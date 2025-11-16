# PHR-06 identityToken (Phase-C)
- RUN_ID: 20251121TrialPHRSeqZ1-CDE
- Request: POST /20/adm/phr/identityToken (Basic trial/weborcatrial)
- Response: HTTP 405 Method Not Allowed (Allow: OPTIONS, GET)
- Body: {"Code":405,"Message":"code=405, message=Method Not Allowed"}
- Trialsite reference: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#limit` でトライアルサーバでは一部管理業務と外部連携機能が利用できない旨が記載されており、Layer ID 発行 API は閉塞されている。
- Next action: Modernized RESTEasy 実装で `PHR_LAYER_ID_TOKEN_ISSUE` 監査を発火させ、Trial では 405 ブロックを evidence のまま残す。
