# SSE ChartEvent replay check (RUN_ID=20260124T134514Z)

## Environment
- MODERNIZED_APP_HTTP_PORT=19096
- MODERNIZED_APP_ADMIN_PORT=19995
- MODERNIZED_POSTGRES_PORT=55480
- MINIO_API_PORT=19120
- MINIO_CONSOLE_PORT=19121

## Commands
\n### 1) Send ChartEvent before restart
HTTP 401
response saved: /tmp/chart_event_put_1.json
\n### 2) Restart server container
opendolphin-server-modernized-dev-task-1769260796333-89889f
\n### 3) Wait for health
health OK
\n### 4) Replay with Last-Event-ID=0
{"error":"header_auth_disabled","code":"header_auth_disabled","message":"Header-based authentication is not allowed","status":401,"traceId":"7bf759bd-be9d-4c1c-ac66-8045a3f7a14c","path":"/openDolphin/resources/chart-events","principal":"1.3.6.1.4.1.9414.10.1:dolphindev","reason":"header_authentication_disabled"}sse log: /tmp/chart_event_sse_replay.log
\n### 5) Send ChartEvent with Basic auth
HTTP 404
response saved: /tmp/chart_event_put_2.json
\n### 6) Restart server container
opendolphin-server-modernized-dev-task-1769260796333-89889f
\n### 7) Wait for health
health OK
\n### 8) Replay with Last-Event-ID=0 (Basic auth)
sse log: /tmp/chart_event_sse_replay_basic.log
\n### 9) Send ChartEvent to /chartEvent/event with Basic auth
HTTP 200
response saved: /tmp/chart_event_put_3.json
\n### 10) Restart server container
opendolphin-server-modernized-dev-task-1769260796333-89889f
\n### 11) Wait for health
health OK
\n### 12) Replay with Last-Event-ID=0 (Basic auth)
sse log: /tmp/chart_event_sse_replay_basic2.log
replayed ids:
CREATE SEQUENCE
CREATE TABLE
CREATE INDEX
CREATE INDEX
\n### 13) Send ChartEvent after DDL apply
HTTP 200
response saved: /tmp/chart_event_put_4.json
\n### 14) Restart server container
opendolphin-server-modernized-dev-task-1769260796333-89889f
\n### 15) Wait for health
health OK
\n### 16) Replay with Last-Event-ID=0 (Basic auth)
sse log: /tmp/chart_event_sse_replay_basic3.log
replayed ids:
\n### 17) Send ChartEvent (PVT_STATE) and verify DB insert
HTTP 200
 event_id |      facility_id      | issuer_uuid 
----------+-----------------------+-------------
        1 | 1.3.6.1.4.1.9414.10.1 | issuer-6
(1 row)

\n### 18) Restart server container
opendolphin-server-modernized-dev-task-1769260796333-89889f
\n### 19) Wait for health
health OK
\n### 20) Replay with Last-Event-ID=0 (Basic auth)
sse log: /tmp/chart_event_sse_replay_basic4.log
replayed ids:

## Replay check rerun (RUN_ID=20260124T134514Z)
Date: 2026-01-24T14:26:04Z

### 1) Send ChartEvent x2 (Basic auth)
Command: curl -s -u "dolphindev:dolphindev" -H "Content-Type: application/json" -X PUT --data ... http://localhost:19096/openDolphin/resources/chartEvent/event
status1=0 response1={"error":"unauthorized","code":"unauthorized","message":"Authentication required","status":401,"traceId":"18357f3e-dc80-4f9c-9737-41e2c7d9c80a","path":"/openDolphin/resources/chartEvent/event","reason":"authentication_failed"}
status2=0 response2={"error":"unauthorized","code":"unauthorized","message":"Authentication required","status":401,"traceId":"79d97451-c512-4826-b5d2-4cb7bed02ffa","path":"/openDolphin/resources/chartEvent/event","reason":"authentication_failed"}

### 2) Query latest event_id
Command: docker exec opendolphin-postgres-modernized-task-1769260796333-89889f psql -U opendolphin -d opendolphin_modern -tAc "select max(event_id) from chart_event_history where facility_id=1.3.6.1.4.1.9414.10.1;"
latest_event_id=

### 3) Restart server container
Command: docker restart opendolphin-server-modernized-dev-task-1769260796333-89889f
opendolphin-server-modernized-dev-task-1769260796333-89889f

### 4) Wait for health
health OK (attempt 3)

### 5) Replay with Last-Event-ID=0
Command: curl -N --max-time 5 -u "dolphindev:dolphindev" -H "clientUUID: sse-client-replay" -H "Last-Event-ID: 0" http://localhost:19096/openDolphin/resources/chart-events
sse log: /tmp/chart_event_sse_replay_basic5.log
--- replay output ---
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0{"error":"unauthorized","code":"unauthorized","message":"Authentication required","status":401,"traceId":"dbc3c6c3-0fa4-4377-bb30-d064600f0324","path":"/openDolphin/resources/chart-events","reason":"authentication_failed"}100   222  100   222    0     0    650      0 --:--:-- --:--:-- --:--:--   651
--- end replay output ---

### 6) Replay check (corrected latest id)
latest_event_id=1
Last-Event-ID=0
Command: docker restart opendolphin-server-modernized-dev-task-1769260796333-89889f
opendolphin-server-modernized-dev-task-1769260796333-89889f

### 7) Wait for health
health OK (attempt 2)

### 8) Replay with Last-Event-ID=0
Command: curl -N --max-time 5 -u 'dolphindev:dolphindev' -H 'clientUUID: sse-client-replay-2' -H 'Last-Event-ID: 0' http://localhost:19096/openDolphin/resources/chart-events
sse log: /tmp/chart_event_sse_replay_basic6.log
--- replay output ---
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0{"error":"unauthorized","code":"unauthorized","message":"Authentication required","status":401,"traceId":"c1f90fbb-50e7-4501-9432-5a23125ec77b","path":"/openDolphin/resources/chart-events","reason":"authentication_failed"}100   222  100   222    0     0   1596      0 --:--:-- --:--:-- --:--:--  1597
--- end replay output ---

## Replay check rerun (Basic auth + X-Facility-Id)
Date: 2026-01-24T14:28:22Z

### 1) Send ChartEvent x2 (Basic auth + facility header)
response1=1
response2=1

### 2) Query latest event_id
Command: docker exec opendolphin-postgres-modernized-task-1769260796333-89889f psql -U opendolphin -d opendolphin_modern -tAc "select max(event_id) from chart_event_history where facility_id='1.3.6.1.4.1.9414.10.1';"
latest_event_id=3

### 3) Restart server container
Command: docker restart opendolphin-server-modernized-dev-task-1769260796333-89889f
opendolphin-server-modernized-dev-task-1769260796333-89889f

### 4) Wait for health
health OK (attempt 2)

### 5) Replay with Last-Event-ID=2
Command: curl -N --max-time 5 -u 'dolphindev:dolphindev' -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' -H 'clientUUID: sse-client-replay-3' -H 'Last-Event-ID: 2' http://localhost:19096/openDolphin/resources/chart-events
sse log: /tmp/chart_event_sse_replay_basic7.log
--- replay output ---
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0

event: chart-event
id: 3
data: {"state":0,"eventType":0,"issuerUUID":"issuer-replay-4","byomeiCount":0,"byomeiCountToday":0,"facilityId":"1.3.6.1.4.1.9414.10.1","pvtPk":0,"ptPk":0}

100   184    0   184    0     0    151      0 --:--:--  0:00:01 --:--:--   152100   184    0   184    0     0     83      0 --:--:--  0:00:02 --:--:--    83100   184    0   184    0     0     57      0 --:--:--  0:00:03 --:--:--    57100   184    0   184    0     0     43      0 --:--:--  0:00:04 --:--:--    43100   184    0   184    0     0     36      0 --:--:--  0:00:05 --:--:--    36
curl: (28) Operation timed out after 5003 milliseconds with 184 bytes received
--- end replay output ---
