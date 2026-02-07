# Order Bundle Save Check
- runId: 20260204T235200Z-order-bundle-ui-save
- baseURL: http://localhost:5176
- patientId: 01415
- bundleName: 代表オーダー 20260204T235200Z-order-bundle-ui-save
- orderResponse: 200 http://localhost:5176/orca/order/bundles?patientId=01415&entity=generalOrder
- uiReflected: false
- error: TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('[data-test-id="generalOrder-edit-panel"]').locator('.charts-side-panel__items').getByText('代表オーダー 20260204T235200Z-order-bundle-ui-save') to be visible[22m
