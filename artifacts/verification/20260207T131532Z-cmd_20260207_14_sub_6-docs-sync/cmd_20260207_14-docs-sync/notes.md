# cmd_20260207_14_sub_6 docs sync

- RUN_ID: `20260207T131532Z-cmd_20260207_14_sub_6-docs-sync`
- Purpose: cmd_20260207_14 の入力 sub_1..5 を `docs/verification-plan.md` 正本へ収束し、仮データ/モック表示の混入防止（P0）と確認手順を固定する。

## Updated Docs

- `docs/verification-plan.md`
  - Added/updated section: `## cmd_20260207_14: 仮データ/モック表示の排除（P0=prod混入防止）`
  - Integrated inputs:
    - sub_1 mock data inventory (static scan)
    - sub_2 mock visibility smoke (MSW ON/OFF)
    - sub_3 MSW gate hardening (auto-start removal + banner + dist scan)
    - sub_4 mock-data replacements (SAMPLE_PATIENTS removal + Patients empty/error classification + Charts demo wording removal)
    - sub_5 server-no-mock-audit (env gates for mock/stub + additive error normalization)

## Referenced Input RUNs (Evidence)

- sub_1 RUN_ID: `20260207T124033Z-cmd_20260207_14_sub_1-mock-data-inventory`
  - `artifacts/verification/20260207T124033Z-cmd_20260207_14_sub_1-mock-data-inventory/mock-data-inventory/notes.md`

- sub_2 RUN_ID: `20260207T124047Z-cmd_20260207_14_sub_2-mock-visibility-smoke`
  - `artifacts/verification/20260207T124047Z-cmd_20260207_14_sub_2-mock-visibility-smoke/mock-visibility-smoke/notes.md`
  - `.../run-msw-off.json`, `.../run-msw-on.json`
  - `.../har/network-msw-off.har`, `.../har/network-msw-on.har`

- sub_3 RUN_ID: `20260207T124128Z-cmd_20260207_14_sub_3-msw-gate-hardening`
  - `artifacts/verification/20260207T124128Z-cmd_20260207_14_sub_3-msw-gate-hardening/msw-gate-hardening/notes.md`
  - `.../screenshots/msw-on-banner.png`
  - `.../dist-scan.txt` / `.../vite-build.log`

- sub_4 RUN_ID: `20260207T124102Z-cmd_20260207_14_sub_4-mock-data-replacements`
  - `artifacts/verification/20260207T124102Z-cmd_20260207_14_sub_4-mock-data-replacements/mock-data-replacements/notes.md`
  - `.../screenshots/before/`, `.../screenshots/after/`
  - `.../har/before/`, `.../har/after/`

- sub_5 RUN_ID: `20260207T124248Z-cmd_20260207_14_sub_5-server-no-mock-audit`
  - `artifacts/verification/20260207T124248Z-cmd_20260207_14_sub_5-server-no-mock-audit/server-no-mock-audit/notes.md`
  - `.../curl.summary.txt` and representative bodies/headers

## Notes

- This RUN only syncs docs/evidence references. No functional changes were made in this step.
