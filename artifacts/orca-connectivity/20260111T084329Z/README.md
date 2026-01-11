# ORCA Connectivity Evidence

- RUN_ID: 20260111T084329Z
- Target: WebORCA Trial (`https://weborca-trial.orca.med.or.jp`)
- Auth: Basic (`<MASKED>` / `<MASKED>`)
- Purpose: WebORCA Trial API responses after server-modernized ORCA client fixes.

## Trial direct calls (curl)
| API | URL | HTTP | Api_Result | Api_Result_Message | Evidence |
| --- | --- | --- | --- | --- | --- |
| system01dailyv2 | /api/api01rv2/system01dailyv2 | 200 | 00 | 処理終了 | `trial/system01dailyv2/` |
| visitptlstv2 | /api/api01rv2/visitptlstv2 | 200 | 13 | 対象がありません | `trial/visitptlstv2/` |
| acceptmodv2 (Request_Number=00) | /api/orca11/acceptmodv2 | 200 | 10 | 患者番号に該当する患者が存在しません | `trial/acceptmodv2/` |

## Server-modernized wrapper calls
- Endpoint: `/openDolphin/resources/orca/visits/list` and `/openDolphin/resources/orca/visits/mutation`
- Result: HTTP 500 (DB schema missing: `d_users`, `d_audit_event`).
- Evidence: `server/visitptlstv2/`, `server/acceptmodv2/`
- Note: ORCA API call itself was not reached due to server-side DB preconditions.

## Files
- Request XML: `trial/*/request.xml`
- Response XML: `trial/*/response.xml`
- Response headers: `trial/*/response.headers`
- curl trace (Authorization masked): `trace/*.trace`
- Server request/response: `server/*/request.json`, `server/*/response.*`
