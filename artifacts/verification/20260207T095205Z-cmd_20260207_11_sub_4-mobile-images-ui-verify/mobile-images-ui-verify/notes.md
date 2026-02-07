# Mobile Images Upload UI (Phase1) - Manual Verify Notes

## Metadata

- RUN_ID: `20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify`
- Verified at (UTC): `2026-02-07T09:58:41Z` - `2026-02-07T09:58:50Z` (see `summary.json`)
- Tester: ashigaru3 (Playwright headless)
- Repo/branch/commit: OpenDolphin_WebClient `master` @ `bb4d26377`
- Web URL: `http://127.0.0.1:5173/f/1.3.6.1.4.1.9414.72.103/m/images`
- API base URL: `/api` (MSW enabled; actual network to backend is not required for this run)
- Facility ID: `1.3.6.1.4.1.9414.72.103`
- Patient selector method:
  - Patient ID input (reception list selection UI is not present in Phase1 mobile page)

## Feature Flags / Gate

- VITE_DISABLE_MSW: `0` (MSW ON)
- VITE_PATIENT_IMAGES_MOBILE_UI: `1`
- VITE_PATIENT_IMAGES_MVP: `1`
- Gate headers / facility headers evidence:
  - Where captured:
    - `network.har` / `network-android.har` / `network-ipad.har`
    - `run-iphone.json` requestLog includes `x-feature-images: 1`

## Device / Viewport Matrix

Playwright device profiles were used (see `verify.mjs`).

### iPhone (iPhone 13)

- Device profile: `devices['iPhone 13']`
- Notes: 413 error + Retry evidence included on this device.

### Android phone (Pixel 5)

- Device profile: `devices['Pixel 5']`

### iPad / Tablet (iPad gen 7)

- Device profile: `devices['iPad (gen 7)']`

## UI Existence (Phase1)

- Dedicated mobile upload UI exists:
  - Entry point: `/f/:facilityId/m/images` (AppRouter gated by `VITE_PATIENT_IMAGES_MOBILE_UI=1`)
  - Screenshot(s):
    - iPhone: `screenshots/iphone/01-open.png`
    - Android: `screenshots/android/01-open.png`
    - iPad: `screenshots/ipad/01-open.png`
- File input attributes:
  - `accept="image/*"` present: yes
  - `capture="environment"` present: yes (capture input only)
  - Evidence:
    - iPhone: `screenshots/iphone/03-capture-attrs.png`
    - Android: `screenshots/android/03-capture-attrs.png`
    - iPad: `screenshots/ipad/03-capture-attrs.png`

## Happy Path Verification

For each step: include expected, actual, evidence (screenshot name + network key requests).

1. Patient identify
   - Method: patientId input + commit
   - Expected: patientId is set; list GET is triggered
   - Actual: status shows `patientId=...` and list is rendered (empty or populated)
   - Evidence:
     - screenshots:
       - `screenshots/*/02-patient-selected.png`
     - network:
       - `GET /patients/{patientId}/images` (HAR)
2. Upload 1 image
   - Method: file upload (Playwright `setInputFiles`) as substitute
   - File used:
     - name: `tiny.png`
     - type: `image/png` (by extension)
     - size: very small (1x1 PNG)
   - Expected: POST succeeds; status shows "送信しました"; list refresh
   - Actual: OK (all devices)
   - Evidence:
     - screenshots:
       - `screenshots/*/04-file-selected*.png`
       - `screenshots/*/07-upload-success-list.png`
     - network requests:
       - `POST /patients/{patientId}/images` (HAR)
       - status: 200 in success path (HAR)
3. List refresh / list reflects uploaded item
   - Expected: uploaded item appears in list
   - Actual: list shows at least 1 item + download link
   - Evidence:
     - screenshots: `screenshots/*/07-upload-success-list.png`
     - network: `GET /patients/{patientId}/images` (HAR)
4. Download confirm
   - Expected: download/preview link opens
   - Actual: popup opened and loaded
   - Evidence:
     - screenshots: `screenshots/*/08-download-popup.png`
     - network:
       - `GET /openDolphin/resources/patients/{patientId}/images/{imageId}` (HAR; routed to return dummy PNG for evidence)

## Error UX + Retry

### 404 (feature gate off)

- Not verified in this RUN (min requirement satisfied by 413 case).

### 413 (payload too large)

- How to trigger: upload a file > 5MiB
- Expected UI message: "容量超過: 413" を含む表示 + Retry ボタンが出る
- Actual UI message: OK（iPhone run）
- Retry behavior: Retry で再送準備→小さい画像に差し替えて送信成功
- Evidence (iPhone):
  - `screenshots/iphone/04-file-selected-large.png`
  - `screenshots/iphone/05-error-413.png`
  - `screenshots/iphone/06-retry-ready.png`
  - `screenshots/iphone/06b-retry-file-selected.png`
  - `screenshots/iphone/07-upload-success-list.png`

### 415 (unsupported media type)

- Not verified in this RUN.

### Offline / Network interruption

- Not verified in this RUN.

## Audit / Observability Evidence

- RUN_ID is shown in UI header and injected into session:
  - `summary.json` / `run-*.json` includes injected session `runId`

## Network Evidence Checklist

- Save `network.har`: yes (plus android/ipad HAR)
- Confirm endpoints used:
  - list: `GET /patients/{patientId}/images`
  - upload: `POST /patients/{patientId}/images` (with `x-feature-images: 1`)
  - download: `GET /openDolphin/resources/patients/{patientId}/images/{imageId}`
- Confirm no deprecated CLAIM endpoints are called:
  - `/orca/claim/outpatient` called? no
  - Evidence: `rg "/orca/claim/outpatient" *.har` -> no hits

## Screenshots Checklist (PHI-masked)

- Masking method: CSS blur applied to `[data-test-id="mobile-images-status"]` and `[data-test-id="mobile-patient-id-input"]` before screenshot.
- Screenshots captured:
  - Entry screen:
  - Patient selected:
  - Upload UI:
  - Upload success:
  - List updated:
  - Download action:
  - Each error case + retry:

## Result Summary

- Overall: partial-pass (success path on 3 viewports + 413 error + retry proven)
- Gaps/known issues:
  - 404 gate / 415 / offline error cases are not covered in this RUN (only 413 was required and included).
  - Patient selection in Phase1 mobile UI is patientId input only (no reception list selection).
- Follow-ups / backlog candidates:
  - Add dedicated "gate off" verification mode (VITE_PATIENT_IMAGES_MOBILE_UI=0 or header gate off) and error UX screenshots.
  - Add 415 and offline scenarios to the automated runner.
