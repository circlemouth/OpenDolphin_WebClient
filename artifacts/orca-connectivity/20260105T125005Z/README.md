# ORCA Trial API-only connectivity evidence (RUN_ID=20260105T125005Z)

## Summary
- system01dailyv2: HTTP 200 / Api_Result=00 (処理終了)
- systeminfv2: HTTP 200 / Api_Result=0000 (処理終了)
- system01lstv2 (class=01): HTTP 200 / Api_Result=00 (処理終了)

## Evidence index
- system01dailyv2
  - request: trial/system01dailyv2/request.xml
  - response: trial/system01dailyv2/response.xml
  - headers: trial/system01dailyv2/response.headers
  - status: trial/system01dailyv2/response.status
  - curl verbose: trial/system01dailyv2/request_v.curl_verbose.txt
  - curl response (verbose): trial/system01dailyv2/response_v.xml
- systeminfv2
  - request: trial/systeminfv2/request.xml
  - request timestamp: trial/systeminfv2/request.timestamp.txt
  - response: trial/systeminfv2/response.xml
  - headers: trial/systeminfv2/response.headers
  - status: trial/systeminfv2/response.status
  - curl verbose: trial/systeminfv2/request_v.curl_verbose.txt
  - curl response (verbose): trial/systeminfv2/response_v.xml
- system01lstv2 (class=01)
  - request: trial/system01lstv2/request.xml
  - response: trial/system01lstv2/response.xml
  - headers: trial/system01lstv2/response.headers
  - status: trial/system01lstv2/response.status
  - curl verbose: trial/system01lstv2/request_v.curl_verbose.txt
  - curl response (verbose): trial/system01lstv2/response_v.xml

## CLAIM/JMS log check
- logs/server-modernized.claim_jms.txt
- logs/web-client-dev.claim_jms.txt
- logs/server-modernized.log.txt (raw)
- logs/web-client-dev.tail.txt
- logs/minio.log.txt
- logs/postgres.log.txt
