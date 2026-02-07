# WebORCA Full Flow (Reception -> Charts -> Order -> Finish -> ORCA Send)

- RUN_ID: 20260204T212400Z
- TRACE_ID: trace-20260204T212400Z
- 実施日時: 2026-02-04T21:26:00.163Z
- Base URL: http://127.0.0.1:5173
- Facility ID: 1.3.6.1.4.1.9414.72.103
- Patient ID: 00001
- Department Code: 01
- Physician Code: 0001
- Payment Mode: insurance
- Visit Kind: 1
- Reception Result: エラー受付処理でエラーが返却されました ｜ 送信先: Reception ｜ 次アクション: 内容確認 ｜ RUN_ID: 20260204T212400Z ｜ traceId: b6d08cdb-f0db-4e88-b263-0cb416d3e4bc
- Reception Row: not-found
- Charts runId: 20260204T212400Z
- Charts traceId: 6ddf51b5-de2d-482c-bb1f-16192a52a5a4
- Order Result: error (TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('[data-test-id="generalOrder-edit-panel"]') to be visible[22m
)
- Finish Toast: 診療終了を完了runId=20260204T212400Z / traceId=6ddf51b5-de2d-482c-bb1f-16192a52a5a4 / requestId=6ddf51b5-de2d-482c-bb1f-16192a52a5a4 / outcome=MISSING閉じる
- ORCA Send: no-response 
- ORCA Send Disabled: true (patient_not_selected)
- ORCA Send Guard: 送信前チェック: ORCA送信をブロック患者未選択: 対象未確定で送信不可: 患者が未選択のため送信先が確定できません。（次にやること: Patients で患者を選択 / Reception へ戻って対象患者を確定）
- ORCA Send Guard Summary: ガード理由（短文）ORCA送信: 患者未選択: 対象未確定で送信不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定印刷: 患者未選択: 対象未確定で印刷不可 / 次: Patients で患者を選択 / Reception へ戻って対象患者を確定
- ORCA Send Dialog: not-shown
- ORCA Send Toast: 診療終了を完了runId=20260204T212400Z / traceId=6ddf51b5-de2d-482c-bb1f-16192a52a5a4 / requestId=6ddf51b5-de2d-482c-bb1f-16192a52a5a4 / outcome=MISSING閉じる
- Billing: clicked (http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/reception?from=charts&runId=20260204T212400Z&transition=server&section=billing)

## Screenshots
- screenshots/01-reception-before-accept.png
- screenshots/02-reception-after-accept.png
- screenshots/04-charts-open.png

## Notes
- Network/requests: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/e2e/20260204T212400Z/fullflow/network
- Console errors: 3801
- Page errors: 0
