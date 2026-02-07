# ORDER-001 Parity Evidence (Order Edit Minimal Ops)
- RUN_ID: 20260207T052503Z-cmd_20260207_05_sub_1-order-001-parity3
- baseURL: http://localhost:5176
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId: 01415
## Minimal Operation Set
- (1) Charts open: OK (charts-page)
- (2) medOrder add/save: saved=false uiListed=false recordsReturned=n/a
- (3) generalOrder add/save: saved=false uiListed=false recordsReturned=n/a
- (4) Persistence: GET /orca/order/bundles recordsReturned captured above (if n/a, rely on UI list evidence)
- (5) Send/finish: sendDisabled=null reason=n/a finishDisabled=null reason=n/a
## Evidence
- screenshots: 4 files under screenshots/
- network: orca-order-bundles.network.json
- network memo: orca-order-bundles.network.memo.md
- summary: summary.json
## Errors
- TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-utility-action="order-edit"]')[22m
[2m    - locator resolved to <button role="tab" type="button" data-active="false" title="Ctrl+Shift+3" aria-selected="false" aria-expanded="false" class="charts-docked-panel__tab" data-utility-action="order-edit" id="charts-docked-tab-order-edit" aria-controls="charts-docked-panel">…</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    10 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not stable[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div data-cache-hit="false" data-fallback-used="false" data-missing-master="false" class="charts-patient-summary" data-run-id="20251212T143720Z" data-source-transition="server">…</div> from <div class="charts-workbench__sticky">…</div> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div class="patient-meta-row__line">…</div> from <div class="charts-workbench__sticky">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m  6 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div class="patient-meta-row__line">…</div> from <div class="charts-workbench__sticky">…</div> subtree intercepts pointer events[22m
[2m  4 × retrying click action[22m
[2m      - waiting 500ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m  - retrying click action[22m
[2m    - waiting 500ms[22m
