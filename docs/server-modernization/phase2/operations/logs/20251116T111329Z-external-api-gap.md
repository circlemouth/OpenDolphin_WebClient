# 2025-11-16 外部 API ギャップ棚卸しログ

- RUN_ID: `20251116T111329Z`
- 担当: Codex（Phase2 ORCA PHR ギャップ担当）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md`
- 成果物:
  - `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md`
  - 本ログ
  - `DOC_STATUS` 追記（モダナイズ/外部連携セクション）

## 1. 調査サマリ
| 観点 | Legacy API 例 | モダナイズ状態 | ギャップ / Blocker | 主な参照 |
| --- | --- | --- | --- | --- |
| PHR (`/20/adm/phr/*`) | 異常値・アレルギー・鍵・Layer ID・PHRContainer・Export | コードと `PhrRequestContextExtractor` は存在するが RESTEasy 未公開。Trial では `/20/adm/phr/*` が 404/405。Export 系は persistence.xml 未登録で実行不可。 | Phase A/B/C の前提（`phr_access_key` Flyway、`TouchMedicationFormatter` 抽出、Layer ID secrets）と ORMaster 実測が未完。 | `MODERNIZED_REST_API_INVENTORY.md:205-224`, `API_PARITY_MATRIX.md:35`, `PHR_RESTEASY_IMPLEMENTATION_PLAN.md`, `DOC_STATUS.md` W22 行 |
| 予約 / 受付ラッパー | `/orca14/appointmodv2`, `/orca11/acceptmodv2`, `/api01rv2/appointlstv2` | `POST /orca/appointments/*`, `/orca/visits/mutation`, `/orca/patients/*` が実装済み。Trial では `HTTP 405 (Allow=OPTIONS,GET)` で Spec-based、Blocker=`TrialLocalOnly`。 | ORMaster 実測と UI before/after 未取得。Trial 側 POST 解放待ち。SSE / Managed Executor の運用手順未整備。 | `MODERNIZED_REST_API_INVENTORY.md:334-353`, `ORCA_API_STATUS.md` (No.2/4/6), `RESERVATION_BATCH_MIGRATION_NOTES.md` |
| 紹介状 / MML | `/odletter/letter`, `/mml/letter/*`, `/mml/labtest/*` | LetterResource 4 本は 1:1。`MmlResource` の letter/labtest 4 本は「実装済み・証跡未整備」で残存。 | CRUD ログや diff 証跡が無く、Runbook/DOC_STATUS へリンクなし。監査 ID (`LETTER_EXPORT_*`) も未定義。 | `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md:10-17`, `API_PARITY_MATRIX.md:32,267-270` |
| Touch / Demo ASP | `/touch/*` 19 本, `/demo/*` 15 本 | Jakarta 実装は存在するが `DemoResourceAsp` ビルド失敗、テストケース未整備。`API_PARITY_MATRIX` では 34 本が Legacy のみ。 | Maven 修正とテスト整備が必須。今回の RUN では参照のみ。 | `DOLPHIN_RESOURCE_ASP_MIGRATION.md`, `DEMO_RESOURCE_ASP_MIGRATION.md`, `API_PARITY_MATRIX.md:17` |

詳細はノート参照: `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md`。

## 2. 所見
1. **PHR**  
   - `MODERNIZED_REST_API_INVENTORY.md` は 11 本すべてを「RESTEasy 未公開」と記載し、監査 ID や `touch.phr.requiredHeaders` を要件化したまま。  
   - `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` Phase-A/B/C の Blocker（`phr_access_key` Flyway、`TouchMedicationFormatter` 抜き出し、Layer ID secrets）未解決。  
   - `DOC_STATUS.md` W22 TaskF/E 行より、2025-11-21 RUN でも `/20/adm/phr/*` は HTTP 404/405、Export 系は UnknownEntityException。  
2. **予約 / 受付ラッパー**  
   - `MODERNIZED_REST_API_INVENTORY.md` §7 で `OrcaAppointmentResource` など全行に Blocker=`TrialLocalOnly`。  
   - `ORCA_API_STATUS.md` No.2/4 は `HTTP/1.1 405`、Spec-based 扱い。  
   - `RESERVATION_BATCH_MIGRATION_NOTES.md` は静的解析のみで、SSE や Managed Executor の実測手順が未記載。  
3. **紹介状 / MML**  
   - `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` では LetterResource 4 本が◎、`MmlResource` (letter/labtest 4 本) が△。  
   - `API_PARITY_MATRIX.md` でも該当 4 行が `[ ]`。Runbook/ログ無し。  
4. **Touch/Demo ASP**  
   - `DOLPHIN_RESOURCE_ASP_MIGRATION.md`／`DEMO_RESOURCE_ASP_MIGRATION.md` は移行方針のみ。`DemoResourceAsp` は import 欠落でビルド不可、`DemoResourceAspTest` 未着手。  

## 3. アクションアイテム
1. **PHR**
   - `phr_access_key` Flyway を適用し、`TouchRequestContextExtractor` 必須ヘッダーと監査 ID (`PHR_ACCESS_KEY_*`, `PHR_LAYER_ID_*`) を実装 → RESTEasy リソース登録。
   - `server-modernized/persistence.xml` へ `PHRKey` / `PHRAsyncJob` を追加し、Export 系の UnknownEntityException を解消。
   - ORMaster or 開放済み ORCA で CRUD 証跡を採取し、`artifacts/orca-connectivity/<RUN_ID>/phr` と `ORCA_API_STATUS.md` を更新。
2. **予約 / 受付ラッパー**
   - `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` に沿って ORMaster で `appointmodv2`/`acceptmodv2` を再測し、`[Spec-based]` を解除。
   - `RESERVATION_BATCH_MIGRATION_NOTES.md` §8 へ SSE/Managed Executor テスト手順と JMS リソース差分を追記。
   - Trial 側 `blocked/README.md` を最新化（doctor/patient seed、GUI 端末、POST 解放条件）。
3. **紹介状 / MML**
   - `/mml/letter/{list,json}` と `/mml/labtest/{list,json}` の `curl` 結果を取得して diff。`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` と `DOC_STATUS` へ証跡リンクを貼る。
   - 紹介状テンプレに `LETTER_EXPORT_SINGLE/BULK` などの監査 ID を定義し、`AuditTrailService` へ組み込む。
4. **Touch/Demo ASP**
   - `DemoResourceAsp` の import 不足と `DemoResourceAspTest` の空ケースを補完し、`touch-api-parity.md` と `DOC_STATUS` を更新。
   - 需要が高い `/touch/module/*` 系のレスポンス diff を採取し、Trial/Modernized の比較を追加ログへ残す。

## 4. DOC_STATUS 更新メモ
- 行追加: `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md`（ステータス Active、最終レビュー 2025-11-16、備考に本 RUN_ID と本ログパス）。
- 既存 W22 行の備考へ「RUN_ID=`20251116T111329Z` ギャップ棚卸し参照」を付記。

## 5. フォローアップ RUN (Worker-D, RUN_ID=`20251116T210500Z-D`)
- **概要**: 親 RUN（`20251116T111329Z`）の差分整理を引き継ぎ、EXT-01〜03 を Worker-D が担当。`docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md` にセクション 4 を追加し、PHR/予約/紹介状ラインの実装・証跡タスクを細分化した。
- **PHR (EXT-01)**: web.xml 登録／Flyway (`phr_access_key`) 適用／`PHRKey`・`PHRAsyncJob` 永続化設定／Secrets (`PHR_LAYER_ID_SECRET`, `PHR_EXPORT_SIGNING_SECRET`) を ToDo 化。Trial=Spec-based、ORMaster CRUD で証跡取得する方針を `artifacts/orca-connectivity/20251116T210500Z-D/phr/` 配下に計画。
- **予約/受付ラッパー (EXT-02)**: `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` を参照しつつ、ORMaster で `appointmodv2` / `acceptmodv2` を再測し、SSE/Managed Executor 連動や UI before/after を `artifacts/orca-connectivity/20251116T210500Z-D/reservation/`へ残すタスクリストを作成。Trial 側の `HTTP 405` は `trialsite.md` を根拠に継続 Blocker として明示。
- **紹介状/MML (EXT-03)**: `/odletter/*` および `/mml/{letter,labtest}/{list,json}` の CRUD ログ採取パス `artifacts/external-interface/mml/20251116T210500Z-D/` を定義。Trial での 405 応答を Blocker として残しつつ、ORMaster で diff を取得して `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` / `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` / `API_PARITY_MATRIX.md` を更新する計画を追記。
- **次アクション**: ORMaster 認証情報の確保 → Flyway/persistence/Audit 実装 → Trial/ORMaster 並行ログ採取 → `DOC_STATUS` W22 行および `PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` に証跡リンクを反映。完了前は `[Spec-based]` ステータスを維持する。

## 6. RUN_ID=`20251116T210500Z-E2` (予約/受付ラッパー Trial 実測)
- **Scope**: EXT-02 のサブラン。`/orca14/appointmodv2` と `/orca11/acceptmodv2` を target とし、Trial=Spec-based の証跡更新と ORMaster DNS 確認を実施。
- **Trial 実測**: `curl -v -u <MASKED>:<MASKED> --data-binary @payloads/{appointmod,acceptmod}_trial.xml https://weborca-trial.orca.med.or.jp/orca{14,11}/...` を実行し、いずれも `HTTP/1.1 405 Method Not Allowed`。証跡 (`response.xml`, `headers.txt`, `curl_verbose.log`, `http_status.txt`) を `artifacts/orca-connectivity/20251116T210500Z-E2/{appointmodv2,acceptmodv2}/trial/` に保存。
- **ORMaster 接続確認**: `nslookup ormaster.orca.med.or.jp` が `NXDOMAIN`（`artifacts/.../dns/ormaster.nslookup.txt`）。`curl -u ormaster:ormaster https://ormaster.orca.med.or.jp/...` は `curl: (6)` で終了。`blocked/README.md` へ「ORMaster DNS 未開放」エントリを追加。
- **ログ**: `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-appointmod.md` / `...-acceptmod.md` を新設し、Trial 405 / ORMaster 未達 / 次アクションを整理。`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` の appointmod/acceptmod 節へ進捗メモを追記。
- **Ext ノート更新**: `external-api-gap-20251116T111329Z.md` EXT-02 節に RUN_ID=`20251116T210500Z-E2` の結果と Blocker を反映。
- **DOC_STATUS**: W22 Gap Sweep 行へ本 RUN_ID と証跡パスを追記し、Spec-based 継続と ORMaster DNS/FW 確認の TODO を明記。
