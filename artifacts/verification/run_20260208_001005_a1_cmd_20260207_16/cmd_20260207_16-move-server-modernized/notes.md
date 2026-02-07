# cmd_20260207_16: move server-modernized from shogun workspace copy

- RUN_ID: run_20260208_001005_a1_cmd_20260207_16
- Task: cmd_20260207_16_sub_7
- Executed by: ashigaru7
- Timestamp: 2026-02-08T00:17:15+0900

## Goal
Remove the mistaken duplicate folder under `multi-agent-shogun/` and ensure we do not lose any unique changes compared to the canonical repo.

## Inventory Reference
This subtask depends on the inventory from `cmd_20260207_16_sub_1`:
- `artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/notes.md`
- `.../rsync/map_shogun_nested_server_modernized_to_target.txt` (shows the two potential overwrite candidates)

## Source / Destination
- Source (mistaken copy): `/Users/Hayato/Documents/GitHub/multi-agent-shogun/OpenDolphin_WebClient/server-modernized/`
- Destination (canonical): `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/server-modernized/`

## Findings
- At execution time, the specific source folder `/Users/Hayato/Documents/GitHub/multi-agent-shogun/OpenDolphin_WebClient/server-modernized/` was already absent, so `diff -ru` / `rsync --dry-run` from the source could not be re-run.
- Canonical repo still contains `server-modernized/` and the inventory indicates only these two files were potential overwrite points if the (now-removed) source were copied:
  - `server-modernized/src/main/java/open/dolphin/rest/KarteRevisionResource.java`
  - `server-modernized/src/main/java/open/dolphin/session/KarteRevisionServiceBean.java`

## Actions
- No files were copied into the canonical repo (no overwrite performed).
- No git commit was created for this subtask.
- Confirmed the mistaken duplicate subtree is no longer present under `multi-agent-shogun/`.
