# 外部 API ギャップ棚卸し（RUN_ID=`20251116T111329Z`）

- 日時: 2025-11-16 20:13 JST（UTC 11:13）
- 対象: Legacy で外部と連携している PHR / 予約（ORCA ラッパー）/ 紹介状＋MML（紹介状配布・文書交換）/ Touch ASP 系
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md`
- 主な参照資料: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`、`docs/server-modernization/phase2/domains/{API_PARITY_MATRIX,PHR_RESTEASY_IMPLEMENTATION_PLAN,RESERVATION_BATCH_MIGRATION_NOTES,STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN}.md`、`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`（W22 行）。

## 1. カバレッジ概要
| ドメイン | Legacy 提供範囲（サマリ） | モダナイズ現況 | ギャップ/ToDo |
| --- | --- | --- | --- |
| PHR (`/20/adm/phr/*`) | 11 本のテキスト/鍵/トークン API + export 系 | RESTEasy 実装＆`PhrRequestContextExtractor` は存在するが web.xml 未登録、Trial では POST/画像が 404/405。`PHR export` 系 API は未実装。 | Phase A/B/C の Blocker（`phr_access_key` Flyway、`TouchMedicationFormatter` 抜き出し、Layer ID secrets）を解消後、RESTEasy リソースを登録し RUN_ID 付きで CRUD 証跡を採取。Trial で POST 禁止のため、ORMaster or WebORCA ローカル環境での検証計画を維持。**2025-11-16 update:** RUN_ID=`20251116T210500Z-E1` で EXT-01 Evidence を整備し、Trial=404/405 (RUN=`20251121TrialPHRSeqZ1-A/B`)・Modernized経路=200 (RUN=`20251121TrialPHRSeqZ1-CTX`) の両証跡と Flyway/Secrets 確認ログを `artifacts/orca-connectivity/20251116T210500Z-E1/` に集約。 |
| 予約 / 受付 ORCA ラッパー (`/orca*/`, `/api01rv2/*`, `/orca14/*`, `/orca11/*`) | ORCA 本体の予約登録／受付／患者同期 API | ラッパー (`/orca/appointments/*`, `/orca/visits/mutation`, `/orca/patients/*` など) 実装済みだが Trial は `HTTP 405`・`TrialLocalOnly`。内部バッチは静的解析のみで実行証跡なし。 | Trial POST 解放 or ORMaster 接続までは Spec-based。`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` の計画を継続しつつ、予約 SSE/Managed Executor の手順書と UI before/after を追加する。 |
| 紹介状 / MML (`/odletter/*`, `/mml/letter/*`, `/mml/labtest/*`) | 紹介状 CRUD、MML 形式の文書/検査配布 | `LetterResource` は 1:1 で Jakarta 化済み。一方 `MmlResource` の labtest/list/json + letter/list/json 4 本は「実装あり / 証跡未整備」で止まっている。 | labtest/letter 4 本の CRUD ログ＋差分比較を取得し、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`・`DOC_STATUS` に貼る。紹介状テンプレの監査 ID（`LETTER_EXPORT_*`）を追記。 |
| Touch ASP / Demo ASP | `/touch/*` 19 本 + `/demo/*` 15 本 | Java 実装は存在するがビルド失敗 (`DemoResourceAsp` import 欠落) や試験不足 (`DemoResourceAspTest` 未作成ケース)。API パリティ上も 34 本が Legacy のみ。 | Maven ビルド修正とテスト雛形の実装後、`touch-api-parity.md` とあわせて DOC_STATUS を更新。今回の RUN では参照のみ。 |

## 2. 詳細メモ

### 2.1 PHR
1. `MODERNIZED_REST_API_INVENTORY.md` の PHR セクションは 11 本すべてを「RESTEasy 未公開」として列挙し、`PHR_ABNORMAL_TEXT` などの新監査 ID を要件化している（同 md:205-224）。`API_PARITY_MATRIX.md` でもレガシーのみ 11 件のまま（行35）。  
2. `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` では Phase-A/B/C ごとの Blocker を具体化（Flyway 適用、`TouchMedicationFormatter` 抽出、Layer ID シークレット注入など）。RUN_ID=`20251116T210500Z-E1` では前提証跡（Flyway/Secrets/Trial&Modernizedログ）を整備し、Task-H で RESTEasy 公開レビューを再開予定。  
3. `ORCA_API_STATUS.md`／`DOC_STATUS.md` W22 行によれば、2025-11-21 の RUN でも `/20/adm/phr/*` は HTTP 404/405 のまま（TrialLocalOnly）。`PHR export` API は persistence.xml に `PHRKey/PHRAsyncJob` が無く UnknownEntityException で失敗（DOC_STATUS W22 TaskE）。Modernized 経路での 200 応答（RUN=`20251121TrialPHRSeqZ1-CTX`）を引用しつつ、Trial=Spec-based の根拠 (`trialsite.md` Snapshot 行2-7) を Blocker に記録。  
**ToDo**  
   - Flyway (`phr_access_key`) 適用と `TouchRequestContextExtractor` ヘッダー必須化を完了し、web.xml へ PHR サーブレットを登録。`server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql` を基準に採番ログを残す。  
   - Layer ID シークレット定義と監査 ID 追加 (`PHR_LAYER_ID_TOKEN_ISSUE` など) を `phr-2fa-audit-implementation-prep.md` と連動。`ops/check-secrets.sh` 結果 (`artifacts/.../checks/secrets.log`) を RUN_ID と紐づける。  
   - ORMaster or 開放済み ORCA 環境で CRUD/Evidence を取得し、`artifacts/orca-connectivity/<RUN_ID>/phr` へ保存。Trial で POST が禁止されている間は `[Spec-based]` タグを外さない（本 RUN は Modernized 経路で 200/403 の暫定確認のみ）。  

### 2.2 予約 / 受付ラッパー（ORCA 外部 API）
1. `MODERNIZED_REST_API_INVENTORY.md` §7 は `POST /orca/appointments/*`, `/orca/visits/mutation`, `/orca/patients/*` などを列挙し、全行に Blocker=`TrialLocalOnly`＋RUN_ID=`20251116T170500Z` を付けている（行334-353）。  
2. `ORCA_API_STATUS.md` 2/4 行は Trial で `HTTP/1.1 405 (Allow=OPTIONS,GET)`、Spec-based 扱いと記載。Production/ORMaster 完了計画は `20251116T173000Z-prod-validation-plan.md` へ分離済み。  
3. 内部の予約/バッチメモ（`RESERVATION_BATCH_MIGRATION_NOTES.md`）は静的解析ベースで JMS/SSE/Managed Executor の設計差分をまとめているだけで、WildFly 33 での実行証跡はまだない。  
**ToDo**  
   - `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` のシナリオを ORMaster 環境で消化し、`appointmodv2`/`acceptmodv2` の CRUD ログ＋UI before/after（予約ウィジェット）を取得。  
   - SSE/Managed Executor への反映手順（`ChartEventSseSupport` × `ScheduleServiceBean`）を `RESERVATION_BATCH_MIGRATION_NOTES.md` §8 へ追記。  
   - Trial が POST 解放されるまで `[Spec-based]` ステータスを維持し、`blocked/README.md` に再開条件（doctor/patient seed、GUI 端末）を書き戻す。  

### 2.3 紹介状 / MML
1. `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` は LetterResource 4 本が 1:1 対応済み、MmlResource の letter/labtest 4 本が「実装あり・証跡未整備」と記録（行10-17）。  
2. `API_PARITY_MATRIX.md` でも同 4 本が `[ ] / △` のまま（行32, 267-270）。  
3. `DOC_STATUS.md` には紹介状用の最新 RUN が無く、外部共有できるログ（`docs/server-modernization/phase2/operations/logs/*letter*.md`）も未作成。  
**ToDo**  
   - `/mml/letter/{list,json}` と `/mml/labtest/{list,json}` の `curl` + JSON diff を取得し、`artifacts/external-interface/mml/<RUN_ID>/` へ保存。  
   - `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` と `DOC_STATUS` に証跡リンクを追加。  
   - 紹介状テンプレ更新時に監査 ID (`LETTER_EXPORT_SINGLE/BULK`) を `AuditTrailService` へ追加。  

### 2.4 Touch / Demo ASP 付随 API
`API_PARITY_MATRIX.md` は DolphinResourceASP 19 本 + DemoResourceASP 15 本をいまだ「レガシーのみ」として列挙（表17）。いずれも `DOLPHIN_RESOURCE_ASP_MIGRATION.md`・`DEMO_RESOURCE_ASP_MIGRATION.md` で移行方針が定義されているが、`DemoResourceAsp` のビルド失敗やテスト欠落が解消されていない。今回の RUN では参照のみ、要対応タスクとしてログに残した。

## 3. 推奨アクション
1. **PHR**: Flyway (`phr_access_key`) / Secrets / 監査 ID を揃えた「Phase-A/B/C 完了 PR」を作成 → web.xml で PHR リソース登録 → Trial/ORMaster 両系で CRUD 証跡取得 → `MODERNIZED_REST_API_INVENTORY.md` の PHR 表を「◎ 実装完了」へ更新。
2. **予約 / 受付ラッパー**: ORMaster 実測を最優先で進める。`appointmodv2`/`acceptmodv2` の CRUD 成功ログを `docs/server-modernization/phase2/operations/logs/<RUN_ID>-orca-trial-crud.md` に追記し、`ORCA_API_STATUS.md` と coverage row の `[Spec-based]` タグを解除。Trial が POST 解放されるまで `blocked/README.md` で制限根拠を保持。
3. **紹介状/MML**: `MmlResource` 4 本の CRUD を `curl` で採取し、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` と本ノートへ証跡を反映。完了後に `API_PARITY_MATRIX.md` の該当 4 行を `[x]/◎` へ更新。
4. **Touch/Demo ASP**: `DemoResourceAsp` のビルドエラーとテスト欠落を解消し、`touch-api-parity.md` の残タスク欄を更新。次 RUN で差分証跡を取得し、`DOC_STATUS` へ反映する。

## 4. RUN 進捗 (RUN_ID=`20251116T210500Z-D`, parent=`20251116T111329Z`)
Worker-D として EXT-01〜03 の対応計画を具体化し、下記の通りモダナイズ API / 証跡整備の ToDo を細分化した。各タスクは本 RUN で着手し、完了までは `[Spec-based]` ステータスを維持する。

### EXT-01: PHR REST 登録 + 証跡
- **web.xml 登録方針**: `server-modernized/src/main/webapp/WEB-INF/web.xml` に `PhrRestApplication` (`javax.ws.rs.core.Application`) を Servlet 1 本として登録し、`/20/adm/phr/*` へ `<url-pattern>` を割り当てる。`TouchRequestContextExtractor` で参照する BASIC 認証ヘッダー（`Authorization: Basic ...`）、`X-Facility-Id`, `X-Layer-Id`, `X-PHR-Device-Token` を `init-param` で必須化する。
- **前提タスク**: `Flyway` に `phr_access_key` マイグレーションを追加し、`server-modernized/persistence.xml` へ `open.dolphin.infomodel.PHRKey` / `PHRAsyncJob` を登録。Secrets では `PHR_LAYER_ID_SECRET`, `PHR_EXPORT_SIGNING_SECRET`, `PHR_SIGNED_URL_SALT` を `ops/check-secrets.sh --profile phr-export` で検証する。
- **監査 ID / 例外ハンドリング**: `AuditTrailService` に `PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_SIGNED_URL_ISSUE_FAILED`, `PHR_EXPORT_ENTITY_MISSING` を追加し、`TouchMedicationFormatter` の移植に伴って Phase-A/B/C のログ期待値（`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-phaseCDE.md`）と突合する。
- **証跡計画**: Trial では 404/405 が続いているため、ORMaster 側 CRUD（`curl -u <ormaster-cred> https://<ormaster-host>/20/adm/phr/allergy` など）で 200 系を取得し、`artifacts/orca-connectivity/20251116T210500Z-D/phr/{crud,httpdump,trace}/` に保存。Trial 側は `[Spec-based]` として `docs/server-modernization/phase2/operations/logs/20251116T111329Z-external-api-gap.md` へ Blocker を追記する。
- **残 TODO**: Flyway スクリプトと persistence.xml の改修を PR 化 → RESTEasy 登録 → Secrets / Audit 実装 → ORMaster CRUD 実測 → `MODERNIZED_REST_API_INVENTORY.md` / `ORCA_API_STATUS.md` / `DOC_STATUS` の W22 行を更新。

### EXT-02: 予約 / 受付ラッパー Trial 実測
- **現状把握**: `POST /orca/appointments/*`, `/orca/visits/mutation`, `/orca/patients/*` は WildFly に実装済だが Trial では `HTTP/1.1 405 (Allow=OPTIONS,GET)`。`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` が ORMaster 実測手順を保持。
- **2025-11-16 RUN_ID=`20251116T210500Z-E2` 実測結果**:
  - `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-appointmod.md` / `...-acceptmod.md` に Trial (`curl -u trial:weborcatrial .../orca14/appointmodv2`, `/orca11/acceptmodv2`) の 405 応答を記録。`artifacts/orca-connectivity/20251116T210500Z-E2/appointmodv2/trial/` と `.../acceptmodv2/trial/` にヘッダー・body・curl verbose を保存。
  - 同 RUN で `nslookup ormaster.orca.med.or.jp` を取得したところ `NXDOMAIN`（`artifacts/orca-connectivity/20251116T210500Z-E2/dns/ormaster.nslookup.txt`）。`curl -u ormaster:ormaster https://ormaster.orca.med.or.jp/...` は `curl: (6)` で終了し、HTTP ボディなし。現状では ORMaster 証跡が得られず `[Spec-based]` を解除できない。
  - Blocker ラベル: Trial 側は `trialsite.md#limit`、ORMaster 側は「DNS 解決不可（環境側制約）」として `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-*.md` と `blocked/README.md` に追記する。
- **再測定シナリオ**: DNS ルート確保後に ORMaster/WildFly を対象として以下を実施。
  1. `curl -u ormaster:ormaster https://ormaster.orca.med.or.jp/orca14/appointmodv2?class=01` を再送し、HTTP200 + JSON body + UI 連携キャプチャを `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-appointmod.md` へ追記。
  2. `curl -u ormaster:ormaster https://ormaster.orca.med.or.jp/orca11/acceptmodv2?class=01` を取得し、`artifacts/orca-connectivity/20251116T210500Z-E2/acceptmodv2/ormaster/` に CRUD 証跡を保存。
  3. SSE/Managed Executor 連動（`ScheduleServiceBean` → `ChartEventSseSupport`）と UI before/after を ORMaster 200 を得たタイミングで `docs/web-client/features/appointments.md`（作成済みの場合）へ添付。
- **UI 連携**: Trial 405 のため UI 変更は未着手。ORMaster 実測で差分が得られた段階で `artifacts/orca-connectivity/20251116T210500Z-E2/ui/` と `MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` EXT-02 行を更新する。
- **残 TODO**: ORMaster 認証情報（DNS/Firewall）を Ops に確認、SSE 証跡取得、`ORCA_API_STATUS.md` No.2/4 の `[Spec-based]` 除去タイミングを決定。

### EXT-03: 紹介状 / MML ログ採取
- **対象 API**: `/odletter/letter`, `/odletter/letter/detail`, `/mml/letter/{list,json}`, `/mml/labtest/{list,json}`。LetterResource は 200 実績あり、MmlResource 4 本は証跡未整備（コード上は 1:1 移植済）。
- **採取手順**:
  1. Trial/ORMaster 共通で `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/mml/letter/list` を実行し、`{"Code":405}` を Blocker 証跡として `docs/server-modernization/phase2/operations/logs/20251116T111329Z-external-api-gap.md` に追記済み。
  2. RUN_ID=`20251116T210500Z-E3` では Legacy/Modernized コード比較とサンプル棚卸しを実施し、`artifacts/external-interface/mml/20251116T210500Z-E3/README.md` および `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E3-mml.md` を作成。Runbook §4.4 にチェックリストを追加した。  
  3. RUN_ID=`20251116T134354Z` で Jakarta Persistence (`LetterItem/Text/Date`) を `server-modernized/.../persistence.xml` へ登録し、`tmp/parity-headers/mml_TEMPLATE.headers` を MD5 パスワード＋`X-Facility-Id` 付きへ更新。`artifacts/external-interface/mml/20251116T134354Z/README.md` と ops ログ (`20251116T134354Z-mml.md`) を整備し、docker 再構築後の `send_parallel_request.sh` 実測に備えた。  
  4. ORMaster 接続が許可されたタイミングで `curl -u <ormaster> https://<host>/mml/letter/json/{pk}` など 4 エンドポイントを取得し、Legacy との差分を `diff -u legacy.json modern.json` で生成。結果は `artifacts/external-interface/mml/<RUN_ID>/{letter_json,labtest_json}` へ格納。  
  5. 取得完了後に `STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` / `API_PARITY_MATRIX.md` の 4 行を `[x]/◎` へ更新し、`DOC_STATUS` W22 備考を `[証跡取得済]` に切り替える。
- **監査/設定**: 紹介状テンプレの監査 ID (`LETTER_EXPORT_SINGLE`, `LETTER_EXPORT_BULK`) および `LABTEST_EXPORT_SINGLE` (仮称) を `AuditTrailService` に追加し、`server-modernized/src/main/resources/application-mml.properties`（存在する場合）へ `mml.export.storage` を定義する。
- **残 TODO**: ORMaster での CRUD 実行と diff ログ作成、`AuditTrailService` フックの確認、`PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` の MML チェック行へ今回の証跡リンクを設定。
