# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T075725Z
- TRACE_ID: trace-20260204T075725Z
- 実施日時: 2026-02-04T07:59:10.748Z
- Base URL: https://localhost:5175
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01415
- Department Code: 01
- Physician Code: 1001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T075725Z ｜ traceId: e8d354c0-d994-43e3-8af6-4bb40a3e01eb
- Reception Row: not-found
- Charts runId: 20251202T090000Z
- Charts traceId: 230be81c-1d21-48e9-8a53-b5327962fb22
- Order Result: error (TimeoutError: locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-test-id="generalOrder-edit-panel"]').locator('#generalOrder-item-quantity-0')[22m
[2m    - locator resolved to <input value="" placeholder="数量" id="generalOrder-item-quantity-0" name="generalOrder-item-quantity-0"/>[22m
[2m    - fill("1")[22m
[2m  - attempting fill action[22m
[2m    - waiting for element to be visible, enabled and editable[22m
[2m  - element was detached from the DOM, retrying[22m
)
- Finish Toast: 診療終了を完了runId=20260204T075725Z / traceId=230be81c-1d21-48e9-8a53-b5327962fb22 / requestId=230be81c-1d21-48e9-8a53-b5327962fb22 / outcome=MISSING閉じる
- ORCA Send: 502 https://localhost:5175/api21/medicalmodv2?class=01
- ORCA Send Toast: ORCA送信に失敗runId=20260204T075725Z / traceId=230be81c-1d21-48e9-8a53-b5327962fb22閉じる
- Billing: clicked (https://localhost:5175/f/1.3.6.1.4.1.9414.72.103/reception?sort=time&date=2026-02-04)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T075725Z/fullflow/network
- Console errors: 28
- Page errors: 0
