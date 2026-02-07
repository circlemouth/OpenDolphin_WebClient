# cmd_20260207_16: move docs from shogun workspace

- RUN_ID: run_20260208_001029_a3_cmd_20260207_16_sub_3
- Task: cmd_20260207_16_sub_3
- Executed by: ashigaru3

## Sources

- shogun docs: /Users/Hayato/Documents/GitHub/multi-agent-shogun/docs/
- shogun duplicate docs: /Users/Hayato/Documents/GitHub/multi-agent-shogun/OpenDolphin_WebClient/docs/

## Destination (canonical)

- /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/docs/

## Collision Decisions

- docs/verification-plan.md
  - Destination has an existing, different document.
  - Action: keep destination file; copy shogun version as docs/verification-plan-screen-review.md and update moved-doc references.

- docs/weborca-reception-checklist.md
  - Destination is longer/more complete.
  - Action: keep destination file; do not overwrite.

- docs/server-modernization/session-layer/karte-revision-api-phase1.md
  - Action: identical; no overwrite.

## Commands

- (filled as executed)

## Commit

- (filled after commit)
- rsync -a --exclude 'verification-plan.md' --exclude 'weborca-reception-checklist.md' shogun/docs/ -> OpenDolphin_WebClient/docs/
- cp shogun/docs/verification-plan.md -> OpenDolphin_WebClient/docs/verification-plan-screen-review.md
