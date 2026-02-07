# /orca/visits/mutation Api_Result matrix retest

- Scope: direct ORCA (`/orca11/acceptmodv2`) vs server-modernized wrapper (`/orca/visits/mutation`) vs web-client(Vite proxy)
- Evidence folder stores only redacted response JSON (Api_Result + message etc) to avoid patient PII.

## Scenarios

| Scenario | direct ORCA | server-modernized | web-client | Notes |
| --- | --- | --- | --- | --- |
| `phys0001` | HTTP 200 + Api_Result=14 | HTTP 200 + apiResult=14 | HTTP 200 + apiResult=14 | doctor not found |
| `ins9999` | HTTP 200 + Api_Result=24 | HTTP 200 + apiResult=24 | HTTP 200 + apiResult=24 | insurance combination missing |
| `dup10001` | HTTP 200 + Api_Result=16 | HTTP 200 + apiResult=16 | HTTP 200 + apiResult=16 | duplicate reception (same dept/insurance/date) |

## Notes on Api_Result=90

Api_Result=90 (other terminal in use / lock) is ORCA acceptmodv2 behavior and is timing-dependent in the shared Trial.
See prior run evidence in repository docs (RUN_ID=`20260205T070802Z`).
