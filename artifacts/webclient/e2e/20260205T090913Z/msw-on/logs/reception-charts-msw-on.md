# MSW ON Reception/Charts 実測ログ

- RUN_ID: 20260205T090913Z
- Date (UTC): 2026-02-05T09:18:45Z
- Base URL: http://localhost:4173
- Facility/User: 1.3.6.1.4.1.9414.72.103 / doctor1
- MSW: VITE_DISABLE_MSW=0, URL query `msw=1`
- Scenario: cache-hit (x-msw-scenario=cache-hit, x-msw-cache-hit=1, x-msw-missing-master=0, x-msw-transition=server, x-msw-fallback-used=0)

## Evidence
- HAR: artifacts/webclient/e2e/20260205T090913Z/msw-on/har/reception-charts-20260205T090913Z.har
- Screenshots:
  - artifacts/webclient/e2e/20260205T090913Z/msw-on/screenshots/reception-20260205T090913Z.png
  - artifacts/webclient/e2e/20260205T090913Z/msw-on/screenshots/charts-20260205T090913Z.png
- Summary JSON: artifacts/webclient/e2e/20260205T090913Z/msw-on/logs/run-summary-20260205T090913Z.json

## Network Responses
- 200 http://localhost:4173/orca/appointments/list/mock
- 200 http://localhost:4173/orca/visits/list/mock
- 200 http://localhost:4173/orca21/medicalmodv2/outpatient
- 200 http://localhost:4173/orca/appointments/list/mock
- 200 http://localhost:4173/orca/visits/list/mock

## Console Errors/Warnings
- error: Access to font at 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2' from origin 'http://localhost:4173' has been blocked by CORS policy: Request header field x-msw-cache-hit is not allowed by Access-Control-Allow-Headers in preflight response.
- error: Failed to load resource: net::ERR_FAILED

## Page Errors
- なし
