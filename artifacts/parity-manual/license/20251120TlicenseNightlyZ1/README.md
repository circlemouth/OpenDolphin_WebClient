# RUN_ID=20251120TlicenseNightlyZ1 夜間ライセンス監視ジョブ

## 1. 実行サマリ
- RUN_ID=`20251120TlicenseNightlyZ1`, TRACE_RUN_ID=`license-20251120TlicenseNightlyZ1`（実際の `X-Trace-Id` はテンプレ展開で `license-license-20251120TlicenseNightlyZ1`）。
- Vault 取得: `PATH=$PWD/tmp/fakebin:$PATH VAULT_ADDR=http://dummy-vault.local VAULT_TOKEN=dummy ops/tools/fetch_license_secrets.sh --run-id $RUN_ID --artifact-dir artifacts/parity-manual/license/$RUN_ID/secrets --log-json` を実行し、`license.properties` / `system_license_post_body.txt` を Legacy (`opendolphin-server`)・Modernized (`opendolphin-server-modernized-dev`) へ再配備。取得メタは `logs/license_fetch_meta.json`。
- DB 前提整備: `ops/db/local-baseline/local_synthetic_seed.sql` を Legacy/Modernized Postgres に流して `LOCAL.FACILITY.0001:dolphin` ユーザーと施設を投入。さらに `CREATE SEQUENCE IF NOT EXISTS d_audit_event_seq OWNED BY d_audit_event.id;` → `SELECT setval('d_audit_event_seq', ...)` を両 DB で実行し、欠落していた `d_audit_event_seq` を補完。
- API スモーク: helper コンテナ (`opendolphin_webclient-helper-1`) から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id $RUN_ID` を実行。出力一式は `artifacts/parity-manual/smoke/$RUN_ID/` から `artifacts/parity-manual/license/$RUN_ID/http/` へ同期。

## 2. HTTP / ヘッダー結果
| Case | Legacy (http://opendolphin-server:8080) | Modernized (http://opendolphin-server-modernized-dev:8080) | 保存先 |
| --- | --- | --- | --- |
| `POST /dolphin/license` | **200, body="0"**, `Allow: POST,OPTIONS`, `X-Trace-Id: license-license-20251120TlicenseNightlyZ1` | **200, body="0"**, `X-Trace-Id: license-license-20251120TlicenseNightlyZ1` | `http/{legacy,modernized}/license_post/` |
| `GET /dolphin/license` | 405 (`Allow: POST,OPTIONS`) | 405 | `http/{legacy,modernized}/license_get_dolphin/` |
| `GET /system/license` | 405 | 404（期待通り未公開） | `http/{legacy,modernized}/license_get_system/` |
- 実行メタ: `http/metadata.json`。ログは `logs/{legacy,modernized}_server.log`（`docker logs --since 5m`）に保存。

## 3. d_audit_event チェック
| スタック | 抽出クエリ | CSV | 件数 |
| --- | --- | --- | --- |
| Legacy | `SELECT event_time, action, trace_id, payload FROM d_audit_event WHERE action='SYSTEM_LICENSE_CHECK' AND trace_id LIKE 'license-license-20251120TlicenseNightlyZ1%'` | `logs/d_audit_event_legacy_20251120TlicenseNightlyZ1.csv` | **0** |
| Modernized | 同上 (`db=opendolphin_modern`) | `logs/d_audit_event_modern_20251120TlicenseNightlyZ1.csv` | **0** |
- Modernized 側には `SYSTEM_LICENSE_CHECK` 行が 3 件追加されたが、`trace_id`・`payload` が空/数値のみで RUN_ID と突合できず、ゲート条件（`trace_id` と `payload.status=success`）を満たせない。Legacy 側は `REST_UNAUTHORIZED_GUARD`（401 時の追跡値）のみが残存し、`SYSTEM_LICENSE_CHECK` 自体が未発火。
- 参考: `docker exec opendolphin-postgres-modernized psql -c "SELECT id, action, trace_id, payload FROM d_audit_event ORDER BY id DESC LIMIT 5;"` → `SYSTEM_LICENSE_CHECK / trace_id='' / payload=17598` を確認。

## 4. 通知・ログ
a. `logs/d_audit_event_summary.txt` : `legacy_count=0`, `modern_count=0` を記録しゲート失敗扱い。

b. 通知テンプレ:
- Slack: `notifications/slack_test.log`（policy により HTTP 送信はドライラン。ペイロードと `curl` コマンドを記録）。
- PagerDuty: `notifications/pagerduty_test.log`（同上）。

c. 追加ログ: `logs/license_fetch_meta.json`, `logs/metadata.json`, `logs/{legacy,modernized}_server.log` に今回の RUN_ID / uid / WildFly INFO を保存。

## 5. 既知課題 / 次アクション
1. **Modernized d_audit_event が RUN_ID を保持しない**: `SystemResource` (modernized) は `SYSTEM_LICENSE_CHECK` 追加時に `trace_id`・`payload.status` を未設定のままコミットしており、監視ゲート条件を満たせない。`server-modernized` 側で `AuditModel` へ `traceId` / `payload(status, uid)` を連携する修正が必要。
2. **Legacy 側 d_audit_event に SYSTEM_LICENSE_CHECK が出力されない**: WildFly10 実装ではライセンス POST 完了後も監査レコードが記録されない。Legacy `SystemResource` で `SYSTEM_LICENSE_CHECK` を明示的に送るか、監視基準を Modernized のみへ変更する判断が必要。
3. **Trace ID 命名二重付加**: `TRACE_RUN_ID=license-$RUN_ID` + `X-Trace-Id: license-{{RUN_ID}}` により `license-license-*` 形式になっている。`TRACE_RUN_ID=$RUN_ID` とするか、ヘッダーテンプレートから `license-` を外して今後の RUN_ID と照合しやすくする。
4. **通知は Dry-run**: 外部送信禁止ポリシーのため Slack/PagerDuty はコマンドのみ記録。実配備時は CI から実際の Webhook/Events API を叩けるよう credentials を登録する。
