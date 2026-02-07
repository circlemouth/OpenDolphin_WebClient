# Mobile Images Upload UI (Phase1) - Manual Verify Notes Template

This is a notes template for cmd_20260207_11_sub_4.

Copy this file to:
`OpenDolphin_WebClient/artifacts/verification/<RUN_ID>/mobile-images-ui-verify/notes.md`

## Metadata

- RUN_ID:
- Verified at (UTC):
- Tester:
- Repo/branch/commit:
- Web URL:
- API base URL:
- Facility ID:
- Patient selector method:
  - Reception list | Patient ID input

## Feature Flags / Gate

- VITE_DISABLE_MSW:
- VITE_PATIENT_IMAGES_MVP:
- Other relevant flags:
- Gate headers / facility headers evidence:
  - Where captured:
    - `network.har`
    - `network-summary.json` (optional)

## Device / Viewport Matrix

Record results per device/viewport. Use Playwright device profiles if available.

### iPhone (example: iPhone 13)

- User agent/device profile:
- Viewport (w x h):
- Orientation:
- Notes:

### Android phone (example: Pixel 5)

- User agent/device profile:
- Viewport (w x h):
- Orientation:
- Notes:

### iPad / Tablet (example: iPad 10th gen)

- User agent/device profile:
- Viewport (w x h):
- Orientation:
- Notes:

## UI Existence (Phase1)

- Dedicated mobile upload UI exists:
  - Entry point (URL/path / button / tab):
  - Screenshot(s):
- File input attributes:
  - `accept="image/*"` present:
  - `capture` attribute present/visible in DOM:
  - Screenshot(s) or DOM evidence:
- Camera capture UI (if implemented):
  - HTTPS requirement (`window.isSecureContext`) handled:
  - Fallback message shown when not secure:

## Happy Path Verification

For each step: include expected, actual, evidence (screenshot name + network key requests).

1. Patient identify
   - Method: Reception list selection OR patientId input
   - Expected:
   - Actual:
   - Evidence:
     - screenshots:
     - network:
2. Upload 1 image
   - Method:
     - Real camera capture OR file upload (Playwright setInputFiles) as substitute
   - File used:
     - name:
     - type:
     - size:
   - Expected:
   - Actual:
   - Evidence:
     - screenshots:
     - network requests:
       - upload endpoint:
       - status code:
       - response key fields (if safe):
3. List refresh / list reflects uploaded item
   - Expected:
   - Actual:
   - Evidence:
     - screenshots:
     - network:
4. Download confirm
   - Expected:
   - Actual:
   - Evidence:
     - screenshots:
     - network:

## Error UX + Retry

### 404 (feature gate off)

- How to trigger:
- Expected UI message:
- Actual UI message:
- Retry behavior:
- Evidence:

### 413 (payload too large)

- How to trigger:
  - Use a file > max size (note: may need a generated blob in test)
- Expected UI message:
- Actual UI message:
- Evidence:

### 415 (unsupported media type)

- How to trigger:
  - Upload a non-image file or mismatched content-type if possible
- Expected UI message:
- Actual UI message:
- Evidence:

### Offline / Network interruption

- How to trigger:
  - Playwright `page.context().setOffline(true)` (or browser devtools)
- Expected UI message:
- Actual UI message:
- Retry behavior:
- Evidence:

## Audit / Observability Evidence

- runId / traceId present:
  - Where captured (response headers / logs):
- Audit event emitted (if applicable):
  - event/action name:
  - outcome:
  - Evidence files:

## Network Evidence Checklist

- Save `network.har`:
- Confirm endpoints used:
  - list:
  - upload:
  - download:
- Confirm no deprecated CLAIM endpoints are called:
  - `/orca/claim/outpatient` called? yes/no
  - Evidence:

## Screenshots Checklist (PHI-masked)

- Masking method:
- Screenshots captured:
  - Entry screen:
  - Patient selected:
  - Upload UI:
  - Upload success:
  - List updated:
  - Download action:
  - Each error case + retry:

## Result Summary

- Overall: pass | partial | fail
- Gaps/known issues:
- Follow-ups / backlog candidates:

