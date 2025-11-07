# スタンプ / 文書 / 外部連携モダナイズ対応計画（更新日: 2025-11-03）

## 1. 背景とスコープ
- 担当: Worker F（Stamp / Letter / MML / ORCA）
- 対象: `StampResource` 15 件、`LetterResource` 4 件、`MmlResource` の未移植 4 件、`OrcaResource` の未移植 1 件。
- 参照必須資料: `API_PARITY_MATRIX.md`、`rest-api-modernization.md`、`MODERNIZED_REST_API_INVENTORY.md`、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`。
- 目的: スタンプ CRUD と階層データ移行の完了、削除操作の監査強化、ORCA/MML 連携契約の再確認と整合テスト計画、モダナイズ新規 API の差異文書化、必要に応じたデータマイグレーション手順書の策定。

## 2. API パリティ確認結果（2025-11-03 再走査）
| リソース | レガシー実装 | モダナイズ実装 | 状態 | 補足 |
| --- | --- | --- | --- | --- |
| StampResource | `/stamp/tree/*`, `/stamp/published/*`, `/stamp/subscribed/*`, `/stamp/id/*`, `/stamp/list/*` | `server-modernized/src/main/java/open/dolphin/rest/StampResource.java`（Jakarta 版、完全同等） | ◎ 1:1 対応済み | パリティマトリクスの未移植 15 件を解消。`MODERNIZED_REST_API_INVENTORY.md` は `/stamp/id` 系を未掲載だったため追記必須。 |
| LetterResource | `/odletter/letter`, `/odletter/letter/{id}`, `/odletter/list/{karteId}` | `server-modernized/src/main/java/open/dolphin/rest/LetterResource.java` | ◎ 1:1 対応済み | `GET/DELETE /odletter/letter/{id}` がモダナイズ版でも提供されていることを確認。 |
| MmlResource | `/mml/letter/json/{id}`, `/mml/letter/list/{karteId}`, `/mml/labtest/list/{fid}`, `/mml/labtest/json/{pk}` | `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java` | △ 実装確認 / 証跡未整備 | 4 件とも Jakarta 版で提供されている（`MmlResource.java:285-351`）。自動テスト・動作ログが存在しないため、レスポンス差分検証と Runbook 反映が必要。 |
| OrcaResource | `PUT /orca/interaction` | `server-modernized/src/main/java/open/orca/rest/OrcaResource.java` | ◎ 1:1 対応済み | 旧サーバー実装との差分なし。テスト DB 未接続につき動作検証は Runbook ORCA-COMPAT-20251103-01 で追跡。 |

> パリティマトリクス (`API_PARITY_MATRIX.md`) と REST インベントリ (`MODERNIZED_REST_API_INVENTORY.md`) を 2025-11-03 再更新し、MML Labtest/Letter が Jakarta 版に存在すること、PHR export API が未提供であることを備考に追記済み。

## 3. スタンプ CRUD・階層データ移行方針

### 3.1 データ構造と移行ステップ
対象エンティティ: `StampTreeModel`, `PublishedTreeModel`, `SubscribedTreeModel`, `StampModel`, `StampList`。

1. **事前棚卸し**  
   - `SELECT COUNT(*) FROM d_stamp_tree;`、`SELECT COUNT(*) FROM d_stamp;` を取得し、旧サーバー値と比較。  
   - ユーザー単位のバージョン番号を `SELECT user_id, version_number FROM d_stamp_tree ORDER BY user_id;` で確認。競合がある場合は `syncTree` の強制同期対象リストを作成。
2. **エクスポート**  
   - 旧環境: `/stamp/tree/{userPk}` と `/stamp/list/{stampId,...}` を `curl` で取得し、JSON バックアップを `artifacts/stamp/export-<date>` に保存。  
   - 公開ツリーは `/stamp/published/tree`、サブスクライブ情報は `/stamp/subscribed/tree` を同様に取得。
3. **インポート / マージ**  
   - モダナイズ環境: `/stamp/tree` へ PUT し、レスポンスの `pk` を記録。バージョン衝突時は `/stamp/tree/sync` を使用。  
   - 公開ツリーは `/stamp/published/tree`、サブスクライブは `/stamp/subscribed/tree` 経由で登録。Worker B が提供するデモデータはこのフェーズで反映。  
   - Worker C（スタンプキャッシュ）は `/stamp/tree/{userPk}` 応答とキャッシュ更新の整合を確認し、キャッシュ無効化フローを `StampCacheInvalidation.md`（別途作成予定）に記録。
4. **検証**  
   - `GET /stamp/id/{stampId}` でシリアライズ結果を比較（旧 JSON の `entity`, `byteData` などが一致すること）。  
   - `/stamp/tree/{userPk}` 応答の `versionNumber` がインポート後に +1 されているか確認。  
   - `/stamp/subscribed/tree/{idPks}` で削除した場合、`SubscribedTreeModel` 側が削除済みになることを DB で確認。

### 3.2 削除操作の監査強化
- 監査サービス: `open.dolphin.security.audit.AuditTrailService`。スタンプ削除 API で以下を記録すること。
  - `action`: `STAMP_DELETE_SINGLE`（`DELETE /stamp/id/{stampId}`）、`STAMP_DELETE_BULK`（`DELETE /stamp/list/{ids}`）。
  - `resource_path`: 実際の URL。
  - `payload`: 削除対象スタンプ ID 群と `userId`。
  - `previous_hash`: 既存チェーンを維持。
- 実装方針: `StampResource` に `@Inject AuditTrailService` を追加し、`stampServiceBean.removeStamp*` 実行後に `auditTrailService.record(...)` を呼び出す。例外時は `status=failed` を記録し、DB ロールバックと整合すること。
- テスト観点:  
  1. 正常削除で `d_audit_event` に `status=success` が挿入される。  
  2. 存在しない ID 削除で `status=failed`（404 応答）と `errorCode=STAMP_NOT_FOUND`（アプリ側で定義）をログする。  
  3. バルク削除時、`payload` に全 ID が JSON 配列で格納されている。  
  4. Worker C 提供のキャッシュ API 連携を利用し、削除後にキャッシュが失効することを HTTP で確認。

- 2025-11-03 実装状況: `StampResource` に監査ログ記録を実装し、`StampResourceTest`（成功・404・一括失敗シナリオ）を追加。ローカル環境では Maven 不在のためテスト実行は未実施で、CI での実行と DB 監査テーブル確認を Runbook STAMP-AUDIT-20251103-01 に追記してフォローする。キャッシュ連携と実 DB 差分確認は Worker C／インフラチームに引き継ぎ。 

### 3.3 リスクと対策
- **同時編集競合**: `syncTree` が `First Commit Win` 例外を投げる。例外発生時に UI 側で最新ツリーを再取得し、差分マージを案内するフローを Web クライアントで実装。  
- **文字コード差異**: スタンプ定義に Shift_JIS 由来の文字が含まれる場合、Jackson2 変換で不正なエンコーディングが発生しないか `PUT /stamp/list` のテストケースを追加。  
- **公開ツリーの施設 ID**: 旧サーバーでは `publishType` に施設 ID を格納。新サーバーでも同値であることを `/stamp/published/tree` のレスポンスで確認し、ズレがあれば `forceSyncTree` を利用して補正する。

## 4. ORCA / MML 契約確認と整合テスト

### 4.1 契約差分サマリ
| API | 現状 | 対応方針 |
| --- | --- | --- |
| `PUT /orca/interaction` | Jakarta 実装は旧コードと同等。ORCA テスト DB 未接続のためレスポンス比較は未実施。 | ORCA チームが用意する検証環境で `Runbook ORCA-COMPAT-20251103-01` の手順に従い応答差分を取得。結果に応じて `GET /mml/interaction` への切替方針を再判断。 |
| `GET /mml/letter/json/{id}` / `list/{karteId}` | 未移植。レター PDF 生成との互換性に影響。 | `LetterServiceBean` の DTO を流用し、`LetterModuleConverter` 応答を実装する。暫定対応として旧サーバーへのフォールバック経路を用意。 |
| `GET /mml/labtest/list/{fid}` / `json/{pk}` | 未移植。ラボ履歴の外部提供に影響。 | LabMML 出力スキーマを Web クライアント側で参照できるようサンプル JSON/MML を作成し、移植優先度を High に設定。 |

### 4.2 連携整合テスト計画
| No. | シナリオ | API | 検証ポイント | データセット | 判定基準 |
| --- | --- | --- | --- | --- | --- |
| 1 | スタンプ登録と削除の往復テスト | `PUT /stamp/id`, `DELETE /stamp/id/{stampId}` | DB 永続化と監査ログ生成 | 既存スタンプ JSON + Worker B デモ | `SELECT count(*)` の差分が 0、`d_audit_event` に成功レコード |
| 2 | スタンプツリー同期競合 | `PUT /stamp/tree`, `PUT /stamp/tree/sync` | バージョン競合時の 409 応答と再同期 | 2 クライアント同時更新モック | 競合時に `First Commit Win` を受けてリトライ成功 |
| 3 | レター取得互換性 | `GET /odletter/letter/{id}` | 旧 JSON との互換、添付リスト整合 | 既存カルテの紹介状データ | JSON キー・値が旧サーバーと一致 |
| 4 | レター削除監査 | `DELETE /odletter/letter/{id}` | 単体テスト（LetterResourceTest）で監査ペイロードを検証し、ステージ環境で `d_audit_event` を確認 | ダミー紹介状 | Runbook LETTER-AUDIT-20251103-01：単体テストは追加済／DB 実測は Maven・ステージ環境準備後に実施 |
| 5 | ORCA 相互作用代替経路 | `GET /mml/interaction` → ORCA DB | ORCA 契約バージョンで許容されるレスポンスか | ORCA テスト DB（Ver. 5.1 対応） | 旧 `PUT` API と同一の薬剤組み合わせ結果 |
| 6 | MML レター／ラボ出力 | （未移植 API） | 旧サーバーとの応答差分 | サンプル患者 ID (`WEB1001`) | 差分ツールでフィールド差異なし |

テスト結果は `docs/server-modernization/phase2/PHASE2_PROGRESS.md` とリリースノート草案に転記する。

### 4.3 データマイグレーション手順（必要時）
対象: レター、ラボ結果の過去データ。
1. 旧サーバーで `GET /mml/letter/list/{karteId}`、`GET /mml/labtest/list/{fid}` をダンプし、JSON を ZIP 化して保管。
2. モダナイズ版に移植実装が完了したら、REST 経由で再投入するか、直接 DB へ INSERT。直接投入の場合は JPA エンティティに合わせたカラム整形を行い、Flyway で追跡できるよう `V<timestamp>__mml_letter_backfill.sql` を作成。
3. 再投入後に `/mml/letter/json/{id}` 等を呼び出し、旧 JSON とフィールド差分を比較。差異がある場合はマッピングルールをドキュメントに追記。  
4. 本番リハーサル時には `SELECT COUNT(*)` 比較と ORCA 側連携ログを取得し、整合性を証跡として残す。

## 5. データ整合テスト計画（Web/外部連携チーム共有）
| カテゴリ | テスト項目 | 事前条件 | 手順概要 | 成功条件 | 担当 |
| --- | --- | --- | --- | --- | --- |
| スタンプ | CRUD API パリティ自動テスト | Postman または REST Assured スイート | 旧/新サーバーへ同一リクエストを送信し応答を比較 | レガシーとの差分 0、監査ログが増分一致 | QA（Worker F 主導） |
| スタンプ | 公開/購読ツリー移行 | 施設用公開ツリーが旧環境に存在 | `/stamp/published/tree` → インポート → `/stamp/subscribed/tree` 検証 | 公開ツリー数一致、購読一覧一致 | Worker F + Worker B |
| レター | 個別取得・削除 | 紹介状データが存在 | `/odletter/letter/{id}` → `/odletter/letter/{id}` DELETE → 再取得で 404 | 削除後に監査ログが記録、レター一覧から除外 | Worker F |
| MML | レター / ラボ JSON 互換 | 旧サーバーへアクセス可能 | フォールバック経路で JSON を比較し、未移植 API の代替要否を判断 | 差分に応じて移植チケット化 | Worker F + QA |
| ORCA | 相互作用 API | ORCA テスト DB、`InteractionCodeList` サンプル | 旧 `PUT /orca/interaction` と新 `GET /mml/interaction` を比較 | 同一薬剤ペアでレスポンス一致 or 認可差分を記録 | Worker F + ORCA 担当 |

## 6. モダナイズ新規 API と旧 API の違い（抜粋）
- `GET /mml/interaction`（新規）: 旧 `PUT /orca/interaction` に相当するが HTTP メソッド／レスポンススキーマが異なる。クライアント更新時は PUT から GET への変更とドメインモデル差分に注意。
- `GET /mml/stampTree/{param}`, `GET /mml/stamp/{param}`: モダナイズ版で追加されたスタンプの軽量参照 API。Web クライアントが `/stamp` 系 API を叩く場合は権限や応答サイズに応じて使い分ける。
- `ChartEventStreamResource`（SSE）: 旧ロングポーリング API を段階的に置き換える計画。スタンプ CRUD とは直接関係しないが、削除操作監査と同じくトレース ID を共有する必要がある。

## 7. 次アクション（担当・期日目安）
- Worker F（本タスク）:  
  1. スタンプ監査強化の実装チケット化（2025-11-04）。  
  2. 未移植 MML/ORCA API の移植可否をアーキテクトへエスカレーション（2025-11-05）。  
  3. データ整合テスト自動化スイートのベースライン作成（2025-11-06）。
- Worker C（スタンプキャッシュ）: キャッシュ無効化手順と `/stamp/tree` の ETag 化を検討し、結果を共有（2025-11-07）。
- Worker B（デモスタンプデータ）: デモデータの JSON 配布と `/stamp/list` 用 ID マッピング表を作成（2025-11-04）。
- QA: 本計画に基づくテスト実施と `PHASE2_PROGRESS.md` へのログ追記（2025-11-08）。

---
本ドキュメントに関する更新は `docs/web-client/README.md` の「プロセス / 計画」セクションへ追記済み。追加情報があれば本ファイルへ追記し、更新日を明記すること。
