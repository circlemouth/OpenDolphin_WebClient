# Mobile Images UI Phase1

- RUN_ID: 20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1
- CreatedAt: 2026-02-07T09:46:27.566Z
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId (masked in screenshots): 01415
- route: /f/:facilityId/m/images
- feature flag: VITE_PATIENT_IMAGES_MOBILE_UI=1
- server gate header: X-Feature-Images: 1
- API (web-client path): /patients/{patientId}/images  (dev proxy => /openDolphin/resources/patients/{patientId}/images)

## Scenarios

- success: upload -> 完了 -> 一覧反映
- error: 404(feature gate) / 413 / 415 / network_error をシミュレートし、文言+Retry を確認

## Files

- screenshots: `00-success.png`, `10-error-404.png`, `11-error-413.png`, `12-error-415.png`, `13-error-network.png`
- HAR: `success.har`, `error-404.har`, `error-413.har`, `error-415.har`, `error-network.har`
- network memo: `network.json`

## Network Memo

```json
[
  {
    "label": "success",
    "entries": [
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:20.641Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:20.680Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:20.683Z"
      },
      {
        "kind": "response",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:20.691Z"
      },
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:20.692Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:20.696Z"
      }
    ]
  },
  {
    "label": "404",
    "entries": [
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:22.140Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:22.181Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:22.186Z"
      },
      {
        "kind": "response",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 404,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:22.189Z"
      }
    ]
  },
  {
    "label": "413",
    "entries": [
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:23.657Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:23.697Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:23.701Z"
      },
      {
        "kind": "response",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 413,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:23.706Z"
      }
    ]
  },
  {
    "label": "415",
    "entries": [
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:25.190Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:25.232Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:25.236Z"
      },
      {
        "kind": "response",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 415,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:25.239Z"
      }
    ]
  },
  {
    "label": "network",
    "entries": [
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:26.707Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:46:26.748Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:46:26.752Z"
      }
    ]
  }
]
```

## Console Memo (warnings/errors)

```json
[
  {
    "label": "success",
    "entries": []
  },
  {
    "label": "404",
    "entries": [
      {
        "type": "error",
        "text": "Access to font at 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2' from origin 'http://localhost:4191' has been blocked by CORS policy: Request header field x-force-images-status is not allowed by Access-Control-Allow-Headers in preflight response.",
        "location": {
          "url": "http://localhost:4191/f/1.3.6.1.4.1.9414.72.103/m/images?runId=20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:21.991Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: net::ERR_FAILED",
        "location": {
          "url": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:21.992Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: the server responded with a status of 404 (Not Found)",
        "location": {
          "url": "http://localhost:4191/patients/01415/images",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:22.189Z"
      }
    ]
  },
  {
    "label": "413",
    "entries": [
      {
        "type": "error",
        "text": "Access to font at 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2' from origin 'http://localhost:4191' has been blocked by CORS policy: Request header field x-force-images-status is not allowed by Access-Control-Allow-Headers in preflight response.",
        "location": {
          "url": "http://localhost:4191/f/1.3.6.1.4.1.9414.72.103/m/images?runId=20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:23.497Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: net::ERR_FAILED",
        "location": {
          "url": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:23.497Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: the server responded with a status of 413 (Payload Too Large)",
        "location": {
          "url": "http://localhost:4191/patients/01415/images",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:23.706Z"
      }
    ]
  },
  {
    "label": "415",
    "entries": [
      {
        "type": "error",
        "text": "Access to font at 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2' from origin 'http://localhost:4191' has been blocked by CORS policy: Request header field x-force-images-status is not allowed by Access-Control-Allow-Headers in preflight response.",
        "location": {
          "url": "http://localhost:4191/f/1.3.6.1.4.1.9414.72.103/m/images?runId=20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:24.976Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: net::ERR_FAILED",
        "location": {
          "url": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:24.976Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: the server responded with a status of 415 (Unsupported Media Type)",
        "location": {
          "url": "http://localhost:4191/patients/01415/images",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:25.239Z"
      }
    ]
  },
  {
    "label": "network",
    "entries": [
      {
        "type": "error",
        "text": "Access to font at 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2' from origin 'http://localhost:4191' has been blocked by CORS policy: Request header field x-force-images-network-error is not allowed by Access-Control-Allow-Headers in preflight response.",
        "location": {
          "url": "http://localhost:4191/f/1.3.6.1.4.1.9414.72.103/m/images?runId=20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:26.544Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: net::ERR_FAILED",
        "location": {
          "url": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:26.544Z"
      },
      {
        "type": "error",
        "text": "Failed to load resource: net::ERR_FAILED",
        "location": {
          "url": "http://localhost:4191/patients/01415/images",
          "lineNumber": 0,
          "columnNumber": 0
        },
        "ts": "2026-02-07T09:46:26.757Z"
      }
    ]
  }
]
```
