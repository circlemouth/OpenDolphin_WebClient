# RUN_ID=20251121TlicenseNightlyZ1 夜間ライセンス監視ジョブ

## 1. 実行サマリ
- RUN_ID=`20251121TlicenseNightlyZ1`, TRACE_RUN_ID=`20251121TlicenseNightlyZ1`（`sysad-license.headers` の `X-Trace-Id` も同一値で二重 prefix を解消）。
- Vault 取得: `PATH=$PWD/tmp/local-bin:$PATH VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root ops/tools/fetch_license_secrets.sh --run-id $RUN_ID --artifact-dir artifacts/parity-manual/license/$RUN_ID/secrets --log-json` を実行し、Legacy (`opendolphin-server`)／Modernized (`opendolphin-server-modernized-dev`) 双方へ `license.properties` と `system_license_post_body.txt` を再配備した。取得メタは `logs/license_fetch_meta.json`。
- API スモーク: helper コンテナ (`opendolphin_webclient-helper-1`) から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id $RUN_ID` を実行。出力一式は `artifacts/parity-manual/license/$RUN_ID/http/` に移動済み。

## 2. HTTP / ヘッダー結果
| Case | Legacy (http://opendolphin-server:8080) | Modernized (http://opendolphin-server-modernized-dev:8080) | 保存先 |
| --- | --- | --- | --- |
| `POST /dolphin/license` | **200, body="0"**, `X-Trace-Id: 20251121TlicenseNightlyZ1` | **200, body="0"**, `X-Trace-Id: 20251121TlicenseNightlyZ1` | `http/{legacy,modernized}/license_post/` |
| `GET /dolphin/license` | 405 (`Allow: POST,OPTIONS`) | 405 | `http/{legacy,modernized}/license_get_dolphin/` |
| `GET /system/license` | 405 | 404（仕様通り未公開） | `http/{legacy,modernized}/license_get_system/` |
- 実行メタ: `http/metadata.json`。サーバーログは `logs/{legacy,modernized}_server.log`（`docker logs --since 10m`）に採取。

## 3. d_audit_event チェック
| スタック | 抽出クエリ | CSV | 件数 |
| --- | --- | --- | --- |
| Legacy | `trace_id LIKE '20251121TlicenseNightlyZ1%'` | `logs/d_audit_event_legacy_20251121TlicenseNightlyZ1.csv` | **0** |
| Modernized | 同上 (`db=opendolphin_modern`) | `logs/d_audit_event_modern_20251121TlicenseNightlyZ1.csv` | **1** |
- Modernized 側の `payload` は JSON (`{"status":"success","actionType":"already_registered",...}`) となり、`payload.status=success` を確認済み。`logs/d_audit_event_summary.txt` に `legacy_count=0 / modern_count=1` を追記。
- Legacy スタックは依然として `SYSTEM_LICENSE_CHECK` を出力しないため、監視ゲートは Modernized 側のみを対象とする。

## 4. 通知・ログ
- Slack / PagerDuty は失敗時のみ送信する方針のため、本 RUN は `notifications/{slack.log,pagerduty.log}` に `status=not_triggered` を記録。
- `logs/license_fetch_meta.json`, `logs/metadata.json`, `logs/{legacy,modernized}_server.log` に Vault 取得メタと WildFly INFO を保存。

## 5. メモ
- `docs/server-modernization/phase2/notes/license-config-check.md §7` と `docs/web-client/process/SWING_PARITY_CHECKLIST.md` に今回の RUN_ID、Modernized 専用ゲート化、`TRACE_RUN_ID` 命名変更、`d_audit_event` CSV 更新を反映済み。
