# PHR-11 container (Phase-E)
- RUN_ID: 20251121TrialPHRSeqZ1-CDE
- Request: GET /20/adm/phr/1234567,00000001,20250101,20250101 (Basic trial/weborcatrial)
- Response: HTTP 404 Not Found
- Body: {"Code":404,"Message":"code=404, message=Not Found"}
- Trialsite reference: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#limit` 記載の通り、データ出力/外部連携系は提供対象外であるため PHR コンテナ API は未開放。
- Next action: Modernized REST 実装で `PHR_CONTAINER_FETCH` / `PHR_SIGNED_URL_*` を検証し、Trial では 404 エビデンスを維持。
