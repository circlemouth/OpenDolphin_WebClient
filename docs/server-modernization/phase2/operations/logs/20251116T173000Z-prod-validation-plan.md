# 20251116T173000Z ORCA Production Validation Plan

## 1. Summary / Updated Docs
- `ORCA_CONNECTIVITY_VALIDATION.md` §4.3/§4.4 へ final validation 手順と RUN_ID=`20251116T173000Z` 方針 (`curl -vv -u ormaster:ormaster ...`, DNS/TLS 証跡、`operations/logs/<RUN_ID>-prod-validation.md` リンク) を追記。
- `ORCA_API_STATUS.md` に Spec-based 列 + PHR 行を追加し、Matrix No.2/4/11/32/42 を本番接続切替手順 (`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md#<api>`) と連携。
- `MODERNIZED_API_DOCUMENTATION_GUIDE.md` §3.2、`PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md`、`MODERNIZED_REST_API_INVENTORY.md` §7 へ共通メッセージと Spec-based 記録・最終 RUN_ID 手順を挿入。
- 証跡ログ（本ファイル）を新設し、DOC_STATUS への参照用パスを確保。

## 2. Common Policy
> RUN_ID=`20251116T173000Z`: Trial サーバーで POST/PHR API が禁止されている間は Spec-based 実装として扱い、最終段階で ORMaster／本番サーバー接続に切り替えて通信検証を行う。検証完了後に DOC_STATUS／Runbook／API_STATUS を同日更新する。

- DNS/TLS: `nslookup weborca-trial.orca.med.or.jp` / `openssl s_client -connect weborca-trial.orca.med.or.jp:443` の ORMaster 切替版を `artifacts/orca-connectivity/20251116T173000Z/{dns,tls}/` へ取得。
- HTTP 証跡: `curl -vv -u ormaster:ormaster --data-binary @payloads/<api>_prod.xml https://ormaster.orca.med.or.jp/<path>`（PHR は `/20/adm/phr/*`、REST ラッパーは `/api01rv2/*`,`/orca**/*`）を取得し、`docs/server-modernization/phase2/operations/logs/20251116T173000Z-<api>.md` サマリへ展開予定。
- DOC_STATUS: W22 ORCA 行へ「RUN_ID=20251116T173000Z / `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md`」追記済み。

## 3. API Final Validation Checklist
### <a id="appointmodv2"></a>`/orca14/appointmodv2`
- 手順: `curl -vv -u ormaster:ormaster --data-binary @payloads/appointmod_prod.xml https://ormaster.orca.med.or.jp/orca14/appointmodv2?class=01`。
- 証跡: `artifacts/orca-connectivity/20251116T173000Z/crud/appointmodv2/`（request/response, UI screenshot）。
- 完了後: `ORCA_API_STATUS.md` Matrix No.2 Spec 列 / `MODERNIZED_REST_API_INVENTORY.md` No.2 / DOC_STATUS を更新。
- 進捗 (2025-11-16 RUN_ID=`20251116T210500Z-E2`): Trial では `HTTP/1.1 405 Method Not Allowed`（`artifacts/orca-connectivity/20251116T210500Z-E2/appointmodv2/trial/`）。ORMaster は `nslookup ormaster.orca.med.or.jp` が `NXDOMAIN` のため未到達。詳細は `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-appointmod.md`。

### <a id="acceptmodv2"></a>`/orca11/acceptmodv2`
- 手順: `curl -vv -u ormaster:ormaster --data-binary @payloads/acceptmod_prod.xml https://ormaster.orca.med.or.jp/orca11/acceptmodv2?class=01`。
- 証跡: `crud/acceptmodv2/` + `blocked/README.md#acceptmodv2` を「解除」に切替。
- 進捗 (2025-11-16 RUN_ID=`20251116T210500Z-E2`): Trial は `HTTP/1.1 405 Method Not Allowed`（`artifacts/orca-connectivity/20251116T210500Z-E2/acceptmodv2/trial/`）。ORMaster への DNS 解決ができず `curl: (6)`。詳細は `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E2-acceptmod.md`。

### <a id="appointlstv2"></a>`/api01rv2/appointlstv2`
- Trial 参照のみの JSON を ORMaster `/api01rv2/appointlstv2` で再計測し、予約 CRUD 後の反映差分を `Δtimestamp.md` に追記。

### <a id="medicatonmodv2"></a>`/orca102/medicatonmodv2`
- `curl -vv -u ormaster:ormaster --data-binary @payloads/medicatonmod_prod.json https://ormaster.orca.med.or.jp/orca102/medicatonmodv2`。
- 点数マスタ同期後の `Api_Result` と DTO 変換ログを `docs/server-modernization/phase2/operations/logs/20251116T173000Z-orca-tensu.md` へ記録。

### <a id="patientlst1v2"></a>`/api01rv2/patientlst1v2`
- `curl -vv -u ormaster:ormaster --data-binary @payloads/patientlst1_prod.json https://ormaster.orca.med.or.jp/api01rv2/patientlst1v2?class=01`。
- `OrcaPatientBatchResource#patientIdList` の JSON と ORCA XML を diff。

### <a id="patientlst2v2"></a>`/api01rv2/patientlst2v2`
- バッチ 500 件分を ORMaster で取得して `artifacts/.../patientlst2v2/` へ保存。

### <a id="patientlst3v2"></a>`/api01rv2/patientlst3v2`
- 氏名検索結果を ORMaster 応答で更新し、UI ハイライトの期待値を `docs/server-modernization/phase2/operations/logs/20251116T173000Z-orca-name-search.md` に追記。

### <a id="system01lstv2"></a>`/api01rv2/system01lstv2`
- 管理メニュー解放後に `/orca/system/management` REST ラッパーから DTO へ流し、`coverage/coverage_matrix.md` の Matrix No.11 を `実測完了` へ更新。

### <a id="medicalgetv2"></a>`/api01rv2/medicalgetv2`
- ORMaster `/api01rv2/medicalgetv2` を `curl -vv -u ormaster:ormaster --data-binary @payloads/medicalget_prod.json` で取得し、モダナイズ DB との差分を `docs/server-modernization/phase2/operations/logs/20251116T173000Z-orca-medical.md` に転記。

### <a id="diseasegetv2"></a>`/api01rv2/diseasegetv2`
- ORMaster からの XML を `OrcaDiseaseResource` へ透過し、`RegisteredDiagnosisModel` との突合ログを残す。

### <a id="patientmodv2"></a>`/orca12/patientmodv2`
- Delete 系を ORMaster で実測（Trial 405）。CRUD 完了後に `PatientServiceBean` の監査を `artifacts/.../patientmodv2/` へ保存。

### <a id="appointlst2v2"></a>`/api01rv2/appointlst2v2`
- 患者別予約一覧の POST を ORMaster で再取得し、`/orca/appointments/patient` の JSON を比較。

### <a id="acsimulatev2"></a>`/api01rv2/acsimulatev2`
- 請求試算 API の `Api_Result`/`Warning` を ORMaster 応答ベースにし、SSE 連携ログを更新。

### <a id="subjectivesv2"></a>`/orca25/subjectivesv2`
- Trial stub を解除し、ORMaster で `/orca25/subjectivesv2` CRUD を実行。`subjectives` DTO を保存。

### <a id="visitptlstv2"></a>`/api01rv2/visitptlstv2`
- 来院一覧 (`/orca/visits/list`) を ORMaster で再取得し、PVT キャッシュとの整合を `VisitPatientListResponse` に記録。

### <a id="manageusersv2"></a>`/orca101/manageusersv2`
- 職員登録/削除を ORMaster で実測し、`/orca/system/users` REST ラッパーに透過。`system01lstv2` と同じ RUN で管理権限を確認。

### <a id="medicalsetv2"></a>`/orca21/medicalsetv2`
- 診療セット stub を本番応答へ差し替え。`Request_Number` ごとに CRUD 証跡を採取。

### <a id="birthdeliveryv2"></a>`/orca31/birthdeliveryv2`
- 出産育児 API を ORMaster で実測し、`Api_Result`/`Birth_Info` を JSON へ転写。

### <a id="patientlst6v2"></a>`/api01rv2/patientlst6v2`
- 保険組合せ一覧（Matrix No.35）の ORMaster 応答を取得し、`/orca/insurance/combinations` と diff。

### <a id="patientlst8v2"></a>`/api01rv2/patientlst8v2`
- 旧姓履歴を ORMaster 応答で確認し、`FormerNameHistoryResponse` のマッピング差分を整理。

### <a id="diseasev2"></a>`/orca22/diseasev2`
- `DiseaseMutationRequest` を ORMaster POST で再測。`Api_Result` と `RegisteredDiagnosisModel` の同期ログを `artifacts/.../diseasev2/` に保存。

### <a id="diseasev3"></a>`/orca22/diseasev3`
- v3 フィールド（BaseMonth 等）を ORMaster 応答で補完し、stub を解除。

### <a id="receiptprintv3"></a>`/orca42/receiptprintv3`
- 帳票印刷（Matrix No.42）を ORMaster で実測し、`push-exchanger` と `/blobapi` への連携を `docs/server-modernization/phase2/operations/logs/20251116T173000Z-orca-report.md` に記録。

### <a id="phr"></a>PHR `/20/adm/phr/*`
- Trial 404/405 を維持しつつ、ORMaster で Phase-A〜F (`phaseA` `phaseB` ... `phr06`) を `curl -vv -u ormaster:ormaster --data-binary @payloads/phr_phase_<x>_prod.json https://ormaster.orca.med.or.jp/20/adm/phr/<x>` で取得。`artifacts/orca-connectivity/20251116T173000Z/crud/phr_phase_<x>/` へ証跡保存。

### <a id="phr-phase-ab"></a>Task-D Final Validation
- 担当: Worker-A。条件: ORMaster BASIC 認証。ログ: `docs/server-modernization/phase2/operations/logs/20251116T173000Z-phr-phase-ab.md`。

### <a id="phr-phase-cde"></a>Task-F Final Validation
- 担当: Worker-B。条件: ORMaster `/20/adm/phr/phr0{3-6}` 開放。ログ: `.../20251116T173000Z-phr-phase-cde.md`。

### <a id="manager-ops"></a>Manager Ops / Escalation
- エスカレーション用週次資料に ORMaster 切替条件・DNS/TLS 証跡・残課題（ORMaster 認証配布待ち）を添付。タスク: PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST Task-I。

## 4. Next Actions
1. ORMaster 認証（ormaster:ormaster）とアクセスホワイトリストの確認（Ops チーム）。
2. `payloads/*_prod.*` を証跡と同じ RUN_ID で freeze し、`artifacts/orca-connectivity/20251116T173000Z` 配下にコピー。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行へ「本番検証 plan」を追記（済）し、実測完了後に日付＋結果を更新。
4. Worker 報告: `【ワーカー報告】RUN_ID=20251116T173000Z` を提出し、証跡リンクと残課題（ORMaster 証明書受領待ち）を明記。
