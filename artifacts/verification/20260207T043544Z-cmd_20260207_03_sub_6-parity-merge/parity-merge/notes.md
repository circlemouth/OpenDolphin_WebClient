# Parity Merge Notes

RUN_ID: 20260207T043544Z-cmd_20260207_03_sub_6-parity-merge

## Inputs

- Web inventory (RUN_ID=20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1)
  - `artifacts/verification/20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1/web-client-feature-inventory/web-features.md`
- Legacy inventory (RUN_ID=20260207T041950Z-cmd_20260207_03_sub_3-legacy-feature-inventory)
  - `artifacts/verification/20260207T041950Z-cmd_20260207_03_sub_3-legacy-feature-inventory/legacy-client-feature-inventory/legacy-features.md`
- P0 resolution references:
  - REC-030: RUN_ID=20260207T042411Z-cmd_20260207_03_sub_4-rec-030-acceptmodv2-parity
  - CHART-010/020: RUN_ID=20260207T042527Z-cmd_20260207_03_sub_5-chart-010-020

## Conversions (reduce `不明`)

- AUTH-001: `不明` -> `完了` (Web has login/session; evidence via inventory + code pointers)
- AUTH-010: `不明` -> `一部`
- AUTH-020: `不明` -> `一部`
- PAT-001: `不明` -> `一部`
- PAT-010: `不明` -> `一部`
- PAT-900: `不明` -> `仕様差`
- REC-001: `不明` -> `一部` (legacy CLAIM-centric status vs Web ORCA-queue centric)
- SCHED-001: `不明` -> `一部`
- SCHED-010: `不明` -> `一部`
- ORDER-001: `不明` -> `一部`
- LAB-001: `不明` -> `未実装` (legacy has import + chart + PDF; Web scope currently does not include Lab)
- STAMP-001: `不明` -> `一部` (Web has stampTree fetch; legacy has StampBox UI)
- STAMP-010: `不明` -> `未実装`
- Added new domains for clarity:
  - INTEG-010/020/030 (CLAIM/MML/PVT background services): `仕様差`
  - IMG-010/020 (Schema/Image browser): `未実装`

## Backlog update

- Removed already-done P0 items (REC-030, CHART-010, CHART-020) from Top 10.
- New Top 3 (P0): STAMP-001, ORDER-001, REC-001.

## Counts (after merge)

- `不明` rows: 1 (DEBUG-001 only)
- P0 items in Backlog Top10: 3
