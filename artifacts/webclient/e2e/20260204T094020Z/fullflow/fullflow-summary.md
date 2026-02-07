# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T094020Z
- TRACE_ID: trace-20260204T094020Z
- 実施日時: 2026-02-04T09:41:56.087Z
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
- Charts traceId: 0add309d-d493-4649-92f0-8f050d252a56
- Order Result: error (TimeoutError: locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-test-id="generalOrder-edit-panel"]').locator('#generalOrder-bundle-name')[22m
[2m    - locator resolved to <input disabled value="" placeholder="例: 降圧薬RP" id="generalOrder-bundle-name"/>[22m
[2m    - fill("代表オーダー 20260204T094020Z")[22m
[2m  - attempting fill action[22m
[2m    2 × waiting for element to be visible, enabled and editable[22m
[2m      - element is not enabled[22m
[2m    - retrying fill action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and editable[22m
[2m      - element is not enabled[22m
[2m    - retrying fill action[22m
[2m      - waiting 100ms[22m
[2m    51 × waiting for element to be visible, enabled and editable[22m
[2m       - element is not enabled[22m
[2m     - retrying fill action[22m
[2m       - waiting 500ms[22m
)
- Finish Toast: 診療終了を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / requestId=req-20251212T143720Z / outcome=PARTIAL閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: true (not_server_route,missing_master)
- ORCA Send Toast: 診療終了を完了runId=20251212T143720Z / traceId=trace-20251212T143720Z / requestId=req-20251212T143720Z / outcome=PARTIAL閉じる
- Billing: error (TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: '会計へ' })[22m
[2m    - locator resolved to <button disabled type="button" data-disabled-reason="missing_master">会計へ</button>[22m
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
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T094020Z/fullflow/network
- Console errors: 42
- Page errors: 0
