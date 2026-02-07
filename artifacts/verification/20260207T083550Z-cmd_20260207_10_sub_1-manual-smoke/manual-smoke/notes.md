# Manual Smoke: STAMP/ORDER/REC (CLAIM excluded)

RUN_ID=`20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke`

Scope:
- Verify P0 implementations for:
  - `STAMP-001` (VITE_STAMPBOX_MVP)
  - `ORDER-001` (VITE_ORDER_EDIT_MVP)
  - `REC-001` (VITE_RECEPTION_STATUS_MVP)
- Baseline (flags off) vs MVP (flags on).
- CLAIM is deprecated and excluded from verification; must also prove `/orca/claim/outpatient` is not called.

Notes:
- This smoke ran with `VITE_DISABLE_MSW=0` (MSW enabled).
- `/api/user/:facilityId:userId` login is not available under MSW-only execution; the smoke runner injects a minimal session into storage to access screens.
  - See `smoke.mjs` "inject session" step.

## Evidence Layout

- `baseline/`:
  - `flags.json`, `steps.md`, `network-summary.json`, `network.har`, `screenshots/*.png`
- `mvp1/` (Phase1):
  - `flags.json`, `steps.md`, `network-summary.json`, `network.har`, `screenshots/*.png`
- `mvp2/` (Phase2):
  - `flags.json`, `steps.md`, `network-summary.json`, `network.har`, `screenshots/*.png`

## Results Summary (by case)

### baseline (flags off)
- flags: `VITE_STAMPBOX_MVP=0`, `VITE_ORDER_EDIT_MVP=0`, `VITE_RECEPTION_STATUS_MVP=0`
- REC:
  - reception status MVP UI: not shown (expected)
- ORDER:
  - order-edit MVP selector: not shown (expected)
- STAMP:
  - stamps tab: not shown (expected)
- Network:
  - `/orca/claim/outpatient`: not called (`claimOutpatientCalled=false` in `baseline/network-summary.json`)

### mvp1 (flags on: Phase1)
- flags: `VITE_STAMPBOX_MVP=1`, `VITE_ORDER_EDIT_MVP=1`, `VITE_RECEPTION_STATUS_MVP=1`
- REC:
  - reception status MVP UI: shown (`receptionStatusMvpCount>0`)
- STAMP:
  - stamps tab: shown, server stamp tree + stamp detail fetched (tree/list/preview)
  - copy-to-clipboard is disabled (expected in Phase1)
- ORDER:
  - MVP entity selector presence was not detected by the runner (`orderEditEntitySelectorPresent=false` in `mvp1/network-summary.json`)
  - `/orca/order/bundles` was not called in this run (see `keyEndpointHits`)
  - Treat as "smoke incomplete" for ORDER in this phase; needs follow-up with a patient-selected encounter where order bundle fetch occurs.
- Network:
  - `/orca/claim/outpatient`: not called (`claimOutpatientCalled=false`)

### mvp2 (flags on: Phase2)
- flags: `VITE_STAMPBOX_MVP=2`, `VITE_ORDER_EDIT_MVP=1`, `VITE_RECEPTION_STATUS_MVP=2`
- REC:
  - reception status MVP UI: shown (`receptionStatusMvpCount>0`)
  - retry button depends on queue decision; not observed in this dataset (`receptionRetryCount=0`)
- STAMP:
  - stamps tab: shown, preview ok
  - copy-to-clipboard: executed (evidence screenshot `mvp2/screenshots/mvp2-stamps-copied.png`)
  - "open order-edit" from stamp panel: executed (evidence screenshot `mvp2/screenshots/mvp2-order-edit-from-stamps.png`)
- ORDER:
  - MVP entity selector detected (`orderEditEntitySelectorPresent=true` in `mvp2/network-summary.json`)
  - `/orca/order/bundles` GET was observed (`keyEndpointHits["/orca/order/bundles"]=1`)
- Network:
  - `/orca/claim/outpatient`: not called (`claimOutpatientCalled=false`)

