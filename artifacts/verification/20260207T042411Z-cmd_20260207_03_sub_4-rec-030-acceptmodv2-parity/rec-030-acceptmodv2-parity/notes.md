# REC-030 acceptmodv2 parity: success criteria and Trial failure modes

RUN_ID: 20260207T042411Z-cmd_20260207_03_sub_4-rec-030-acceptmodv2-parity

## Scope
- Parity ID: REC-030 (Reception: 受付送信)
- API: `POST /orca/visits/mutation` (wrapper) -> upstream `POST /orca11/acceptmodv2`

## Success Criteria (prod-like env acceptance)
Environment prerequisites:
- Validate on a prod-like ORCA path (not MSW): `VITE_DISABLE_MSW=1`.
- Ensure server-modernized reaches ORCA with a correct prefix setup:
  - Avoid missing/double `/api` prefix (`ORCA_BASE_URL` and/or `ORCA_API_PATH_PREFIX`).
- Auth/role/facility must be valid to avoid 401. (If needed, include `X-Facility-Id`.)

Input prerequisites (data/seed):
- `patientId` exists in ORCA.
- `insuranceCombinationNumber` is the actual value bound to that patient (do not guess).
- `physicianCode` must be the system01lstv2 physician Code (`10001/10003/10005/10006/10010`), not the staff code (0001 etc).

Pass conditions:
- `POST /orca/visits/mutation` returns HTTP 200 (JSON) and the UI remains operable.
- Api_Result is handled as follows:
  - `00`: accepted/registered (workflow success).
  - `16`: already accepted for that day/condition (idempotent business error; not fatal).
  - `14` / `24`: business errors caused by seed/input mismatch; UI must show it and allow retry after fixing seed.
  - `90`: ORCA-side exclusivity; non-deterministic in Trial; acceptable as an upstream behavior (retry later).

## Why Trial fails (not a Web functional gap)
- Upstream ORCA Trial intermittently returns HTTP 502; server-modernized retry exhaustion can surface as `/orca/visits/mutation` 500 (Session layer failure).
- Misconfigured prefix (`ORCA_API_PATH_PREFIX`/`ORCA_BASE_URL`) causes upstream acceptmodv2 POST 405.
- Missing seed or wrong physicianCode causes Api_Result business errors (14/24/16).

## Evidence (existing RUN_IDs)
- Web-client E2E (success path present):
  - `20260204T055600Z-acceptmodv2-webclient` (HTTP 200 / Api_Result=00)
  - `20260205T101957Z-direct-acceptmodv2` (direct acceptmodv2 success)
- Trial/proxy failure modes:
  - `20260205T105842Z-acceptmodv2-proxy` (upstream 502 -> wrapper instability)
  - `20260204T052600Z-acceptmodv2-webclient` (500 + upstream 405 evidence)
- Api_Result policy (14/24/16 are business errors; 90 is upstream exclusivity):
  - `20260206T124058Z-api-result-matrix-retest2`

## Next actions
- Keep REC-030 parity status as done under prod-like prerequisites; treat Trial-only instability as environment.
- If a single additional recheck is needed, run one MSW-OFF E2E with a known-good patient/insurance mapping and capture HAR/screenshots.
