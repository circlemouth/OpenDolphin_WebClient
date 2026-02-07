# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T105046Z
- TRACE_ID: trace-20260204T105046Z
- 実施日時: 2026-02-04T10:53:55.012Z
- Base URL: http://localhost:5175
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 0001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: found
- Charts runId: 20251212T143720Z
- Charts traceId: d188a0a8-66d1-41d9-b082-22dd11531e86
- Order Result: 200 (http://localhost:5175/orca/order/bundles)
- Finish Toast: 
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: —
- ORCA Send Dialog: not-shown
- ORCA Send Toast: 
- Billing: error (TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: '会計へ' })[22m
[2m    - locator resolved to <button type="button">会計へ</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    38 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not stable[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m
)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T105046Z/fullflow/network
- Console errors: 94
- Page errors: 0
