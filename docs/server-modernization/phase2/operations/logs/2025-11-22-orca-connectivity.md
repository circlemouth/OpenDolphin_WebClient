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
