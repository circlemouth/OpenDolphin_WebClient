# Webクライアント未活用機能一覧（参照経路付き）

更新日: 2026-01-14
RUN_ID: 20260114T145507Z

## 目的
モダナイズ版サーバー（server-modernized）に実装済みだが、Webクライアントからは未使用の機能/APIを整理し、後続ワーカーが迷わず実装できるように**参照経路（server側の入口〜ORCA transport/スタブまで）**を明示する。

## 範囲/前提
- 対象は `web-client/src` で参照が見つからないエンドポイント。
- ORCA連携は **server-modernized 経由**が前提（Webクライアントから直叩きしない）。
- Phase2 ドキュメントは Legacy なので、本ドキュメントからのリンクはしない。

## 参照経路の読み方（共通）
- **server入口**: REST Resource の `@Path`（server-modernized）
- **service**: 必要に応じて `OrcaWrapperService` / domain service を経由
- **transport/ORCA**:
  - `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaEndpoint.java`
  - `server-modernized/src/main/java/open/dolphin/orca/transport/RestOrcaTransport.java`
  - `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaHttpClient.java`
- **スタブ**: `server-modernized/src/main/resources/orca/stub/*.sample.(xml|json)`
- **Webクライアント側の実装参考**:
  - XML API: `web-client/src/features/charts/orcaMedicalGetApi.ts` など
  - JSON API: `web-client/src/features/outpatient/orcaQueueApi.ts`
  - ルーティング許可: `web-client/src/libs/http/httpClient.ts`

---

## A. ORCA wrapper（JSON）※未活用
ORCA XML API を server 側でラップし、Webクライアントには JSON で返す系。フロント実装は **JSON API モジュール**として実装し、`httpFetch` + observability + audit に合わせる。

### A-1. 予約・受付・請求試算
※Webクライアントは `/orca/appointments/list` を利用中（RUN_ID=`20251217T234312Z`）。`/orca/appointments/patient`・`/orca/appointments/mutation`・`/orca/visits/*` は未接続。
1) `/orca/appointments/list`（予約一覧）
- server入口: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaAppointmentResource.java`
- service: `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java#getAppointmentList`
- transport: `OrcaEndpoint.APPOINTMENT_LIST`（`/api01rv2/appointlstv2`）
- stub: `server-modernized/src/main/resources/orca/stub/06_appointlstv2_response.sample.xml`
- DTO: `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaAppointmentListRequest.java` / `OrcaAppointmentListResponse.java`
- Web参考: `web-client/src/features/reception/api.ts`（外来一覧の取得フロー）

2) `/orca/appointments/patient`（患者別予約一覧）
- server入口: `OrcaAppointmentResource.java`
- service: `OrcaWrapperService.java#getPatientAppointments`
- transport: `OrcaEndpoint.PATIENT_APPOINTMENT_LIST`（`/api01rv2/appointlst2v2`）
- stub: `server-modernized/src/main/resources/orca/stub/15_appointlst2v2_response.sample.xml`
- DTO: `PatientAppointmentListRequest.java` / `PatientAppointmentListResponse.java`
- Web参考: `web-client/src/features/patients/api.ts`（患者IDを入力するAPIの作法）

3) `/orca/billing/estimate`（請求試算）
- server入口: `OrcaAppointmentResource.java`
- service: `OrcaWrapperService.java#simulateBilling`
- transport: `OrcaEndpoint.BILLING_SIMULATION`（`/api01rv2/acsimulatev2`）
- stub: `server-modernized/src/main/resources/orca/stub/16_acsimulatev2_response.sample.xml`
- DTO: `BillingSimulationRequest.java` / `BillingSimulationResponse.java`
- Web参考: `web-client/src/features/charts/OrcaSummary.tsx`（会計系パネルの表示パターン）

4) `/orca/appointments/mutation`（予約更新）
- server入口: `OrcaAppointmentResource.java`
- service: `OrcaWrapperService.java#mutateAppointment`
- transport: `OrcaEndpoint.APPOINTMENT_MUTATION`（`/orca14/appointmodv2`）
- stub: `server-modernized/src/main/resources/orca/stub/02_appointmodv2_response.sample.xml`
- DTO: `AppointmentMutationRequest.java` / `AppointmentMutationResponse.java`
- Web参考: `web-client/src/features/charts/PatientInfoEditDialog.tsx`（保存前確認/監査UI）

5) `/orca/visits/list`（受付一覧）
- server入口: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaVisitResource.java`
- service: `OrcaWrapperService.java#getVisitList`
- transport: `OrcaEndpoint.VISIT_LIST`（`/api01rv2/visitptlstv2`）
- stub: `server-modernized/src/main/resources/orca/stub/18_visitptlstv2_response.sample.xml`
- DTO: `VisitPatientListRequest.java` / `VisitPatientListResponse.java`
- Web参考: `web-client/src/features/reception/api.ts`

6) `/orca/visits/mutation`（受付更新）
- server入口: `OrcaVisitResource.java`
- service: `OrcaWrapperService.java#mutateVisit`
- transport: `OrcaEndpoint.ACCEPTANCE_MUTATION`（`/orca11/acceptmodv2`）
- stub: `server-modernized/src/main/resources/orca/stub/04_acceptmodv2_response.sample.xml`
- DTO: `VisitMutationRequest.java` / `VisitMutationResponse.java`
- Web参考: `web-client/src/features/reception/pages/ReceptionPage.tsx`（受付変更のUI/監査）

### A-2. 患者同期（バッチ・検索・保険）
※Webクライアントは `/orca/patients/local-search` で患者検索/一覧を実装済み（RUN_ID=`20251212T143720Z`）。その他の `/orca/patients/*` は未接続。
1) `/orca/patients/id-list`（患者ID一覧）
- server入口: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaPatientBatchResource.java`
- service: `OrcaWrapperService.java#getPatientIdList`
- transport: `OrcaEndpoint.PATIENT_ID_LIST`（`/api01rv2/patientlst1v2`）
- stub: `server-modernized/src/main/resources/orca/stub/08_patientlst1v2_response.sample.xml`
- DTO: `PatientIdListRequest.java` / `PatientIdListResponse.java`
- Web参考: `web-client/src/features/patients/api.ts`（患者一覧APIの基礎）

2) `/orca/patients/batch`（患者一括取得）
- server入口: `OrcaPatientBatchResource.java`
- service: `OrcaWrapperService.java#getPatientBatch`
- transport: `OrcaEndpoint.PATIENT_BATCH`（`/api01rv2/patientlst2v2`）
- stub: `server-modernized/src/main/resources/orca/stub/09_patientlst2v2_response.sample.xml`
- DTO: `PatientBatchRequest.java` / `PatientBatchResponse.java`

3) `/orca/patients/name-search`（患者名検索）
- server入口: `OrcaPatientBatchResource.java`
- service: `OrcaWrapperService.java#searchPatients`
- transport: `OrcaEndpoint.PATIENT_NAME_SEARCH`（`/api01rv2/patientlst3v2`）
- stub: `server-modernized/src/main/resources/orca/stub/10_patientlst3v2_response.sample.xml`
- DTO: `PatientNameSearchRequest.java` / `PatientSearchResponse.java`

4) `/orca/insurance/combinations`（保険組み合わせ）
- server入口: `OrcaPatientBatchResource.java`
- service: `OrcaWrapperService.java#getInsuranceCombinations`
- transport: `OrcaEndpoint.INSURANCE_COMBINATION`（`/api01rv2/patientlst6v2`）
- stub: `server-modernized/src/main/resources/orca/stub/35_patientlst6v2_response.sample.xml`
- DTO: `InsuranceCombinationRequest.java` / `InsuranceCombinationResponse.java`
- Web参考: `web-client/src/features/patients/insuranceApi.ts`

5) `/orca/patients/former-names`（旧姓履歴）
- server入口: `OrcaPatientBatchResource.java`
- service: `OrcaWrapperService.java#getFormerNames`
- transport: `OrcaEndpoint.FORMER_NAME_HISTORY`（`/api01rv2/patientlst8v2`）
- stub: `server-modernized/src/main/resources/orca/stub/51_patientlst8v2_response.sample.xml`
- DTO: `FormerNameHistoryRequest.java` / `FormerNameHistoryResponse.java`

---

## B. ORCA公式 XML プロキシ（XML）※未活用
Webクライアントが XML を送るケース。`OrcaAdditionalApiResource` / `OrcaMedicalApiResource` 等の既存実装を参考にする。

1) `/api01rv2/acceptlstv2`（受付一覧）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/OrcaAcceptanceListResource.java`
- transport: `OrcaEndpoint.ACCEPTANCE_LIST`
- stub: `server-modernized/src/main/resources/orca/stub/05_acceptlstv2_response.sample.xml`
- 参考実装: `web-client/src/features/charts/orcaMedicalGetApi.ts`

2) `/api01rv2/system01lstv2`（システム管理一覧）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java`
- transport: `OrcaEndpoint.SYSTEM_MANAGEMENT_LIST`
- stub: `server-modernized/src/main/resources/orca/stub/44_system01lstv2_response.sample.xml`
- 参考実装: `web-client/src/features/administration/api.ts`（system01dailyv2 連携）

3) `/orca101/manageusersv2`（ユーザー管理）
- server入口: `OrcaSystemManagementResource.java`
- transport: `OrcaEndpoint.MANAGE_USERS`
- stub: `server-modernized/src/main/resources/orca/stub/45_manageusersv2_response.sample.xml`

4) `/api01rv2/insprogetv2`（保険者マスタ）
- server入口: `OrcaSystemManagementResource.java`
- transport: `OrcaEndpoint.INSURANCE_PROVIDER`
- stub: `server-modernized/src/main/resources/orca/stub/46_insprogetv2_response.sample.xml`

---

## C. ORCA内製ラッパー（JSON・stub混在）※未活用
Trial閉鎖で stub 応答のみの API を含むため、UI で **stub 表示/未開放** を明示する必要あり。

1) `/orca/medical-sets`（診療セット）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java`
- DTO: `MedicalSetMutationRequest.java` / `MedicalSetMutationResponse.java`
- 備考: stub固定（Api_Result=79）

2) `/orca/tensu/sync`（点数マスタ同期）
- server入口: `OrcaMedicalAdministrationResource.java`
- DTO: `MedicationModRequest.java` / `MedicationModResponse.java`
- 備考: stub固定（Api_Result=79）

3) `/orca/birth-delivery`（出産育児一時金）
- server入口: `OrcaMedicalAdministrationResource.java`
- DTO: `BirthDeliveryRequest.java` / `BirthDeliveryResponse.java`
- 備考: stub固定（Api_Result=79）

4) `/orca/medical/records`（診療記録取得）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java`
- DTO: `MedicalGetRequest.java` / `MedicalGetResponse.java`
- 備考: `OrcaPostFeatureFlags` で実データ切替。デフォルトは stub。

5) `/orca/patient/mutation`（患者作成/更新）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java`
- DTO: `PatientMutationRequest.java` / `PatientMutationResponse.java`
- 備考: delete は Trial 閉鎖想定で stub。

6) `/orca/chart/subjectives`（主訴登録）
- server入口: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaSubjectiveResource.java`
- DTO: `SubjectiveEntryRequest.java` / `SubjectiveEntryResponse.java`
- 備考: `OrcaPostFeatureFlags` で実データ切替。デフォルトは stub。

---

## D. Legacy REST（server 側に存在、Webクライアント未使用）
Webクライアントの設計方針次第で接続可。ただし Legacy API をそのまま使うかは別途判断が必要。
2026-01-14 時点では **debug 導線 `/debug/legacy-rest`** から疎通確認できるようにし、2xx/4xx 判定と `legacy: true` の監査ログを残す（本番ユーザー導線には非公開）。
  - 実装: `web-client/src/features/debug/legacyRestApi.ts` / `web-client/src/features/debug/LegacyRestConsolePage.tsx`
  - ガード: system_admin + `VITE_ENABLE_DEBUG_PAGES=1`
  - 監査: `source=legacy-rest`, `payload.legacy=true`, `payload.endpoint` を必須化
2026-01-14 追記: **通常導線（Administration）** に `Legacy REST 互換 API` パネルを追加し、system_admin が 2xx/4xx 判定を UI で確認できるようにした（RUN_ID=20260114T135802Z）。
  - 導線: `/f/:facilityId/administration` → 「Legacy REST 互換 API（通常導線）」パネル
  - 監査: `screen=administration/legacy-rest`, `action=legacy-rest-request`, `payload.legacy=true`, `payload.endpoint` を必須化

- 受付/来院
  - `server-modernized/src/main/java/open/dolphin/rest/PVTResource.java`（/pvt）
  - `server-modernized/src/main/java/open/dolphin/rest/PVTResource2.java`（/pvt2）
  - `server-modernized/src/main/java/open/dolphin/rest/AppoResource.java`（/appo）

- カルテ/ドキュメント
  - `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`（/karte）
  - `server-modernized/src/main/java/open/dolphin/rest/StampResource.java`（/stamp）
  - `server-modernized/src/main/java/open/dolphin/rest/PatientResource.java`
  - `server-modernized/src/main/java/open/dolphin/rest/LetterResource.java`（/odletter）

- スケジュール/帳票/検体
  - `server-modernized/src/main/java/open/dolphin/rest/ScheduleResource.java`（/schedule）
  - `server-modernized/src/main/java/open/dolphin/rest/ReportingResource.java`（/reporting/karte）
  - `server-modernized/src/main/java/open/dolphin/rest/NLabResource.java`（/lab）
  - `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java`（/mml）

- イベント/システム
  - `server-modernized/src/main/java/open/dolphin/rest/ChartEventResource.java`（/chartEvent）
  - `server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java`（/chart-events）
  - `server-modernized/src/main/java/open/dolphin/rest/SystemResource.java`（/dolphin|/system）
  - `server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java`（/serverinfo）
  - `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java`（/demo）

---

## E. Touch / ADM / PHR 系（server 側に存在、Webクライアント未使用）
- Touch
  - `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/DolphinResourceASP.java`
  - `server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/EHTResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/DemoResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java`

- ADM/PHR
  - `server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java`
  - `server-modernized/src/main/java/open/dolphin/adm20/rest/JsonTouchResource.java`
  - `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
  - `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java`
  - `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`

2026-01-14 追記: Administration 画面に Touch/ADM/PHR API の疎通確認パネルを追加し、主要 endpoint の 200/4xx 判定と監査ログを記録できるようにした（RUN_ID=20260114T145507Z）。

---

## 実装開始時のチェックリスト（Web側）
- `web-client/src/libs/http/httpClient.ts` に通過パスを追加（必要な場合）
- `httpFetch` 経由で `runId/traceId` を付与する
- ORCA XML は **Content-Type/Accept** を既存 API と合わせる
- 監査ログ: `web-client/src/libs/audit/auditLogger.ts` の利用/追加
- 画面側のトーンは `web-client/src/ux/charts/tones.ts` を準拠
- MSW 追加ハンドラは `web-client/src/mocks/handlers/*` に追加
