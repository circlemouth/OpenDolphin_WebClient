# ORCA connectivity check (RUN_ID=20251121T150124Z)

- Target: http://100.102.17.40:8000/api01rv2/system01dailyv2
- Attempt1 (ormaster/ormaster): HTTP 401 Unauthorized
- Attempt2 (ormaster/change_me): HTTP 200 / Api_Result=00 (Base_Date=2025-11-21)
- Payload: XML (see local/system01dailyv2/request.xml)
- Evidence:
  - Attempt1: local/system01dailyv2/{response.headers,response.xml}, trace/system01dailyv2.trace (auth masked)
  - Attempt2: local/system01dailyv2_change-me/{response.headers,response.xml}, trace/system01dailyv2_change-me.trace (auth masked)
