# Factor2 parity RUN_ID=20251118Tfactor2ParityZ2

## 実行手順
- helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）で `--network legacy-vs-modern_default` を指定し、`TRACE_RUN_ID=20251118Tfactor2ParityZ2` のまま `ops/tools/send_parallel_request.sh --profile modernized-dev --config tmp/factor2/factor2_totp_registration.config` を実行。
- ヘッダーは `tmp/parity-headers/factor2_{totp_registration,fido_registration,fido_assertion}_TEMPLATE.headers` を `{{RUN_ID}}` 置換で使用、ペイロードは `tmp/factor2/*.json` を指定。

## HTTP ステータス
| API | Legacy | Modernized | 備考 |
| --- | --- | --- | --- |
| `POST /20/adm/factor2/totp/registration` | 404 | 200 | Modern 側は `Factor2Credential` を永続化し、レスポンス中の `secret`/`provisioningUri` は `***masked***` にマスク済み。 |
| `POST /20/adm/factor2/fido2/registration/options` | 404 | 200 | Modern 側は `Factor2Challenge (FIDO2_REGISTRATION)` を発行。 |
| `POST /20/adm/factor2/fido2/assertion/options` | 404 | 200 | Modern 側は `Factor2Challenge (FIDO2_ASSERTION)` を発行。 |

## Audit / JMS / DB
- `d_audit_event`（modern）に `TOTP_REGISTER_INIT` / `FIDO2_REGISTER_INIT` / `FIDO2_ASSERT_INIT`（TraceId=`parity-factor2-*-20251118Tfactor2ParityZ2`）が 1 件ずつ追記。Legacy 側は 404 により空。(`logs/d_audit_event_factor2_{modern,legacy}.tsv`)
- Modern JMS `messages-added` が 23L → 26L へ +3 増加、Legacy は 0L のまま。(`logs/jms_dolphinQueue_read-resource*.txt`)
- `d_factor2_credential` に `id=2 / credential_type=TOTP / verified=false` が作成され、`d_factor2_challenge` へ FIDO2 登録・認証チャレンジが保存済み。(`logs/d_factor2_*.csv`)

## Legacy 404 の理由
`opendolphin-server`（Legacy WildFly10）では `/20/adm/factor2/*` REST がパッケージされておらず、`AdmissionResource` がルーティングしないため 404 となる。Legacy 環境で Factor2 API を公開する計画は未定のため、本 RUN では 404 を既知事象として Evidence の README に明記した。
