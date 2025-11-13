# RUN_ID=20251119TlicenseMonitorZ2 ライセンス監視スモーク

## 1. 実行条件
- コマンド: `TRACE_RUN_ID=20251119TlicenseMonitorZ2 BASE_URL_LEGACY=http://localhost:8080/openDolphin/resources BASE_URL_MODERN=http://localhost:9080/openDolphin/resources ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseMonitorZ2`
- `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers`（`X-Trace-Id: license-20251119TlicenseMonitorZ2`）。
- `PARITY_BODY_FILE=tmp/license/system_license_post_body.txt` (`license.uid_seed-20251119TlicenseVaultAutoZ2` を投入)。
- 生成物: `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/{post,get,get-system}/` に headers/meta/response を保存。`metadata.json` は `profile=modernized-dev` かつ `generated_at=2025-11-13T05:11:27Z`。

## 2. HTTP ステータス概要
| Case | Legacy (`opendolphin-server`) | Modernized (`opendolphin-server-modernized-dev`) | 保存先 |
| --- | --- | --- | --- |
| `POST /dolphin/license` | **200 OK**, body=`0`, `X-Trace-Id: license-20251119TlicenseMonitorZ2`（処理成功） | **500 Internal Server Error**, body=`Internal Server Error` | `post/license_post/{legacy,modernized}/` |
| `GET /dolphin/license` | **405 Method Not Allowed**, `Allow: POST, OPTIONS` | **500 Internal Server Error** | `get/license_get_dolphin/{legacy,modernized}/` |
| `GET /system/license` | **405 Method Not Allowed**, `Allow: POST, OPTIONS` | **500 Internal Server Error** | `get-system/license_get_system/{legacy,modernized}/` |

Modernized 側は 3 ケースすべてが 500 で HTML エラーページを返却したため、WildFly ログ（`logs/opendolphin-server-modernized-dev.log` など）で root cause の切り分けが必要。Legacy 側は従来どおり POST=200/GET=405 を維持しており、`X-Trace-Id` もレスポンスヘッダーに反映された。

## 3. 付記
- `artifacts/parity-manual/smoke/20251119TlicenseMonitorZ2/` には元の `legacy/modernized` 階層があるため、追加解析時は同ディレクトリを参照可。
- `tmp/license/` 配下の実ファイルはテスト完了後に削除予定。`artifacts/parity-manual/license/20251119TlicenseVaultAutoZ2/` にサニタイズ済みテンプレートを残している。

## 4. 追加調査メモ
- Modernized 500 の事前条件と Vault 配備状況は `docs/server-modernization/phase2/PHASE2_PROGRESS.md` および `docs/server-modernization/phase2/operations/SECURITY_SECRET_HANDLING.md`（§2.4–2.8）を参照。
- 本 RUN の証跡ディレクトリ配下 (`artifacts/parity-manual/license/20251119TlicenseMonitorZ2/`) には `logs/opendolphin-server-modernized-dev.log` が含まれていない。スタックトレース解析には `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z"` などで再取得し、本 README へパスを追記する必要がある。

### 4.1 追加で必要なログと理由
- `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z"`：500 応答が即時発生（0.01〜0.03s）しているため、`LogFilter`/`UserServiceBean` で投げられた `EJBException` や WAR デプロイ失敗ログを取得しないと root cause を特定できない。スタックトレースを `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/logs/` に保存する必要があるが、コンテナ操作はマネージャー許可待ち。
- （任意）`docker exec opendolphin-server-modernized-dev cat /opt/jboss/wildfly/standalone/log/server.log`：WildFly の `deployment-info` や `WFLYSRV0059` を確認し、SystemResource alias の再デプロイ有無を裏付ける。上記と同じ理由で現状は取得できていない。

### 4.2 2025-11-13 14:12 JST ログ採取結果
- `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z" | tee logs/modernized_server.log` を実行し、全文を `logs/modernized_server.log` に保存済み。
- `rg -n 'license-20251119TlicenseMonitorZ2' logs/modernized_server.log` 結果:
  - `312`: `WARN open.dolphin Unauthorized user ... /dolphin/license traceId=license-20251119TlicenseMonitorZ2`
  - `437`: 同 WARN（2 度目、POST/GET を順次処理）
  - `562`: `/system/license` 実行時の WARN
- いずれのリクエストでも直前に `SQLState: 42P01`（relation `d_users` や `d_audit_event` 不在）→ `org.hibernate.exception.SQLGrammarException` → Undertow `UT005023` のスタックトレースが出力されている（例: `logs/modernized_server.log:305-333`, `430-466`, `545-583`）。PostgreSQL にライセンス用テーブルが存在しない状態で JPA クエリが実行され、`LogFilter`/`AuditTrailService` が 500 を返していることが判明。
- WildFly CLI で `deployment-info --name=opendolphin-server.war` を取得し、`logs/deployment_info.txt` に `STATUS=OK` を保存。WAR 自体は有効化済みで、アプリ層ではなく DB ベースライン欠落が主因と判断できる。

### 4.3 2025-11-13 17:38 JST 再検証（RUN_ID=`20251119TlicenseMonitorZ2Rerun`）
- Modernized DB を `RUN_ID=20251119TbaselineFixZ1` で再構築（`pg_dump --schema-only` → `local_synthetic_seed.sql` → Flyway `0-0227`）後、`TRACE_RUN_ID=20251119TlicenseMonitorZ2Rerun BASE_URL_{LEGACY,MODERN}=http://localhost:{8080,9080}/openDolphin/resources ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseMonitorZ2Rerun` を実行。
- 追加成果物は `post/get/get-system` それぞれに `rerun-20251119TlicenseMonitorZ2Rerun/` サブディレクトリを作成し、`artifacts/parity-manual/smoke/20251119TlicenseMonitorZ2Rerun/{legacy,modernized}/` から headers/meta/response をコピーした（例: `post/rerun-20251119TlicenseMonitorZ2Rerun/license_post/{legacy,modernized}/`）。`logs/modernized_server_rerun.log` と `logs/deployment_info/20251119TlicenseMonitorZ2Rerun.txt` で WildFly ログと CLI 証跡を追記。
- HTTP 結果:
  | Case | Legacy | Modernized | 保存先 |
  | --- | --- | --- | --- |
  | `POST /dolphin/license` | 200 OK / body=`0` | 200 OK / body=`0` | `post/rerun-20251119TlicenseMonitorZ2Rerun/license_post/{legacy,modernized}/` |
  | `GET /dolphin/license` | 405 Method Not Allowed | 405 Method Not Allowed | `get/rerun-20251119TlicenseMonitorZ2Rerun/license_get_dolphin/{legacy,modernized}/` |
  | `GET /system/license` | 405 Method Not Allowed | 405 Method Not Allowed | `get-system/rerun-20251119TlicenseMonitorZ2Rerun/license_get_system/{legacy,modernized}/` |
- `logs/modernized_server_rerun.log` では `d_audit_event` 系の 42P01 が消失し、`Audit envelope ... outcome=FAILURE`（仕様上 GET=405 のため）以外の WARN/ERROR は発生していない。`logs/deployment_info/20251119TlicenseMonitorZ2Rerun.txt` でも `STATUS=OK` を確認済み。
- これにより Modernized 側の HTTP 500 再発は収束し、ライセンス API の本番相当フロー（POST=200, GET=405）を取り戻した。Swing 側 `/system/license` 互換性は従来どおり Undertow rewrite なしで維持できるため、`PHASE2_PROGRESS.md` / `SWING_PARITY_CHECKLIST.md` を STABLE へ更新する。
