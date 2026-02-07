# Charts Revision Drawer Phase2 proof (write API migrated to /karte/revisions/*)

- RUN_ID: 20260207T002441Z-cmd_20260206_23_sub_12-charts-revision-edit-restore-v2
- CreatedAt: 2026-02-07T00:24:48.218Z
- VITE_DEV_PROXY_TARGET: http://localhost:9080
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
- visitDate: 2026-02-06

## Evidence

- 01-before.png: Drawer open (source: server) before actions
- 02-after-revise-200.png: After revise (POST /karte/revisions/revise 200/201) and history refreshed
- 03-after-restore-200.png: After restore (POST /karte/revisions/restore 200/201) and history refreshed
- 04-conflict-409.png: REVISION_CONFLICT (HTTP 409) shown in UI + refresh guidance

## Network memo (filtered to /karte/pid, /karte/revisions*, /karte/revisions/revise|restore)

```json
[
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.479Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.498Z"
  },
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.839Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.876Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions/revise",
    "status": 200,
    "method": "POST",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.899Z"
  },
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.916Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:45.932Z"
  },
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:46.756Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:46.771Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions/restore",
    "status": 200,
    "method": "POST",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:46.792Z"
  },
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:46.805Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:46.816Z"
  },
  {
    "url": "http://localhost:4179/karte/pid/01415,2000-01-01%2000%3A00%3A00",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:47.624Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions?karteId=9058&visitDate=2026-02-06",
    "status": 200,
    "method": "GET",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:47.639Z"
  },
  {
    "url": "http://localhost:4179/karte/revisions/revise",
    "status": 409,
    "method": "POST",
    "contentType": "application/json",
    "ts": "2026-02-07T00:24:47.663Z"
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
      "url": "http://localhost:4179/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-07T00:24:43.612Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/orca/disease/import/01415",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.143Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.635Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/orca/appointments/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.656Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.679Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/orca/visits/list",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.743Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
    "location": {
      "url": "http://localhost:4179/api01rv2/pusheventgetv2",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:44.768Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 409 (Conflict)",
    "location": {
      "url": "http://localhost:4179/karte/revisions/revise",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-07T00:24:47.664Z"
  }
]
```

## Page errors

```json
[]
```
