# PHR-08 labtest memo (RUN_ID=20251115TorcaPHRSeqZ1)
- Query param: `labSince=2025-05-01` for patient WEB1001.

## Attempt A (PKCS#12 エラー)
- `curl` exit=58。証跡: `trace/phr08_labtest_trace.log` (earlier timestamp).

## Attempt B (Pass FJjmq/d7EP)
- HTTP 404 JSON (`{"Code":404,...}`)。ORCA 本番側 `/20/adm/phr/labtest/{patientId}` が存在しないため、Modernized REST リソースを経由せず 404 で停止。
- TLS mutual auth OK。`trace/phr08_labtest_trace.log` 後半に handshake/HTTP までのログを保存。
- 次アクション: Modernized server (RESTEasy) 側へ接続し、PHRResource 実装のステータスを検証する。ORCA 直叩きでは Phase-B 実測の要件を満たせない。
