# ORDER-001 MVP Evidence
- RUN_ID: 20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1
- baseURL: http://127.0.0.1:5176
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
- VITE_ORDER_EDIT_MVP: 1
## MVP Items
- (1) order-edit entity selector visible: true
- (2) bundleName auto-fill (generalOrder): saved=true expectedBundleName=MVP一般-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1
- (3) entity select + auto-fill (treatmentOrder): saved=true expectedBundleName=MVP処置-20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1
- (4) send dialog: opened=true
## Evidence
- screenshots: 7 files under screenshots/
- network: orca-order-bundles.network.json
- network memo: orca-order-bundles.network.memo.md
- summary: summary.json