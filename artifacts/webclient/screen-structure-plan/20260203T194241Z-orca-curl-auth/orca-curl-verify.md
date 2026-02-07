# ORCA curl 検証（MSW無効・VITE_ORCA_API_PATH_PREFIX差分 / user auth）
- RUN_ID: 20260203T194241Z-orca-curl-auth
- 実施日時: 2026-02-03T19:42:41Z
- Base: http://localhost:5173 / http://localhost:9080
- Auth: Basic(doctor1:doctor2025), X-Facility-Id=1.3.6.1.4.1.9414.72.103

## MSW off / prefix auto / via Vite (http://localhost:5173)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:5173/orca/appointments/list -> 404 (body 436 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/appointments.json)
- visits: http://localhost:5173/orca/visits/list -> 404 (body 418 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/visits.json)
- claim: http://localhost:5173/orca/claim/outpatient -> 404 (body 433 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/claim.json)
- medicalmod: http://localhost:5173/orca21/medicalmodv2/outpatient -> 404 (body 460 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/medicalmod.json)

## MSW off / prefix auto / direct backend (http://localhost:9080/openDolphin/resources)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:9080/openDolphin/resources/orca/appointments/list -> 200 (body 431 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/appointments.json)
- visits: http://localhost:9080/openDolphin/resources/orca/visits/list -> 200 (body 405 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/visits.json)
- claim: http://localhost:9080/openDolphin/resources/orca/claim/outpatient -> 404 (body 421 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/claim.json)
- medicalmod: http://localhost:9080/openDolphin/resources/orca21/medicalmodv2/outpatient -> 200 (body 923 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/auto/medicalmod.json)

## MSW off / prefix off / via Vite (http://localhost:5173)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:5173/orca/appointments/list -> 200 (body 431 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/appointments.json)
- visits: http://localhost:5173/orca/visits/list -> 200 (body 405 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/visits.json)
- claim: http://localhost:5173/orca/claim/outpatient -> 404 (body 421 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/claim.json)
- medicalmod: http://localhost:5173/orca21/medicalmodv2/outpatient -> 200 (body 923 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/medicalmod.json)

## MSW off / prefix off / direct backend (http://localhost:9080/openDolphin/resources)
- appointmentDate=2026-02-04, visitDate=2026-02-04
- appointments: http://localhost:9080/openDolphin/resources/orca/appointments/list -> 200 (body 431 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/appointments.json)
- visits: http://localhost:9080/openDolphin/resources/orca/visits/list -> 200 (body 405 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/visits.json)
- claim: http://localhost:9080/openDolphin/resources/orca/claim/outpatient -> 404 (body 421 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/claim.json)
- medicalmod: http://localhost:9080/openDolphin/resources/orca21/medicalmodv2/outpatient -> 200 (body 923 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194241Z-orca-curl-auth/off/medicalmod.json)

