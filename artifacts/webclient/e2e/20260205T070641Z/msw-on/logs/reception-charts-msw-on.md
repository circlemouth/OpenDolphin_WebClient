# MSW ON Reception/Charts 実測ログ

- RUN_ID: 20260205T070641Z
- Date (UTC): 2026-02-05T07:08:44Z
- Base URL: http://localhost:4173
- Facility/User: 0001 / doctor1
- MSW: VITE_DISABLE_MSW=0, URL query `msw=1`
- Scenario: cache-hit (x-msw-scenario=cache-hit, x-msw-cache-hit=1, x-msw-missing-master=0, x-msw-transition=server, x-msw-fallback-used=0)

## Evidence
- HAR: artifacts/webclient/e2e/20260205T070641Z/msw-on/har/reception-charts-20260205T070641Z.har
- Screenshots:
  - artifacts/webclient/e2e/20260205T070641Z/msw-on/screenshots/reception-20260205T070641Z.png
  - artifacts/webclient/e2e/20260205T070641Z/msw-on/screenshots/charts-20260205T070641Z.png
- Summary JSON: artifacts/webclient/e2e/20260205T070641Z/msw-on/logs/run-summary-20260205T070641Z.json

## Network Summary
- /orca/claim/outpatient: **not observed** (HAR search)
- /orca/appointments/list/mock: HTTP 200 (MSW)
- /orca/visits/list/mock: HTTP 200 (MSW)
- /orca21/medicalmodv2/outpatient: HTTP 200 (MSW)
- 401/404: none

## UI Text Check
- "CLAIM" text occurrences: Reception=0, Charts=0

## Console Errors
- Font CORS preflight blocked due to extra headers on font requests (non-API)
- ChartsPage: Maximum update depth exceeded (warning)

