# ORCA-05/06/08 セキュリティ・プライバシー チェックリスト

- RUN_ID: `20251124T134500Z`（親=`20251124T000000Z`）
- 対象: ORCA マスターデータ REST/キャッシュ/ログ/監査メタ（ORCA-05 薬剤・用法・特材・検査分類、ORCA-06 保険者・住所、ORCA-08 電子点数表）
- 参照: `docs/web-client/process/API_UI_GAP_ANALYSIS.md`（監査フィールド必須）、`docs/server-modernization/phase2/operations/orca-master-release-plan.md`（フラグ/ロールバック）、`docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`（正式版 OpenAPI）

## 1. フィールド分類とマスキング・保存方針
| マスタ種別 | 主なフィールド | 区分 (個人情報/要配慮/非PII) | キャッシュに残す可否 | ログ/監査メタに残す可否 | マスキング/削除ルール | 推奨保持期間 |
| --- | --- | --- | --- | --- | --- | --- |
| ORCA-05 薬剤分類・最低薬価・用法・特定器材・検査分類 | `generic_class_code/name`, `youhou_code/name`, `material_code/name/category`, `kensa_sort_code/name`, `min_price`, `tensu_version`, `valid_from/to` | 非PII（医薬品・コード情報のみ） | 可。TTL=5分（アプリ）/24時間（スナップショット） | 可。ただし患者・職員 ID と結合しない | 金額系は平文のまま。`tensu_version`/`valid_from/to` は改ざん防止のためハッシュ不要 | キャッシュ: 24h ローテ。アプリログ: 30日。監査: 1年 |
| ORCA-06 保険者 | `payer_code/name/type`, `payer_ratio`, `valid_from/to`, `version` | 非PII（法人識別・制度情報） | 可。TTL=5分 | 可。`payer_ratio` を含めてよい | マスキング不要。利用者 ID と結合禁止 | キャッシュ: 7日。ログ: 30日。監査: 1年 |
| ORCA-06 住所 | `pref_code`, `city_code`, `zip`, `address_line`, `version` | 非PII（行政区分コード）。`address_line` は公共データ由来で個人特定不可 | 可。TTL=7日 | 可。ただし患者入力値と混在させない | 個人入力値を受け取った場合は `address_line` をログに残さず監査のみ（値を `***` マスク） | キャッシュ: 7日。ログ: 30日（個人入力は記録しない）。監査: 1年（マスク済み） |
| ORCA-08 電子点数表 | `tensu_code`, `name`, `kubun`, `tanka`, `unit`, `category`, `start_date`, `end_date`, `tensu_version`, `version` | 非PII（診療行為コード） | 可。TTL=5分 | 可。算定結果と紐付く場合も個人 ID を含めない | 単価は平文。`tensu_version` を必須で記録し差分解析に使用 | キャッシュ: 24h。ログ: 30日。監査: 1年 |
| 共通監査メタ | `runId`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `fetchedAt`, `snapshotVersion`, `traceId` | 非PII（テクニカルメタ） | 可（無期限で構わないが 30日ローテ推奨） | 必須。全経路で付与 | `traceId` を除き平文。`traceId` は 90日で削除 | ログ: 30日。監査: 1年（`traceId` は 90日でクリーニング） |

補足:
- ORCA マスタは個人情報を含まない想定だが、住所 API にユーザー入力を混在させるケースでは入力値をログに残さない。監査イベントでは `address_line="***"` とし、UI へはバリデーション結果のみ返す。
- 監査メタは UI/サーバー双方で必須。`runId` は親 RUN と揃え、派生 RUN を利用する場合は `parentRunId` を追加する。

## 2. ログ/監査設定チェックリスト（実装完了時に確認）
- 収集禁止項目: 患者 ID / 患者氏名 / 生年月日 / 保険証記号番号 / 職員 ID / 認証トークン / 生体認証情報 がログ/監査に出力されていない。
- マスキング: ユーザー入力の住所テキストを記録する場合は `***` にマスクし、保険証番号・電話番号などを受け取った場合は即時破棄して監査に「drop」イベントを残す。
- 保存期間: アプリログ 30日ローテーション、監査ログ 1年保管（`traceId` は 90日で削除）。S3/Blob のライフサイクルポリシーを設定済み。
- ローテーション: `logrotate` またはクラウドローテが 1日単位で動作し、圧縮後の権限が `rw-------`（実行ユーザーのみ）になっている。
- アクセス権限: 監査ログは `role=auditor`/`role=admin` のみ読み取り可、開発者・QA は要申請。キャッシュはアプリユーザー権限プロセスのみ読み書き可。
- フィールド最小化: ログは `runId`, `endpoint`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `status`, `duration_ms`, `traceId` まで。レスポンスボディ全体を出力しない。
- エラー時の扱い: 4xx/5xx でも入力ペイロードをフルログしない。`traceId` と `status`、マスタ種別、`reason` のみ記録。
- 監査送出確認: `/orca/master/*` および `/orca/tensu/*` で success/404/timeout いずれも `runId` 付き監査イベントが送出されることを手動/自動テストで確認。
- アラート: エラー率 >2%（5分）、P99 >3s（10分）、`missingMaster` >0.5%（10分）で通知が飛ぶことをモニタに設定。

## 3. 配置・運用メモ
- キャッシュ保存先: `artifacts/api-stability/20251124T000000Z/master-snapshots/`（24h ローテ）。アプリ内キャッシュはメモリのみ・永続化しない。
- ログ保管先: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` を索引とし、長期保管はクラウドストレージに集約。ローテーションポリシーを evidence に記録する。
- チェックリストの参照先: bridge 計画書（`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`）と OpenAPI README（`docs/server-modernization/phase2/operations/assets/openapi/README.md`）から本ファイルへリンクする。

## 4. 簡易テスト観点（ログ/監査）
- 正常: `/orca/master/address?zip=1000001` で `dataSource=server`、`cacheHit=false→true`、`missingMaster=false` が監査に記録される。
- 欠損: `/orca/master/address` が 404 のとき `missingMaster=true`、`fallbackUsed=true`、レスポンスボディ未ログであることを確認。
- タイムアウト: 3s で強制タイムアウトし、`status=timeout` のみ記録。リトライ後もボディを残さない。
- UI 警告: warning バナー表示時に監査へ `bannerVisible=true` が送出され、入力値を含まないことを確認。

## 5. 変更履歴
- 2025-11-24 (Codex, RUN_ID=`20251124T134500Z`): 初版作成。フィールド分類表/マスキング・保持期間/チェックリストを追加。
