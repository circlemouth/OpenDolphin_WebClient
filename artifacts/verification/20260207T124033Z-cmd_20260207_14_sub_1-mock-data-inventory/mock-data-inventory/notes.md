# cmd_20260207_14_sub_1 mock data inventory (web-client)

RUN_ID: 20260207T124033Z-cmd_20260207_14_sub_1-mock-data-inventory

## How this inventory was built
- Command (broad scan):
  - `rg -n "\b(msw|mock|fixture|sample|dummy|lorem|seed|fake)\b" web-client/src tests scripts -S --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/artifacts/**'`
- Total matches (approx): 759 lines (stored temporarily in `/tmp/mock_inventory_rg.txt` on the operator machine).

## Priority definition (P0/P1/P2)
- P0: Production routes (or admin routes) where mock/sample data can surface if env/config is wrong or APIs return empty; affects real usage.
- P1: Debug-only routes or explicitly gated behaviors (env flags + role + `?msw=1`) used for QA/verification.
- P2: Tests/scripts/docs-only references (no runtime impact unless running tests/CLI).

## Inventory by screen / reach path

### App bootstrap / MSW worker (cross-cutting)
- P0
  - `web-client/src/main.tsx`
    - Reach path: all app loads when `VITE_DISABLE_MSW != '1'`.
    - Behavior: dynamically imports `./mocks/browser` and starts MSW worker.
  - `web-client/src/mocks/browser.ts`
    - Reach path: same as above.
    - Behavior: `setupWorker(...handlers)` and `worker.start({ onUnhandledRequest: 'bypass' })`.
  - `web-client/src/mocks/handlers/*`, `web-client/src/mocks/fixtures/*`
    - Reach path: only when MSW is active.
    - Notes: MSW affects many endpoints (outpatient, queue, master, images, chart events). A production build MUST set `VITE_DISABLE_MSW=1` (or equivalent build-time policy) to avoid unintended interception.

### Reception (受付一覧)
- P0
  - `web-client/src/features/reception/pages/ReceptionPage.tsx`
    - Reach path: `/f/:facilityId/reception`.
    - Uses `GET /api/orca/queue` (can be mocked by MSW).
- P1
  - Fault injection headers for MSW are only allowed when:
    - `VITE_DISABLE_MSW != '1'` AND
    - (`VITE_ENABLE_DEBUG_PAGES=1` OR `VITE_ENABLE_DEBUG_UI=1`) AND system_admin role AND `?msw=1`.
    - See `web-client/src/libs/http/header-flags.ts`.

### Charts (カルテ)
- P0
  - General reach path: `/f/:facilityId/charts`.
  - Many MSW handlers exist for chart-related flows (`web-client/src/mocks/handlers/orcaMaster.ts`, `chartEvents.ts`, etc.).
  - Risk is primarily configuration: MSW active when it should not be.

### Patients (患者一覧)
- P0
  - `web-client/src/features/patients/api.ts`
    - Reach path: `/f/:facilityId/patients` and any feature calling `fetchPatients`.
    - `SAMPLE_PATIENTS` fallback is used when API returns an empty list AND the fetch attempt has no `error`.
    - This can surface sample patients in non-test environments if the backend returns 200 with empty payload.
    - Key line: `const resolvedPatients = patients.length > 0 ? patients : result?.error ? [] : SAMPLE_PATIENTS;`

### Administration (配信/設定)
- P0 (admin route)
  - `web-client/src/features/administration/AdministrationPage.tsx`
    - Reach path: `/f/:facilityId/administration` (system_admin role required).
    - Includes `Charts master ソース` option `mock（MSW/fixture 優先）`.
    - This is a deliberate admin/QA control; still production-reachable for system_admin.

### Outpatient Mock (debug)
- P1
  - `web-client/src/features/outpatient/OutpatientMockPage.tsx`
    - Reach path: `/f/:facilityId/debug/outpatient-mock` (requires `VITE_ENABLE_DEBUG_PAGES=1` and system_admin role).
    - Uses outpatient fixtures and explicitly references MSW scenarios.

### Mobile patient picker demo (debug)
- P1
  - `web-client/src/features/debug/MobilePatientPickerDemoPage.tsx` + `web-client/src/AppRouter.tsx` debug gate
    - Reach path: `/f/:facilityId/debug/mobile-patient-picker?msw=1` (requires `VITE_ENABLE_DEBUG_PAGES=1` and system_admin role).

### Images (カルテ画像: MSW placeholder)
- P1
  - `web-client/src/mocks/handlers/karteImage.ts`
    - Reach path: only when MSW is active.
    - Notes: in-memory store enables "upload -> list contains it" proof while server API is pending.

### Tests / scripts
- P2
  - `tests/**` (Playwright): many MSW scenarios, fixtures, and fault injection.
  - `scripts/**`: seed and MSW fixture verification helpers.

## High-signal findings (actionable)
1. P0 risk: MSW worker auto-starts when `VITE_DISABLE_MSW != '1'`.
   - If an environment accidentally ships with MSW enabled, mocks/fixtures can intercept production traffic.
2. P0 risk: `SAMPLE_PATIENTS` fallback in `fetchPatients` can display sample patients when backend returns empty list without error.
   - Strongly consider gating this fallback behind a debug env flag or MSW-only mode.
3. Admin route contains an explicit `mock（MSW/fixture 優先）` selection.
   - Ensure it is documented as QA-only behavior and does not leak into non-QA environments.

## Suggested follow-up (not executed in this task)
- Add a single source-of-truth build-time guard: production builds force `VITE_DISABLE_MSW=1`.
- Replace `SAMPLE_PATIENTS` with `[]` unless explicitly in debug/MSW mode.
- Add a CI check that fails if `SAMPLE_` fallback is reachable without debug flag.
