# Blocked / Notable Results (RUN_ID=20251121T153100Z)

- POST `/orca11/acceptmodv2?class=01`: HTTP 405 `Allow: OPTIONS, GET`. Evidence: `artifacts/orca-connectivity/20251121T153100Z/crud/acceptmodv2/response_2025-11-21T06-45-43Z.xml`. Trace: `trace/acceptmodv2_2025-11-21T06-45-43Z.trace`. Status: Method not allowed on target host; POST route unavailable.
- POST `/orca14/appointmodv2?class=01`: HTTP 405 `Allow: OPTIONS, GET`. Evidence: `artifacts/orca-connectivity/20251121T153100Z/crud/appointmodv2/response_2025-11-21T06-46-27Z.xml`. Trace: `trace/appointmodv2_2025-11-21T06-46-27Z.trace`. Status: Method not allowed on target host; POST route unavailable.
- Data gap: POST `acceptlstv2` (Api_Result=13, ドクターが存在しません) / `appointlstv2` (Api_Result=12) / `medicalmodv2` (Api_Result=10, 対象患者なし). Evidence under `crud/<api>/response_*.xml`. Follow-up: requires seed data (doctor/patient/insurance) on 100.102.17.40 to obtain Api_Result=00.
