# patientlst7v2 curl 検証（MSW無効・5173/9080差分）
- RUN_ID: 20260203T194422Z-patientlst7v2
- 実施日時: 2026-02-03T19:44:22Z
- Auth: Basic(doctor1:doctor2025), X-Facility-Id=1.3.6.1.4.1.9414.72.103
- Base: http://localhost:5173 / http://localhost:9080

## MSW off / via Vite (5173)
- patientlst7v2: http://localhost:5173/api01rv2/patientlst7v2 -> 500 (body 0 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194422Z-patientlst7v2/auto/vite-5173.xml)

## MSW off / direct backend (9080)
- patientlst7v2: http://localhost:9080/openDolphin/resources/api01rv2/patientlst7v2 -> 200 (body 392 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194422Z-patientlst7v2/auto/backend-9080.xml)

