# ORCA Claim Send Trial Evidence (20260207T153855Z)

- scenario: success
- durationMs: 285
- cacheKey: charts:orca-claim-send:1.3.6.1.4.1.9414.72.103:doctor1
- cacheEntry: {"patientId":"000001","appointmentId":"APT-2401","invoiceNumber":"INV-000001","dataId":"DATA-000001","runId":"20260207T153855Z","traceId":"trace-20260207T153855Z","apiResult":"00","sendStatus":"success","savedAt":"2026-02-07T18:36:57.884Z"}
- telemetryLog: 20260207T153855Z-_Data_Id_-telemetry.txt
- auditLog: 20260207T153855Z-_Data_Id_-audit.json
- orcaResponse: 20260207T153855Z-_Data_Id_-orca-response.txt
- pre-send debug: {"sendDisabled":false,"sendDisabledReason":null,"statusLine":"送信状態: 処理中（runId=20260207T153855Z / traceId=trace-20260207T153855Z）","transition":"20260207T153855Z"}- scenario: failure (msw fault http-500)
- durationMs: 278
- retryQueueLogged: true
- orcaClaimSendAudit: true
- telemetryLog: 20260207T153855Z-_aria-live_-telemetry.txt
- auditLog: 20260207T153855Z-_aria-live_-audit.json
- orcaResponse: 20260207T153855Z-_aria-live_-orca-response.txt
# ORCA Claim Send Trial Evidence (20260207T153855Z)

- scenario: success
- durationMs: 275
- cacheKey: charts:orca-claim-send:1.3.6.1.4.1.9414.72.103:doctor1
- cacheEntry: {"patientId":"000001","appointmentId":"APT-2401","invoiceNumber":"INV-000001","dataId":"DATA-000001","runId":"20260207T153855Z","traceId":"trace-20260207T153855Z","apiResult":"00","sendStatus":"success","savedAt":"2026-02-07T18:41:36.406Z"}
- telemetryLog: 20260207T153855Z-_Data_Id_-telemetry.txt
- auditLog: 20260207T153855Z-_Data_Id_-audit.json
- orcaResponse: 20260207T153855Z-_Data_Id_-orca-response.txt
- pre-send debug: {"sendDisabled":false,"sendDisabledReason":null,"statusLine":"送信状態: 処理中（runId=20260207T153855Z / traceId=trace-20260207T153855Z）","transition":"20260207T153855Z"}- scenario: failure (msw fault http-500)
- durationMs: 266
- retryQueueLogged: true
- orcaClaimSendAudit: true
- telemetryLog: 20260207T153855Z-_aria-live_-telemetry.txt
- auditLog: 20260207T153855Z-_aria-live_-audit.json
- orcaResponse: 20260207T153855Z-_aria-live_-orca-response.txt
