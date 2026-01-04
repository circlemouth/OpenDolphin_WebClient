# 20260104T005943Z ORCA 実環境連携（Web クライアント）

- RUN_ID: 20260104T005943Z
- 実施日: 2026-01-04 (UTC)
- 対象: Web クライアント（Reception / Charts / Patients / Administration）
- 接続先: https://weborca.cloud.orcamo.jp:443
- 証跡: artifacts/orca-connectivity/20260104T005943Z/ , artifacts/webclient/e2e/20260104T005943Z/
> **注記**: 2026-01-04 以降の標準接続先は WebORCA Trial（XML/UTF-8 + Basic）である。本ログは旧方針（mTLS + JSON/Shift_JIS）実測の記録として参照のみ。

## 証明書/認証メモ
- PKCS#12: `ORCAcertification/103867__JP_u00001294_client3948.p12`
- パスフレーズ: あり（値は <MASKED>）
- Basic 認証: ORCA_PROD_BASIC_USER / ORCA_PROD_BASIC_KEY（値は <MASKED>）

## 実行コマンド（値はマスク）
```bash
# ORCA mTLS + Basic 疎通
# NOTE: このコマンドは旧方針（JSON/Shift_JIS + class=00）。現行は Trial + XML/UTF-8 を使用する。
RUN_ID=20260104T005943Z \
ORCA_PROD_CERT=ORCAcertification/103867__JP_u00001294_client3948.p12 \
ORCA_PROD_CERT_PASS=<MASKED> \
ORCA_PROD_BASIC_USER=<MASKED> \
ORCA_PROD_BASIC_KEY=<MASKED> \
curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
  -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json; charset=Shift_JIS' \
  -X POST --data-binary '@docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.json' \
  "https://weborca.cloud.orcamo.jp:443/api/api01rv2/system01dailyv2?class=00"

# Web クライアント起動（mTLS + Basic 付き dev proxy）
RUN_ID=20260104T005943Z \
VITE_DISABLE_MSW=1 \
VITE_DEV_PROXY_TARGET=https://weborca.cloud.orcamo.jp:443/openDolphin/resources \
ORCA_PROD_CERT=ORCAcertification/103867__JP_u00001294_client3948.p12 \
ORCA_PROD_CERT_PASS=<MASKED> \
ORCA_PROD_BASIC_USER=<MASKED> \
ORCA_PROD_BASIC_KEY=<MASKED> \
MINIO_API_PORT=39000 MINIO_CONSOLE_PORT=39001 \
MODERNIZED_POSTGRES_PORT=55436 MODERNIZED_APP_HTTP_PORT=9082 MODERNIZED_APP_ADMIN_PORT=9997 \
WEB_CLIENT_MODE=npm ./setup-modernized-env.sh
```

## 疎通結果
- DNS/TLS: 成功（`artifacts/orca-connectivity/20260104T005943Z/dns/resolve.log`, `tls/openssl_s_client.log`）
- `system01dailyv2`: HTTP 502（`httpdump/system01dailyv2/httpcode.txt`）

## Web クライアント検証結果
- ログイン: doctor1 / facility=1.3.6.1.4.1.9414.72.103
- runId バッジ: 20260104T011302Z
- runId と auditEvent の突合: Reception / Charts / Patients / Administration で一致
- ORCA キュー: `ORCA_QUEUE_STATUS` を確認（queueEntries=0, queueSource=live）
- 患者一覧: `/api01rv2/patient/outpatient/mock` が 500 を返却

## 補足
- `setup-modernized-env.sh` は ORCA info 未設定のため `ORCA host: localhost / port: 18080` を採用（custom.properties.dev に反映）。
- Web クライアントの ORCA 呼び出しは Vite dev proxy（mTLS + Basic）で実施。

## 証跡
- ORCA 疎通: artifacts/orca-connectivity/20260104T005943Z/
- Web UI: artifacts/webclient/e2e/20260104T005943Z/
  - screenshots: reception.png / charts.png / patients.png / administration.png / after-login.png
  - logs: summary.json / audit-*.json / session.json / login-status.json / browser.log
  - har: session-20260104T005943Z.har

## ブロッカー
- ORCA system01dailyv2 が 502 を返却（mTLS + Basic 疎通で API 側のゲートウェイ応答）
- `/api01rv2/patient/outpatient/mock` が 500 を返却（Patients 画面、audit ログで再現）
