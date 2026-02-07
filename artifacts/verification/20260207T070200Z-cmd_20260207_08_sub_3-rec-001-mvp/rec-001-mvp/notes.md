# REC-001 MVP (Reception status/icon mapping + exceptions + retry) verification

## RUN_ID
- 20260207T070200Z-cmd_20260207_08_sub_3-rec-001-mvp

## Feature flag
- `VITE_RECEPTION_STATUS_MVP=2`
  - Phase1: status/icon (normalized) + ORCA queue label shown in list
  - Phase2: exception next-action + inline retry button (ORCA queue retry)

## What to check
- Reception list rows show a status dot + label (Phase1).
- ORCA column is backed by `/api/orca/queue` send status (`成功`/`待ち`/`処理中`/`失敗`/`不明`) (Phase1).
- When ORCA queue is stalled (`滞留`) or failed and retryable, list shows `次: 再送` + `再送` button (Phase2).
- CLAIM-centric operations are out of scope by policy; the MVP is ORCA-queue centric.

## Evidence
- Playwright spec: `tests/reception/e2e-rec-001-status-mvp.spec.ts`
- Screenshots: `artifacts/verification/20260207T070200Z-cmd_20260207_08_sub_3-rec-001-mvp/rec-001-mvp/screenshots/`
- HAR: `artifacts/verification/20260207T070200Z-cmd_20260207_08_sub_3-rec-001-mvp/rec-001-mvp/har/`

## Notes
- The E2E uses MSW and injects an ORCA queue stall condition (`x-msw-fault=queue-stall`) to make the retry UI deterministic.
