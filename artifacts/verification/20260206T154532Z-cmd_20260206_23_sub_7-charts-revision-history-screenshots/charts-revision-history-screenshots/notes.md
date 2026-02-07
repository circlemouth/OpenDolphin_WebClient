# Charts Revision Drawer screenshots

- RUN_ID: 20260206T154532Z-cmd_20260206_23_sub_7-charts-revision-history-screenshots
- CreatedAt: 2026-02-06T15:45:44.286Z
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId (URL param only): 01415
- seeded encounterKey: 01415::none::none::none
- seeded soap history key: opendolphin:web-client:soap-history:v2:1.3.6.1.4.1.9414.72.103:doctor1
- seeded encounter context key: opendolphin:web-client:charts:encounter-context:v2:1.3.6.1.4.1.9414.72.103:doctor1

## Memo

- 00-flag-off.png: VITE_CHARTS_REVISION_HISTORY=0 -> 「版履歴」入口が出ない
- 01-flag-on.png:  VITE_CHARTS_REVISION_HISTORY=1 -> 「版履歴」入口が出る
- 02-drawer-open-diff.png: Drawer open + changed/delta 表示
- 03-server-unavailable.png: server API 未提供/失敗時でも落ちず "server unavailable" 表示

## Network memo (filtered to /api/charts/revisions)

```json
[
  {
    "kind": "response",
    "url": "http://localhost:4176/api/charts/revisions?patientId=01415",
    "status": 503,
    "contentType": "text/html; charset=utf-8",
    "ts": "2026-02-06T15:45:43.919Z"
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
      "url": "http://localhost:4176/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-06T15:45:40.281Z"
  },
  {
    "type": "error",
    "text": "The pseudo class \":nth-child\" is potentially unsafe when doing server-side rendering. Try changing it to \":nth-of-type\".",
    "location": {
      "url": "http://localhost:4176/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-06T15:45:42.415Z"
  },
  {
    "type": "error",
    "text": "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
    "location": {
      "url": "http://localhost:4176/api/charts/revisions?patientId=01415",
      "lineNumber": 0,
      "columnNumber": 0
    },
    "ts": "2026-02-06T15:45:43.919Z"
  }
]
```
