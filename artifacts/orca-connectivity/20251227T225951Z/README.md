# ORCA 接続証跡（RUN_ID: 20251227T225951Z）

## 実施概要
- 目的: ORCA 本番（certification）疎通の TLS/BASIC 事前確認と system01dailyv2 実行
- 接続先: https://weborca.cloud.orcamo.jp:443
- 結果: TLS/DNS は取得。system01dailyv2 実行は HTTP 502。

## 実施内容
- DNS 取得: `dns/resolve.log`
- TLS ハンドシェイク: `tls/openssl_s_client.log`
  - 事象: `ssl/tls alert handshake failure` が記録されるが、証明書チェーン/暗号スイートは取得。
- system01dailyv2 呼び出し: HTTP 502（`trial/system01dailyv2/response.headers`）

## 追加メモ
- 作業ツリーに資格情報ファイルが存在しないため、master ブランチの `ORCAcertification/` を参照して実行（ファイルのコピーは行っていない）。

## 次アクション
- 上記 2 ファイルを作業ツリーの `ORCAcertification/` に配置後、`system01dailyv2` を再実行する。
