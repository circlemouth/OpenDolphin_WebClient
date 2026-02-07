# Mobile Images UI Phase1

- RUN_ID: 20260207T094410Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1
- CreatedAt: 2026-02-07T09:44:45.194Z
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
        "ts": "2026-02-07T09:44:13.355Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:44:13.398Z"
      },
      {
        "kind": "request",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:44:13.432Z"
      },
      {
        "kind": "response",
        "method": "POST",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:44:13.454Z"
      },
      {
        "kind": "request",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "hasFeatureHeader": "1",
        "ts": "2026-02-07T09:44:13.454Z"
      },
      {
        "kind": "response",
        "method": "GET",
        "url": "http://localhost:4191/patients/01415/images",
        "status": 200,
        "contentType": "application/json",
        "ts": "2026-02-07T09:44:13.458Z"
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
  }
]
```
