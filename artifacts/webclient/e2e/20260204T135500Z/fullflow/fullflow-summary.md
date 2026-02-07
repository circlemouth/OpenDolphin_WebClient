# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T135500Z
- TRACE_ID: trace-20260204T135500Z
- 実施日時: 2026-02-04T13:51:53.093Z
- Base URL: http://localhost:5175
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 01416
- Department Code: 01
- Physician Code: 10001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: 情報受付登録が完了しました ｜ 送信先: Reception ｜ 次アクション: 内容確認
- Reception Row: not-found
- Charts runId: 20251212T143720Z
- Charts traceId: e8d0a9a3-68be-4235-b3d0-2686c4ae49e3
- Order Result: error (TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-test-id="generalOrder-edit-panel"]').getByRole('button', { name: /保存して追加|保存して更新|展開する/ }).first()[22m
[2m    - locator resolved to <button type="button">展開する</button>[22m
[2m  - attempting click action[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m  - element was detached from the DOM, retrying[22m
)
- Finish Toast: 
- ORCA Send: no-response 
- ORCA Send Disabled: false
- ORCA Send Guard: —
- ORCA Send Guard Summary: ガード理由（短文）印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
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
[2m    19 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not stable[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T135500Z/fullflow/network
- Console errors: 38
- Page errors: 0
