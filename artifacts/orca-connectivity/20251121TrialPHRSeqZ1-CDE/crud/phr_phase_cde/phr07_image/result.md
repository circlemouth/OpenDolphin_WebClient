# PHR-07 image (Phase-D)
- RUN_ID: 20251121TrialPHRSeqZ1-CDE
- Request: GET /20/adm/phr/image/00000001 (Basic trial/weborcatrial)
- Response: HTTP 404 Not Found
- Body: {"Code":404,"Message":"code=404, message=Not Found"}
- Trialsite reference: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#limit` に「一部の管理業務」は利用不可と記載されており、PHR 画像ストリームはトライアル公開範囲外。
- Next action: Modernizedサーバーで `PHR_SCHEMA_IMAGE_STREAM` 監査を実装し、Trial 404 を Blocker(`TrialLocalOnly`) としてログに残す。
