# ORDER-001 Parity Evidence (Order Edit Minimal Ops)
- RUN_ID: 20260207T055950Z-cmd_20260207_05_sub_1-order-001-parity9
- baseURL: http://127.0.0.1:5176
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
## Minimal Operation Set
- (1) Charts open: OK (charts-page)
- (2) medOrder add/save: saved=true uiListed=true recordsReturned=n/a
- (3) generalOrder add/save: saved=false uiListed=false recordsReturned=n/a
- (4) Persistence: GET /orca/order/bundles recordsReturned captured above (if n/a, rely on UI list evidence)
- (5) Send/finish: sendDisabled=false reason=n/a finishDisabled=false reason=n/a
## Evidence
- screenshots: 7 files under screenshots/
- network: orca-order-bundles.network.json
- network memo: orca-order-bundles.network.memo.md
- summary: summary.json
## Errors
- reception_row_missing_or_open_failed: patientId=01415
- generalOrder_panel_open_failed
- generalOrder_panel_not_visible_after_open