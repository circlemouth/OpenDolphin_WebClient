# UI replay-gap 簡易確認 (RUN_ID=20260124T143620Z)

## 1) ChartEvent 送信
Command:
```
curl -s -u 'dolphindev:dolphindev' \
  -H 'Content-Type: application/json' \
  -H 'X-Facility-Id: 1.3.6.1.4.1.9414.10.1' \
  -X PUT --data '<payload>' \
  http://localhost:19096/openDolphin/resources/chartEvent/event
```
Payload:
```
{"state":0,"eventType":0,"issuerUUID":"ui-gap-test","byomeiCount":0,"byomeiCountToday":0,"facilityId":"1.3.6.1.4.1.9414.10.1","pvtPk":0,"ptPk":0}
```

Response:
```
1```

## 2) 最新 event_id
Command:
```
docker exec opendolphin-postgres-modernized-task-1769260796333-89889f \
  psql -U opendolphin -d opendolphin_modern -tAc \"
  "select max(event_id) from chart_event_history where facility_id='1.3.6.1.4.1.9414.10.1';"
```
Result:
```
5```

## 3) replay-gap 受信
Command:
```
curl -N --max-time 5 -u 'dolphindev:dolphindev' \" >> artifacts/orca-preprod/20260124T143620Z/chart-event-history/ui-replay-gap-recovery.md
echo  -H X-Facility-Id: 1.3.6.1.4.1.9414.10.1 \"
  -H 'clientUUID: chart-events-gap-ui' \" >> artifacts/orca-preprod/20260124T143620Z/chart-event-history/ui-replay-gap-recovery.md
echo  -H Last-Event-ID: 0 \"
  http://localhost:19096/openDolphin/resources/chart-events
```
Response (抜粋):
```


event: chart-events.replay-gap
data: {"requiredAction":"reload"}

event: chart-event
id: 1
data: {"state":0,"eventType":0,"byomeiCount":0,"byomeiCountToday":0,"issuerUUID":"issuer-6","facilityId":"1.3.6.1.4.1.9414.10.1","pvtPk":0,"ptPk":0}

event: chart-event
id: 2
data: {"state":0,"eventType":0,"issuerUUID":"issuer-replay-3","byomeiCount":0,"byomeiCountToday":0,"facilityId":"1.3.6.1.4.1.9414.10.1","pvtPk":0,"ptPk":0}

event: chart-event
id: 3
data: {"state":0,"eventType":0,"issuerUUID":"issuer-replay-4","byomeiCount":0,"byomeiCountToday":0,"facilityId":"1.3.6.1.4.1.9414.10.1","pvtPk":0,"ptPk":0}

event: chart-event
id: 4
data: {"state":0,"eventType":0,"facilityId":"1.3.6.1.4.1.9414.10.1","byomeiCount":0,"byomeiCountToday":0,"issuerUUID":"ui-gap-test","pvtPk":0,"ptPk":0}

event: chart-event
id: 5
data: {"state":0,"eventType":0,"facilityId":"1.3.6.1.4.1.9414.10.1","byomeiCount":0,"byomeiCountToday":0,"issuerUUID":"ui-gap-test","pvtPk":0,"ptPk":0}

```

## 4) UI 実装メモ
- `ChartEventStreamBridge` が `chart-events.replay-gap` を受信するとトーストを表示し、
  `chartEventReplayRecovery.ts` 経由で appointments/visits・orca/queue・pusheventgetv2 を再取得する。
- `Last-Event-ID` は `sessionStorage` の `chart-events:lastEventId:<facilityId>` に保存し、
  再接続時にヘッダ送出する。
