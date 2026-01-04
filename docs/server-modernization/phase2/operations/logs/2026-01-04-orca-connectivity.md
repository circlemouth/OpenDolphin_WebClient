# ORCA Connectivity Log


## RUN_ID=20260104T071138Z (ORCA実環境連携検証)
- 接続先: https://weborca.cloud.orcamo.jp:443
- DNS/TLS: `artifacts/orca-connectivity/20260104T071138Z/dns/resolve.log`, `artifacts/orca-connectivity/20260104T071138Z/tls/openssl_s_client.log`
- ORCA system01dailyv2: HTTP 502 (headers: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.headers`)
- ServerInfo claim.conn: `artifacts/orca-connectivity/20260104T071138Z/serverinfo/claim_conn.json` (=server)
- Web client audit evidence: `artifacts/orca-connectivity/20260104T071138Z/audit/audit_events.tsv`
- Screenshots: `artifacts/orca-connectivity/20260104T071138Z/screenshots/*.png`

## RUN_ID=20260104T080619Z (Trial ORCA 接続試行)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（trial/weborcatrial）
- DNS/TLS: `artifacts/orca-connectivity/20260104T080619Z/dns/resolve.log`, `artifacts/orca-connectivity/20260104T080619Z/tls/openssl_s_client.log`
- ORCA system01dailyv2: HTTP 502 (headers: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/response.headers`)
