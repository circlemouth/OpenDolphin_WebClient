# 20251210T130644Z orca-prod-bridge Evidence
- 状態: 本番 webORCA (`https://weborca.cloud.orcamo.jp`) へ前倒し実行。`/api/api01rv2/acceptlstv2?class=01` POST は HTTP 404 (HTML NotFound) で Api_Result 取得なし。
- TLS: `tls/openssl_s_client_20251210T130644Z.txt`（handshake failure, alert 40）。
- HTTP: `httpdump/20251210T130644Z-headers.txt`, `trace/20251210T130644Z-trace.log`, `data-check/20251210T130644Z-response.json`。
- serverinfo: 未取得（server-modernized 未起動）。
- 参照: `docs/server-modernization/phase2/operations/logs/20251210T130644Z-orca-prod-bridge.md`
- ポリシー: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（RUN_ID=20251203T134014Z）準拠。資格情報は環境変数でセットし、ログには `<MASKED>` を使用。
