# cmd_20260207_16_sub_4 - web-client/scripts consolidation (content-based)

- RUN_ID: run_20260208_001005_a1_cmd_20260207_16
- Commit: 078787c5af04d70a604598c1a7d5767be9ce01ac

## Evidence (rsync dry-run)

Inventory notes:
- artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/notes.md

Collision markers (rsync -ai --dry-run outputs captured by sub_1):
- artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/rsync/map_shogun_webclient_scripts_to_target.txt
- artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/rsync/map_shogun_nested_webclient_scripts_to_target.txt

## Merge decision

Update candidates (per inventory):
- web-client/scripts/qa-order-001-parity.mjs
- web-client/scripts/qa-charts-do-copy-manual-regression.mjs

Applied:
- qa-charts-do-copy-manual-regression.mjs: merged stability changes (wait for '#charts-docked-tab-document', open via stable id, capture disabled-state screenshot).

Not applied:
- qa-order-001-parity.mjs: kept current OpenDolphin_WebClient version (no safer/newer source copy was available at merge time; avoided overwriting).

## Cleanup

- Removed shogun workspace copies (per sub_4 task):
  - /Users/Hayato/Documents/GitHub/multi-agent-shogun/web-client
  - /Users/Hayato/Documents/GitHub/multi-agent-shogun/OpenDolphin_WebClient/web-client
