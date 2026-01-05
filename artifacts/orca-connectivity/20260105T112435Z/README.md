# ORCA Trial API-only connectivity (RUN_ID=20260105T112435Z)

## Summary
- Base URL: https://weborca-trial.orca.med.or.jp
- Auth: Basic (trial / weborcatrial)
- Mode: API-only (XML UTF-8)

## Evidence
- system01dailyv2
  - request: trial/system01dailyv2/request.xml
  - response: trial/system01dailyv2/response_v5.xml
  - headers: trial/system01dailyv2/response_v5.headers
  - curl verbose: trial/system01dailyv2/request_v5.curl_verbose.log
- systeminfv2
  - request: trial/systeminfv2/request.xml
  - response: trial/systeminfv2/response_v2.xml
  - headers: trial/systeminfv2/response_v2.headers
  - curl verbose: trial/systeminfv2/request_v2.curl_verbose.log

## Notes
- Authorization header is present in verbose logs.
- system01dailyv2 succeeded with Api_Result=00.
- systeminfv2 returned Api_Result=0006 (request time mismatch), but HTTP 200.
