# TLS 取得メモ (RUN_ID=20251122T071146Z)
- 取得日時(UTC): 2025-11-22T13:29:17Z
- 対象ホスト: 100.102.17.40
- 手順: `openssl s_client -connect <host:port> -showcerts -servername <host>`
- 結果:
  - :443 / :8443 / :8000 いずれも TLS ハンドシェイクが `internal error` / `protocol version` で失敗し、証明書チェーンを取得できず。HTTP は 8000/tcp で応答 (405)。
- 対応案: Stage の HTTPS 経路とポートを担当チームに確認し、稼働しているポートに対して再取得する。
