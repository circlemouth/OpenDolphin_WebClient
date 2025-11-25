# ORCA-05/06/08 監査ログ・アーカイブ方針（draft）
- RUN_ID: `20251124T190000Z`（親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 対象: ORCA マスター橋渡し（ORCA-05/06/08）に伴う **監査・運用ログ**（アプリ/監査）と **長期アーカイブ**。server/ コード改修は別タスクで扱い、本書は運用ポリシーと保存・検索の最小要件を定義する。
- 参考: `docs/server-modernization/phase2/operations/orca-master-security-privacy-checklist.md`（機微/PII 区分）、`docs/server-modernization/phase2/operations/orca-master-release-plan.md`（ロールバック時のログ確保）、`docs/server-modernization/phase2/operations/orca-master-resilience-plan.md`（障害/フォールバック時の監査必須項目）。

## 1. 保存期間・保管クラス
| 区分 | 目的/内容 | 保存期間 | 保管クラス | ローテーション | 備考 |
| --- | --- | --- | --- | --- | --- |
| アプリ運用ログ（UI/API 成功/失敗） | 監査対象外だが障害解析・運用追跡に使用。`runId`, `facilityId`, `userId`, `apiRoute`, `httpStatus`, `duration`, `traceId` を最小セットで保持。 | 30 日（ホット） | オブジェクトストレージ標準層（S3 Standard / Azure Blob Hot） | 日次ファイルローテ（サイズ上限 200MB）。30 日超は自動削除。 | 個人名/患者 ID を出さないよう UI 側でマスキング済みを前提。 |
| 監査ログ（監査メタ: dataSource/cacheHit/missingMaster/fallbackUsed/runId/snapshotVersion 等） | 規程上の監査証跡。ORCA-05/06/08 取得経路切替・警告表示・保存ブロック・ロールバックを追跡。 | 1 年（ホット 90 日 + コールド 9 か月） | 90 日: S3 Standard / Blob Hot, 91 日以降: S3 Glacier Instant Retrieval / Blob Archive Cool | 日次ローテ。ホット→コールドは月次バッチ（Lifecycle ルール）。1 年超は削除または Vault へ延長申請。 | PII/診療関連は不可逆マスク後に保存。抽出時は最小権限の監査ロールを使用。 |
| 障害証跡（HAR/スクリーンショット/ハッシュ差分） | レジリエンス/フォールト注入・A/B 比較の証跡。 | 180 日 | S3 Standard-IA / Blob Cool | 週次ローテ。180 日で削除または課題オープン中は延長。 | PII 除外前提。必要に応じエビデンスは匿名化サマリへ置換。 |

## 2. 匿名化・マスキングルール（共通）
- PII/診療系フィールド（患者 ID/氏名/住所/電話/生年月日/保険証番号/自由文）は **保存禁止**。収集が必要な場合は以下で不可逆化する。
  - ID 類: `SHA256(<facilityId>:<rawId>:<salt>)` を採用。salt は 90 日ごとローテし、キー管理は KMS で行う。
  - 住所/電話/自由文: 完全除去。Zip や prefecture code は許可（スキーマ上必要な場合）。
- ログ出力時点で UI/Bridge 層がマスキングする（サーバー後処理禁止）。例: `patientIdMasked`, `insurerMasked`, `tensuCode` はそのまま、`patientName` は削除。
- ハッシュ/塩・KMS キーのアクセス権は運用チーム限定。開発者・QA は復号権限を持たない。
- ORCA API から返る生データは保存しない。必要な場合は (a) 必須フィールドだけ抽出し、(b) 上記マスキングを適用した JSON に整形して保管する。

## 3. ローテーションとエクスポート
- ログファイル命名: `<logKind>-<runId>-<date>.log`。例: `audit-20251124T190000Z-2025-11-24.log`。
- アプリログ: ログローテータ（size=200MB または 24h）→ S3/Blob へマルチパートアップロード。失敗時は 3 回リトライ＋DLQ へ格納。
- 監査ログ: 日次で `runId`/`facilityId`/`userId`/`apiRoute` 別に圧縮（zstd 推奨）し、Lifecycle ルールで 91 日目に Glacier/Archive へ移動。
- 署名付き URL での一時参照は 24h 以内に限定。監査ロール以外の List/Get は deny。
- 事故/インシデントで延長が必要な場合は `operations/logs/<RUN_ID>-*.md` に延長理由・期間を記載し、Lifecycle を手動延長。

## 4. 検索・照会フロー（実装非依存の抽象案）
- **検索軸**: `runId`, `facilityId`, `userId`, `apiRoute` (例: `/orca/master/address`), `masterType` (orca05/06/08), `dataSource` (server/snapshot/mock/fallback), `httpStatus`, `traceId`, `snapshotVersion`, `cacheHit`, `missingMaster`, `fallbackUsed`。
- **メタラベル**: `env` (dev/stage/prod), `logKind` (app/audit), `region`, `version` (git SHA/OpenAPI version)。
- **Index/Label 設計例**: Loki/CloudWatch Logs/Elasticsearch いずれでも、以下を最小キーとする。
  - パーティション: `env`, `logKind`, `date (YYYY-MM-DD)`。
  - プライマリキー相当: `runId`, `facilityId`, `userId`, `apiRoute`。
  - ソートキー/フィールド: `timestamp`, `httpStatus`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `traceId`。
- **検索クエリ例**（抽象）:
  - `runId=20251124T190000Z AND masterType=orca06 AND missingMaster=true`
  - `apiRoute="/orca/master/address" AND dataSource="server" AND httpStatus>=500`
  - `facilityId=9001 AND userId="9001:doctor1" AND dataSourceTransition exists`
- **エクスポート**: 検索結果は最大 10,000 件/リクエストで CSV/JSON にエクスポート。PII カラムは非出力がデフォルト。監査ロールのみ再ハッシュ照合を許可。

## 5. インシデント時の保持延長と凍結
- インシデント検知時は対象期間のバケットを「リーガルホールド」タグで 30 日凍結し、削除・移動を停止する。
- 凍結解除・延長はマネージャー承認の上、`operations/logs/<RUN_ID>-*.md` に実施者/日時/対象バケットを記録。
- 証跡（HAR/スクリーンショット/差分 CSV）は関連チケット ID をファイル名に付与し、PII が混入していないことを確認してから添付する。

## 6. 移行ステップ（提案）
1. **フラグ定義**: web-client ブリッジの監査メタに `logKind`/`dataSource`/`snapshotVersion` を必須化（実装タスクは別チケット）。
2. **ストレージ決定**: S3 か Blob を選択し、Lifecycle ルール（30 日削除/90→Glacier/Archive）とバケットポリシー（監査ロールのみ）を設定。
3. **ラベル試験**: Loki/Elasticsearch/CloudWatch いずれかで `runId/facility/apiRoute/dataSource` ラベルがクエリ可能か確認し、1 日分のサンプルで遅延/コストを計測。
4. **匿名化検証**: MSW フィクスチャ/スナップショットレスポンスを入力に、マスキング後ログが PII を含まないことを静的チェック（`rg` で NG パターン検出）し、ログ生成処理に単体テストを追加。
5. **ドキュメント連携**: DOC_STATUS 備考に本 RUN_ID と「監査ログ/アーカイブ方針 draft」記載、橋渡し計画の参考資料節に本書リンクを追加。オペレーションログに実施記録を追記。

---
- 変更履歴: 初版（RUN_ID=20251124T190000Z）。
