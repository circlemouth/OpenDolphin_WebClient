# 2025-12-27 ORCA 接続ログ
> **注記**: 現行の標準接続先は WebORCA Trial（XML/UTF-8 + Basic）。本ログは旧方針（certification）実測の記録として参照のみ。

## RUN_ID: 20251227T225951Z
- 追記: 現行ルールに従い Phase2 配下から `docs/server-modernization/operations/logs/` へ移設。
- 目的: ORCA 本番（certification）疎通の TLS/BASIC 事前確認と system01dailyv2 実行
- 接続先: `https://weborca.cloud.orcamo.jp:443`
- 証跡: `artifacts/orca-connectivity/20251227T225951Z/`
- 実施結果:
  - DNS 取得: `dns/resolve.log`
  - TLS ハンドシェイク: `tls/openssl_s_client.log`（`ssl/tls alert handshake failure` を記録）
  - system01dailyv2: HTTP 502（`trial/system01dailyv2/response.headers`）
- 補足:
  - 作業ツリーに資格情報ファイルが存在しないため、master ブランチの `ORCAcertification/` を参照して実行。
