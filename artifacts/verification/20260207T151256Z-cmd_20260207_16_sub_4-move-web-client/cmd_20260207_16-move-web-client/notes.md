# cmd_20260207_16_sub_4 - web-client/scripts consolidation

- RUN_ID: 20260207T151256Z-cmd_20260207_16_sub_4-move-web-client
- Commit: 078787c5af04d70a604598c1a7d5767be9ce01ac

## Sources reviewed

- multi-agent-shogun/web-client/scripts
  - qa-order-001-parity.mjs
- multi-agent-shogun/OpenDolphin_WebClient/web-client/scripts
  - qa-charts-do-copy-manual-regression.mjs
  - qa-order-001-parity.mjs

## Result

- Destination (authoritative): OpenDolphin_WebClient/web-client/
- No new scripts were missing in destination; one script update was merged from the mistaken duplicate workspace.

### Applied change

- web-client/scripts/qa-charts-do-copy-manual-regression.mjs
  - Waits for '#charts-docked-tab-document' after initial layout (reduces flakiness).
  - Opens the document panel via stable tab id '#charts-docked-tab-document' and records a disabled-state screenshot.

### Not applied

- web-client/scripts/qa-order-001-parity.mjs
  - Source copies were older than destination; kept destination version.

## Cleanup

- Removed: multi-agent-shogun/web-client/
- Removed: multi-agent-shogun/OpenDolphin_WebClient/web-client/
