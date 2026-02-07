# ORDER-001 Parity Evidence (Order Edit Minimal Ops)
- RUN_ID: 20260207T055643Z-cmd_20260207_05_sub_1-order-001-parity8
- baseURL: http://127.0.0.1:5176
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
## Minimal Operation Set
- (1) Charts open: OK (charts-page)
- (2) medOrder add/save: saved=true uiListed=true recordsReturned=n/a
- (3) generalOrder add/save: saved=false uiListed=false recordsReturned=n/a
- (4) Persistence: GET /orca/order/bundles recordsReturned captured above (if n/a, rely on UI list evidence)
- (5) Send/finish: sendDisabled=null reason=n/a finishDisabled=null reason=n/a
## Evidence
- screenshots: 5 files under screenshots/
- network: orca-order-bundles.network.json
- network memo: orca-order-bundles.network.memo.md
- summary: summary.json
## Errors
- reception_row_missing_or_open_failed: patientId=01415
- TimeoutError: locator.waitFor: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('#generalOrder-bundle-name') to be visible[22m
