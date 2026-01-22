# ORCA Fullflow Repeat Summary
- runId: 20260122T035042Z
- traceId: trace-20260122T035042Z
- baseUrl: http://localhost:4173
- msw: enabled (http dev server)
- command: RUN_ID=20260122T035042Z TRACE_ID=trace-20260122T035042Z VITE_DEV_USE_HTTPS=0 PLAYWRIGHT_BASE_URL=http://localhost:4173 PLAYWRIGHT_ARTIFACT_DIR=artifacts/webclient/orca-e2e/20260123/fullflow npx playwright test tests/e2e/orca-fullflow.spec.ts --reporter=line --repeat-each=5 --workers=1
- result: 10/10 passed (success=5/5 per scenario)
- non-functional: duration < 120000ms per scenario (asserted in test)
- runId/traceId presence: charts meta verified (asserted in test)
- apiResult coverage: 00/21/0001 verified by banners/assertions
