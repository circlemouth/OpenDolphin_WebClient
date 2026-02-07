# ORCA curl 検証（MSW無効・VITE_ORCA_API_PATH_PREFIX差分）
- RUN_ID: 20260203T194139Z-orca-curl
- 実施日時: 2026-02-03T19:41:39Z
- Base: http://localhost:5173 / http://localhost:9080
- Note: Authorization=Basic(trial:weborcatrial)

## MSW off / prefix auto / via Vite (http://localhost:5173)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:5173/orca/appointments/list -> 401 (body 236 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/appointments.json)
- visits: http://localhost:5173/orca/visits/list -> 401 (body 230 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/visits.json)
- claim: http://localhost:5173/orca/claim/outpatient -> 401 (body 235 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/claim.json)
- medicalmod: http://localhost:5173/orca21/medicalmodv2/outpatient -> 401 (body 244 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/medicalmod.json)

## MSW off / prefix auto / direct backend (http://localhost:9080/openDolphin/resources)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:9080/openDolphin/resources/orca/appointments/list -> 401 (body 232 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/appointments.json)
- visits: http://localhost:9080/openDolphin/resources/orca/visits/list -> 401 (body 226 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/visits.json)
- claim: http://localhost:9080/openDolphin/resources/orca/claim/outpatient -> 401 (body 231 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/claim.json)
- medicalmod: http://localhost:9080/openDolphin/resources/orca21/medicalmodv2/outpatient -> 401 (body 240 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/auto/medicalmod.json)

## MSW off / prefix off / via Vite (http://localhost:5173)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:5173/orca/appointments/list -> 401 (body 232 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/appointments.json)
- visits: http://localhost:5173/orca/visits/list -> 401 (body 226 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/visits.json)
- claim: http://localhost:5173/orca/claim/outpatient -> 401 (body 231 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/claim.json)
- medicalmod: http://localhost:5173/orca21/medicalmodv2/outpatient -> 401 (body 240 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/medicalmod.json)

## MSW off / prefix off / direct backend (http://localhost:9080/openDolphin/resources)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:9080/openDolphin/resources/orca/appointments/list -> 401 (body 232 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/appointments.json)
- visits: http://localhost:9080/openDolphin/resources/orca/visits/list -> 401 (body 226 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/visits.json)
- claim: http://localhost:9080/openDolphin/resources/orca/claim/outpatient -> 401 (body 231 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/claim.json)
- medicalmod: http://localhost:9080/openDolphin/resources/orca21/medicalmodv2/outpatient -> 401 (body 240 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194139Z-orca-curl/off/medicalmod.json)

