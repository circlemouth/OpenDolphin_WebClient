# Charts Revision Drawer Phase2 proof (revise/restore)

- RUN_ID: 20260207T001030Z-cmd_20260206_23_sub_11-charts-revision-edit-restore
- CreatedAt: 2026-02-07T00:10:36.239Z
- VITE_DEV_PROXY_TARGET: http://localhost:9080
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
- visitDate: 2026-02-06

## Evidence

- 01-before.png: Drawer open (source: server) before actions
- 02-after-revise.png: After "改訂版追加" (POST /karte/document 200/201) and history refreshed
- 03-after-restore.png: After "restore" (POST /karte/document 200/201) and history refreshed

## Network memo (filtered to /karte/pid, /karte/revisions*, /karte/document)

```json
[
  {
    "url": "http://localhost:4178/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.268Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.292Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.316Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9192",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.317Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.317Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9175",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.321Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.340Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9193&toRevisionId=9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.340Z"
  },
  {
    "url": "http://localhost:4178/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.557Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.571Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.583Z"
  },
  {
    "url": "http://localhost:4178/karte/document",
    "status": 200,
    "method": "POST",
    "contentType": "text/plain;charset=UTF-8",
    "ts": "2026-02-07T00:10:34.608Z"
  },
  {
    "url": "http://localhost:4178/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.623Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.635Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9200",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.657Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.657Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9192",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.657Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9175",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.658Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.658Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9193&toRevisionId=9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.675Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9198&toRevisionId=9200",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.677Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:34.677Z"
  },
  {
    "url": "http://localhost:4178/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.383Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.398Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.409Z"
  },
  {
    "url": "http://localhost:4178/karte/document",
    "status": 200,
    "method": "POST",
    "contentType": "text/plain;charset=UTF-8",
    "ts": "2026-02-07T00:10:35.430Z"
  },
  {
    "url": "http://localhost:4178/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.443Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.455Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9202",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.471Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.471Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9192",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.472Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9200",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.474Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.475Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/9175",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.485Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9198&toRevisionId=9200",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.501Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9193&toRevisionId=9198",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.502Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.502Z"
  },
  {
    "url": "http://localhost:4178/karte/revisions/diff?fromRevisionId=9200&toRevisionId=9202",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:10:35.504Z"
  }
]
```

## Console memo (warnings/errors)

```json
[
  {
    "type": "error",
    "text": "The pseudo class \":nth-child\" is potentially unsafe when doing server-side rendering. Try changing it to \":nth-of-type\".",
    "location": {
      "url": "http://localhost:4178/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-07T00:10:32.571Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/orca/disease/import/01415",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:32.929Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:33.014Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/api01rv2/pusheventgetv2",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:33.027Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:33.027Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:33.055Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4178/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:10:33.089Z"
  }
]
```

## Page errors

```json
[]
```
