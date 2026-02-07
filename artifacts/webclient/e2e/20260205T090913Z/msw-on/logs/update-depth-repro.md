# Charts update depth warning repro (MSW ON)

- RUN_ID: 20260205T090913Z
- Env: Vite 4173 / MSW ON / URL `?msw=1`
- Session: seeded `opendolphin:web-client:auth` (facilityId=0001, userId=doctor1)

## Result
- Console: `Warning: Maximum update depth exceeded` (ChartsContent @ ChartsPage.tsx:205:105)
- Network: `/orca/appointments/list/mock` 200, `/orca/visits/list/mock` 200, `/orca21/medicalmodv2/outpatient` 200
- `/orca/claim/outpatient` not observed

## Evidence
- HAR: artifacts/webclient/e2e/20260205T090913Z/msw-on/har/reception-charts-20260205T090913Z.har
- Screenshots:
  - artifacts/webclient/e2e/20260205T090913Z/msw-on/screenshots/reception-20260205T090913Z.png
  - artifacts/webclient/e2e/20260205T090913Z/msw-on/screenshots/charts-20260205T090913Z.png
- Summary JSON: artifacts/webclient/e2e/20260205T090913Z/msw-on/logs/run-summary-20260205T090913Z.json

