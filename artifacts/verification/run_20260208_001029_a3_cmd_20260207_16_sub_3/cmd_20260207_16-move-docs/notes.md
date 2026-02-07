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

## Reference

- Inventory evidence (A1): `artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/notes.md`

## Updated Collision Decisions (content-based)

- `docs/verification-plan.md`:
  - Keep destination (CLAIM deprecation master) to avoid breaking existing references.
  - Import shogun version (screen review plan) as `docs/verification-plan-screen-review.md`.
  - Add a top note in `docs/verification-plan.md` linking to `docs/verification-plan-screen-review.md`.

- `docs/weborca-reception-checklist.md`:
  - Keep destination (existing evidence-rich checklist).
  - Import shogun short checklist as `docs/weborca-reception-evaluation-checklist.md` (explicitly a short checklist/snippet candidate).
  - Add references in `docs/weborca-reception-checklist.md`.
- Commit: 015fc4d2d

## Source Cleanup

- Deleted shogun-side docs folder after successful commit:
  - /Users/Hayato/Documents/GitHub/multi-agent-shogun/docs

## rsync dry-run (recheck)

From: multi-agent-shogun/docs/ -> OpenDolphin_WebClient/docs/

### A1 rsync dry-run evidence (excerpt)

From `artifacts/verification/run_20260208_001005_a1_cmd_20260207_16/cmd_20260207_16-inventory/rsync/map_shogun_docs_to_target_docs.txt`:

- overwrite candidates (handled manually):
  - `verification-plan.md`
  - `weborca-reception-checklist.md`

- new files (moved + committed):
  - `verification-plan-*.md`
  - `ops/tmux-send-keys.md`
