# ORCA Connectivity Evidence (20260104T005943Z)

- RUN_ID: 20260104T005943Z
- 実行日時: 2026-01-04 (UTC)
- 接続先: https://weborca.cloud.orcamo.jp:443
- 証明書: ORCAcertification/103867__JP_u00001294_client3948.p12 (PKCS#12, passphrase あり)
- Basic 認証: ORCA_PROD_BASIC_USER / ORCA_PROD_BASIC_KEY を環境変数で設定（値は <MASKED>）

## 実行内容
1. DNS 取得
2. TLS ハンドシェイク確認
3. system01dailyv2 への疎通確認（mTLS + Basic）

## 結果サマリ
- DNS/TLS: 成功（`dns/resolve.log`, `tls/openssl_s_client.log`）
- `POST /api/api01rv2/system01dailyv2?class=00`: HTTP 502
  - 証跡: `httpdump/system01dailyv2/`

## 証跡一覧
- `dns/resolve.log`
- `tls/openssl_s_client.log`
- `httpdump/system01dailyv2/response.headers`
- `httpdump/system01dailyv2/response.json`
- `httpdump/system01dailyv2/httpcode.txt`
