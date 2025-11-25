# 2025-11-22 ORCA Connectivity Log (Mac Dev ORCA)

## Overview
- **Target**: Mac Dev ORCA (`http://100.102.17.40:8000`)
- **Auth**: `ormaster` / `change_me`
- **RUN_ID**: `20251122T073700Z_ORMaster_Connectivity`

## Connectivity Results

### 1. Connectivity Check (`system01dailyv2`)
- **Method**: POST
- **Status**: `HTTP 200 OK`
- **Api_Result**: `91` (Request Number Missing - Expected for simple connectivity check)
- **Conclusion**: Connectivity and Authentication (`ormaster`) are working.

### 2. Write API Check (`acceptmodv2`, `appointmodv2`)
- **Method**: POST
- **Status**: `HTTP 405 Method Not Allowed`
- **Allow Header**: `OPTIONS, GET`
- **Conclusion**: POST method is NOT allowed on this server configuration. `receipt_route.ini` likely needs `ALLOW_METHODS=POST`.

## Evidence
- Root: `artifacts/orca-connectivity/20251122T073700Z_ORMaster_Connectivity/`
  - `system01dailyv2_response.json`
  - `acceptmodv2_request.log` (Shows 405)
  - `appointmodv2_request.log` (Shows 405)

## Next Steps
- Update `receipt_route.ini` on the target server (`100.102.17.40`) to enable POST for `orca11`, `orca14`, etc.
- Continue using this server as the standard connection target as requested.

## Analysis vs Official Documentation (2025-11-22)
The user provided the official "ORCA API 予約 (appointmodv2)" documentation.
- **Official Spec**:
  - Method: `POST`
  - URL: `/orca14/appointmodv2?class=01`
  - Content-Type: `application/xml`
- **Current Request**:
  - We are sending exactly this: `POST /orca14/appointmodv2?class=01` with `Content-Type: application/xml`.
- **Discrepancy**:
  - The server returns `405 Method Not Allowed` (Allow: OPTIONS, GET).
  - This confirms the issue is **server-side configuration**, specifically the `receipt_route.ini` (or `jma-receipt.conf`) restricting allowed methods for these API groups.
  - The documentation proves that `POST` is the correct and intended method for this endpoint.

