# ORCA Claim Send Trial Evidence (20260121T003937Z)

- scenario: success
- durationMs: 161 (<= 3000ms)
- cacheKey: charts:orca-claim-send:1.3.6.1.4.1.9414.72.103:doctor1
- cacheEntry: {"patientId":"000001","appointmentId":"APT-2401","invoiceNumber":"INV-000001","dataId":"DATA-000001","runId":"20260121T003937Z","traceId":"trace-20260121T003937Z","apiResult":"00","sendStatus":"success","savedAt":"2026-01-21T00:42:22.664Z"}
- telemetryLog: 20260121T003937Z-_Data_Id_-telemetry.txt
- auditLog: 20260121T003937Z-_Data_Id_-audit.json
- orcaResponse: 20260121T003937Z-_Data_Id_-orca-response.txt

- scenario: failure (msw fault http-500)
- durationMs: 173 (<= 3000ms)
- retryQueueLogged: true
- orcaClaimSendAudit: true
- telemetryLog: 20260121T003937Z-_aria-live_-telemetry.txt
- auditLog: 20260121T003937Z-_aria-live_-audit.json
- orcaResponse: 20260121T003937Z-_aria-live_-orca-response.txt
