# 03 モダナイズ API マッピング

- **RUN_ID=20251204T064209Z** で Phase2 の foundation チェーンと UX/Architecture 側ドキュメント（将来 `docs/web-client/architecture/web-client-api-mapping.md` に統合予定）を起点に、Reception/Charts/Patients/Administration が使う外来 API のレスポンス shape と監査メタ (`auditEvent`) を整理します。
- 本稿は `docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md` で示された優先領域と、`docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` の共通メタ（runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt）に整合させています。

## 1. Reception で使う ORCA 外来レセプト API

| パス | 目的 | 主なレスポンス項目 | `auditEvent` で残すべき情報 |
| --- | --- | --- | --- |
| `/api01rv2/claim/outpatient/*` | 予約/診療で送信された外来請求データ（`claim:information`＋`claim:bundle`以下の処理済みオーダー）を Web クライアントが受信・表示する | `claim:information` ヘッダ（`claim:performTime`、`claim:status`、`insuranceUid`、`timeClass`）<br>`claim:bundle` ごとの `classCode`/`bundleNumber`/`claim:item`（`code`/`tableId`/`name`/`number`/`unit`/`claimRate`）<br>`mmlRd:InOutPatient=outpatient` など入外区分 | `ORCA_CLAIM_OUTPATIENT` 相当の action で `facilityId`/`patientId`/`claimBundles` 数（または bundleId）を `details` に含め、`resource` にリクエスト path、`traceId`/`requestId`/`actorId`/`facilityId` を `AuditEventEnvelope` にセット。メタ `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt` も `details` に載せる。現状 `KarteResource.sendDocument` は `recordAudit` を呼び出していないため、外部 request 層で `SessionAuditDispatcher` を介して同等の `auditEvent` を書き出す設計が必要（また `docs/server-modernization/phase2/operations/logs/20251202T083708Z-api-gap.md` に gap 記録）。 |
| `/api01rv2/appointment/outpatient/*` | 予約一覧・患者別予約・請求試算・来院中患者一覧などを現行 ORCA `appointlstv2`/`appointlst2v2`/`acsimulatev2`/`visitptlstv2` から取得して Web クライアントへ供給する | `OrcaAppointmentListResponse`（`apiResult`/`appointmentDate`/`slots[]` に `appointmentTime`・`departmentCode`・`physicianCode`・`visitInformation`・`PatientSummary`）<br>`PatientAppointmentListResponse`（`reservations[]` に `appointmentDate`/`appointmentId`/`departmentName`・`appointmentNote`）<br>`BillingSimulationResponse`（`totalPoint`、`breakdown[]`）<br>`VisitPatientListResponse`（`visits[]`：`voucherNumber`/`insuranceCombinationNumber`/`updateDate`）<br>`AppointmentMutationResponse`（予約登録・変更後の `appointmentId`/`departmentCode`/`warnings[]`） | 上記レスポンスに `runId=20251116T170500Z` などが自動付与されているが、`OrcaAppointmentResource` 側ではまだ `recordAudit` を通していない。`auditEvent` には `action=ORCA_APPOINTMENT_OUTPATIENT`（仮称）で `patientId`・`appointmentId`・`appointmentDate/time`・`operation=mutation/list/retrieve` を `details` に含め、`facilityId`/`traceId`/`requestId`/`actorId` を確保する。`details` には `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt` も含める（`docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` の metadata 仕様を参照）。`

### 1.1 `claim`/`appointment` で共通して監査メタを載せるための注意

- `Orca` から返る `Api_Result`/`Api_Result_Message` は UI 表示だけでなく `auditEvent.details` に `apiResult` を入れて追跡する。<br>
- `dataSourceTransition` は `mock→server` など切り替えの瞬間のみ返す（`docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md` 参照）。`missingMaster` や `fallbackUsed` も `details` に保持し、`OrcaSummary` のバナーに即時反映させる。<br>
- `claim` 送信時の `claim:bundle` 数・`inOut=outpatient` などは `details` にキャプチャして `d_audit_event` 上で diagnose しやすくする。`

## 2. Charts で使う `/orca21/medicalmodv2/outpatient`

- 中途終了（外来）データの登録/変更/削除を http://`/orca21/medicalmodv2` で担い、外来専用の `InOut`（空/`outpatient`）で外来レコードを返す。resp の `medicalreq`/`medicalres` には `Medical_Uid`・`Diagnosis_Information`（`Medical_Information`/`Disease_Information` を 40 件まで）・`Medical_Push` 等が含まれ、`resp` 側の `Api_Result`/`Api_Result_Message` で処理状態がわかる。詳細は `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/medicalmod.md` 参照。<br>
- 現行 `OrcaMedicalResource` は `MedicalGetResponse` を返し、`records[]` に `performDate`・`departmentCode`・`documentId`・`documentStatus`・`lastUpdated` を詰める。`records` には `insuranceCombinationNumber`（card）も含まれる。`
- `auditEvent` は `action=ORCA_MEDICAL_GET`、`details` に `facilityId`・`patientId`・`recordsReturned=records.size()` を含み、`outcome=SUCCESS` を明示。`traceId`/`requestId`/`actorId` は `AbstractOrcaRestResource.recordAudit` で `SessionAuditDispatcher` へ渡される。`

## 3. Patients/Administration の `/orca12/patientmodv2/outpatient`

- `patientmodv2` の class=01/02/03/04 で患者登録・更新・削除・保険追加を処理。外来か入院かは `Mod_Key/Patient_ID` と `Insurance` 情報で判断できる（`InOut` という項目は持たないが、UI では `outpatient` ルートのみを使う）。`docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/patientmod.md` が項目一覧とレスポンス設計を提供している。`
- `PatientMutationResponse`（`apiResult`/`apiResultMessage`/`runId`/`patientDbId`/`patientId`）はすべてのオペレーションで共通。`return` には警告メッセージ `warningMessage` もあり、UI では `OrcaSummary` に渡す。`
- 監査イベントとして `action=ORCA_PATIENT_MUTATION`、`details` に `facilityId`/`patientId`/`operation` (`create`/`update`/`delete`) を付与。`recordAudit` 呼び出しは `OrcaPatientResource` ですでに行われており `AuditTrailService` へ `TraceId` `RequestId` `ActorId` を伝搬するため、追加で `dataSource/cacheHit/missingMaster/fallbackUsed/runId` を `details` へ入れて `d_audit_event` との突合を容易にする。`

## 4. auditEvent の共通フォーマット

`SessionAuditDispatcher.buildEnvelopeFromPayload`（`server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`）は `AuditEventPayload` の `details` を `d_audit_event` に永続化する前に `facilityId`/`dataSource`/`cacheHit` などを補完し、`AuditEventEnvelope`（`common/src/main/java/open/dolphin/audit/AuditEventEnvelope.java`）へ詰める。`auditEvent` には以下を含めることを全エンドポイントでルール化しています：

1. `action` + `resource` + `actorId`（`ORCA_*` 系の action 名）<br>
2. `traceId`/`requestId`（`AbstractOrcaRestResource` が HTTP header から取得）<br>
3. `details` map: `facilityId`, `patientId`（利用可能な場合）、`operation`/`recordsReturned`/`appointmentId` など<br>
4. `details` に冒頭で述べた metadata（`runId`/`dataSource`/`snapshotVersion`/`cacheHit`/`missingMaster`/`fallbackUsed`/`dataSourceTransition`/`fetchedAt`）を追加し、UI 監査バナーと `AuditTrail` を同じ値で突合可能にする<br>
5. `Outcome` は成功系 `SUCCESS`、エラー系は `FAILURE` で `errorCode`/`errorMessage` を追加

## 5. Gap & 次のアクション

- `claim/outpatient` および `appointment/outpatient` については `auditEvent`（`recordAudit`）の挿入がまだ `OrcaAppointmentResource`/`KarteResource` で実装されておらず、`d_audit_event` への記録と `details` の整備が未完です。`docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md` に gap を追加しました。
- 入院系 `/orca21/medicalmodv2/inpatient` などは本フェーズで扱わず `差分表には“外来スコープ外”` と記載し、DOC_STATUS の備考にも付記します。
- 次のリリースでは `auditEvent` が Web クライアント側で `dataSourceTransition` を受け取れるよう `httpClient`/`Orca` ルートを調整し、Playwright で警告バナー（`missingMaster`/`fallbackUsed`）の再現を確認します。

---

## 参照
- `docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md`
- `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/claim.md`
- `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/patientmod.md`
- `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/medicalmod.md`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/*`（`MedicalGetResponse`, `PatientMutationResponse`, `OrcaAppointmentListResponse` 等）
- `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java`
- `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`
- `common/src/main/java/open/dolphin/audit/AuditEventEnvelope.java`
- `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`
