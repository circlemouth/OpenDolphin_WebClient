# cmd_20260207_11_sub_2 mobile patient pick Phase1 notes

RUN_ID: 20260207T092856Z-cmd_20260207_11_sub_2-mobile-patient-pick-phase1

## Goal
Mobile-first UI for patient identification (for mobile image upload dedicated UI):
- Pick from "today reception candidates" list (1-tap)
- Or input patientId manually (barcode/manual) with validation + existence check

## API rationale
- Today candidates:
  - Source: `GET /api/orca/queue`
  - Reason: already used by Reception, CLAIM is deprecated, and `queue[].patientId` provides a stable patientId list for "today"-equivalent candidates.
  - Note: in MSW mode, candidates are injected via `mswFault=queue-stall`.

- Manual patientId existence check:
  - Source: `POST /orca/patients/local-search` (via `fetchPatients({ keyword })`)
  - Phase1 behavior: treat as "exists" when exact match patientId is found in returned list.

## UI behavior (Phase1)
- Candidate list:
  - search (patientId)
  - big rows, 1-tap selection
  - fetch error -> show message + retry button

- Manual input:
  - digits-only; max 12 digits; if <6 digits -> zero-pad to 6 for ORCA-like IDs
  - "存在確認" runs `fetchPatients` and shows runId/sourcePath/status in the result
  - emergency-only: "そのまま選択" is provided (skips existence check)

## Evidence
- Screenshot: `screenshots/mobile-patient-picker-phase1.png`

## Integration point (for ashigaru5)
- Component: `web-client/src/features/images/components/MobilePatientPicker.tsx`
- Barrel export: `web-client/src/features/images/components/index.ts`
- Props:
  - `onSelect(patientId: string)`
  - `selectedPatientId?: string`
  - `title?: string`

## Demo (debug)
- Page: `/f/:facilityId/debug/mobile-patient-picker?msw=1`
- Requires: `VITE_ENABLE_DEBUG_PAGES=1` and system_admin role
