# 2025-12-27 ORCA 接続ログ

## RUN_ID: 20251227T225951Z
- 目的: ORCA 本番（certification）疎通の TLS/BASIC 事前確認と system01dailyv2 実行
- 接続先: `https://weborca.cloud.orcamo.jp:443`
- 証跡: `artifacts/orca-connectivity/20251227T225951Z/`
- 実施結果:
  - DNS 取得: `dns/resolve.log`
  - TLS ハンドシェイク: `tls/openssl_s_client.log`（`ssl/tls alert handshake failure` を記録）
  - system01dailyv2: 未実施（資格情報ファイル欠如）
- Blocker:
  - `ORCAcertification/新規 テキスト ドキュメント.txt` が存在しない
  - `ORCAcertification/103867__JP_u00001294_client3948.p12` が存在しない
