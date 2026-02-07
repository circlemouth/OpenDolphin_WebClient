# patientlst7v2 Vite修正後の再検証（5173/9080差分）
- RUN_ID: 20260203T194712Z-patientlst7v2-vitefix
- 実施日時: 2026-02-03T19:47:12Z
- Auth: Basic(doctor1:doctor2025), X-Facility-Id=1.3.6.1.4.1.9414.72.103
- Base: http://localhost:5173 / http://localhost:9080

## MSW off / via Vite (5173)
- patientlst7v2: http://localhost:5173/api01rv2/patientlst7v2 -> 500 (body 0 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194712Z-patientlst7v2-vitefix/vite-5173.xml)

## MSW off / direct backend (9080)
- patientlst7v2: http://localhost:9080/openDolphin/resources/api01rv2/patientlst7v2 -> 200 (body 392 bytes, /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/webclient/screen-structure-plan/20260203T194712Z-patientlst7v2-vitefix/backend-9080.xml)

## Vite proxy log (tail)

  VITE v6.4.1  ready in 128 ms

  ➜  Local:   http://localhost:5173/
4:47:13 [vite] http proxy error: /api01rv2/patientlst7v2
Error: Parse Error: Invalid header value char
    at Socket.socketOnData (node:_http_client:558:22)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23)
