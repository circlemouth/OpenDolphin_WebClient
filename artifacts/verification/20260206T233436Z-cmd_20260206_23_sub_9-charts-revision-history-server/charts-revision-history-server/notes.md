# Charts Revision Drawer (server modernized API) proof

- RUN_ID: 20260206T233436Z-cmd_20260206_23_sub_9-charts-revision-history-server
- CreatedAt: 2026-02-06T23:34:41.801Z
- baseURL: http://localhost:4177
- VITE_DEV_PROXY_TARGET: http://localhost:9080
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
- visitDate: 2026-02-06

## Evidence

- drawer-server-200.png: Drawer open and shows `source: server` + `server: N件`

## Network memo (filtered to /karte/pid and /karte/revisions)

```json
[
  {
    "url": "http://localhost:4177/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.298Z"
  },
  {
    "url": "http://localhost:4177/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.337Z"
  },
  {
    "url": "http://localhost:4177/karte/revisions/9193",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.376Z"
  },
  {
    "url": "http://localhost:4177/karte/revisions/9192",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.376Z"
  },
  {
    "url": "http://localhost:4177/karte/revisions/9175",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.422Z"
  },
  {
    "url": "http://localhost:4177/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193",
    "status": 200,
    "contentType": "application/json",
    "ts": "2026-02-06T23:34:41.486Z"
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
      "url": "http://localhost:4177/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-06T23:34:39.548Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/orca/disease/import/01415",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.273Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.819Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.845Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.865Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/api01rv2/pusheventgetv2",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.870Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4177/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T23:34:40.896Z"
  }
]
```

## Page errors

```json
[]
```
