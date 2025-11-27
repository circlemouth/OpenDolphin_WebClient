# フェーズ2 進捗メモ (更新: 2026-06-15)

> **運用方針 (2025-11-13 改訂)**
> - Legacy サーバー/クライアントは電子カルテ要件を確認するための「参照アーカイブ」であり、今後の運用予定はない。
> - モダナイズ版サーバーは新 Web クライアントとの連携を唯一の必須条件とし、旧クライアント連携や Legacy 側 200 応答は Gate から除外する。
> - Runbook／チェックリストの Gate は Modernized 側が満たしていれば完了扱いとし、Legacy 手順は Appendix (参考) に移行する。

## 2025-11-13 追記: Vault 自動化スクリプト dry-run（担当: Codex）
- **RUN_ID=`20251119TlicenseVaultAutoZ1`**: Vault へ接続できないローカル環境だったため `tmp/fakebin/vault` を作成し、`license.key` / `license.secret` / `license.uid_seed` を含む JSON を返すスタブで `vault kv get -format=json kv/modernized-server/license/dev` を模擬。`PATH="$PWD/tmp/fakebin:$PATH" ./ops/tools/fetch_license_secrets.sh --dry-run --vault-path kv/modernized-server/license/dev --run-id 20251119TlicenseVaultAutoZ1 --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1` を実行して `license.properties` / `system_license_post_body.txt`（`UIDSEEDMOCK-20251119TlicenseVaultAutoZ1`）と `license_fetch_meta.json` を生成した。
- **成果物**: 生成ファイルを `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/dry-run/` へ移し、ディレクトリ直下には従来のサニタイズ済みテンプレと meta JSON を残した。README に dry-run 手順を記載し、`docs/server-modernization/phase2/operations/SECURITY_SECRET_HANDLING.md` の 2.4.1 に本 dry-run を登録済み。
- **TODO**: Dev Vault へ接続可能な端末で同 RUN_ID か後続 RUN_ID を用い、実値での `docker cp` / `ops/tools/send_parallel_request.sh POST /dolphin/license` を完遂して `docs/web-client/planning/phase2/DOC_STATUS.md`「License secrets plan documented」を STABLE に更新する。

## 2025-11-13 追記: Legacy/Modernized Postgres ベースライン再構築（担当: Codex）
- **RUN_ID=`20251119TbaselineFixZ1`**: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` に従い、`docker exec opendolphin-postgres(-modernized)` で `DROP SCHEMA opendolphin/public CASCADE` を実施後、Legacy DB から取得した `pg_dump --schema-only --no-owner --no-privileges` を両 DB に適用して Hibernate DDL を代替。`ops/db/local-baseline/local_synthetic_seed.sql` を再投入し、`docker exec ... psql -c '\dt'` / 主要テーブル件数ログを `artifacts/parity-manual/db-restore/20251119TbaselineFixZ1/` に収集した。
- **[2025-11-13 08:36Z 追記]**: 上記ディレクトリに `flyway_baseline|migrate|info_{legacy,modern}.log`、`psql_modern_d_users_count.log` などを追加し、Modernized 側でも `flyway info → Schema version: 0227`・`d_users=2`・`d_audit_event=0` を確認済み。以後 Modernized DB を再初期化する際は `RUN_ID=20251119TbaselineFixZ1` 手順（schema import → シード → Flyway）を Gate 条件として扱う。
- **Log / validation**: `flyway/flyway:10.17` コンテナで `baseline → migrate → info` を Legacy/Modernized の順に実行し、`flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222,0223,0224,0225,0226,0227` を記録。`d_facility=2 / d_users=2 / d_patient=2 / d_appo=1` を双方で確認し、`curl -H \"userName: LOCAL.FACILITY.0001:dolphin\" ... /serverinfo/jamri` の 200 応答ヘッダーを保存済み。
- **Blockers / follow-ups**: (1) ホストに `psql` が無く最初の `psql -f` が失敗したため、Runbook 備考へ `docker exec ... psql` fallback を明記すること。(2) `ops/db/local-baseline/local_synthetic_seed.sql` の WEB1001 患者挿入で `patientId='1.3.6.1.4.1.9414.72.103:WEB1001'` を使うと同ファイル内の `patientId='WEB1001'` 参照が NULL になり `d_karte` で NOT NULL 例外が発生するため、今回 `patientId='WEB1001'` へ修正済み。Runbook / DOC_STATUS にも当該修正と `pg_dump --schema-only` フォールバックの追加が必要。
- **Runbook更新済み (RUN_ID=20251119TbaselineFixZ1)**: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` の節3/4/6へ `pg_dump --schema-only` フォールバック＋`docker exec ... psql` 実行例、`flyway_baseline|migrate|info` の証跡要件を追記し、Modernized 専用 Gate を明文化した。

## 2025-11-13 追記: DB Runbook Gate 実証（担当: Codex）
- **RUN_ID=`20251120TbaselineGateZ1`**: Legacy DB を `DROP SCHEMA public CASCADE` 後に `artifacts/parity-manual/db-restore/20251119TbaselineFixZ1/legacy_schema_dump.sql` を再適用し、新たに `pg_dump --schema-only --no-owner --no-privileges` を取得。生成した `legacy_schema_dump.sql` を Modernized 側へ `docker exec -i opendolphin-postgres-modernized psql -v ON_ERROR_STOP=1` で流し込み、`\dt d_*` / `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` を採取した。
- **Seed / Flyway**: `ops/db/local-baseline/local_synthetic_seed.sql` を Modernized に投入し、`SELECT count(*) FROM d_users;` が 3 件となるよう `LOCAL.FACILITY.0001:nurse` を追加。続けて `flyway/flyway:10.17` で `baseline → migrate → info`（network=`container:opendolphin-postgres-modernized`）を実行し、`flyway_schema_history` を v0227 まで `Success` に更新。
- **証跡**: `legacy_schema_dump.sql` / `legacy_schema_apply.log` / `modern_schema_apply.log` / `modern_seed.log` / `flyway_{baseline,migrate}.log` / `flyway_info.log` / `psql_modern_{dt,d_users_count,public_table_count}.log` を [`artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/`](../../../artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/) に保存。
- **Docs**: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` 6.2 節へ本 RUN_ID の「Gate 実証済み」リンクを追加し、`pg_dump → docker exec psql → seed → Flyway` フローで Gate #0〜#4 を満たしたことを明記。
- **Gate 再起動注意**: Postgres を停止する際は `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml down db db-modernized` の出力を `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/down.log` に保存し、再起動後は (1) `MODERNIZED_POSTGRES_PORT=55433` を強制して 55432/5432 の競合を避ける、(2) `local_synthetic_seed.sql` で `LOCAL.FACILITY.0001:nurse` を再挿入して `d_users=3` を確認する、(3) `flyway/flyway:10.17 baseline` 実行前に Legacy/Modernized 双方で `DROP TABLE IF EXISTS flyway_schema_history;` を流す──の 3 点を Gate checklist に加えた。
- **RUN_ID=`20251122TbaselineGateZ2`**: `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml down db db-modernized` の停止ログを既存 `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/down.log` と突合したうえで、`MODERNIZED_POSTGRES_PORT=55433 docker compose ... up -d db db-modernized` を `artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/up.log` に保存。Legacy/Modernized 両 DB へ `ops/db/local-baseline/local_synthetic_seed.sql` を再適用し（Legacy には欠落していた `LOCAL.FACILITY.0001:nurse` を追加挿入）、`DROP TABLE IF EXISTS flyway_schema_history;` → `flyway/flyway:10.17 baseline` → `migrate` → `info` を `flyway_*_{legacy,modern}.log` で採取した。
- **証跡 (Gate #0〜#4 更新)**: `psql_{legacy,modern}_{dt,d_users_count,public_table_count}.log`、Legacy 追加シードログ（`legacy_seed_nurse*.log`）、および `up.log` を [`artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/`](../../../artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/) に格納。Legacy `d_users=3`・Modernized `d_users=4` を記録し、Gate 表の port 再割当／seed／Flyway 注意書きを §6（POSTGRES_BASELINE_RESTORE.md）と本メモの両方で更新済み。

## 2025-11-12 追記: API パリティ自動チェック再実行（担当: Codex）
- **RUN_ID=`20251116TapiparityZ2`**: `ops/tests/api-smoke-test/run.sh --scenario base_readonly --dual` を再実行し、`artifacts/parity-manual/smoke/20251116TapiparityZ2/{legacy,modernized}/` へ保存。3 ケースすべて 200 となり、Legacy は `Server`/`X-Powered-By` を露出、Modernized は `Referrer-Policy`/`CSP`/`HSTS`/`X-Content-Type-Options` のみという差分を確認（`.../base_readonly_dolphin/headers.txt` 参照）。
- **Touch parity checker**: `scripts/api_parity_targets.touch.json` を `/jtouch/*` へ更新し `PARITY_OUTPUT_DIR=tmp/parity-touch/20251116TapiparityZ2 ops/tools/send_parallel_request.sh --profile compose --config ...` を実行。`touch_sendPackage_javaTime` は Modernized=200 / Legacy=500 (`issuedAt` 未対応)、`touch_document_admFlag` / `touch_mkdocument_performFlag` は双方 500（`admFlag`/`performFlag` 未実装）。`tmp/parity-touch/20251116TapiparityZ2/diff.txt` は 3 ケースすべて `Status mismatch (expected 200, ...)`。
- **Root cause**: Legacy `JsonTouchResource`（Jackson 1.x）が `ISendPackage` の追加フィールドを認識できず `org.codehaus.jackson.map.exc.UnrecognizedPropertyException: issuedAt` を投げる。`IDocInfo` / `IMKDocument` も `admFlag` / `performFlag` を保持しておらず、Modernized 側でも JSON → DTO 変換で `Unrecognized field` が発生。ログは `artifacts/parity-manual/smoke/20251116TapiparityZ2/logs/{legacy,modern}_server.log` に保存。
- **TODO**: (1) `IDocInfo` 系 DTO に新フィールドを追加し、Jackson 1.x/2.x の `FAIL_ON_UNKNOWN_PROPERTIES` を false に設定、(2) Legacy/Modernized 双方で `ISendPackage` に JavaTime パッチを取り込む（`issuedAt` フィールド）、(3) 上記反映後に `python3 scripts/api_parity_response_check.py` を再実行して JSON 比較を完了させ、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ9をクローズ。

## 2025-11-12 追記: ライセンス REST 検証（担当: Codex）
- **RUN_ID=`20251118TlicenseCheckZ1`**: `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-actuator.headers TRACE_RUN_ID=20251118TlicenseCheckZ1 ops/tools/send_parallel_request.sh --profile compose GET /system/license "license/20251118TlicenseCheckZ1"` を実行。`sysad-license.headers` が未整備だったため actuator ヘッダーを流用し、HTTP/headers/meta は `artifacts/parity-manual/license/20251118TlicenseCheckZ1/{legacy,modern}/`、`docker logs opendolphin-server{,-modernized-dev}` は `.../logs/` に保存した。
- **結果**: Legacy は `HTTP/1.1 401 Unauthorized`（`reason=authentication_failed`, `principal=1.3.6.1.4.1.9414.10.1:dolphin`）。Modernized は `curl: (56) Recv failure: Connection reset by peer` でレスポンス取得ならず。前者は `LogFilter` がヘッダー認証に失敗して REST 本体まで到達しないこと、後者は `PHASE2_PROGRESS.md`「ネットワーク復旧ブロッカー」で既知の `localhost:9080` port-forward 問題に合致することを確認した。
- **ドキュメント**: `docs/server-modernization/phase2/notes/license-config-check.md` を新設し、(1) 証跡パス、(2) `JBOSS_HOME/license.properties` のみを探索する Legacy/Modernized 共通ロジック、(3) 両コンテナに `license.properties` が未配置である現状、(4) Modern 側 200 応答を再取得するための helper 経路を記録。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ7 ライセンス項目を [x] へ更新済み。
- **RUN_ID=`20251118TlicenseCheckZ2`**: helper コンテナ（`docker run --rm --network legacy-vs-modern_default ... mcr.microsoft.com/devcontainers/base:jammy`）から `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers TRACE_RUN_ID=20251118TlicenseCheckZ2 ops/tools/send_parallel_request.sh --profile modernized-dev GET /system/license license/20251118TlicenseCheckZ2` を実行し、両サーバーの HTTP/headers/meta と `docker logs opendolphin-server{,-modernized-dev}` を `artifacts/parity-manual/license/20251118TlicenseCheckZ2/{legacy,modern,logs}/` へ保存した。`sysad-license.headers` は `LOCAL.FACILITY.0001:dolphin` の Basic 認証＋`facilityId: LOCAL.FACILITY.0001` をテンプレ化し、`X-Trace-Id: license-{{RUN_ID}}` で trace を固定できるようにした。
- **結果**: Modernized/Legacy いずれも `HTTP/1.1 404 Not Found`（本文空）で統一。`LogFilter` は helper からの認証を通過しており、`172.19.0.8 ... GET /system/license traceId=license-20251118TlicenseCheckZ2` が双方の WildFly ログに残った。一方、JAX-RS 側には `/resources/system` に対応するエンドポイントが存在せず、`SystemResource` の `@Path("/dolphin")` 配下（`/dolphin/license`, POST 専用）しか公開されていないため GET `/system/license` は routable になっていない。Modernized 9050 port-forward 問題は解消済みであるため、次は (a) `/system` エイリアスを追加するか (b) parity チェック対象を `/dolphin/license`（POST, TEXT 応答）へ切り替える必要がある。

## 2025-11-13 追記: `/system/license` エイリアス vs Undertow rewrite 検討（担当: Codex）
- `docs/server-modernization/phase2/notes/license-config-check.md` §4.3–4.5 に SystemResource エイリアス案と Undertow rewrite 案を比較表で整理。`@Path("/{scope : dolphin|system}")` でアプリ層にエイリアスを持たせる案を採用し、検証手順と rewrite フィルタの CLI 参考例を記録した（選択案は Java 実装、rewrite は一時しのぎ用）。
- 選択根拠: REST 実装に閉じた alias であれば 404→405/401 の遷移も含めて監査ログを一元化でき、将来 `/system/*` を別用途で使う際に Undertow 側のフィルタ設定を再調整する必要がなくなる。rewrite はネットワーク障害時にだけ有効化し、恒久対応は SystemResource パッチに一本化する。
- フォローアップ: (1) Legacy/Modernized 双方で `SystemResource` の `@Path` を regex 化し、`send_parallel_request` シナリオに `POST /system/license` を追加、(2) alias 実装が完了するまで `/system/license` 404 を監視する `ops/tests/api-smoke-test/run.sh` の nightly を残す、(3) 実装完了後に `docs/web-client/planning/phase2/DOC_STATUS.md` のライセンス行を Dormant へ切り替えるタイミングを判断。
- **RUN_ID=`20251118TlicenseDeployZ1`**: `tmp/license/license.properties` を作成 (`license.key=test-key`, `license.secret=test-secret`) → `docker cp ... opendolphin-server{,-modernized-dev}:/opt/jboss/wildfly/license.properties` → `docker exec -u 0 ... chown jboss:jboss && ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` をホットデプロイ。helper コンテナから  
  `PARITY_OUTPUT_DIR=artifacts/parity-manual/license/20251118TlicenseDeployZ1/post TRACE_RUN_ID=20251118TlicenseDeployZ1 ops/tools/send_parallel_request.sh --profile modernized-dev --config ops/tests/api-smoke-test/configs/system_license_post.config --run-id 20251118TlicenseDeployZ1`  
  を実行し、`POST /dolphin/license` が Legacy/Modernized ともに `HTTP 200`（本文 `0`）となることを確認した。`ops/tests/api-smoke-test/configs/system_license_post.config`（ヘッダー＝`ops/tests/api-smoke-test/headers/sysad-license.headers`、本文＝`tmp/license/system_license_post_body.txt`）を追加し、再実行時に RUN_ID だけ差し替えればよい形に整理。
- **結果**: `artifacts/parity-manual/license/20251118TlicenseDeployZ1/post/license_post/{legacy,modern}/` にレスポンス・ヘッダー・meta を保存。GET 系は `artifacts/parity-manual/license/20251118TlicenseDeployZ1/get/`（`GET /dolphin/license` → 405、`Allow: POST, OPTIONS`）と `.../get-system/`（`GET /system/license` → 404）に分離し、`logs/opendolphin-server{,-modernized-dev}.log` で `SYSTEM_LICENSE_CHECK status=success` を採取済み。
- **CI シナリオ実行済み（RUN_ID=`20251119TlicenseScenarioZ1`）**: helper コンテナ（`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace mcr.microsoft.com/devcontainers/base:jammy`）から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseScenarioZ1` を実行。成果物は `artifacts/parity-manual/license/20251119TlicenseScenarioZ1/{post,get,get-system}/` 配下に Legacy/Modern の HTTP/headers/meta を分離して保存し、`diff -u` で `20251118TlicenseDeployZ1` の `response.json` と一致することを確認した（差異は `X-Trace-Id` / `Date` / `time_total` のみ）。
- **TODO**: `/system/license` を利用する Swing クライアントへの影響を整理し、(1) Undertow rewrite で `/system` を `/dolphin` へフォールバックさせる、または (2) クライアントの REST ベース URL を `/dolphin` に統一する方針を立案する。決定後は `docs/server-modernization/phase2/notes/license-config-check.md` / `SWING_PARITY_CHECKLIST.md` の該当節を更新する。
- **備考**: `docs/server-modernization/phase2/notes/license-config-check.md` の TODO (1)(2) を DONE 化し、`docs/web-client/planning/phase2/DOC_STATUS.md` に同ノートを Active として追記済み。
- **RUN_ID=`20251119TlicenseVaultAutoZ2`（2025-11-13）**: Dev Vault コンテナ `opd-vault`（`hashicorp/vault:1.15.5`, `VAULT_DEV_ROOT_TOKEN_ID=root`）を再起動し、`tmp/local-bin/vault` ラッパー経由で `vault kv put kv/modernized-server/license/dev`（version=2, `rotated_at=2025-11-13T05:08:33Z`）を登録。`PATH="$PWD/tmp/local-bin:$PATH" VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root ops/tools/fetch_license_secrets.sh --run-id 20251119TlicenseVaultAutoZ2 --vault-path kv/modernized-server/license/dev --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ2 --log-json` を実行し、Legacy/Modernized 双方へ `docker cp tmp/license/license.properties ...` → `ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` を再適用。Artifacts にはサニタイズ済みテンプレ (`license.properties.sanitized`, `system_license_post_body.sanitized.txt`, `license_fetch_meta.sanitized.json`) のみを保存し、実シークレットは `tmp/license/` 内で運用後に削除予定。
- **RUN_ID=`20251119TlicenseMonitorZ2`（2025-11-13）**: 上記シークレットを適用後、`TRACE_RUN_ID=20251119TlicenseMonitorZ2 BASE_URL_LEGACY=http://localhost:8080/openDolphin/resources BASE_URL_MODERN=http://localhost:9080/openDolphin/resources ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseMonitorZ2` をホストから実行。Legacy=POST 200 (`body=0`), GET/GET-system 405 (`Allow: POST, OPTIONS`, `X-Trace-Id: license-20251119TlicenseMonitorZ2`) を再取得できた一方、Modernized は 3 ケースすべて `HTTP 500 Internal Server Error`（HTML body）のまま。HTTP/headers/meta/response は `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/{post,get,get-system}/` に保存し、500 の根本原因を `logs/opendolphin-server-modernized-dev.log` で調査するタスクを継続。
- **[2025-11-13 14:12 JST 更新]**: `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z"` を採取し `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/logs/modernized_server.log` に保存。`rg -n 'license-20251119TlicenseMonitorZ2'` で抽出した行（312/437/562）では `WARN open.dolphin Unauthorized user ...` の直後に `SQLState: 42P01`（`d_users`, `d_audit_event` 不在）→ `org.hibernate.exception.SQLGrammarException` → Undertow `UT005023` のスタックトレースが連鎖しており、Modernized DB のライセンス関連テーブル欠落が一次原因と判明。併せて `docker exec ... jboss-cli.sh --commands="deployment-info --name=opendolphin-server.war"` を `logs/deployment_info.txt` に保存し、WAR デプロイは `STATUS=OK` と確認。
- **[2025-11-13 17:40 JST 更新 / RUN_ID=`20251119TlicenseMonitorZ2Rerun`]**: `RUN_ID=20251119TbaselineFixZ1` で Modernized DB を再構築した直後にライセンスシナリオを再実行。結果は Legacy/Modernized ともに `POST /dolphin/license=200 body=0`、`GET /dolphin/license=405`、`GET /system/license=405` となり、500 が解消された。新しい HTTP/headers/meta/response は `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/{post,get,get-system}/rerun-20251119TlicenseMonitorZ2Rerun/` に保存し、`logs/modernized_server_rerun.log` と `logs/deployment_info/20251119TlicenseMonitorZ2Rerun.txt` を追加。`docs/server-modernization/phase2/notes/license-config-check.md §4.6` および `SWING_PARITY_CHECKLIST.md` のライセンス行を STABLE（DB baseline 復旧済み）へ更新する。

- **RUN_ID=`20251119TlicenseAliasZ1`（2025-11-13）**: Legacy/Modernized 両方の `SystemResource` を `@Path("/{scope : dolphin|system}")` ベースへ更新し、`mvn -f pom.server-classic.xml -pl server -am -Plegacy-wildfly10 -DskipTests -Dmaven.test.skip=true clean package` / `mvn -f pom.server-modernized.xml -pl server-modernized -am -DskipTests -Dmaven.test.skip=true clean package` で WAR を再生成。`docker cp server/target/opendolphin-server-2.7.1.war opendolphin-server:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war`＋`touch .../.dodeploy`、`docker cp server-modernized/target/opendolphin-server.war opendolphin-server-modernized-dev:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war`＋`touch .../.dodeploy` でホットデプロイ後、helper コンテナ（`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy`）から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseAliasZ1` を実行した。
- **結果**: `POST /dolphin/license` は Legacy/Modernized とも `HTTP 200 body=0`、`GET /dolphin/license`／`GET /system/license` はいずれも `405 Method Not Allowed` へ変化し、`X-Trace-Id=license-20251119TlicenseAliasZ1-*` が `/system` 実行時にも `SystemResource` 監査へ残ることを確認。HTTP/headers/meta は `artifacts/parity-manual/license/20251119TlicenseAliasZ1/{post,get,get-system}/{legacy,modernized}/` に整理し、作業後に `tmp/license/system_license_post_body.txt` を削除。`docs/server-modernization/phase2/notes/license-config-check.md §4.4` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`、`DOC_STATUS.md` を同 RUN_ID で更新し、Phase7 ライセンス行を完了扱いへ移行した。
- **RUN_ID=`20251119TlicenseLegacyFixZ1`（2025-11-13）**: Legacy 側で sporadic に 404 が残っている報告を受け、`docker exec opendolphin-server ls /opt/jboss/wildfly/standalone/deployments` で WAR 展開状態を確認しつつ、直接 `curl -isS -H'userName:9001:doctor1' -H'password:doctor2025' http://localhost:8080/openDolphin/resources/dolphin/license` を叩いて 405 応答を再現。`tmp/license/system_license_post_body.txt` を再生成したうえで `ops/tests/api-smoke-test/run.sh --scenario license --profile compose --run-id 20251119TlicenseLegacyFixZ1` をローカル Compose スタックに対して実行した。
- **結果**: Legacy/Modernized とも `POST /dolphin/license = 200 body="0"`、`GET /dolphin/license = 405`、`GET /system/license = 405` で安定。Legacy でも 404 への逆戻りは発生せず、`artifacts/parity-manual/license/20251119TlicenseLegacyFixZ1/{post,get,get-system}/{legacy,modernized}/` に HTTP/headers/meta を保存。`tmp/license/*` は Run 完了後に削除した。

> **注記（WebORCA サポート問い合わせ）**: リポジトリ付属の WebORCA はローカル検証用コンテナのため、405/404 の恒久対応を急がないフェーズではサポート窓口への問い合わせを後回しにして構わない。送付タイミングはマネージャー判断とし、問い合わせを保留した場合は `PHASE2_PROGRESS.md` / `docs/server-modernization/phase2/operations/logs/` に「試験用につき未照会」と理由を残す。API 仕様や引数確認が必要な場合は `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md`（firecrawl 取得済みオフラインコピー）を参照し、対象 API の `SpecSlug` を Evidence に含める。

## 2025-11-13 追記: Touch parity dryRun PASS（担当: Codex）
- **RUN_ID=`20251117TtouchParityZ3`**: Legacy/Modernized/ADM10 の `JsonTouchResource` に `?dryRun=true` を追加し、`/jtouch/document` / `/jtouch/mkdocument` が DTO 変換のみで完結するモードを実装。`scripts/api_parity_targets.touch.json` へ `query.dryRun=true` を追加したうえで `PARITY_OUTPUT_DIR=tmp/parity-touch/20251117TtouchParityZ3 TRACE_RUN_ID=20251117TtouchParityZ3 ops/tools/send_parallel_request.sh --profile compose --config ...` を実行し、`tmp/parity-touch/20251117TtouchParityZ3/` に HTTP キャプチャを保存。続けて `LEGACY_API_BASE=... MODERN_API_BASE=... python3 scripts/api_parity_response_check.py --config tmp/parity-touch/20251117TtouchParityZ3/api_targets.resolved.json > tmp/parity-touch/20251117TtouchParityZ3/diff.txt` を実行したところ `[PASS]` ×3（JSON 完全一致）となり、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ9（API parity）の残タスクをクローズ。dto には `@JsonIgnoreProperties`/`@JsonProperty` を追加済みで、`server-modernized/src/test/java/open/dolphin/touch/JsonTouchResourceParityTest` へ dryRun ユニットテストを追加して CI カバレッジも補完した。

## 2025-11-13 追記: ORCA API enable inquiry prepared（担当: Codex）
- `questions/RECEIPT_ROUTE_REQUEST.md` を新設し、`RUN_ID=20251113TorcaConfigW40` の config dump（`artifacts/orca-connectivity/20251113T022010Z/config_dumps/`）から `env_API_ROUTE_HYBRID.txt`／`online.env`／`jma-receipt.env`／`route_yml(yaml)_search.txt` を抜粋、`POST /api01rv2/*` が 404/405 のままである証跡パス（`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`、`artifacts/orca-connectivity/20251113T011831Z/P0_retry/` 等）と質問事項をテンプレ化した。  
- Runbook `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.5 に「質問テンプレ（API/ROUTE/HYBRID 未定義・route\*.yml 不在時）」節を追加し、サポート向け提出物（必要ファイル一覧、設定差分ブロック、ログ参照先、質問例、送信後の記録先）を一本化。今後は同節のチェックリストを満たしてからサポート窓口（`weborca-support@orcamo.jp`）へ送付する。
- ✅ ORCA 404/405 実運用テンプレ準備済み（`docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` §7）。`artifacts/orca-connectivity/template-next-run/` に空ディレクトリ構造と README（RUN_ID 置換手順付き）を設置し、`handbook-dryrun/README.md` を参照する本番チェックリストを追加。次回 404/405 発生時は同チェックリストと [Slack テンプレ（§5）](docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md#5-%E5%A0%B1%E5%91%8A%E3%83%86%E3%83%B3%E3%83%97%E3%83%ACslack--%E3%83%A1%E3%83%A2) を RUN_ID に差し替えて適用待ち。
- **RUN_ID=`20251121TorcaHttpLogZ1`（2025-11-13 21:55 JST）**: Handbook §7 を本番適用。`http_live_20251113T123218Z.log` で `System Error:405` と `/api01rv2/patientgetv2` 呼び出しを取得し、`http_live_20251113T124324Z.log` には Go Echo `web.ErrorHandler` の panic stacktrace を記録。`docker_orca_since_20251113T123218Z.log` でも Basic 認証付き `patientgetv2` が 401 のまま `Auth Error` になっていることを確認し、`httpdump/api01rv2_patientgetv2{,_basic}` に 401 応答を保存。`api11/unknown` の 404 も取得できたため route 未定義時の再現証跡を更新。次手順は `receipt_route.ini`／`API_ENABLE` で `patientgetv2` GET+Basic を許可し、Go 側 `ErrorHandler` panic が収束するか確認する。
- **RUN_ID=`20251122TorcaHttpLogZ1`（2025-11-13 22:20 JST）**: `ORCAcertification/` の ORCAMO ID/API キーへ合わせた `curl --cert-type P12` を `https://weborca.cloud.orcamo.jp/api/api01rv2/patientgetv2?class=00` へ送信したところ、1 回目は Basic 不一致で 401、再送は 404（`{"Code":404,"Message":"Not Found"}`）。`artifacts/orca-connectivity/20251122TorcaHttpLogZ1/httpdump/api01rv2_patientgetv2{,_basic}/` に 401/404 の httpdump、`logs/http_live_20251113T131848Z.log`／`http_404405_extract_20251113T131848Z.log` に curl -v 出力を保存。`allow` に POST が含まれていないため WebORCA 側ルーティングが閉じていると判断し、`ORCA_HTTP_404405_HANDBOOK.md` に 401→404 切り替え時の再現条件を追記。Basic 情報は環境変数のみで取り扱い、`online.env` / `jma-receipt.env` に平文を残さない方針を明記した。
- ✅ RUN_ID=`20251120TorcaHttpLogZprep`: `scripts/orca_prepare_next_run.sh` でテンプレ展開 → Handbook §7 の tail -F / docker logs --since / rg / httpdump を実行し、`artifacts/orca-connectivity/20251120TorcaHttpLogZprep/` に本番フォルダを完成させた（テンプレ本番実行済み）。`patientgetv2` ダミーリクエストは Basic 認証未付与につき 401 だが、`http_live_20251113T122203Z.log` 内で既存 `/orca11/acceptmodv2` 405 も確認でき、Slack テンプレ差し替え例を README に記載済み。次回は Basic 認証付き再取得か route/API_ENABLE の恒久対応を追記予定。
- **RUN_ID=`20251113TorcaProdCertZ1`（2025-11-13）**: WebORCA クラウド本番への TLS/BASIC ハンドシェイクを初実行。`curl --cert-type P12 -u ${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}` で `POST /api/api01rv2/acceptlstv2?class=01` を送信し、HTTP 200 / `Api_Result=21` を取得。`artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/acceptlstv2.{headers,json}`、`tls/openssl_s_client.log`、`logs/serverinfo_claim_conn.json` を保存し、Runbook §4 をクラウド手順へ全面更新。以後の ORCA 検証は本番接続のみを使用する方針を決定。
- **RUN_ID=`20251119TorcaCertPermZ1`（2025-11-13）**: WebORCA クラウド用証跡フォルダの棚卸し。`ORCAcertification/*.p12` とパスフレーズファイルを `chmod 600` へ統一し、`artifacts/orca-connectivity/20251119TorcaCertPermZ1/permissions/` に `stat` 出力と `shasum -a 256` を保存。`ORCA_CONNECTIVITY_VALIDATION.md` §3.1 に証明書管理手順を追記し、`ORCA_HTTP_404405_HANDBOOK.md` のテンプレも `curl --cert-type P12` 前提へ差し替えた。
- （参照: [Sprint2設計](domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)）

## 2025-11-13 追記: ORCA route/log plan drafted（担当: Codex）
- ORCA route/log plan drafted — `artifacts/orca-connectivity/templates/receipt_route.template.ini` / `route.template.yaml` を整理し、Runbook §4.5（HTTP 404/405 対応フロー）から直接参照できるよう README に適用手順を追記。WebORCA クラウドでは route 編集を行わない方針のため、テンプレはアーカイブ扱い（`docs/archive/2025Q4/`）へ移す準備を開始。
    - `docker-compose.override.yml.example` に `/opt/jma/weborca/log` を `./orca-logs` へバインドする案内を追加し、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` に route/LOGDIR の follow-up 手順（config dump 保存、`ops/tests/orca/api-smoke.sh` 再実行、`orc-logs` 収集パス）をまとめた。
    - 次回 RUN_ID では `example/receipt_route.ini` → `/opt/jma/weborca/app/etc/receipt_route.ini` → `ops/tests/orca/api-smoke.sh --prefixes route,direct` の順に適用し、ログは `orca-logs/` から `artifacts/orca-connectivity/<RUN_ID>/log-persistence/` へコピーする運用とする。
- （参照: [Sprint2設計](domains/ORCA_REST_IMPLEMENTATION_NOTES.md#6-sprint2-%E3%82%A8%E3%83%B3%E3%83%89%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88%E8%A8%AD%E8%A8%88%E8%A9%B3%E7%B4%B0)）

## 2025-11-13 追記: Touch parity 非 dry-run PASS（担当: Codex）
- **DB スキーマ修正**: `touch_document_full` で `d_module.beanbytes` が OID Large Object を参照する挙動と DB 定義（bytea）が一致しておらず 500 になるため、`tmp/sql/touch_document_full_seed.sql` を追加し `ALTER TABLE {opendolphin,public}.d_module ALTER COLUMN beanbytes TYPE oid USING lo_from_bytea(...)` と `hibernate_sequence` / `d_document_seq` / `d_module_seq` の再採番を実行。`docker exec opendolphin-postgres{,-modernized} psql -U opendolphin < tmp/sql/touch_document_full_seed.sql` で Legacy/Modernized 両 DB を更新、`\\d opendolphin.d_module` で型が `oid` へ揃ったことを確認。  
- **RUN_ID=`20251118TtouchParityZ4`**: helper コンテナ（`docker run --network legacy-vs-modern_default -v $PWD:/work -w /work mcr.microsoft.com/devcontainers/base:jammy ...`）内で `PARITY_OUTPUT_DIR=tmp/parity-touch/20251118TtouchParityZ4 TRACE_RUN_ID=20251118TtouchParityZ4 BASE_URL_{LEGACY,MODERN}=http://opendolphin-server{,-modernized-dev}:8080/openDolphin/resources TOUCH_DRY_RUN=false` を指定し `ops/tools/send_parallel_request.sh --profile compose --config scripts/api_parity_targets.touch.json --run-id 20251118TtouchParityZ4` を実行。  
- **結果/証跡**: `/jtouch/sendPackage`・`/jtouch/document?dryRun=true`・`/jtouch/mkdocument?dryRun=true` に加えて `/jtouch/document`（非 dry-run）が 200 と一致。HTTP/headers/meta は `tmp/parity-touch/20251118TtouchParityZ4/` および `artifacts/parity-manual/touch/20251118TtouchParityZ4/` に保存し、同ネットワーク内で `python3 scripts/api_parity_response_check.py --config tmp/parity-touch/20251118TtouchParityZ4/api_targets.resolved.json` を実行して `diff.txt`（`[PASS]` ×4）を取得。今後の非 dry-run parity Gate は本 RUN_ID を基準とする。  

## 2025-11-13 追記: Legacy server Maven ビルド修正（担当: Codex）
- **RUN_ID=`20251118TlegacyFixZ1`**: Legacy WildFly10 プロファイルの Maven ビルドが `bootstrap class path not set in conjunction with -source 8` + `IDocInfo`/`JsonTouchResource` の未定義メソッドで失敗していたため、`server/pom.xml` と `pom.server-classic.xml` の `maven-compiler-plugin` を 3.11.0（`<release>8</release>`, `-Xlint:unchecked` 付与）へ更新し、`IDocInfo` の `admFlag` フィールド重複/ゲッター重複を整理。`JsonTouchResource` は Modernized 版と同じ `handleDocumentPayload` + dryRun ロジックへ揃え、Jackson 1.x でも `dryRun=true`／`false` 双方で DTO 初期化が共有できるようにした。検証コマンド: `mvn -f pom.server-classic.xml -pl server -am -Plegacy-wildfly10 -DskipTests -Dmaven.test.skip=true package`。成功ログは `artifacts/parity-manual/build/legacy_server_compile/20251118TlegacyFixZ1/mvn_package.log`（`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ1にリンク済み）。

## 2025-11-13 追記: Legacy Diagnosis 500 → 200（担当: Codex）
- **Logger/NPE 対策**: `DiagnosisSender` が `Logger.getLogger("dolphin.claim").getLevel()` で null を返し NPE → HTTP 500 になっていたため、`docker exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands="/subsystem=logging/logger=dolphin.claim:add(level=INFO)"` を適用し、同コマンドを `tmp/configure-wildfly.legacy.cli` に常設。`legacy_server.log` で `DiagnosisSendWrapper message has received` 以降が例外なく流れることを確認。
- **シード SQL**: `tmp/diagnosis_seed.sql` を新設し、`docker exec opendolphin-postgres psql -U opendolphin -d opendolphin < tmp/diagnosis_seed.sql` を実行。`d_patient`（id=1001）、`d_karte`（id=2001）、`d_letter_module`（id=7001001）、診断シード行（`opendolphin.d_diagnosis.id=9001001`）を揃えつつ、`hibernate_sequence` / `opendolphin.d_diagnosis_seq` を `>=9002000` に `setval` して ID の正レンジ化を完了。
- **RUN_ID=`20251118TdiagnosisLegacyZ1`**: helper コンテナ（`--network legacy-vs-modern_default`）から `TRACE_RUN_ID=20251118TdiagnosisLegacyZ1 PARITY_HEADER_FILE=tmp/parity-headers/diagnosis_TEMPLATE.headers PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json ops/tools/send_parallel_request.sh --profile modernized-dev POST /karte/diagnosis/claim messaging_diagnosis` を実行。Legacy=200（`response=9002004`）、Modern=200。Legacy JMS `messages-added=0L→0L`（サーバー直送）、Modern JMS `5L→6L`。証跡は `artifacts/parity-manual/messaging/20251118TdiagnosisLegacyZ1/` に HTTP/headers/meta/JMS/Audit TSV/ログを保存。
- **RUN_ID=`20251118TdiagnosisAuditZ2`**: Legacy/Modern 両コンテナへ最新 WAR（Diagnosis audit hook 込み）をホットデプロイ後、`--profile compose` で同リクエストを再取得。`tmp/diagnosis_seed.sql` を実行し直したうえで CLI を叩き、`logs/d_audit_event_diagnosis_{legacy,modern}.tsv` に TraceId=`parity-diagnosis-send-20251118TdiagnosisAuditZ2` の `EHT_DIAGNOSIS_CREATE` を確保。これにより Legacy/Modern 両方の `d_audit_event` が TraceId 付きで揃い、Appendix A.6 / Checklist / 本ファイルの残課題をクローズ。

## 2025-11-13 追記: Diagnosis seed Gate 自動化（担当: Codex）
- **Gate 2.5 追加**: `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` に「Diagnosis Seed Refresh Gate（診断監査・Claim parity）」を新設し、`docker exec -i opendolphin-postgres{,-modernized} bash -lc 'psql -U opendolphin -d opendolphin -f tmp/diagnosis_seed.sql'` を毎 RUN_ID で実行→`hibernate_sequence`/`opendolphin.d_diagnosis_seq` を `>=9002000` に揃えてから `POST /karte/diagnosis/claim` を投げるよう Runbook 化。`artifacts/parity-manual/messaging/20251118TdiagnosisAuditZ2/` を Gate 通過例として参照する。
- **helper ラッパー共有**: `README.md` へ helper コンテナ経由で `ops/tools/send_parallel_request.sh` を呼び出すテンプレ（`ops/tools/helper_send_parallel_request.sh`）を記載し、Gate 2.5 適用後の CLI から `TRACE_RUN_ID` と `PARITY_OUTPUT_DIR` を一括で定義できるようにした。
- **証跡リンク**: `artifacts/parity-manual/messaging/20251118TdiagnosisAuditZ2/README.md` へ Gate 2.5 を参照する追記を行い、診断監査取得前リセットが行われたかどうかを README から即座に判別できるようにした。

## ネットワーク復旧ブロッカー（2025-11-12 更新: Codex）
- RUN_ID=`20251111Tnetdiag3`（`artifacts/parity-manual/network/20251111Tnetdiag3/README.txt`）で、ホスト→`localhost:9080` の port-forward が SYN 後に HTTP payload を返さないことを確認。pf でのブロックはなく、vpnkit の再登録待ち。
- Docker Desktop で 9080 port-forward を再生成するまで、ホストからの parity 実行・本番操作は中止し、必ず helper コンテナまたは `socat TCP-LISTEN:19080,fork TCP:localhost:9080` を経由する。`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §8` に暫定運用手順を集約済み。
- マネージャーが実施すべき恒久対応（`docs/.../LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §9`）: (1) Docker Desktop/vpnkit 再起動と再度の `curl`/`tcpdump` 成功確認、(2) 必要に応じた pf pass ルールの追記、(3) VPN 切替テストと `docs/web-client/operations/mac-dev-login.local.md` トラブルシュート欄の確認コマンドに沿った証跡採取。
- **テンプレ活用手順**: `artifacts/parity-manual/network/TEMPLATE/` を `cp -R .../TEMPLATE <RUN_ID>` で複製してから再採取を開始し、`pf_rules_9080.txt` / `lo0_9080.pcap` / `host_curl_9080.log` / `docker_backend_portforward.log` のコメントに沿って証跡を差し替える。`README.txt` には RUN_ID・取得者・再現可否を記載する。
- **再起動後の確認コマンド再掲**: 1) `lsof -iTCP:9080 -sTCP:LISTEN` で `com.docker.backend` の LISTEN 差し替えを確認、2) `curl -v http://localhost:9080/openDolphin/resources/serverinfo/jamri --max-time 10` で 200 応答を取得、3) `sudo tcpdump -i lo0 tcp port 9080 -c 10` で HTTP payload の往復を確認。すべて成功した RUN_ID を `PHASE2_PROGRESS.md` / `DOC_STATUS.md` へ追記する。
- 依存タスク: `TRACE_PROPAGATION_CHECK` 再取得、`domain-transaction-parity` Gate、`ops/tools/send_parallel_request.sh --profile compose` を使う全テスト。復旧が完了し `PHASE2_PROGRESS.md` へ「helper 非依存」ステータスを追記するまで再開不可。
- Legacy JMS queue は RUN_ID=`20251111TstampfixZ3` 以降も `messages-added=0L`（Legacy）／`consumer-count=0` のまま。`TRACEID_JMS_RUNBOOK.md` §4.1 と `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` §3.4 を更新済み。**次アクション: `StampSenderMDB` 再起動 → `messages-added` 変化確認 → `standalone-full.xml` / `server/src/main/resources/META-INF/ejb-jar.xml` の JMS 設定整合性チェック**。再起動手順はマネージャーのみ実行し、ログは `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/{legacy_mdb_restart,server.log}` へ保存する。

## 2025-11-12 追記: Maven DuplicateProjectException 調査（担当: Build）
- ステータス: **完了（RUN_ID=`20251116TreactorFixZ1`）**。`mvn -f pom.server-modernized.xml -pl server-modernized -am help:effective-pom -DskipTests` と `... package -DskipTests` を連続実行して DuplicateProjectException が再発しないことを確認し、ログを `artifacts/parity-manual/build/duplicate_project/20251116TreactorFixZ1/{help_effective_pom.log,mvn_package.log}` に、`ls -l server-modernized/target` を `server-modernized-target-ls.txt` に保存した。
- ルート `pom.xml` の `<modules>` と `pom.server-modernized.xml` のリアクターから `server`/`server-modernized` を分離し、Modernized 側は `artifactId=opendolphin-server-modernized` + `<finalName>opendolphin-server</finalName>`、Legacy 側は `artifactId=opendolphin-server` を維持することで GAV 重複を恒久的に排除できることを確認。`server-modernized/pom.xml` の設定と依存モジュール (`common`/`reporting`) が単一リアクターに二重登録されていないかも合わせて再点検した。
- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ1行・`docs/server-modernization/phase2/notes/domain-transaction-parity.md §3.5`・`patches/maven_duplicate_fix_plan.md` を RUN_ID とログへのリンクで更新し、Build チームが help:effective-pom を単独実行できることを明示した。CI/Runbook では `-f pom.server-modernized.xml` を常に付与するよう説明文を差し替え済み。
- Manual JAR（`opendolphin:itext-font`, `com.apple:AppleJavaExtensions`）欠品で Reactor が停止する事象への対処として、`docs/web-client/architecture/REPOSITORY_OVERVIEW.md` Build & Toolchain 節へ `mvn install:install-file ...` コマンドを明記し、`domain-transaction-parity.md §3.5` から Java 8 検証時の参照先としてリンクした。ビルドトラブル時はまず当該コマンドでローカル Maven リポジトリへ再登録する運用を踏襲する。

## 2025-11-12 追記: 共通モジュール共有方針（担当: Worker B）
- `opendolphin-common` を Legacy/Modernized サーバーと Swing クライアントで分割配布する案（Modernized 専用 fork）を検討したが、DTO/JPA パリティと `scripts/jpql_trace_compare.sh` の比較前提を壊すため、**単一ソース／単一 JAR 維持**を正式決定。Modernized 側は `common/pom.xml` の `jakarta-no-persistence` 実行で生成される `-jakarta` classifier 版を読み込み、Legacy/Swing は classifier なしを利用する。
- 本決定の根拠と利点を `docs/server-modernization/phase2/notes/domain-transaction-parity.md` 「共通モジュール運用方針」と `docs/web-client/architecture/REPOSITORY_OVERVIEW.md` Modules 節に追記し、質問時は両資料を一次回答として案内する。Web ハブにも 2025-11-12 更新として記録済み。
- **再検討条件**（いずれか成立時に再評価タスクを起票）:
  1. Swing クライアント廃止または InfoModel の gRPC/GraphQL 最適化等で `open.dolphin.infomodel.*` を API/クライアント毎に別フォーマットへ分岐するロードマップが合意された場合。
  2. Modernized サーバーが Jakarta EE 10+ で `record`/`sealed` など Java 17 固有コードを InfoModel に導入し、Legacy/Swing の Java 8 互換性を維持できなくなる場合。
  3. DTO にバイナリ互換性を壊すフィールド移動が必要になり、`common` を multi-release jar か microservice 専用モジュールへ切り離すほうがテストコストを削減できると判断された場合。

## 2025-11-12 追記: AuditTrailService Java8 互換化（担当: Codex）
- `common/src/main/java/open/dolphin/audit/AuditTrailService.java` の `private` インターフェースメソッドを `default systemEnvelope(...)` へ移行し、`Map.of()` を `Collections.emptyMap()` へ置換。`requireNonBlank` で action/resource/actor/request/trace を default メソッド側で検証してから Builder へ渡す構成に揃えた。
- `AuditEventEnvelope.Builder#build` の `String#isBlank()` 依存を Java 8 互換の `isNullOrBlank` ヘルパーへ置き換え、`requestId` が空の際は従来通り `traceId` をフォールバックに利用。差分は `patches/audit_trail_java8_fix.diff` に保存し、`docs/server-modernization/phase2/notes/domain-transaction-parity.md §3.4` に同メモを反映済み。
- `mvn -rf :opendolphin-common -DskipTests compile` を 2025-11-12 21:10 JST に実行し、ログ `artifacts/parity-manual/build/audit_trail_java8_fix/mvn-compile.log` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` のフェーズ1行へ記録を追加。これにより `opendolphin-common` を Java 8 でコンパイルした際のビルドブロッカー（private interface method, Map.of, String#isBlank）がクローズした。

## 2025-11-12 追記: REST 例外レスポンス統一（担当: Codex）
- `AbstractResource` に `restError` / `writeRestError` ヘルパーを追加し、Legacy/Modernized の `SystemResource`／`KarteResource`／`LogFilter`／`TouchRequestContextExtractor` が `error` / `message` / `status` / `traceId` を含む JSON を返すよう改修。Legacy 側は `mvn -f pom.server-classic.xml -pl server -am -Plegacy-wildfly10 package` で WAR を生成し、`docker cp .../opendolphin-server.war` のホットデプロイのみで適用。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` と `README.manual.md` を RUN_ID=`20251115TresterrexZ1` ベースへ更新し、`tmp/rest-error-headers/trace_http_*_20251115TresterrexZ1.headers`（password は MD5、401 ケースのみ password 行削除）に合わせて CLI 手順を再整備。
- `ops/tools/send_parallel_request.sh --profile compose` で `rest_error_{bad_request,unauthorized,internal}` を再取得。Legacy/Modernized 双方が `invalid_activity_param` 400、`unauthorized` 401（`reason=authentication_failed`）、`karte_lookup_failed` 500 を返すことを `artifacts/parity-manual/rest-errors/20251115TresterrexZ1/{README.md,logs/}` に記録。以前 HTML 500 だった Legacy `/karte/pid/*` も JSON 500 へ統一された。
- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8 行を完了に更新し、`rest_error_*` の HTTP/JSON 例を `docs/server-modernization/phase2/notes/domain-transaction-parity.md` Gate #49/#73/#74 の証跡へリンク。

## 2026-06-15 追記: フェーズ4 Docker ブロッカー共有（担当: Codex）
- WSL2 側で Docker Desktop を導入しておらず、`scripts/start_legacy_modernized.sh start --build` / `docker compose` 系コマンドがすべて `docker: not found` で停止するため、フェーズ4（JPQL/TX、予約・紹介状 REST、SessionOperation、adm10/20、HealthInsuranceModel）のタスクを一時停止。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の対象行へ「WSL2 Docker 未導入のため一時停止（2026-06-15）」を記載してブロッカー理由を明示した。
- 直近 RUN_ID（20251110T070638Z）以降は HTTP/JMS/DB の追加証跡が取得できておらず、`ops/tools/send_parallel_request.sh --profile compose` による再実行や `docker compose exec db-* psql` での監査ログ採取も実施できない。DB 復旧 Runbook／JMS 検証／`trace_http_*` 収集はいったん Mac 側へ引き継ぐ。
- **再開条件**: (1) Windows ホストに Docker Desktop を導入し、「設定 > Resources > WSL Integration」で当該ディストリへ統合を有効化する、(2) `./scripts/start_legacy_modernized.sh down && ./scripts/start_legacy_modernized.sh start --build` が成功し Legacy/Modernized 両 WildFly の `/actuator/health` が 200 を返すことを証跡化する。両条件を満たした時点で `PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を更新し、RUN_ID を新規採番してフェーズ4タスクを再開する。

## 2026-06-16 追記 フェーズ4 ブロッカー共有（Manager）
- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-1 行に `artifacts/parity-manual/JPQL/{20251109T201157Z,20251110T002451Z}/README.md` の更新内容（CLI 条件・TraceId・`docker compose exec db-{legacy,modern}` 不可理由）を追記し、Mac 環境での再取得手順を `PHASE2_PROGRESS.md` 2025-11-11 節と連動させた。`domain-transaction-parity.md §3`／`rest_error_scenarios.manual.csv` の TODO（remoteUser=anonymous / WEB1001 seed gap）も同一 RUN_ID で追跡。
- `TRACE_PROPAGATION_CHECK.md §7`・`domain-transaction-parity.md §2.1`・`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-3 には `RUN_ID={20251110T002045Z,20251110T070638Z}` を既に記録。今回は WSL2 で `curl: (7)` が継続している事実と「Docker Desktop を有効化した Mac で `scripts/start_legacy_modernized.sh start --build` → `ops/tools/send_parallel_request.sh --profile compose` を再実行」手順を再周知し、Touch Session 2 系への `@SessionOperation` 付与チケットを残課題として維持した。
- **Appo/Schedule Audit/JMS（コード差分レビュー待ち, RUN_ID テンプレ=`20251115TappoSchedPlanZ`）**: `docs/server-modernization/phase2/notes/domain-transaction-parity.md §3.4` に `SessionAuditDispatcher + AuditTrailService#write` の実装案と `artifacts/parity-manual/{appo,schedule}/<RUN_ID>/` 保存ルールを追記し、`ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` へ `rest_audit_{appo,schedule}_trace` を追加して Evidence 取得ステップを単一ソース化した。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 も「実装計画あり（監査/JMS 未反映）」→「コード差分レビュー待ち」に更新済みで、`patches/appo_schedule_audit_plan.diff` に PR 向け差分案を保存している。次アクション: (1) `SessionOperationInterceptor` で HTTP actor 情報を `SessionTraceContext` に転写、(2) `AuditTrailService#write` を介して Audit→JMS を連鎖させるコードを実装、(3) helper コンテナ + `--profile compose` で再取得し、`PHASE2_PROGRESS.md` を「検証済み」に切り替える。
- 2025-11-12: 差分レビュー結果として「失敗監査が同一トランザクションでロールバックされる」「`AuditEventEnvelope` に actor/request/patient が未設定」「`ScheduleServiceBean#removePvt` の `deletedDocuments` が PVT 削除件数を含んでしまう」課題を確認。`domain-transaction-parity.md §3.4` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` へレビュー所見を追記し、`AuditTrailService` の Tx属性見直し・SessionAuditDispatcher 実装・details 粒度修正をブロッカーとして管理する。
## 2025-11-11 追記: フェーズ4-1 JPQL/Tx 差分整理（担当: Codex）
- `artifacts/parity-manual/JPQL/20251109T201157Z/` / `20251110T002451Z/` に README を新規追加し、`ops/tools/send_parallel_request.sh` 実行条件・TraceId・保管済みファイル・`d_audit_event` 未採取理由（WSL 上で Docker Desktop 未導入のため `docker compose exec` が不可）を記録。`ScheduleServiceBean` / `AppoServiceBean` の正規化 SQL 差分は RUN_ID=20251110T002451Z で補完した。
- `docs/server-modernization/phase2/notes/domain-transaction-parity.md §3/§3.2` を更新し、Karte/Patient/Schedule/Appo の TX 境界、`remoteUser=anonymous` に起因する DTO 差分、`server-modernized/.../persistence.xml` への `PatientVisitModel`/`AppointmentModel` 登録状況、`ops/db/local-baseline/local_synthetic_seed.sql` の再投入手順、`d_audit_event` 抜粋 TODO を整理。RUN_ID=`20251110T034844Z` ブロッカーとの切り分けも追記。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の Schedule/Appo を `[Resolved 2025-11-09] expected_status=200` にそろえつつ、`TODO(remoteUser=anonymous)`・`TODO(WEB1001 seed gap)` を明示。`docs/server-modernization/phase2/INDEX.md` へ当ノートをリンクして Phase2 配下から辿れるようにした。
- ✅ **Mac 実行プレイブック整備済み**: `docs/server-modernization/phase2/operations/MAC_DOCKER_RECOVERY_PLAYBOOK.md` を追加し、Docker Desktop 設定 → `scripts/start_legacy_modernized.sh start --build` → `POSTGRES_BASELINE_RESTORE.md`（Mac 補足）→ API 投入/証跡保存 → 失敗時リカバリーまでを整理。再開トリガ: Mac 上で `docker ps` に `opendolphin-{server,server-modernized-dev}` が表示された状態で `./scripts/start_legacy_modernized.sh start --build` と `ops/tools/send_parallel_request.sh --profile compose` が連続成功すること。
- 残課題: (1) Docker Desktop を導入できるホストで `docker compose exec db-{legacy,modern} psql ...` を実行し、各サービス配下に `d_audit_event.{legacy,modern}.log` を追加、(2) `ScheduleResource`/`AppoResource` の `HttpServletRequest#getRemoteUser()` が `doctor1@F001` を復元できるよう Elytron/JACC 設定を修正、(3) `WEB1001` シードを `opendolphin_modern` に再投入して `/chart/WEB1001/summary` / `/patient/id/0000001` を 200 系で再採取する。

### 2025-11-11 TODO: Audit/JMS 強化と Artifacts 整理
- **差分候補共有**（`TRACEID_JMS_RUNBOOK.md §5` 最新節）: 2025-11-11 に Legacy 側 `SystemResource#getActivities`（400）, `LogFilter`（401）, `KarteResource#getKarte{ByPid}`（500）を修正済み。Docker 再ビルド／`ops/tools/send_parallel_request.sh trace_http_*` 再実行で Evidence を差し替えるまでは `TRACE_PROPAGATION_CHECK.md §6.3` に記載のとおり検証待ち。Modernized `TouchRequestContextExtractor` / `TouchRequestContext` の facility fallback や `KarteBeanConverter` null-safe 化は別チケット継続中。`ops/db/local-baseline/reset_d_audit_event_seq.sql` を用いた `d_audit_event` シーケンス整合性チェックと新 RUN_ID での `rest_error_{bad_request,unauthorized,internal}` 再取得も再開タスクとして残す。
- **Claim/JMS fix (RUN_ID=`20251111TclaimfixZ3`)**: `/20/adm/eht/sendClaim` を Legacy（`server/src/main/java/open/dolphin/adm20/rest/EHTResource.java`）へ正式移植し、Modernized と同じ JMS レーンで 200/200 応答を取得。シーケンスリセットは `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql`（正式パス: `ops/db/local-baseline/`）を両 DB で実行し、`scripts/diff_d_audit_event_claim.sh 20251111TclaimfixZ3 20251111TclaimfixZ2` の出力を `artifacts/parity-manual/TRACEID_JMS/20251111TclaimfixZ3/README.md` に貼付した。helper コンテナ（`--network legacy-vs-modern_default`）をホスト↔9080 復旧まで運用し、`tmp/claim-tests/claim_<RUN_ID>.headers` / `send_claim_success_<RUN_ID>.json` を直接参照できるよう整理済み。

### 2025-11-11 21:30JST: trace_http 400/401/500 Modernized 根本原因調査（担当: Codex）
- `ops/tools/send_parallel_request.sh --profile compose trace_http_{400,401,500}` を RUN_ID=`20251111TtracefixZ` で再走し、`logs/send_parallel_request.log` に Legacy=400 / Modern=500、Legacy=401 / Modern=403、Legacy=500 / Modern=500 を記録。Modernized 側の証跡 (`artifacts/parity-manual/TRACEID_JMS/20251111TtracefixZ/trace_http_*/modern/{headers.txt,response.json}` と `logs/modern_trace_http.log`) を精査して、`SystemResource#getActivities`（400→500）、`TouchRequestContextExtractor`/`TouchAuthHandler`（401→403）、`KarteBeanConverter`（500 だが Audit/JMS 無し）の各失敗経路を特定した。
- `docs/server-modernization/phase2/notes/domain-transaction-parity.md §2` と `TRACE_PROPAGATION_CHECK.md §3` に Modernized 側の補強方針を追記済み。内容: (1) `SystemResource` はパラメータ検証を JTA 非参加に切り離し `BadRequestException` を 400 で確定させる、(2) `TouchRequestContextExtractor` + `TouchAuthHandler` は facility ヘッダー／Path 情報から composite principal を再構築し、資格情報欠落時は `NotAuthorizedException` を返す、(3) `KarteBeanConverter` + `KarteResource#toConverter` は null 応答でも `AuditTrailService` を呼び出し TraceId/patientId を payload に残す。
- **実装後のテスト計画**: `ops/tools/send_parallel_request.sh --profile compose trace_http_{400,401,500}` を再実行し、`artifacts/parity-manual/TRACEID_JMS/<next-run>/trace_http_*/{legacy,modern}/` と `logs/{modern,legacy}_trace_http.log`、`logs/d_audit_event_latest.tsv`、`logs/jms_dolphinQueue_read-resource.txt` を差分保存。各ケースで `X-Trace-Id` が 400/401/500 それぞれの HTTP ヘッダーに残ること、`d_audit_event` に `trace-http-*-<next-run>` が追記されること、`logs/send_parallel_request.log` が Legacy/Modern 同ステータスで揃うことを確認する。再取得が完了したら `domain-transaction-parity.md` / `TRACE_PROPAGATION_CHECK.md` / `rest_error_scenarios.manual.csv` の Evidence パスを <next-run> へ更新する。

### 2025-11-12: Appo/Schedule Audit Tx 分離 & テスト計画
- `patches/appo_schedule_audit_fix.diff` で `AuditTrailService` を `@Transactional(REQUIRES_NEW)` 化し、`LogFilter` → `SessionOperationInterceptor` → `SessionTraceManager` の流れで `actorId` / `requestId` / `patientId` を `SessionTraceContext` attributes に格納。`AuditEventEnvelope.Builder` は actorId/traceId を必須化し、`AppoServiceBean` / `ScheduleServiceBean` が TraceContext から actor/request/trace/patient を補完するよう更新した。`ScheduleServiceBean#removePvt` の details も `pvtDeletedCount`・`documentsDeletedCount`・`documentsDeletedStatus` へ整理済み。
- RUN_ID=`20251112TauditFix` で `ops/tools/send_parallel_request.sh --profile compose` を実行し、`PUT /appo`（1 件を意図的に `state=TT_REPLACE` → `RuntimeException` へ誘導）と `DELETE /schedule/pvt/{pvtPk,patientPk,date}`（ドキュメント 0 件/複数件のシナリオ）を採取する。期待値: `d_audit_event` に `APPOINTMENT_MUTATION` および `SCHEDULE_{FETCH,CREATE,DELETE}` が成功/失敗とも `actor_id`/`request_id`/`patient_id` を保持して残る。`SessionAuditDispatcher` は未実装のため JMS `messages-added` は 0 のまま（README に「監査のみ」「JMS 後続タスク」を明記）。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の `rest_audit_{appo,schedule}_trace` 行へ RUN_ID / 期待値 / 検証手順を追記し、Evidence は `artifacts/parity-manual/{appo,schedule}/20251112TauditFix/` にまとめる。フェーズ5で JMS ディスパッチを実装した際は同 RUN を再取得して messages-added の差分を記録する。
- Evidence 保存ルール: 400/401/500 の HTTP/ログは `artifacts/parity-manual/TRACEID_JMS/<next-run>/trace_http_*/`、Audit/JMS は同 RUN_ID の `logs/{d_audit_event_latest.tsv,jms_dolphinQueue_read-resource.txt}` へまとめ、`docs/server-modernization/phase2/DOC_STATUS.md` の Phase2-Trace 行に RUN_ID を追記すること。テスト時は `tmp/trace_http_401.headers`（password 行削除）などヘッダーファイルもリポジトリに残しておく。
- **Touch/Karte パリティレビュー**: RUN_ID=`20251111TtracefixZ`（`artifacts/parity-manual/TRACEID_JMS/20251111TtracefixZ/`）で Trace Harness を再取得した結果、Legacy は `trace_http_{400,401,500}` が 400/401/500 まで到達した一方、Modernized は 500/403/500 に後退。`trace_http_401`（password 欠落）は TouchRequestContext fallback が効かず 403 で止まり、`trace_http_400` も `RollbackException` で 500 へ戻った。`trace_http_500` は HTTP ステータスが一致したものの Audit/JMS には到達せず。次 RUN では (1) Touch stack の facility/principal 再構築、(2) `SystemServiceBean` の 500 巻き戻し解消、(3) `logs/d_audit_event_latest.tsv` を TraceId 付きで伸ばすこと、(4) `rest_error_{unauthorized,internal}` Evidence を同 RUN に揃えることが必要。
- **Artifacts インデックス**: 主要 RUN の証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T122644Z/`（helper コンテナ, trace_http 200/400/500）, `20251110T133000Z/`（compose, HTTP/JMS/`d_audit_event_trace-http-*.sql`）, `20251110T221659Z/`（Unauthorized 403 再現）および `TRACEID_JMS/trace/`（集約ログ）に纏めた。DB 側は `artifacts/parity-manual/db/20251110TnewZ/`（Flyway/seed/karte id check）と `20251111T062323Z/karte_id_check.txt` を参照すれば PK 揃え状況を把握できる。`TRACEID_JMS/trace/` 直下には `legacy_http.log` / `modern_http.log` / `README.txt` のみで不要ファイルなし。
- **rest_error_scenarios テンプレ整理完了**: CSV の `notes` を `Headers=` / `Expect=` / `Evidence=` 形式へ統一し、`rest_error_letter_fk` / `lab_empty` / `stamp_data_exception` は `tmp/parity-headers/<case>_<RUN_ID>.headers` を `cp` → `sed -i '' 's/20251111T070532Z/<next RUN_ID>/g'` するだけで差し替え可能にした。手順全文と最新ヘッダー一覧は `ops/tests/api-smoke-test/README.manual.md#rest-例外ケース再現テンプレ` に追記済み。

## 2025-11-11 追記: ラボ再シード準備（担当: Worker E）
- ✅ **ラボ再シード準備完了、Docker再投入待ち。** `ops/db/local-baseline/local_synthetic_seed.sql` の `d_nlabo_module` / `d_nlabo_item` シードを `patientId='1.3.6.1.4.1.9414.72.103:WEB1001'`（fid:pid 形式）へ書き換え、`setval('d_nlabo_{module,item}_seq', …)` の初期値も 9101 / 9202 に合わせた。実際の `psql -f ops/db/local-baseline/local_synthetic_seed.sql` 適用や Docker 再投入はブロッカー解消後に着手する。
- 🗒️ `common/src/main/java/open/dolphin/converter/NLaboModuleListConverter.java` が空リスト時に `null` を返していることを確認し、`docs/server-modernization/phase2/notes/domain-transaction-parity.md` と `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` に「空でも `{"list":[]}` を返す」仕様を追記。実装は後続タスクとして記録。
- ⚠️ `ops/tools/send_parallel_request.sh` の再実行と Docker 再投入、`psql` による再シード適用はいずれも未実施。Runbook では再投入後に RUN_ID を採番して `/lab/module` parity を再取得する想定。
- Audit/JMS ルート強化：設計準備完了、実装待ち — `TRACEID_JMS_RUNBOOK.md §5` に LogFilter null-safe 化、TouchRequestContext fallback、`d_audit_event_id_seq` 再採番プロトコル（バックアップ `\copy`, `setval`, smoke insert）を追記し、対応する証跡パスを `artifacts/parity-manual/TRACEID_JMS/<RUN_ID>/logs/` に固定。Docker/コード編集が許可されるタイミングで実装タスクへ昇格する。

## 2025-11-11 追記: DocumentModel 再登録 & Schedule API 200 化（担当: Codex）
- RUN_ID=`20251110T231006Z`。`docker run --network container:opendolphin-postgres-modernized -e DB_* flyway/flyway:10.17 migrate` で `server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` を再適用し、`flyway_schema_history` に version 0224 を追加。`psql` で `opendolphin.d_document`/`d_module`/`d_image`/`d_attachment` の存在と件数（現状 0 件）を確認し、ログを `artifacts/parity-manual/schedule/20251110T231006Z/psql_*.log` に保存。
- `mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` → `scripts/start_legacy_modernized.sh down && start --build` を実行し、`docker ps` で `opendolphin-server-modernized-dev` が `healthy` になるまで待機。全ビルド/Compose出力は同 RUN_ID フォルダに集約済み。
- `curl -H userName:1.3.6.1.4.1.9414.72.103:doctor1 -H password:632080fabdb968f9ac4f31fb55104648 -H X-Trace-Id:trace-schedule-20251110T231006Z http://localhost:9080/openDolphin/resources/schedule/pvt/2025-11-09` で Modernized が `HTTP 200` と予定カルテ JSON (`架空 花子` 1 件) を返却することを確認。`server_modernized.log` には初回の認証エラー→最終的な `doctor1 GET /schedule/pvt/...` INFO ログが記録され、DocumentModel 起因の `UnknownEntityException` は再発しない。
- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 を更新し、DocumentModel parity 行を完了扱いに変更。証跡は `artifacts/parity-manual/schedule/20251110T231006Z/`（Flyway/Maven/Compose/curl/psql/README）に集約し、`docs/web-client/planning/phase2/DOC_STATUS.md` の該当行も最終レビュー日を 2025-11-11 に更新した。
- 残課題: `opendolphin.d_audit_event` に `/schedule/pvt` の監査行が出力されず、TraceId も `SYSTEM_ACTIVITY_SUMMARY` のみ。JMS 連携と AuditTrail 反映は別チケットで継続。Document 系テーブルは空のため、`ops/db/local-baseline/local_synthetic_seed.sql` へ Document/Module/Schema/Attachment seed を追加するタスクを Phase2 backlog へ再登録。

  - **実施結果（RUN_ID=`20251115TappoSchedPlanZ`, 2025-11-12 22:40 JST）**: `SessionAuditDispatcher` 実装後、War 差し替えのみでコンテナ再構築を避けつつ helper コンテナから `rest_audit_{appo,schedule}_trace` を再取得。直前に `docker exec opendolphin-postgres{,-modernized} psql -f /tmp/reseed_appo.sql` で `d_appo id=8001` を復元し、`ops/tools/send_parallel_request.sh --profile modernized-dev` を実行。Appo は Legacy/Modern とも 200 (`response:1`)、Modern `d_audit_event` には `APPOINTMENT_MUTATION` success/failure が TraceId=`trace-audit-appo-20251115TappoSchedPlanZ` で 4 行追記され、JMS は `messages-added=4L→5L`（Legacy=0L）を記録。Schedule も Legacy/Modern 200 + `SCHEDULE_FETCH` 監査 1 行ずつ（TraceContext 由来の `patientId` が反映される）。Evidence=`artifacts/parity-manual/appo/20251115TappoSchedPlanZ/` / `schedule/20251115TappoSchedPlanZ/` に HTTP/headers/meta/JMS/Audit を保存し、Runbook Appendix A・`rest_error_scenarios.manual.csv`・`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を同 RUN_ID で更新済み。

## 2025-11-11 追記: 予約/予定カルテ/紹介状/ラボ/スタンプ REST parity（RUN_ID=`20251110T234440Z` → `20251110TnewZ`）
- `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace buildpack-deps:curl bash -lc 'BASE_URL_LEGACY="http://server:8080/openDolphin/resources" BASE_URL_MODERN="http://server-modernized-dev:8080/openDolphin/resources" PARITY_HEADER_FILE=/workspace/tmp/parity-headers/<case>_<RUN_ID>.headers … ops/tools/send_parallel_request.sh …'` を採用し、`PUT /appo`, `GET /schedule/pvt/2025-11-09`, `PUT /odletter/letter`, `GET /lab/module/WEB1001,0,5`, `PUT /stamp/tree` を Legacy/Modernized 同順で取得。CLI がホストの `localhost:{8080,9080}` へ到達できない場合の代替手順として `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` §3.1 を更新した。
- 認証ヘッダーは `userName: 1.3.6.1.4.1.9414.72.103:doctor1` / `password: 632080fabdb968f9ac4f31fb55104648 (MD5)` を基準にし、`clientUUID`, `facilityId`, `X-Trace-Id: parity-<case>-<RUN_ID>` をケース別に発行。`tmp/parity-headers/<case>_<RUN_ID>.headers` と `PARITY_OUTPUT_DIR=artifacts/parity-manual/<case>/<RUN_ID>` を組み合わせて HTTP/headers/meta を保存した。
- `V0225__letter_lab_stamp_tables.sql` と `ops/db/local-baseline/local_synthetic_seed.sql` を Legacy/Modernized 双方へ再適用したログを `artifacts/parity-manual/db/20251110TnewZ/` に保存し、`flyway_schema_history` が 0225 まで進んだことを確認したうえで `scripts/start_legacy_modernized.sh down && start --build` → `send_parallel_request.sh` を再実行した。
- **結果サマリ（RUN_ID=`20251110TnewZ`）**
  - `PUT /appo`: Legacy/Modern=200 (`response=1`)。`tmp/reseed_appo.sql` で `id=8001` を毎回復元。`d_audit_event` と JMS が空のため SessionOperation→AuditTrail/JMS の補強が必要。
  - `GET /schedule/pvt/2025-11-09`: 両環境とも `架空 花子` 1 件。`remoteUser` は復旧したが `d_audit_event` は `SYSTEM_ACTIVITY_SUMMARY` のみで TraceId 未記録。
  - `PUT /odletter/letter`: Legacy=200、Modern=500（`fk_d_letter_module_karte` で FK 違反）。`WEB1001` の `d_karte.id` が Legacy=10 / Modern=6 とずれているため、シード or payload を揃える必要あり。
  - `GET /lab/module/WEB1001,0,5`: Legacy/Modern=200 だがレスポンスは双方 `{"list":null}`。`d_nlabo_module`/`d_nlabo_item` シード（9101/920{1,2}）は存在するが DTO 変換で空になっており、Audit/JMS も未取得。
- `PUT /stamp/tree` / `GET /stamp/tree/9001`: RUN_ID=`20251111TstampfixZ3`（helper コンテナ + `BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/openDolphin/resources`）。`ops/db/local-baseline/stamp_tree_oid_cast.sql` と `CREATE TABLE d_subscribed_tree (...)` をモダナイズ DB へ適用し、payload を GET の最新版（versionNumber=11）へ合わせてから PUT を実施。Legacy/Modern とも 200 応答で、`artifacts/parity-manual/stamp/20251111TstampfixZ3/{stamp_tree_user9001,PUT_stamp_tree,rest_error_stamp_data_exception}/` に HTTP/headers/meta を保存。`logs/d_audit_event_stamp_{legacy,modern}.tsv` は TraceId=`parity-stamp-20251111TstampfixZ3` を含み、`logs/jms_dolphinQueue_read-resource*.txt` では `messages-added=4L` / `message-count=0L` を確認。Legacy Audit/JMS も Stamp parity に追いついたため、残課題は Letter FK/JMS と Lab DTO/Audit のみ。
- `GET /stamp/tree/{facility}/{public|shared|published}`: RUN_ID=`20251113TstampPublicPlanZ1`（public）/`20251113TstampSharedPlanZ1`（shared）/`20251113TstampPublishedPlanZ1`（published）で helper コンテナから `ops/tools/send_parallel_request.sh --profile modernized-dev GET /stamp/tree/9001/<variation>` を実行。Legacy/Modern とも 200 で `PublishedTreeList` を返し、`logs/d_audit_event_stamp_<variation>_{legacy,modern}.tsv` に `STAMP_TREE_<VIS>_GET`（`facilityId=9001`, `resultCount={2,1,3}`）が追記された。JMS は read-only（before/after で `messages-added` 変化なし）。Evidence: `artifacts/parity-manual/stamp/20251113Tstamp<Variation>PlanZ1/`（HTTP/headers/meta, `logs/d_audit_event_stamp_<variation>_{legacy,modern}.tsv`, `logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt`, `logs/send_parallel_request.log`）。facility ミスマッチ検証（`RUN_ID=20251113TstampPublicPlanZ4`, `/stamp/tree/9002/public`）の WARN ログも `...Z4/logs/{legacy,modern}_warn.log` に保存済み。
- **結果サマリ（RUN_ID=`20251111T070532Z`）**
  - `PUT /appo`: Legacy/Modern=200（削除件数=1）。HTTP/headers/meta と `logs/{legacy,modern}_trace.log` を `artifacts/parity-manual/appo/20251111T070532Z/` に保存したが、`d_audit_event_{legacy,modern}.txt` は `SYSTEM_ACTIVITY_SUMMARY` のみで JMS も未出力。
  - `GET /schedule/pvt/2025-11-09`: Legacy/Modern=200 で `list` に `架空 花子` 1 件が復活。`TRACEID_JMS` へ Audit/JMS を残せていないため、`d_audit_event` と JMS 伝搬を継続検証する。
  - `PUT /odletter/letter`: Legacy=200（応答=16）、Modern=500（`fk_d_letter_module_karte` → `ARJUNA016053`）。`modern_trace_context.log` に Hibernate の FK 例外と `ARJUNA012125` を記録したが、Audit/JMS は空。
  - `GET /lab/module/WEB1001,0,5`: Legacy/Modern=200 だがボディは引き続き `{"list":null}`。`logs/d_audit_event_{legacy,modern}.txt` と `logs/jms_note.txt` はともにヒット無し。
  - `PUT /stamp/tree`: Legacy/Modern=200（RUN_ID=`20251111TstampfixZ2`）。`artifacts/parity-manual/stamp/20251111TstampfixZ2/` に HTTP/headers/meta・`logs/{legacy,modern}_trace_http.log`・`logs/d_stamp_tree_cast_migration.txt`・`logs/d_audit_event_stamp.tsv`・`logs/jms_dolphinQueue_read-resource.txt` を保存し、`rest_error_stamp_data_exception` の期待値も 200/200 へ更新した。
- **PK 揃え済み→監査/JMS 待ち**: 2025-11-11 06:23Z (`artifacts/parity-manual/db/20251111T062323Z/karte_id_check.txt`) 時点で Legacy/Modern とも `d_karte.id=10` を維持しており、RUN_ID=`20251111T070532Z` で Appo/Schedule/Letter/Lab/Stamp parity を再取得済み。今後は Elytron/JACC 修正と DTO/bytea 改修後に Audit/JMS を埋める再取得を行う。

## 2025-11-12 追記: StampTree parity（RUN_ID=`20251111TstampfixZ2`）
- helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）から `--network legacy-vs-modern_default` で CLI を実行し、`BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/openDolphin/resources` / `PARITY_HEADER_FILE=tmp/parity-headers/stamp_20251111TstampfixZ2.headers` / `TRACE_RUN_ID=20251111TstampfixZ2` で `PUT /stamp/tree` および `rest_error_stamp_data_exception` を同時採取。証跡は `artifacts/parity-manual/stamp/20251111TstampfixZ2/{stamp_tree,rest_error_stamp_data_exception,PUT_stamp_tree}` に格納した。
- Legacy: `logs/d_stamp_tree_cast_migration.txt` の follow-up 手順どおり `bytea_to_oid(bytea)` 関数と暗黙キャストを再適用し、HTTP 200 を維持。ただし `d_audit_event` と JMS は依然として空。
- Modernized: `SubscribedTreeModel` を PU へ再登録した WAR で UnknownEntity を解消。`logs/d_audit_event_stamp.tsv` に `STAMP_TREE_PUT`（id=58/60/62, requestId=parity-stamp-20251111TstampfixZ2）が追加され、`logs/jms_dolphinQueue_read-resource.txt` では `messages-added=2L`, `message-count=0L` を確認した。`artifacts/parity-manual/db/20251111TstampfixZ2/{legacy,modern}/` には `d_audit_event_before_seq_reset.csv` / status / seq_reset / validation ログを保存し、TRACEID_JMS Runbook §5.4 に参照リンクを追記。
- `rest_error_stamp_data_exception`: README / CSV を 200/200 へ更新し、`tmp/parity-letter/stamp_tree_payload.json` の `versionNumber` を 4 に揃えた。今後は Legacy 側 Audit/JMS 実装と Modernized の `GET /stamp/tree/{userPk}` 500 を残課題として `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` / Runbook でフォローする。
- **2025-11-11 Claim send / trace_http_{400,401} 認証パス改修**:  
    - `server-modernized/rest/LogFilter.java` に facility 合成フォールバックと `sendUnauthorized()`（401 + `WWW-Authenticate`）を追加し、Legacy 側 `resolvePrincipalUser()` も単一ユーザー名を許容するよう調整。  
    - `SystemResource#getActivities` が `parseActivityRequest()` で入力検証を完結させ、監査を呼ぶ前に `BadRequestException` を返すことで `jakarta.transaction.RollbackException` → 500 を解消。  
    - `TouchRequestContextExtractor` / `TouchAuthHandler` に `/touch/user/{user,fid,password}` パス由来の fallback と Unauthorized 変換を実装し、`trace_http_401` と `claim_send` で Legacy=401 / Modern=403 の乖離を是正。  
    - 再検証タスク: `TRACE_RUN_ID=20251111TclaimfixZ` を採番し、`ops/tools/send_parallel_request.sh --profile compose trace_http_{400,401}` および `--profile modernized-dev claim_send` を再走。証跡は `artifacts/parity-manual/TRACEID_JMS/20251111TclaimfixZ/{trace_http_400,trace_http_401,claim_send}/` へ保存し、`docs/server-modernization/phase2/notes/domain-transaction-parity.md` / `operations/TRACE_PROPAGATION_CHECK.md` へリンクを追記する。
- 全ケースで `d_audit_event` は Legacy=空／Modern=`SYSTEM_ACTIVITY_SUMMARY` のみ、JMS も未発火だったため `logs/jms_note.txt` に状況を記録。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` §4/付録A および `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 行に RUN_ID と残課題（Audit/JMS、Letter FK、Lab 空レスポンス、Stamp 変換エラー）を反映した。
- 証跡: `artifacts/parity-manual/{appo|schedule|letter|lab|stamp}/20251110TnewZ/` と `artifacts/parity-manual/{appo|schedule|letter|lab|stamp}/20251111T070532Z/`（HTTP/headers/meta/`logs/{legacy,modern}_trace*.log`/`modern_trace_context.log`/`d_audit_event_{legacy,modern}.txt`/`jms_note.txt`）。前 RUN (`20251110T234440Z`) も比較用に保持。
- `rest_error_scenarios.manual.csv` / `ops/tests/api-smoke-test/README.manual.md` に RUN_ID=`20251111T070532Z` のヘッダー（MD5 password, TraceId 命名, `Content-Type`）と新規証跡パスを追記し、`tmp/parity-headers/<case>_<RUN_ID>.headers` の複製だけで `rest_error_letter_fk` / `rest_error_lab_empty` / `rest_error_stamp_data_exception` を再実行できるよう更新した。
- **StampTree GET variations（RUN_ID=`20251111TstampfixZ4`〜`Z6`）**
  - helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）を `--network host` で起動し、`./ops/tools/send_parallel_request.sh --profile compose GET /stamp/tree/9001/<variation>` を public/shared/published の順に実行。`PARITY_HEADER_FILE=tmp/parity-headers/stamp_tree_<variation>_<RUN_ID>.headers` と `PARITY_OUTPUT_DIR=artifacts/parity-manual/stamp/<RUN_ID>` を設定し、HTTP/headers/meta は `stamp_tree_<variation>/{legacy,modern}/` に保存した。
  - HTTP は Legacy/Modern とも全 variation で `404 Not Found`（Content-Length 0、`X-Trace-Id: parity-stamp-tree-<variation>-<RUN_ID>` はレスポンスに残存）。`StampResource` には `/stamp/tree/{facility}/{public|shared|published}` が未実装で、既存の `/stamp/published/tree` 等が現行ルートとなっている。
  - `logs/d_audit_event_stamp_<variation>_{legacy,modern}.tsv` は既存 `STAMP_TREE_PUT` のみで TraceId `parity-stamp-tree-<variation>-*` 行は追加されず。`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,}` も Modern `messages-added=5L`、Legacy `messages-added=0L` のまま変化なし（Legacy queue は `consumer-count=0` 継続）。
  - 証跡: `artifacts/parity-manual/stamp/20251111TstampfixZ4/`（public）、`...Z5/`（shared）、`...Z6/`（published）。`TRACEID_JMS_RUNBOOK.md` Appendix A に helper コマンドと JMS/Audit 採取手順を追記済み。
  - 次アクション: `domain-transaction-parity.md` Appendix A.5 に結果を反映し、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4-2 backlog へ「`StampResource` に `/stamp/tree/{facility}/{public|shared|published}` を追加するか、UI/API を既存ルートへ切り替える」課題を追加する。HTTP 200 + Audit/JMS 記録が得られる正規ルートを設計する。

## 2025-11-11 追記: Trace Harness RUN_ID=20251111T110107Z（Legacy LogFilter null ガード展開）
- `scripts/start_legacy_modernized.sh down && start --build` で Legacy WildFly10 を差し替えたのち、helper コンテナ（`docker run --network legacy-vs-modern_default -v "$PWD":/workspace ...`）から `ops/tools/send_parallel_request.sh` を再実行。Trace Harness は `--profile compose`（`BASE_URL_{LEGACY,MODERN}=http://opendolphin-{server,server-modernized-dev}:8080/...`）、rest_error は `--profile modernized-dev` で送信した。
- **Evidence インベントリ**: `artifacts/parity-manual/TRACEID_JMS/20251111TtracefixZ/trace_http_{400,401,500}/{legacy,modern}/` に HTTP/headers/meta を保存し、同 RUN の `logs/` に `send_parallel_request.log`, `legacy_trace_http.log`, `modern_trace_http.log`, `logfilter_env.txt`, `d_audit_event_latest.tsv`, `jms_dolphinQueue_read-resource.txt` をまとめた（前 RUN_ID=`20251111T091717Z` は比較用に残置）。`jms_dolphinQueue_read-resource.txt` は `messages-added=0L` のままで、本 RUN でも JMS 未到達であることを明記。
- **Trace Harness 結果（RUN_ID=`20251111T110107Z`）**
  - `trace_http_200`: 再送なし。09:17Z の証跡（Legacy/Modern=200）を継続利用。
  - `trace_http_400`: Legacy/Modern=400（`BadRequestException`）。`d_audit_event_latest.tsv` に request_id=`trace-http-20251111T091717Z` が 2 件追加されたが JMS は 0 件。
  - `trace_http_401`: Legacy=200（LogFilter が Touch 認証レイヤを素通り）/ Modern=403。両 DB の `d_audit_event` は 0 行で、`modern_trace_http.log` に `Unauthorized user: ... traceId=trace-http-20251111T091717Z` の WARN が残った。
  - `trace_http_500`: Legacy=500（`NumberFormatException` → SessionOperationInterceptor ERROR）/ Modern=400（`Not able to deserialize data provided`）。Modern 側は引き続き Audit/JMS 未到達。
- **rest_error 再取得（RUN_ID=`20251111TrestfixZ`）**
  - `rest_error_letter_fk`: Legacy=200（戻り値 18）/ Modern=200（戻り値 -38）。`artifacts/parity-manual/letter/20251111TrestfixZ/` に HTTP/headers/meta と `logs/{legacy,modern}_trace_http.log`／`logs/d_audit_event_{legacy,modern}.txt`／`logs/d_audit_event_letter.tsv`／`logs/jms_dolphinQueue_read-resource.txt` を保存。監査/JMS は TraceId 行 0 件。
- `rest_error_lab_empty`: Legacy/Modern=200 かつ `response.json={"list":[]}`。`artifacts/parity-manual/lab/20251111TrestfixZ/` へ同様のログセットを配置し、DTO ギャップは解消済みだが Audit/JMS は未達。
- - ✅ **Letter/Lab Audit RUN_ID=`20251115TletterAuditZ1` / `20251115TlabAuditZ1`**:
  - helper コンテナ（`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace buildpack-deps:curl bash`）から `ops/tools/send_parallel_request.sh --profile modernized-dev` を実行し、`PARITY_HEADER_FILE=tmp/parity-headers/{letter,lab}_<RUN_ID>.headers` と `PARITY_OUTPUT_DIR=artifacts/parity-manual/{letter,lab}/<RUN_ID>` を指定。`rest_error_letter_audit` は Legacy/Modern=200 で `LETTER_CREATE` が Modern `d_audit_event`（id=82）へ保存され、`messages-added` が 0L→1L。`rest_error_lab_audit` は Modern=200／Legacy=404（seed 未適用）で `LAB_TEST_READ`（id=84, resultCount=0）が追加され、`messages-added` が 1L→2L。
  - 証跡: `artifacts/parity-manual/{letter,lab}/20251115T*` に HTTP/headers/meta と `logs/{send_parallel_request.log,d_audit_event_{legacy,modern}.tsv,jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt}` を集約。`TRACEID_JMS_RUNBOOK.md §5.8` / `domain-transaction-parity.md §4` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を更新済みで、`rest_error_scenarios.manual.csv` の `letter_lab_audit_status` を DONE に変更。
  - TODO: Legacy DB へ `d_nlabo_*` seed を再投入して 404→200 を確認し、Legacy `AuditTrailService` 連携を別タスクで復旧する。

- 🚧 **rest_error_stamp/Audit 修正（実行結果と残課題）**: `LetterServiceBean` フォールバック / `NLaboModuleListConverter` 空配列 / `StampTree` bytea / `reset_d_audit_event_seq.sql` を適用したうえで RUN_ID=`20251111TrestfixZ` を採取。Legacy/Modern 両 Postgres でシーケンス調整ログ（`artifacts/parity-manual/db/20251111TrestfixZ/{legacy,modern}/audit_event_{backup.csv,validation_log.txt,status_log.txt}`）を確保し、`tmp/claim-tests/claim_20251111TrestfixZ.headers` + `send_claim_success.json` で `/20/adm/eht/sendClaim` を送信したが Legacy=401 / Modern=403 のまま `messages-added=0L` に留まった。次ステップは Claim 認証の再調整と JMS message-count>0L の採取、Stamp Legacy 500 → 200 化である。
- `ops/db/local-baseline/reset_d_audit_event_seq.sql` を追加し、`\copy d_audit_event` → `setval('d_audit_event_id_seq', next_id, true)` → `INSERT ... 'SEQ_SMOKE' RETURNING id` を 1 ファイルで実行できるようにした。`TRACE_PROPAGATION_CHECK.md §7` / `TRACEID_JMS_RUNBOOK.md §5.3` へも該当パスを追記済み。

### 2025-11-11 追記: TRACEID_JMS メトリクス 0L 再確認
- RUN_ID=`20251111TrestfixZ` の `artifacts/parity-manual/TRACEID_JMS/20251111TrestfixZ/logs/jms_dolphinQueue_read-resource.{before,}.txt` はどちらも `message-count=0L` / `messages-added=0L`。JMS キューは稼働しているが `PUT /20/adm/eht/sendClaim` が Legacy=401 / Modern=403 で失敗し、メッセージ投入に至っていない。
- **RUN_ID=`20251111TclaimfixZ`（2025-11-12 03:45JST）**: `reset_d_audit_event_seq.sql` の tee 依存を外した `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql` を用いて Legacy/Modern DB のシーケンスを再採番し、`artifacts/parity-manual/db/20251111TclaimfixZ/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` を更新したうえで `ops/tools/send_parallel_request.sh --profile modernized-dev PUT /20/adm/eht/sendClaim claim_send` を helper コンテナから実行。`claim_send/http/{legacy,modern}/headers.txt` はいずれも `HTTP/1.1 401` + `WWW-Authenticate: Basic` を記録し、Modern 側には `Strict-Transport-Security` など追加セキュリティヘッダーが出力されたが `logs/jms_dolphinQueue_read-resource.{before,}.txt` は引き続き `messages-added=0L`。`logs/d_audit_event_claim.tsv` も 2025-11-10 の `EHT_CLAIM_SEND` 1 行のみで、TraceId=`trace-jms-20251111TclaimfixZ` の audit 行は生成されていない。
- **RUN_ID=`20251111TclaimfixZ2`（2025-11-12 06:30JST）**: `userName=1.3.6.1.4.1.9414.72.103:doctor1`／`password=632080fab...4648`／`Authorization: Basic RjAwMTptYW5hZ2VyMDE6cGFzc3dvcmQ=` を付与した新ヘッダーと `send_claim_success_20251111TclaimfixZ2.json` を用意し、`ops/db/local-baseline/reset_d_audit_event_seq_batch.sql` 実行後の `artifacts/parity-manual/db/20251111TclaimfixZ2/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` でシーケンス証跡を更新。`docker run --network legacy-vs-modern_default ... send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim claim_send` を 3 回試行した結果、Legacy は `/20/adm/eht/sendClaim` 未実装のため `HTTP/1.1 404`、Modern は JMS enqueue 後に `d_audit_event_pkey (id=59)` 衝突で `HTTP/1.1 500`。それでも `logs/jms_dolphinQueue_read-resource.{before,after}.txt` は `messages-added=2L→3L` を記録し、Trace から JMS までは貫通済みと確認。一方 `logs/d_audit_event_claim.tsv` には新規 `EHT_CLAIM_SEND` 行が無く、AuditTrailService 側の PK 衝突がボトルネックのまま。Legacy エンドポイント実装と Audit PK 修復を blockers として `TRACE_PROPAGATION_CHECK.md §7`／`TRACEID_JMS_RUNBOOK.md §5.4` に追記した。
- **RUN_ID=`20251111TclaimfixZ3`（2025-11-12 08:37JST）**: Legacy に `/20/adm/eht/sendClaim` を移植し、`IDocInfo` の `PVTHealthInsuranceModel` null ガード＋`ClaimSender` の Logger 初期化 null-safe 化を実装。Modern 側は `common/src/main/java/open/dolphin/infomodel/AuditEvent.java` に `@SequenceGenerator(name=\"AuditEventSeq\", sequenceName=\"d_audit_event_id_seq\")` を追加し、Flyway `V0226__audit_event_sequence_owned.sql` を投入した。`ops/db/local-baseline/reset_d_audit_event_seq_batch.sql` で Legacy/Modern 両 DB のシーケンスをリセットし、`artifacts/parity-manual/db/20251111TclaimfixZ3/{legacy,modern}/audit_event_{backup.csv,status_log.txt,validation_log.txt}` を更新。helper コンテナから `PARITY_HEADER_FILE=tmp/claim-tests/claim_20251111TclaimfixZ3.headers`・`PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_20251111TclaimfixZ3.json` を指定して `ops/tools/send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim claim_send` を再送した結果、Legacy/Modern とも `HTTP/1.1 200`（`TRACEID_JMS/20251111TclaimfixZ3/claim_send/claim_send/{legacy,modern}/`）。Modern JMS は `messages-added=4L→5L` / `message-count=0L`（`logs/jms_dolphinQueue_read-resource.{before,after}.txt`）となり、`logs/d_audit_event_claim.tsv` には `id=80/79/78` の `EHT_CLAIM_SEND` が追記された。
- `claim_send/http/{legacy,modern}/meta.json` と `logs/send_parallel_request.log` には上記 401/403 が記録され、`logs/legacy_trace_http.log` / `logs/modern_trace_http.log` も同 TraceId の WARNING のみ。`logs/d_audit_event_claim.tsv` では 2025-11-10 の `EHT_CLAIM_SEND` 1 行だけが残り、新規レコードは追加されていない。
- `TRACEID_JMS_RUNBOOK.md §5.4` と `ops/tests/api-smoke-test/README.manual.md` に今回の実績と次回手順（ヘッダー差し替え、JMS before/after ログ、`PARITY_OUTPUT_DIR=.../claim_send`）を反映済み。次回は Claim 認証を通し、`messages-added>0L` と `d_audit_event_latest.tsv` の更新を Evidence 化する。
- **再取得前のチェックリスト（RUN_ID=`TRACE_RUN_ID`）**: ① `tmp/claim-tests/claim_${RUN_ID}.headers` を新規作成し `X-Trace-Id: trace-jms-${RUN_ID}`・`X-Run-Id: ${RUN_ID}`・`X-Claim-Debug: enabled` を追記、`PARITY_HEADER_FILE` にセットする。② `tmp/claim-tests/send_claim_success.json` の `issuerUUID`/`memo`/`docId`/`labtestOrderNumber`/bundle `memo` に残る旧 RUN_ID（例: `20251111TrestfixZ`）を全て置換し `TRACE_RUN_ID` と一致させる。③ Legacy/Modernized 両 DB で `ops/db/local-baseline/reset_d_audit_event_seq.sql` を実行して `artifacts/parity-manual/db/${RUN_ID}/{legacy,modern}/audit_event_{backup.csv,validation_log.txt,status_log.txt}` を確保し、`logs/d_audit_event_latest.tsv` が 2025-11-10 05:18 JST 以前で止まっていないことを確認する。④ JMS CLI `/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource` を実行し `logs/jms_dolphinQueue_read-resource.before.txt` で 0L を証跡化 → `/20/adm/eht/sendClaim` 実行後に `logs/jms_dolphinQueue_read-resource.txt` を再取得する。⑤ `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` 配下に `claim_send/` を作り、HTTP 応答 / `logs/send_parallel_request.log` / `logs/d_audit_event_claim.tsv` を分離保存。⑥ 完了後は本節と `TRACEID_JMS_RUNBOOK.md §5.4`、`docs/web-client/planning/phase2/DOC_STATUS.md` の対象行を「JMS sendClaim 再取得準備完了（実行待ち）」に更新し、messages-added>0L へ変化したタイミングを Runbook へ追記する。

- ✅ **rest_error parity 修正をコードへ反映**: `ops/db/local-baseline/reset_d_audit_event_seq.sql` に `:audit_event_status_log` 出力と `LOCK TABLE` を追加し、Runbook §5.3(2)(3) の取得ログをワンコマンド化。`LetterServiceBean` では `patientId/facility` から `KarteBean` を再解決するフォールバックを実装、`NLaboModuleListConverter` は空配列 `[]` を返却、`StampTreeModel` / `PublishedTreeModel` は `@JdbcTypeCode(SqlTypes.BINARY)` で PostgreSQL `bytea` に合わせた。Docker 再デプロイ後に `rest_error_{letter_fk,lab_empty,stamp_data_exception}` を再取得し、`artifacts/parity-manual/{letter,lab,stamp}/<new RUN_ID>/` と `TRACE_PROPAGATION_CHECK.md` / `rest_error_scenarios.manual.csv` を更新すること。
- ⚠️ **trace_http_{401,500} コード改修**: `server/src/main/java/open/dolphin/rest/LogFilter.java` に facility ヘッダー由来の principal 補完を追加し、`server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java` / `.../TouchAuthHandler.java` / `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java` / `common/src/main/java/open/dolphin/converter/KarteBeanConverter.java` を null-safe 化して 401/500 シナリオが本来の経路で失敗するようにした。Docker/WildFly が再起動できる環境を確保したら `ops/tools/send_parallel_request.sh --profile compose trace_http_{401,500}` を再実行し、`artifacts/parity-manual/TRACEID_JMS/<next-run>/trace_http_{401,500}/`・`TRACE_PROPAGATION_CHECK.md`・`domain-transaction-parity.md`・`rest_error_scenarios.manual.csv` を更新する（現在は Docker Desktop 未導入で未検証）。

#### trace_http 再取得準備完了（ビルド待ち）
- **RUN_ID**: `20251111TtracefixZ` を予約し、`TRACE_RUN_ID`／`--run-id` で指定できるよう `ops/tools/send_parallel_request.sh` と `tmp/trace_http_{200,400,401,500}.headers` をテンプレ化（`{{RUN_ID}}` 展開）。
- **テスト手順**: Docker/WildFly 再ビルド後に `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/20251111TtracefixZ` をセットし、`send_parallel_request.sh --profile compose --run-id 20251111TtracefixZ GET /serverinfo/jamri trace_http_200` から `trace_http_500` まで順に実行。401 ケースは Legacy/Modernized 共に 401 + `WWW-Authenticate`、500 ケースは Legacy/Modernized 共に `Content-Type: text/plain`（例外本文そのまま）となる想定を `rest_error_scenarios.manual.csv` に記録済み。
- **証跡保存計画**: `artifacts/parity-manual/TRACEID_JMS/20251111TtracefixZ/trace_http_{status}/{legacy,modern}/` と `logs/{legacy,modern}_trace_http.log`, `logs/jms_trace_http_{status}.txt`, `logs/d_audit_event_{legacy,modern}.txt` を同 RUN_ID で揃え、Checklist #49/#73/#74 の Evidence を差し替える。現状はビルド待ちで CLI 実行前。
- **rest_error_stamp/Audit 改修（コード完了・証跡待ち）**: 追加差分（LetterServiceBean フォールバック / NLabo 空配列 / StampTree bytea / `reset_d_audit_event_seq.sql`）は master に反映済み。検証 RUN（予定 `RUN_ID=20251111TrestfixZ`）では、(1) `scripts/start_legacy_modernized.sh start --build` で両サーバーを更新し、(2) Legacy/Modern の Postgres で `psql -v audit_event_backup_file='/tmp/d_audit_event_before_seq_reset_${RUN_ID}.csv' -v audit_event_validation_log='/tmp/d_audit_event_seq_validation_${RUN_ID}.txt' -v audit_event_status_log='/tmp/d_audit_event_seq_status_${RUN_ID}.txt' -f ops/db/local-baseline/reset_d_audit_event_seq.sql` を実行→生成ログを `artifacts/parity-manual/db/${RUN_ID}/` へ保存し、(3) `ops/tools/send_parallel_request.sh --profile modernized-dev` で `rest_error_{letter_fk,lab_empty,stamp_data_exception}` を再送して `logs/d_audit_event_{legacy,modern}.txt` / `logs/jms_note.txt` を埋める、(4) `TRACE_PROPAGATION_CHECK.md` / `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` / `rest_error_scenarios.manual.csv` へ結果を反映する──という順で Audit/JMS 証跡を揃える。現時点ではビルド・Docker 再起動および CLI 実行は未着手で、コードと Runbook の整備で停止していることを明記。
## 2025-11-10 追記: JPQL トランザクション差分レビュー（担当: Codex）
- `domain-transaction-parity.md §3` に `20251110T034844Z` 再取得結果（`ops/tools/send_parallel_request.sh --profile compose` 実行ログとブロッカー）および Legacy/Modernized の TX/JPQL/persistence 差分マトリクスを追加。`server-modernized/src/main/resources/META-INF/persistence.xml` に `PatientVisitModel` / `AppointmentModel` が登録されていないため `UnknownEntityException` が継続する点、`SessionOperationInterceptor` により例外が `SessionServiceException` として `traceId` ログへ集約される点を明文化した。
- `artifacts/parity-manual/JPQL/20251110T034844Z/README.md` に再取得コマンドと `sha256sum`、Docker Desktop 不在で `curl (7)` が発生した証跡を保存。`rest_error_scenarios.manual.csv` へ `rest_error_chart_summary_seed_gap` を追記し、`chart_summary` ケースと `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md#テスト患者データ投入` をリンク付けした。
- 次アクション: (1) Modernized `persistence.xml` に `PatientVisitModel` / `AppointmentModel` / 関連 infomodel を列挙し再ビルド、(2) `opendolphin_modern` に `WEB1001` 系シードを再投入し `/chart/WEB1001/summary` を含む 4 ケースを再取得、(3) `d_audit_event` と Hibernate SQL を `artifacts/parity-manual/JPQL/<new ts>/` に保存して `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #65 をクローズする。

## 2025-11-10 追記: SessionOperation Trace Harness RUN_ID=20251110T070638Z
- `trace_http_{200,400,401,500}`／`trace-{schedule,appo}-jpql` を `ops/tools/send_parallel_request.sh --profile compose` で再実行したが、Legacy/Modernized いずれも `curl: (7) Failed to connect to localhost port {8080,9080}` で停止。HTTP/JPQL/JMS ログは生成されず、`artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/trace_*/meta.json` には `status_code=000`, `exit_code=7` が記録された。
- 証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/README.md` と `logs/send_parallel_request.log` で共有。`docker ps` が `The command 'docker' could not be found in this WSL 2 distro.` を返しており、Docker Desktop↔WSL 統合を有効化しない限り Trace Harness を再取得できない。
- ⚠️ **リスク（SessionOperationInterceptor 適用漏れ）**: `rg --files -g '*ServiceBean.java' server-modernized/src/main/java/open/dolphin` の静的解析で 22 クラス中 `open.dolphin.touch.session.{EHTServiceBean,IPhoneServiceBean}` のみ `@SessionOperation` 未付与と判明。`trace_http_401` 等 Touch 経路で SessionOperationInterceptor が起動せず traceId が記録されない。→ 2025-11-10 22:16Z（RUN_ID=20251110T221659Z）で両クラスへ付与済み＆実機確認済みだが、当節の観測時点では未解消のため記録を残す。対応チケット: (1) 両クラスへ `@SessionOperation` を追加し `TouchUserService` 配下の `getUser`, `getPatientsByPvtDate` などを MDC 連携対象にする、(2) 4xx/5xx 例外時に INFO ログへ traceId を必ず吐き出すよう SessionOperationInterceptor/SessionTraceManager のログレベルを見直す。
- 次アクション: Docker 統合後に RUN_ID を更新して Trace Harness を再実行、`TRACE_PROPAGATION_CHECK.md` §7 および `domain-transaction-parity.md §2.1` のブロッカー記録をクローズする。

## 2025-11-10 追記: Trace Harness RUN_ID=20251110T122644Z（`--profile modernized-dev`）
- helper コンテナを `legacy-vs-modern_default` ネットワークへ接続し `send_parallel_request.sh --profile modernized-dev` を実行。証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T122644Z/README.md`（HTTP/trace/JMS/Audit）および `artifacts/parity-manual/rest-errors/20251110T122644Z/README.md`（REST 例外ログ）に整理。
- **結果:** Modernized = `200 (jamri) / 400 (/dolphin/activity) / 500 (/touch/user) / 400 (/karte/pid/INVALID)`、Legacy = `500 / 500 / 500 / 200`。Legacy は `LogFilter#password.equals(...)` が null で `UT005023` となり 400/401/200 ケースが再現できない。Modernized の 401 は `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げ 500 で終了、500 ケースは `KarteBeanConverter["id"]` NullPointer → `RESTEASY-JACKSON000100`。
- **ログ連携:** `modern_trace_http.log` では helper/ホスト双方の `trace-http-*` が INFO 出力された一方、`d_audit_event_trace-http-*.sql` は全て 0 行で Trace ID の突合不可が継続。`jms_dolphinQueue_read-resource.txt` は `messages-added=1L`, `message-count=0L`, `DLQ=[]` のままで JMS フローには到達せず。Legacy 側の trace ログは引き続き空。
- **アクション:** (1) Legacy `LogFilter` を null-safe 化し、匿名アクセスでも `AbstractResource` まで進める。(2) Touch 系は `AbstractResource#getRemoteFacility` と同等の防御を使うか、`@SessionOperation` 未付与の `EHTServiceBean`/`IPhoneServiceBean` に付与して 401 経路で SessionTraceManager を起動。(3) `KarteBeanConverter` と `persistence.xml` を修正して 500 を本来の `SessionServiceException` に揃える。(4) `d_audit_event` へ `trace_id` カラム or JSON 埋込を追加し、`TRACEID_JMS_RUNBOOK.md` / `TRACE_PROPAGATION_CHECK.md §8` の TODO を解消する。

## 2025-11-10 追記: Trace Harness RUN_ID=20251110T133000Z（`--profile compose`）
- `tmp/trace_http_{200,400,500}.headers` を `PARITY_HEADER_FILE` に指定して `send_parallel_request.sh --profile compose GET ...` を実行。成果物は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/README.md` 配下（HTTP 応答 / logs/modern_trace_http.log / logs/jms_*.txt / `d_audit_event.log`）へ集約。
- **結果:** Modernized = `200 (/serverinfo/jamri)` / `400 (/dolphin/activity)` / `400 (/karte/pid/INVALID)`、Legacy = `200 / 500 / 200`。Modernized の 400 ケースでは `d_audit_event` に `SYSTEM_ACTIVITY_SUMMARY` が記録されるが TraceId は未埋込。Legacy 400 ケースは `LogFilter#password.equals` NPE で HTML 500。
- **Audit/JMS:** `logs/d_audit_event_trace-http-200.sql` と `..._trace-http-500.sql` は 0 行、`..._trace-http-400.sql` には id=-41〜-43 が保存され `d_audit_event_id_seq` が負値で停滞していることを確認。`jms_dolphinQueue_read-resource.txt` は `messages-added=1L`, `message-count=0L`, `DLQ=[]` のまま。これらを次回 RUN の比較ベースとして `d_audit_event.log` に保存。
- **既知バグ（AuditTrail ID 衝突）:** `d_audit_event_id_seq` を再採番すると `d_audit_event_pkey` と衝突し Modernized 側の `trace_http_{400,500}` も 500 (`duplicate key value violates unique constraint`) になることが過去 RUN で判明しているため、今回の README／`rest_error_scenarios.manual.csv`／`TRACE_PROPAGATION_CHECK.md` に注意書きを追加。次 RUN では再採番後の 500 を採取予定。
- **アクション:** (1) AuditTrailService で TraceId を payload に保存する or `d_audit_event` に専用カラムを追加し突合可能にする。(2) `KarteBeanConverter` を null-safe 化し `trace_http_500` を 500 で揃える。(3) Legacy `LogFilter` の匿名時 NPE/401 応答は 2025-11-11 パッチ済み（Docker 再ビルド後に検証）。(4) `d_audit_event_id_seq` の正常化と再採番手順を `TRACEID_JMS_RUNBOOK.md` に反映したうえで再取得する。

## 2025-11-10 追記: Trace Harness RUN_ID=20251110T221659Z（`--profile compose`）
- `ops/tools/send_parallel_request.sh --profile compose` で `trace_http_{200,400,401,500}` を 2 ループ再実行。成果物は `artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/README.md`（HTTP 応答／`logs/send_parallel_request.log`／`logs/modern_trace_http.log`／`logs/d_audit_event_trace-http-*.sql`／`logs/jms_*.txt`）。
- **結果:** Legacy = `500/403/500/403`, Modernized = `403/403/403/403`。Modern 側 WildFly は `Unauthorized user: {null|doctor1}` WARN とともに `traceId=trace-http-*` を記録し、Touch/EHT の `@SessionOperation` が AOP 適用されたことを実証。Legacy 側は相変わらず trace ログなし。
- **ヘッダー/ログ差分:** `trace_http_*/modern/headers.txt` はすべて `X-Trace-Id: trace-http-*` を返却し、`logs/modern_trace_http.log` に WARN が 2 ループ分出力された。Legacy 側 `headers.txt` は Trace ID が空で `logs/legacy_trace_http.log` も 0 バイトのため、`LogFilter` fallback が Modernized のみ機能している事実を Checklist #72 と Runbook §4 へ共有。
- **監査/JMS:** `d_audit_event` は -41〜-43 の既存 `SYSTEM_ACTIVITY_SUMMARY` から更新なしで、`logs/d_audit_event_trace-http-{200,401,500}.sql` は 0 行。`jms_dolphinQueue_read-resource.txt` は `messages-added=0L`, `message-count=0L`, `delivering-count=0`, `logs/jms_DLQ_list-messages.txt` は空配列で、GET 系トレースでは JMS へ進まないことを再確認。
- **監査シーケンス:** `d_audit_event.log` には ID=-41〜-47 しか存在せず `d_audit_event_id_seq` も進んでいない。`logs/d_audit_event_seq_status.txt` へ `select min/max(id)` と `select last_value from d_audit_event_id_seq` の結果を記録し、`ALTER SEQUENCE ... RESTART` で再採番すると PK が衝突するリスクを Runbook／TRACE_PROPAGATION_CHECK.md に転記した。
- **TODO:** (1) `UserServiceBean#authenticate` と `LogFilter#password.equals` を null-safe 化し、400/401/500 ケースを期待ステータスに戻す。(2) `d_audit_event` へ `trace_id` を永続化しつつ `d_audit_event_id_seq` の負 ID を是正する。(3) Legacy 側にも trace ログを追加して HTTP → Session → JMS → Audit を貫通させる。対応状況は `TRACE_PROPAGATION_CHECK.md` §7.3/§8.3、`TRACEID_JMS_RUNBOOK.md` §7、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #72 に反映済み。

## 2025-11-10 追記: Smoke base_readonly RUN_ID=20251110T132800Z（担当: Codex）
- `ops/tests/api-smoke-test/run.sh --scenario base_readonly --dual --profile compose` を実施し、成果物を `artifacts/parity-manual/smoke/20251110T132800Z/` に保存。直前の RUN_ID=`20251110T132702Z`（BASE_URL 誤設定）も 404/connection refused ケースの再現ログとして残した。
- **結果:** Legacy `/dolphin` / `/serverinfo/jamri` / `/mml/patient/list/...` はすべて 200。Modernized 9080 側は 3 ケースとも HTML 404 を返し、`docker ps` では `opendolphin-server-modernized-dev` が `STATUS=Up ... (unhealthy)`。`curl -i http://localhost:9080/openDolphin/resources/dolphin` も healthcheck と同じ 404 で、`open-dolphin-webservice.war` が未展開（または異なる context path）と判断。
- **監査ログ:** `artifacts/parity-manual/audit/20251110T132800Z/{legacy,modern}_d_audit_event.log` を追加。Legacy `d_audit_event` は空、Modernized は 21:32 JST の `SYSTEM_ACTIVITY_SUMMARY` など過去分しか無く、今回の `base_readonly_*` requestId は記録されていない。アプリ未展開状態では `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ6/7 の監査ログタスクが進まない。
- **ブロッカー / TODO:** (1) `server-modernized-dev` の WildFly ログで `Deployment "open-dolphin-webservice.war"` を確認し、失敗していれば Dockerfile / `standalone-opendolphin.xml` の配置を修正、(2) healthcheck が 200 になるまで 9080 の 404 を監視し、復旧後に base_readonly → TRACE/JMS 系へ横展開、(3) 成功後は `docs/server-modernization/phase2/notes/test-data-inventory.md §2.4` の監査ログ記録と `rest_error_scenarios.manual.csv` の参照 RUN_ID を更新する。
- 詳細サマリは `docs/server-modernization/phase2/notes/touch-api-parity.md §10.2.1` に、監査ログ欠落の整理は `docs/server-modernization/phase2/notes/test-data-inventory.md §2.4` に追記済み。

## 2025-11-10 追記: DocumentModel/persistence + Trace Harness RUN_ID=20251110T133000Z（担当: Codex）
- DocumentModel 依存エンティティ（ModuleModel/SchemaModel/AttachmentModel）を `server-modernized/src/main/resources/META-INF/persistence.xml` に列挙し、`server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` によって Modernized DB 側に `d_document`/`d_module`/`d_image`/`d_attachment` を投入することで、DocumentModel が参照するテーブルの欠損による `UnknownEntityException` を回避する土台を整備した。
- 次に立てる RUN_ID=`20251110T133000Z` では `tmp/trace_http_200.headers` を使って trace harness を再取得し、HTTP/Trace/JMS/`d_audit_event` を `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` へ記録する計画。`trace_http_{400,500}` は AuditTrail ID 衝突バグのため Modernized が 500 を返す既存の問題として README へ注記済みで、この RUN でも同様の結果が想定される。
- Modernized AuditTrailService が `eventHash` 想定の軽量クエリに切り替わっている点を踏まえ、RUN_ID=`20251110T133000Z` で `d_audit_event_id_seq` の再採番挙動を追跡できるよう `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/d_audit_event.log` を備える予定。現時点では `d_audit_event` に TraceId が残らず `SYSTEM_ACTIVITY` だけが出力されるため、この監査欠落を DocumentModel/persistence の改善ブロッカーとして追跡している。
- 次アクション: Modern WildFly を再ビルドし `docker compose -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` を起動したうえで `GET /schedule/pvt/2025-11-09` を trace ヘッダー付きで実行し、HTTP 200 と `d_audit_event`/JMS TraceId の記録を確認する。結果およびログ類は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/` 配下へ保存し、`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md`・`docs/server-modernization/phase2/notes/domain-transaction-parity.md`・`docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID・ブロッカー・次アクション（Docker 操作保留）を含めて整理する。

## 2025-11-10 追記 Secrets 欠落再現準備（担当: Codex）
- `tmp/secrets-repro/missing_factor2.env:23` と `tmp/secrets-repro/missing_sysad.env:9-10` に空白文字を埋め込み、docker-compose の `${VAR:-default}` がブランクを上書きする挙動をバイパスできるよう整備。`docs/server-modernization/phase2/notes/ops-observability-plan.md` の Secrets 表にも反映し、Factor2/SYSAD 欠落を実機へ伝播させる前提条件をクリアした。
- `scripts/start_wildfly_headless.sh --env-file tmp/secrets-repro/base.env down` を WSL 上で試行したが、当該ディストリビューションに `docker` / `docker-compose` が導入されておらず `The command ''docker-compose'' could not be found in this WSL 2 distro...` で停止。WildFly 起動・`ops/tests/security/factor2/*.http`・Micrometer 取得を伴う 4 パターン（baseline / DB secret 欠落 / Factor2 欠落 / SYSAD 欠落）は未着手のまま。
- 次アクション: Docker Desktop 連携済みの Mac 環境へ切り替え、同 4 パターンを `scripts/start_wildfly_headless.sh` と `ops/tests/security/factor2/*.http` で再取得。証跡は `artifacts/parity-manual/secrets/<新UTC>/` へ保存し、`TRACE_PROPAGATION_CHECK.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md:76` / `PHASE2_PROGRESS.md` を同時更新する。## 2025-11-07 追記: TraceID-JMS トレース採取（担当: TraceID-JMS）
- `ops/tests/api-smoke-test/test_config.manual.csv` から `/serverinfo/version`・`/user/doctor1`・`/chart/WEB1001/summary` を Trace ID 追跡対象として選び、HTTP/JMS/セッションログを `artifacts/parity-manual/TRACEID_JMS/trace/` へ集約する運用を `docs/server-modernization/phase2/notes/ops-observability-plan.md` に追記。
- `scripts/start_legacy_modernized.sh start --build` で Modernized サーバーを起動する計画だったが、実行環境に Docker/Compose が存在せず `[ERROR] docker compose (v2) または docker-compose が見つかりません。` で停止。サーバー未起動のため `ops/tools/send_parallel_request.sh` によるケース実行とログ採取は未着手。
- ブロッカー解消後に `/serverinfo/version` などを `TraceID-JMS-*` ID で再実行し、`docker compose logs server-modernized-dev | rg traceId=` および `MessagingGateway` 出力を `artifacts/parity-manual/TRACEID_JMS/trace/` へ保存する。

## 2025-11-07 追記: Legacy-Modernized-Capture-Gate（担当: Worker #1）
- ✅ `scripts/setup_codex_env.sh` を CRLF 行末状態で実行した際の失敗、LF 変換後に root 権限を要求される事実を CLI で検証し、`artifacts/parity-manual/setup/20251107T234615Z/` にログを保存（`setup_codex_env*.log`）。root が取れない環境では事前に承認を得て `sudo` を使う必要がある旨を Runbook に記載。
- ⚙️ `docker-compose.modernized.dev.yml` の依存関係 (`db-modernized` → `server-modernized-dev`) を整理し、`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml` による起動順序・フォールバック手順・CLI 専用運用を `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` と `ops/tools/send_parallel_request.profile.env.sample` に統合。`MODERNIZED_TARGET_PROFILE` で `compose` / `remote-dev` / `custom` 切替を定義。
- 📁 証跡: `artifacts/parity-manual/setup/20251107T234615Z/compose_services.txt`（Compose サービス一覧）/`compose_profiles.txt`（有効 profile）および前述ログ一式。  
  Checklist: `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ0 #25/#26 を更新済み。

## 2025-11-08 追記: Postgres ベースライン復旧計画（担当: Worker #2）
- ✅ `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` を新規作成し、Legacy/Modernized 双方で Secrets から DDL を取得→`docker exec ... psql -f` → `flyway baseline+migrate` を流すまでの手順、`LEGACY_MODERNIZED_CAPTURE_RUNBOOK`・`TRACE_PROPAGATION_CHECK` との Gate 関係を整理。
- ✅ DDL/シード所在と不足オブジェクト一覧、調査ログを `artifacts/parity-manual/db-restore/20251108/{ddl_inventory.md,missing_objects.md,investigation.log}` に保存。`facility_num` シーケンスや `d_audit_event` 系テーブルが Secrets 側 dump にしか存在しないことを明文化。
- ⚙️ 2025-11-08T06:24Z の再トライでは `./scripts/start_legacy_modernized.sh down` → `docker volume rm legacy-vs-modern_postgres-data*` で既存環境を初期化し、`docker compose` + `psql` + `flyway/flyway:10.17` の実行ログを `artifacts/parity-manual/db-restore/20251108T062436Z/` に保存。Modernized 側は `\dt` が空、`SELECT COUNT(*) FROM d_users` 等は `relation ... does not exist`、`flyway migrate` は `V0002__performance_indexes.sql` で `ERROR: relation "appointment_model" does not exist (42P01)` となることを確認。
- ⚠️ Secrets Storage からの dump は未配布のまま。2025-11-08T07:43Z 版 `artifacts/parity-manual/db-restore/20251108T074337Z/` に `ls ~/Secrets` 失敗ログ・docker/psql/flyway 未実施の理由・次アクションを追記し、`20251108T062436Z/baseline_search.log` へ Ops/DBA 依頼テンプレも記録済み。ベースライン DDL 入手後に `psql -f` → `flyway baseline/migrate` → 成功ログを `artifacts/parity-manual/db-restore/<新UTC>/` と `artifacts/manual/audit_log.txt` へ保存する必要あり。
- ⚠️ 10:14:55Z/10:22:44Z に再確認しても Secrets は未マウントのまま。`artifacts/parity-manual/db-restore/20251108T101455Z/{README.md,investigation.log,ops_request.txt,blocked_actions.log}` へ再依頼文面・回答待ちステータス・コマンド保留理由を記録し、`baseline_search.log` にも同時刻のフォローアップを追記した。Ops/DBA からチケット ID / Slack スレッド情報が届き次第、同ログへ転記する。
- 🔁 次アクション: (1) Ops/DBA から `legacy-server/db-baseline/*.sql` および `server-modernized/db-baseline/opendolphin-modern-schema.sql` を受領→`~/Secrets/` へ配置した証跡を `artifacts/parity-manual/db-restore/<新UTC>/investigation.log` に `shasum` と共に追記、(2) Runbook 手順 3〜6 を再実施して `psql_dt_modernized.log` / `flyway_migrate_success.log` を取得し Gate #40 を閉じる、(3) クローズ後に Runbook / Checklist / `PHASE2_PROGRESS.md` / `DOC_STATUS.md` の備考を成功済みへ差し替える。

## 2025-11-10 追記: SessionOperation Trace Harness（担当: SessionOperation）
- ✅ `ops/tools/send_parallel_request.sh --profile compose --loop 1` で `trace_http_{200,400,401,500}` と `trace-schedule-jpql` / `trace-appo-jpql` を一括実行。HTTP, ヘッダー, `meta.json` と `logs/{legacy,modern}_*.log` を `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/` に集約し、`tmp/trace-headers/*.headers` へ `X-Trace-Id` 付きヘッダープロファイルを保存。
- ✅ `TRACE_PROPAGATION_CHECK.md` に §6（RUN_ID=20251110T002045Z）を追加し、各ケースの Legacy/Modern ステータス、`SessionOperationInterceptor` ログ有無、既知ブロッカーを整理。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` の Trace Harness 表と JPQL セクションにも同証跡パスをリンク。
- ⚠️ 課題: (1) `trace_http_401` は `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げ、401 想定経路まで進めず Checklist #73 継続。(2) `trace_http_500` は Legacy=200 / Modern=400 で差分があり `SessionTraceManager` も静音。(3) `trace-schedule-jpql` は Modernized で 200 だが `userName` ヘッダーが `remoteUser=anonymous` のままなので DTO 変換時に facilityId=null → `{"list":null}` で返却。(4) `trace-appo-jpql` は Legacy/Modernized 共に `IllegalArgumentException: attempt to create delete event with null entity` が発生し、`SessionOperationInterceptor` の ERROR ログに traceId 付きで記録される（persistence.xml / seed で AppointmentModel を補う必要あり）。
- 🔁 次アクション: Touch 用ヘッダー/バリデーションを修正して 401 を再現、`KarteBeanConverter` の null-safe 化、`ScheduleServiceBean` が `servletReq.getRemoteUser()` を解決できるよう `LogFilter`/認証設定を見直す（facilityId を 1.3 系ユーザーに紐付ける）、`AppointmentModel` を persistence.xml / Flyway seed (`V0223__schedule_appo_tables.sql`) に登録して `trace-appo-jpql` の 500 を解消。完了後に JMS 連携ケース（Factor2/TOTP/Touch sendPackage）を `TRACEID_JMS/trace/` へ拡張し、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の同項目をクローズ可能な状態にする。
- 📁 関連更新: `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ2 に当該タスクを追記。
- 🚧 2025-11-08T10:14:55Z 版 `artifacts/parity-manual/db-restore/20251108T101455Z/` を新設し、`ls ~/Secrets` 再実行結果・Ops/DBA 再依頼文面（`ops_request.txt`）・Runbook 0章に従い docker/psql/flyway をスキップした理由を `blocked_actions.log` として整理。`20251108T062436Z/baseline_search.log` に同時刻の follow-up を追記し、Ops からのチケット ID/配布連絡待ちであることを明示。

## 2025-11-09 追記: DB ベースライン復旧Gate担当（担当: Worker Codex）
- ✅ `scripts/start_legacy_modernized.sh start --build` を再実行し、再ビルド〜起動ログを `artifacts/parity-manual/db-restore/20251109T200035Z/start_legacy_modernized_start_build.log` に保存。Legacy/Modernized 両 Postgres の `healthy` を確認後に次工程へ進行。
- ✅ `psql -h localhost -U opendolphin <DB>` の `\dt` / `SELECT count(*) FROM d_users;` を Legacy/Modernized 双方で取得し、`psql_{legacy,modern}_*.log` に保存。Approval Policy=Never で `brew install libpq` が実施できないため、`docker exec <postgres>` 経由で同一コマンドを実行し README に代替手順を追記。
- ✅ `flyway/flyway:10.17` コンテナを `--network container:opendolphin-postgres(-modernized)` で実行し、`info` の出力を `flyway_info_{legacy,modern}.log` へ採取。`flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222` が並ぶことを確認。
- 📁 証跡 `artifacts/parity-manual/db-restore/20251109T200035Z/README.md` に Gate 条件（開始前前提/チェックリスト/証跡要件）を明文化し、`POSTGRES_BASELINE_RESTORE.md`・`SERVER_MODERNIZED_DEBUG_CHECKLIST.md`・`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` へ反映。
- ⚙️ Runbook 更新: `POSTGRES_BASELINE_RESTORE.md` で `psql -h localhost` ベースのシード投入手順、`flyway/flyway:10.17` コマンド例、失敗パターン表（表形式）、Gate 章立てを追加。`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` 0章へ DB Gate のリンクと証跡パスを追記し、CLI フローから辿れるようにした。

## 2025-11-09 追記: CLAIM_DIAGNOSIS_FIX 再検証（担当: Claim/Diagnosis/MML 送信経路）
- ✅ `claimHelper.vm` を `server-modernized/src/main/resources/` に同梱した状態で、`opendolphin_webclient-server-modernized-dev:latest` イメージをヘルパーコンテナとして `legacy-vs-modern_default` に接続し、`BASE_URL_MODERN=http://opendolphin-server-modernized-dev:8080/...` で `ops/tools/send_parallel_request.sh` を実行。`PUT /20/adm/eht/sendClaim 20251109T201826Z_CLAIM` が 200 となり、`Claim message enqueued` → `MessageSender Processing CLAIM JMS message` の INFO ログを取得（`artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T201846Z/claim_send/`）。`docs/server-modernization/phase2/notes/messaging-parity-check.md` §8 へ HTTP/JMS/DB 表とテンプレ配置方針を追記。
- ✅ `diseaseHelper.vm` を `server-modernized/src/main/resources/` へ同梱したうえで `mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` → `docker compose build server-modernized-dev` → `./scripts/start_legacy_modernized.sh start` を再実行し、`POST /karte/diagnosis/claim 20251109T231900Z_DIAGNOSIS` をホストから直接送信。Legacy=403 / Modernized=200（238ms）、`jms.queue.dolphinQueue` は `messages-added=1`, `message-count=0`, `jms.queue.DLQ` は空、`db/d_diagnosis_tail.txt` には ID=1, -47 の 2 行が並ぶことを `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T231845Z/{diagnosis_claim,logs,db}/` へ証跡化。`docs/server-modernization/phase2/notes/messaging-parity-check.md` §8.5 に再デプロイとログ採取手順を追記。
- ✅ **RUN_ID=`20251118TmessagingParityZ2`（2025-11-13 JST）**: helper コンテナ（`--network legacy-vs-modern_default`）から `ops/tools/send_parallel_request.sh --profile modernized-dev` を用い、Claim=Legacy/Modern 200、Diagnosis=Legacy 500（既存データ不整合）/Modern 200、MML=Legacy 404（未実装）/Modern 200 を再取得。Modern 側は `open.dolphin.adm20.converter.IDocInfo` 重複除去版 WAR をホットデプロイ後に `ISendPackage` デシリアライズが復旧し、`jms.queue.dolphinQueue` の `messages-added=26L→28L`・`d_audit_event`（CLAIM/MML）を証跡化できた。Diagnosis 監査は未整備のため TSV は空、Legacy の 500 も backlog へ残して `docs/server-modernization/phase2/notes/messaging-parity-check.md §7` と `TRACEID_JMS_RUNBOOK.md` Appendix A.6 にリンクした。
- ✅ `PUT /mml/send 20251109T201827Z_MML` は `payload` / `sha256` / `byteLength=10040` をレスポンスへ返却し、`tmp/mvn-mml.log` の `MmlSenderBeanSmokeTest` もパス。Runbook Gate #44 へ Smoke 手順を追加。
- ⚠️ `d_diagnosis_seq` が負方向にずれているため、新規レコード ID が -47 から始まる点と、Legacy 側が常時 403（Basic 認証?）を返す点は未解決。Modernized 側レスポンスも空 JSON のままで UI から成否を判別しづらい。ホスト→9080 の疎通は今回復旧しているが、再発時に備えたヘルパーコンテナ実行ルートを README / Runbook 両方で維持する必要がある。
- 次アクション: (1) `d_diagnosis_seq` を正の主キーに補正し、負値 ID を今後発生させない、(2) Legacy 403 の原因（Basic 認証設定 or 送信ヘッダー）を調査し README に恒久策を追加、(3) `/karte/diagnosis/claim` のレスポンス仕様と Web クライアントでのハンドリングを整理、(4) Claim/Diagnosis/MML をワンショット実行する `send_parallel_request` config を Runbook へ追加し、Host→9080 が不安定な場合の fallback（ヘルパー or port-forward）も Gate 化する。

## 2025-11-08 追記: scripts/ops-tools CRLF 排除（担当: Worker #1）
- ✅ `.gitattributes` を新規作成し、`scripts/**` と `ops/tools/**` で利用するシェル／CLI ファイル（`*.sh/*.bash/*.zsh/*.ksh/*.command/*.cli/*.env/*.env.*/*.profile/*.ps1/*.psm1`）を `text eol=lf` へ強制。Runbook #25/#26 で問題化した CRLF 由来の失敗を防ぐため、対象範囲と除外ポリシー（node_modules 等は非対象）をコメントに記録。
- ✅ `git status --porcelain` を採取 → `git add --renormalize .` を実行 → 既存タスクの差分を `git restore --staged` で戻し、CRLF が残っていた `scripts/setup_codex_env.sh` / `scripts/run-static-analysis-diff.sh` のみを LF 化 (`perl -pi -e 's/\\r$//'`)。代表ファイルの `file` コマンド結果と `git diff --stat` を `artifacts/parity-manual/setup/20251108-renormalize/` に保存。
- 📝 作業内容と今後のフローを `docs/server-modernization/phase2/operations/DEV_ENV_COMPATIBILITY_NOTES.md` へ整理済み。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` のフェーズ0 備考にも同ノートと証跡パスを追記。

## 2025-11-08 追記: Observability Micrometer/Prometheus（担当: Worker Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` へ Micrometer サブシステムと Undertow 逆プロキシ（`/actuator/{health,metrics,prometheus}` → 管理ポート 9990 `/metrics*`）を追加し、`MICROMETER_MANAGEMENT_HOST/PORT` でプロキシ先を切り替えられるようにした。`management-interface=http-interface` の Basic 認証/console 停止も CLI で明示。
- 📁 `scripts/start_wildfly_headless.sh start --build` → `PARITY_OUTPUT_DIR=.../20251108T063106Z ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin` → `curl http://localhost:9080/actuator/{health,metrics,prometheus}` の流れを `artifacts/parity-manual/observability/20251108T063106Z/` に保存（`README.md`, `wildfly_start.log`, `actuator_*.log`, `observability_loop_loop###/*`）。Legacy (8080) は headless profile 非対象のため `curl: (7)`、Modernized は DB 未投入で 404 だが Micrometer の error counter / latency（Prometheus エクスポート）は正常に採取できた。
- 🧰 `scripts/start_wildfly_headless.sh` / `ops/tools/send_parallel_request.sh` が `set -u` 下で空配列展開に失敗していたため `local -a args=()` 初期化と条件付き展開へ修正し、`--build` / `--loop` オプションを CLI で安全に使えるようにした。
- 📝 `docs/server-modernization/phase2/notes/ops-observability-plan.md`, `operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`, `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`, `docs/web-client/planning/phase2/DOC_STATUS.md` を更新し、`/actuator/*` 200 応答と Evidence パスを記録。WildFly 33 では `registry=prometheus` サブリソースが提供されないため、管理ポート経由でスクレイプする制約も追記。
- ✅ `server-modernized/src/main/webapp/WEB-INF/jboss-deployment-structure.xml` を追加し `org.wildfly.micrometer.deployment` を除外、SYSAD ヘッダー `ops/tests/api-smoke-test/headers/sysad-actuator.headers` で `/dolphin` と `/actuator/*` を 200 で叩けるようにした。`scripts/start_legacy_modernized.sh start --build` → `PARITY_OUTPUT_DIR=artifacts/parity-manual/observability/20251108T074657Z-success ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin` → `curl -i http://localhost:{9080,9995}/actuator...` を実施し、Legacy/Modernized 両系の 200 応答・`boot-errors outcome=true` を `actuator_{health,metrics,prometheus}.log` と `metrics_application.log` に保存。README には 404/503 証跡（20251108T063106Z）との比較手順を追記し、Grafana/PagerDuty 反映ログを `docs/server-modernization/phase2/operations/logs/2025-11-08-pagerduty-observability.txt` に記録した。
- 🔁 次アクション: (1) server-modernized WAR へ `jboss-deployment-structure.xml` を取り込むことによる他タスクとの競合をレビューし恒久化、(2) `actuator_*.log` / `metrics_application.log` を添付して Grafana ダッシュボードと PagerDuty ルールの本番反映レビューを完了する。
- 🔁 次アクション: (1) Legacy profile を含む compose（またはリモート検証環境）で同一シナリオを流し、成功レスポンス版の `observability_loop_loop##` を採取、(2) Postgres ベースライン復旧後に 2xx 業務フローを再実行し、`actuator_{metrics,prometheus}.log` を差し替え、(3) PagerDuty/Grafana へ `wildfly_undertow_request_count_total` / `wildfly_datasources_pool_active_count` 等のしきい値を本番反映する。

## 2025-11-09 追記: 添付ファイル保存モード切替（担当: 添付モード検証ワーカー）
- ✅ `MODERNIZED_STORAGE_MODE` / `ATTACHMENT_STORAGE_CONFIG_PATH` / `ATTACHMENT_S3_*` を WildFly へ伝搬する `AttachmentStorageManager` を実装。`attachment-storage.yaml` を MicroProfile Config で読み込み、S3 モード時は MinIO へアップロード→`uri=s3://...` を保存、取得時に自動でバイナリをダウンロードする。DB モード時は従来通り `d_attachment` LOB を利用。
- ✅ `.env.sample` と `docker-compose.modernized.dev.yml`/`ops/modernized-server/docker-compose.yml` に MinIO + `mc` サービスと S3 資格情報、YAML マウントを追加。`ops/modernized-server/docker/Dockerfile` では `attachment-storage.sample.yaml` を `/opt/jboss/config/attachment-storage.yaml` へコピーし、dev compose ではテスト用 YAML をボリュームで差し替え可能にした。
- ✅ `ops/tests/storage/attachment-mode/README.md` / `run.sh` / `payloads/sample-attachment.txt` を追加。DB→S3 の順に compose を起動し、施設登録→医師追加→サンプル添付アップロード→ダウンロード→`sha256sum` 突合→MinIO/WildFly ログ採取→`artifacts/parity-manual/attachments/<UTC>/` 保存を自動化。docker 共有ポリシーにより実行はマネージャー担当とし、手順は `docs/server-modernization/phase2/notes/storage-mode-checklist.md#8` へ記載。
- 🔁 次アクション: マネージャーが空き時間に `ops/tests/storage/attachment-mode/run.sh --compose-file docker-compose.modernized.dev.yml` を実行し、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #85 の成果物（レスポンス/ハッシュ/MinIO ログ/CLI バックアップ）を `artifacts/parity-manual/attachments/<UTC>/` に保存。完了後に本メモ/Checklist/DOC_STATUS を更新してクローズする。

## 2025-11-09 追記: Trace / REST / 監査スモーク再採取（担当: Trace/REST テストワーカー）
- ✅ `ops/db/local-baseline/local_synthetic_seed.sql` を Legacy/Modernized 両 DB に再適用し、Flyway V0001〜V0222 を `mvn -f pom.server-modernized.xml -pl server-modernized org.flywaydb:flyway-maven-plugin:{baseline,migrate}` で実行。ログは `artifacts/parity-manual/db-restore/20251109T060930Z/README.md`。
- ✅ `ops/tests/api-smoke-test/run.sh --scenario base_readonly --dual --profile compose` を `RUN_ID=20251109T060930Z` で実施。`/dolphin` と `/serverinfo/jamri` は 200, `/mml/patient/list/...` は Modernized 500 (`String index out of range: -1`)。証跡は `artifacts/parity-manual/smoke/20251109T060930Z/`。
- ✅ `trace_http_{200,400,401,500}` を同 RUN_ID で採取し、`artifacts/parity-manual/TRACEID_JMS/20251109T060930Z/` に HTTP / WildFly ログを保存。Modernized 側は 400/401 が 500 へ化け、`UnknownEntityException: AuditEvent` / `Remote user does not contain facility separator` の再現に成功。Legacy は Trace ID ログ出力なし。
- ⚠️ 2025-11-10: `send_parallel_request.sh --profile modernized-dev` で `trace_http_{200,400,401,500}` を WSL 環境から再実行したが、Docker Desktop 未導入により `docker ps` が失敗し `opendolphin-server(-modernized-dev)` の名前解決ができず、全ケースが `curl: (6) Could not resolve host`（`status=000`）で終了。証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T035118Z/logs/send_parallel_request.log` と各 `trace_http_*` ディレクトリへ保存。`TRACEID_JMS_RUNBOOK.md` を作成し、Docker/WSL 連携を有効化してから再取得するフロー、または `compose` プロファイルへ切り替える回避策を記載した。
- ⚠️ `rest_error_scenarios.manual.csv` の 4xx/5xx ケースは依然 500/400 にしかならず、`artifacts/parity-manual/rest-errors/20251109T060930Z/` に差分を記録。アプリ改修後に再取得が必要。
- ⚠️ `/20/adm/factor2/totp/registration` で `d_audit_event_seq` 欠落→`AuditTrailService` 500。シーケンスを手動作成したが、Compose が別ワーカーで停止したため最終リクエストは `connection refused`（`artifacts/parity-manual/audit/20251109T060930Z/README.md`）。Docker 操作者による再実行を依頼済み。
- 🔁 マネージャーへ依頼: (1) Docker 常駐＋8080/9080 の疎通確保、(2) Modernized DB に `d_audit_event_seq` を永続化、(3) `/dolphin/activity`/`/touch/user`/`/karte/pid` の期待ステータスへ戻すアプリ改修、(4) 2FA API で `d_audit_event` の `TOTP_*` を取得し同ディレクトリに保存。

## 2025-11-09 追記: HealthInsuranceModel 取り込み修復（担当: HealthInsuranceModel 修復ワーカー）
- ✅ `mvn -f pom.server-modernized.xml -pl server-modernized -am dependency:tree` を再実行し、`opendolphin-common:jar:jakarta` が compile scope で解決されていることをログ化（`artifacts/parity-manual/HEALTH_INSURANCE_MODEL_FIX/20251109T070217Z/mvn_dependency_tree.log`）。同ディレクトリに `mvn ... package -DskipTests` のビルドログと `jar tf .../opendolphin-common-2.7.1-jakarta.jar | rg HealthInsuranceModel`（`jar_common_healthinsurance_after_fix.log`）を保存して、`HealthInsuranceModel.class` / `PVTHealthInsuranceModel.class` が WAR 配下に含まれることを証跡化した。
- ✅ `ops/modernized-server/docker/Dockerfile` および `scripts/start_legacy_modernized.sh` が `reporting/` ディレクトリを `COPY` しておらず BuildKit で `Child module /workspace/reporting ... does not exist` になる問題を修正。`./scripts/start_legacy_modernized.sh down && start --build` を新たに実行し、`start_legacy_modernized_final.log` に legacy / modernized 双方のイメージ再ビルドと CLI 出力を記録した。
- ✅ 再ビルド後の `docker compose --project-name legacy-vs-modern ps`（`docker_compose_ps.log`）で `opendolphin-server-modernized-dev` / `opendolphin-postgres-modernized` / `minio` が全て `Up ... (healthy)` になったことを確認し、`curl http://localhost:9080/actuator/health`（`curl_health_after_fix.log`）で `deployments-status : OK` を取得。これにより `HealthInsuranceModel` の欠落による `UnknownEntityException` が解消され、ops/tests/storage/attachment-mode/run.sh など後続シナリオのブロッカーを解除した。
- 📁 証跡: `artifacts/parity-manual/HEALTH_INSURANCE_MODEL_FIX/20251109T070217Z/` に `mvn_dependency_tree.log`、`mvn_package.log`、`jar_common_healthinsurance_after_fix.log`、`start_legacy_modernized_*`、`docker_compose_ps.log`、`curl_health_after_fix.log` を格納。Checklist と DOC_STATUS を同一タイムスタンプで更新済み。
- ✅ **RUN_ID=`20251116ThealthInsZ1`（2025-11-12 23:40JST）**: `server-modernized/pom.xml` で `opendolphin-reporting` / `opendolphin-common(jakarta)` を dependencyManagement に移し、`mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` → `jar tf .../opendolphin-common-*-jakarta.jar | rg HealthInsuranceModel` を `artifacts/parity-manual/HEALTH_INSURANCE_MODEL_FIX/20251116ThealthInsZ1/{mvn_package.log,jar_common_healthinsurance_after_fix.log}` に保存。Docker Compose を再起動せず `docker cp server-modernized/target/opendolphin-server.war opendolphin-server-modernized-dev:/opt/jboss/wildfly/standalone/deployments/` ＋ `touch .../opendolphin-server.war.dodeploy` でホットデプロイ（`docker_cp_hotdeploy.log`）し、`docker exec -e PGPASSWORD=opendolphin opendolphin-postgres-modernized psql -c '\\d+ d_health_insurance'` → `SELECT id, patient_id, beanbytes FROM d_health_insurance ...` によるテーブル参照を `psql_healthinsurance_model.log` に記録。`ops/modernized-server/docker/Dockerfile` と `scripts/start_legacy_modernized.sh` の `COPY reporting ./reporting` 継続を再確認し、Checklist / DOC_STATUS / `domain-transaction-parity.md §3.5` を同 RUN ID で更新した。

## 2026-06-15 追記: Progress-Update-Flow（担当: Codex）
- ✅ `PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の同期フロー、RACI、レビュースケジュール、共通テンプレートを定義。
- 📌 案件ごとの証跡とチェックリストの突合ルール、週次・リリース前レビューの実施要領を以下に明文化。

## 2026-06-16 追記: Factor2 Secrets & Elytron Toggle（担当: Codex）
- ✅ `ops/tools/logfilter_toggle.sh` を新規追加し、`.env` の `LOGFILTER_HEADER_AUTH_ENABLED` を CLI で切り替え可能にした。`LogFilter` は env / system property / init-param を優先順位付きで解釈し、`docker-compose*.yml` にも同変数を追加。詳細は `docs/server-modernization/phase2/notes/security-elytron-migration.md`。
- ✅ `.env.sample` と `docs/server-modernization/phase2/notes/ops-observability-plan.md` に Secrets 読み込み順と Micrometer/Prometheus 連携メモを追記し、`artifacts/parity-manual/observability/{health,metrics,prometheus}.log` へ `curl` の `Connection refused` 証跡を保存。
- ✅ `docs/server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md` と `artifacts/parity-manual/secrets/wildfly-start.log` に Secrets 欠落時の起動失敗シナリオ（Docker BuildKit がタイムアウトし WildFly 未起動）を記録。`SecondFactorSecurityConfig` のエラーメッセージも Runbook に転記。
- ⚠️ サンドボックスに `scripts/start_wildfly_headless.sh` が無く Docker も利用不可なため、`FACTOR2_AES_KEY_B64` 未設定時の実ログは未取得。`ops/tests/security/factor2/*.http` も未整備のため、`ops/tests/api-smoke-test` + `ops/tools/send_parallel_request.sh --loop` で代替する計画を `docs/server-modernization/phase2/notes/test-data-inventory.md` へ追記。
- 📁 証跡: `artifacts/parity-manual/secrets/env-loading-notes.md`, `artifacts/parity-manual/audit/factor2-audit-plan.md`, `artifacts/parity-manual/observability/*.log`
- 🔁 次アクション: Docker が使えるホストで `FACTOR2_AES_KEY_B64` を削除→WildFly起動→`d_audit_event` 取得まで実施し、Runbook のログ抜粋を差し替える。`ops/tests/security/factor2` ディレクトリを新規作成して `.http` スクリプトを格納。

## 2025-11-08 追記: Trace Propagation Harness（担当: Codex）
- ✅ `ops/tests/api-smoke-test/test_config.manual.csv` / `rest_error_scenarios.manual.csv` に `trace_http_200/400/401/500` を追加し、`SessionOperation` 単位で追跡すべきステータス・ヘッダー・trace-id を整理。`ops/tests/api-smoke-test/headers/{trace-anonymous,trace-session}.headers` で CLI から `X-Trace-Id` を注入できるようにした。  
- ✅ `ops/tools/send_parallel_request.sh` に `--profile` / `--profile-file` を実装し、`send_parallel_request.profile.env.sample` を自動で `source` できるよう拡張。`README.manual.md` にも CLI 流れと `PARITY_HEADER_FILE` の差し替え手順を追記。
- ✅ `trace_http_200` を実行し、`artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/{legacy,modern}/` へ HTTP/メタ情報を保存。`TRACE_PROPAGATION_CHECK.md` と `domain-transaction-parity.md` に証跡リンクとチェックリスト対応状況を追加。
- ⚠️ Legacy イメージは `ops/legacy-server/docker/configure-wildfly.cli` が `org.wildfly.extension.micrometer` を要求するためビルド失敗。ログを `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log` に保存し、V2 Runbook 側へ Blocker として記録。
- ⚠️ Modernized DB (`db-modernized`) は初期データ未投入のため `d_users` 等が存在せず、`trace_http_400/401/500` は `LogFilter` 認証で失敗。`modern_server_full.log` に `relation "d_users" does not exist` のトレースを保存し、`docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` にシード作業が前提である旨を追記。
- 📁 証跡: `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/*`, `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/{legacy_build.log,modern_server_full.log}`

## 2025-11-09 追記: Domain Transaction Parity Phase2（担当: Codex）
- ✅ `/patient/id/0000001`, `/karte/pid/0000001,2024-01-01`, `/schedule/pvt/2025-11-09`, `PUT /appo` を Legacy / Modernized コンテナ内 `curl` で実行し、`X-Trace-Id=jpql-*-20251109T201157Z` 付き SQL ログを `scripts/jpql_trace_compare.sh` で整形。`artifacts/parity-manual/JPQL/20251109T201157Z/<service>/` に raw ログ・diff・HTTP 応答を保存し、`domain-transaction-parity.md` §3 を更新。  
- ⚠️ `PatientServiceBean` / `KarteServiceBean` は facility `1.3.6.1.4.1.9414.72.103` 向けデータが未投入のため `NoResultException` → 500/400。`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` の `WEB1001` シードを `opendolphin_modern` へ再投入するタスクを残課題として追記。  
- ✅ `ScheduleServiceBean` / `AppoServiceBean` の UnknownEntityException を解消。`server-modernized/src/main/resources/META-INF/persistence.xml` に `PatientVisitModel` / `AppointmentModel` を追加し、Flyway V0223 (`server-modernized/tools/flyway/sql/V0223__schedule_appo_tables.sql`) と `ops/db/local-baseline/local_synthetic_seed.sql` で `d_patient_visit` / `d_appo` を新設 + サンプルデータ投入。`rest_error_schedule_unknown_entity` / `rest_error_appo_missing_entity` は `expected_status=200` + `[Resolved 2025-11-09]` へ更新。  
- 📁 証跡: `artifacts/parity-manual/JPQL/20251110T002451Z/{ScheduleServiceBean,AppoServiceBean}/`, `docs/server-modernization/phase2/notes/domain-transaction-parity.md#3-2025-11-09-karte--patient--appo--schedule`  
- 🔁 次アクション: (1) Modernized `persistence.xml` へ `PatientVisitModel` / `AppointmentModel` を登録し再ビルド、(2) 1.3 系カルテ/患者データを modern DB へシードして `/chart/WEB1001/summary` などカルテ系 API を採取、(3) 追加した REST エラーケースを `TRACE_PROPAGATION_CHECK.md` へリンクさせる。

### 2025-11-10 追記: RUN_ID=20251110T122417Z JPQL 追採取（担当: Codex）
- ✅ Docker Desktop (macOS) で `scripts/start_legacy_modernized.sh start --build` を実行し、`ops/tools/send_parallel_request.sh --profile compose` による `GET /patient/id/0000001`, `GET /karte/pid/0000001,2024-01-01`, `GET /schedule/pvt/2025-11-09`, `PUT /appo` を再取得。HTTP/ヘッダー/JPQL/`docker compose logs` を `artifacts/parity-manual/JPQL/20251110T122417Z/<service>/` に保存し、README に reseed・`docker compose exec db-{legacy,modern}` で監査を取る手順を追記。
- ✅ Appo ケースは `/tmp/reseed_appo.sql` を Legacy/Modernized 両 DB へ投入して `id=8001` を毎回復元し、Legacy/Modern 共に 200 (`response=1`) で削除できることを確認。Schedule は両環境 200 だが Modern 側は `{\"list\":null}` が継続、Patient は Modern 500 (`SessionServiceException`) のまま、Karte は Modern 400（`KarteBeanConverter` が null を扱えず）であることを確認。
- ❗ `d_audit_event` は Legacy=空、Modern=SYSTEM_ACTIVITY のみで TraceId が記録されなかったため、`domain-transaction-parity.md` と `rest_error_scenarios.manual.csv` に「監査ログ未記録」を明記し、Elytron/JACC の `remoteUser` 復元パッチ適用後に再取得する TODO を残した。
- 📁 証跡: `artifacts/parity-manual/JPQL/20251110T122417Z/README.md`, `artifacts/parity-manual/persistence-check/20251110T122417Z/*`, `docs/server-modernization/phase2/notes/domain-transaction-parity.md`（§3/§3.2/付録A）。
- 🔁 次アクション: (1) `ScheduleResource`/`AppoResource` の `remoteUser` を Elytron/JACC で正しく復元し、`d_audit_event` に TraceId が記録される状態で再取得、(2) `KarteBeanConverter` の null-safe 化と `/chart/WEB1001/summary` の seed 追加、(3) reseed 手順を `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` へ手順化。

## 2026-06-16 追記: JPQL / Trace parity（担当: Worker #2）
- ✅ Legacy/modernized の `persistence.xml` に `hibernate.show_sql` と `hibernate.archive.autodetection` を追記し、`scripts/start_legacy_modernized.sh` で両サーバーを再構築。モダナイズ用 Postgres (`opendolphin_modern`) に Facility/User/Role の最小データを投入して `/user/doctor1` を実行できる状態を整備。
- ✅ `scripts/jpql_trace_compare.sh` を新規追加し、`artifacts/parity-manual/JPQL/{legacy.log,modernized.log,jpql.diff}` に SQL ログと差分を保存。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` に Checklist #48 の観測結果と残課題を記載。
- ✅ `test_config.manual.csv` に `trace-id` 列を追加し、`README.manual.md`/`test-data-inventory.md` にヘッダーフローを更新。`TRACE_PROPAGATION_CHECK.md` を新設し、`X-Trace-Id` を使った HTTP ログ採取手順とギャップ（Legacy 側で traceId が出力されない点など）を整理。
- ⚠️ `/chart/WEB1001/summary` などカルテ系 API に必要なサンプルデータが未投入のため、Checklist #49〜#50, #73〜#74 分の JPQL ログは未取得。`d_patient` `d_karte` へ移行データを投入後に継続する。
- 📁 証跡: `artifacts/parity-manual/JPQL/*`, `artifacts/parity-manual/TRACEID_JMS/trace/*`, `tmp/trace/user_profile.headers`

### Progress / Checklist Sync Flow
| トリガー | 対応内容 | 期限 | 反映先 |
| --- | --- | --- | --- |
| 新規証跡（テストログ・アーティファクト・設計ドキュメント）の追加 | 24h 以内に `PHASE2_PROGRESS.md` へ追記し、証跡パスと結果要約・残課題を明記。同時に該当チケットへリンクを共有 | 発見後 24h 以内 | `PHASE2_PROGRESS.md`, チケットコメント |
| チェックリスト項目のステータス変化（`[ ]`→`[x]`／備考更新） | 影響範囲を口頭確認後、同営業日内にチェックリストを更新し、進捗メモへ「Checklist: フェーズX-項目名」リンクを追記 | 12h（営業日内） | `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`, `PHASE2_PROGRESS.md` |
| ドキュメント/計画系ファイルの構成変更や追加決定事項 | 変更と理由を `docs/server-modernization/phase2/` 配下の該当ファイルへ即日反映し、進捗メモで編集箇所とレビュアーを宣言 | 24h | 対象ドキュメント, `PHASE2_PROGRESS.md` |
| 重大ブロッカー・監査指摘の検知 | 4h 以内に Phase2 マネージャへエスカレーションし、暫定措置・連絡先を進捗メモと Slack `#phase2-modernized` に掲示 | 4h | `PHASE2_PROGRESS.md`, Slack, Jira |

### レビューサイクル
- 週次レビュー（毎週水曜 10:00 JST）: Phase2 マネージャが直近 7 日分の進捗とチェックリスト差分を確認し、Ops/QA へ課題共有。未反映証跡がある場合はその場で担当者にアクションを割り当てる。
- リリース前レビュー（マイルストーン凍結の 3 営業日前）: チェックリスト `[ ]` を棚卸し、必須証跡の所在確認・欠落時の Go/No-Go 判断を行う。全項目に進捗メモリンクが付与されていることを Exit 条件とする。
- 臨時レビュー: 重大ブロッカー報告や仕様変更時に随時開催し、決定内容を進捗メモとフェーズ計画へ記録。

### RACI（進捗同期関連）
| ワーク | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| 証跡ログの進捗メモ反映 | 各タスク担当ワーカー | Phase2 マネージャ（Codex） | QA リード / Ops 担当 | Server Modernization WG / プロダクトオーナー |
| チェックリスト更新と突合 | チェックリスト担当ワーカー | Phase2 マネージャ | ドメイン SME / テックリード | PMO / QA |
| 週次・リリース前レビュー運営 | Phase2 マネージャ | Server Modernization プログラムマネージャ | Ops, QA, UX リード | 参加全員, 経営窓口 |

### Progress 記入テンプレート
**チェック項目**
- [ ] タイトルに日付・トピック名・担当者を含めたか
- [ ] 対応内容・結果・テストコマンド／ログ・証跡パスを列挙したか
- [ ] 残タスク／次アクションと担当者を明記したか
- [ ] チェックリストや関連ドキュメントへのリンクを付与したか
- [ ] `operations/assets/orca-evidence-index.md`（Evidence Index）を参照し、今回の RUN_ID を登録・更新したか

**記入例**
```markdown
## 2026-06-15 追記: Example-Artifact-Run（担当: Worker F）
- ✅ `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=JsonTouchResourceParityTest test` を実行し、`server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml` を証跡として保存。
- 📁 証跡: `ops/analytics/evidence/20260615/json-touch/`
- 🔁 次アクション: `SA-TOUCH-JSON-PARITY` でレスポンス整合性の差分調査を継続。進捗はチェックリスト フェーズ3-REST/API 項目へ反映。
```

**担当割当早見表（RUN_ID テンプレ付き）**
| 優先度 | 推奨 RUN_ID 命名テンプレ | 推奨担当ロール | メモ |
| --- | --- | --- | --- |
| P0 | `{{YYYYMMDD}}TorcaP0OpsZ#` | 受付オペレーション／予約コーディネータ／診療担当（カルテ）／会計担当 | 53 件中 P0 が最多（受付・予約まわり 20+ 件）で、一次対応の全ロールを RUN_ID で即時想起できるよう Ops を含む命名にする。 |
| P1 | `{{YYYYMMDD}}TorcaP1DomainZ#` | 入院担当／マスタ管理／会計担当 | P1 では入院ワークフローとマスタ調整が中心（§2, §3 由来）。Domain 単位の追跡が必要になるため `Domain` タグを付けている。 |
| P2 | `{{YYYYMMDD}}TorcaP2BacklogZ#` | マスタ管理／バックオフィス（帳票） | P2 は Jakarta 差分や帳票テンプレ整備など計画系が主体。Run 名で backlog 管理タスクと判別し、期日緩めのレビュー待ち行列を区別できるようにする。 |

> ※ 推奨担当ロールは `docs/server-modernization/phase2/operations/assets/orca-api-assignments.md` の優先度別出現数に基づく。`#` には連番を付与し、実 RUN_ID には必ず UTC 形式の日付と用途タグを入れること。

### Phase2 backlog（2025-11-12 更新）

| タスク | ステータス | 担当 | 依存・備考 |
| --- | --- | --- | --- |
| Stamp 公開系 GET 実装（`/stamp/tree/{facility}/{public\|shared\|published}`） | TODO（設計プラン化済み。Resource/API 実装と UI 経路切替は未着手） | Server: Codex / UI: Worker E（Charts） | 依存1: `AuditTrailService` に `STAMP_TREE_*_GET` read イベント・resultCount 記録を追加し、`TRACEID_JMS_RUNBOOK.md` Appendix A の before/after 採取テンプレへ反映。依存2: UI を `/stamp/published/tree` へ差し替えるか alias 実装で facility トグルを担保するかを `docs/web-client/ux/` で決定。スケジュール: REST案ドラフト（Codex）=2025-11-13、UI差し替え PoC（Worker E）=2025-11-14、比較レビュー（Manager）=2025-11-15。参照: `patches/stamp_get_public_plan.md`, `docs/server-modernization/phase2/notes/domain-transaction-parity.md` Appendix A.5 TODO。 |

### 課題欄（W39 ORCA API 有効化）
- **外部エスカレーション要否**: `docs/server-modernization/phase2/notes/orca-api-field-validation.md` §6（W39 追加調査）で確認した公式 PDF には `API_ENABLE_*` / `receipt_route.ini` の公開手順が見当たらないため、404/405 が継続する RUN_ID は WebORCA サポート（`weborca-support@orcamo.jp` / 050-5491-7453）へ問い合わせる。Runbook §4.5 Step3 を踏んだ日時・担当者・問い合わせ内容・SLA を本課題欄に追記し、回答待ち期間は Blocker 扱いとする。
- **Sprint2 RUN_ID プレースホルダ**（ORCA-REST-01/02 対象）:
  - `[RUN_ID={{20251115}}TorcaSprint2P0Z1] /api01rv2/appointlstv2` → `logs/2025-11-13-orca-connectivity.md#appointlstv2` に RUN_ID 記録、`artifacts/orca-connectivity/{{20251115}}TorcaSprint2P0Z1/httpdump/appointlstv2/`＋`trace/appointlstv2_trace.log` へ証跡保存。
  - `[RUN_ID={{20251115}}TorcaSprint2P0Z2] /api01rv2/appointlst2v2` → 同上 `#appointlst2v2` アンカーと `httpdump/appointlst2v2/`。
  - `[RUN_ID={{20251115}}TorcaSprint2P0Z3] /api01rv2/acsimulatev2` → `#acsimulatev2` と `httpdump/acsimulatev2/`（`Allow`/`Api_Result` を headers/json/trace で確保）。
  - `[RUN_ID={{20251115}}TorcaSprint2P0Z4] /api01rv2/visitptlstv2` → `#visitptlstv2` と `httpdump/visitptlstv2/`（来院一覧＋`trace/visitptlstv2_trace.log`）。
  - `[RUN_ID={{20251116}}TorcaSprint2P1Z1] /api01rv2/patientlst1v2` → `#patientlst1v2` と `httpdump/patientlst1v2/`（ID リスト JSON）。
  - `[RUN_ID={{20251116}}TorcaSprint2P1Z2] /api01rv2/patientlst2v2` → `#patientlst2v2` と `httpdump/patientlst2v2/`（患者基本情報バッチ）。
  - `[RUN_ID={{20251116}}TorcaSprint2P1Z3] /api01rv2/patientlst3v2` → `#patientlst3v2` と `httpdump/patientlst3v2/`（カナ検索）。
  - `[RUN_ID={{20251116}}TorcaSprint2P1Z4] /api01rv2/patientlst6v2` → `#patientlst6v2` と `inpatient/35_patientlst6v2/`（`request.xml`／`response.headers`／`response.xml`）＋`trace/patientlst6v2_trace.log`。
  - `[RUN_ID={{20251117}}TorcaSprint2P1Z5] /orca25/subjectivesv2` → `#subjectivesv2`、`httpdump/subjectivesv2/`、`trace/subjectivesv2_trace.log`。ServerInfoResource（`claim.conn=server`）は各 RUN_ID の `logs/...#serverinfo` へ追記する。


## 2026-06-14 追記: Phase0-Scope-Adjustment（担当: Codex）
- ✅ ステークホルダー合意に基づきフェーズ0（環境棚卸し・Compose 手順整理）はサーバーモダナイズ デバッグ範囲から除外。今後の進捗報告・チェックリスト更新はフェーズ1以降のみを対象とし、フェーズ0タスクが再度必要になった場合は別チケットで復活させる方針を確認。
- 📌 `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ0節へスコープ除外の注記を追記済み。

## 2026-06-14 追記: RuntimeDelegate-Expansion（担当: Codex）
- ✅ `DemoResourceAspTest`／`TouchModuleResourceTest`／`DolphinResourceDocumentTest`／`TouchUserServiceTest`／`PHRResourceTest` を `RuntimeDelegateTestSupport` 継承・Mockito `lenient()` 化し、RuntimeDelegate 未登録／Strictness による失敗を解消。
- ✅ `TestRuntimeDelegate` に `Cache-Control`・`MediaType` ヘッダーデリゲートを実装、レスポンスヘッダーへ `Cache-Control` を反映。StackOverflow/UnsupportedOperationException を抑止。
- ✅ `server-modernized/src/test/resources/fixtures/demoresourceasp/` を新設して 16 件のフィクスチャを追加、`DemoResourceAspTest` の期待値をプレースホルダ対応で更新。
- ✅ 単体 (`mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=DemoResourceAspTest,TouchModuleResourceTest,DolphinResourceDocumentTest,TouchUserServiceTest,PHRResourceTest test`) で対象テストがグリーンであることを確認。
- ⚠️ `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false` は `open.dolphin.touch.JsonTouchResourceParityTest`（errors=2, failures=1）と `open.dolphin.infomodel.InfoModelCloneTest`（failures=2）が継続失敗。ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`。
- 🔁 次アクション: 上記 2 テストの調査を `SA-TOUCH-JSON-PARITY`（Worker F）／`SA-INFOMODEL-CLONE`（Worker B）にフォローアップ依頼。RuntimeDelegate 対応メモを `docs/web-client/planning/phase2/runtime-delegate.md` へ追記予定。

## 2026-06-14 追記: SpotBugs-EI-DefensiveCopy（担当: Codex）
- ✅ REST/Touch DTO (`DemoAspResponses`, `DolphinDocumentResponses`, `TouchModuleDtos`, `TouchPatientDtos`, `JsonTouchSharedService` 等) と ADM20 DTO (`PhrExportRequest`, `TotpVerificationResponse`) に防御的コピー処理を導入。`TouchPatientService` / `DemoResourceAsp` から Patient スナップショットを受け渡すよう改修。
- ✅ セキュリティ設定 (`Fido2Config`, `AuditEventPayload`, `SigningConfig`, `SessionTraceContext`) と Messaging/インフラ (`ClaimHelper`, `DiseaseHelper`, `DiagnosisModuleItem`, `PatientHelper`, `AccountSummary`, `ORCAConnection`, `CopyStampTreeBuilder`/`Director`) を immutable 化。
- ✅ 新規テスト 6 件を追加し（`server-modernized/src/test/java/open/dolphin/rest/dto/DemoAspResponsesDefensiveCopyTest.java` ほか）、`mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false` で回帰確認。SpotBugs レポートは `server-modernized/target/static-analysis/spotbugs/spotbugs-opendolphin-server.xml` を参照。
- 🔁 残タスク: JMS/MBean 系 32 件（`SA-INFRA-MUTABILITY-HARDENING`）は未着手。次イテレーションで Properties/Date のクローン／JMS ラウンドトリップテストを追加し、残存 `EI_EXPOSE_REP*` を削減する。Legacy 除外ポリシーは既存メモ（SpotBugs-Exclude-Legacy）を継続。

## 2026-06-14 追記: SpotBugs-Exclude-Legacy（担当: Codex）
- ✅ `server-modernized/config/static-analysis/spotbugs-exclude.xml` に Legacy DTO/コンバータ向けの `EI_EXPOSE_REP*` 除外 `<Match>` を追加し、コメントで互換維持根拠を明示。
- ✅ `mvn -f pom.server-modernized.xml -Pstatic-analysis spotbugs:spotbugs -DskipTests` を再実行し、ログを `server-modernized/target/static-analysis/spotbugs/spotbugs-20260614-legacy-exclude.log` に保存。出力 XML を `docs/server-modernization/phase2/notes/static-analysis-findings.md` へ反映。
- 📊 Medium `EI_EXPOSE_REP*` 903 件のうち 831 件が Legacy 範囲（infomodel/converter/Touch・ADM コンバータ／ICarePlan）であることを確認。手動対応継続分 68 件は REST/Touch DTO・セキュリティ設定・Messaging/MBean へ分類済み。
- 🔁 再評価方針: Touch/ADM 互換 API 廃止または InfoModel 自動生成化の完了時、SpotBugs 5.x への更新時にフィルタを見直し。四半期ごとにフィルタ無しの試験実行を行い、監査ログへ追記する。
- 📦 アーティファクトは `server-modernized/target/static-analysis/spotbugs/` を CI アップロード対象に追加予定。Ops 共有時はログと XML を ZIP 化して提供。

## 2026-06-15 追記: TraceContextProvider-Design（担当: Worker A）
- ✅ `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` に `TraceContextProvider` / `TraceContextBridge` の設計案と依存関係図を追加。`MessagingGateway` から `SessionTraceManager` への直接依存を解消する方針を整理した。
- 📌 新規チケット `TRC-15 TraceContextProvider`（Phase2 backlog）を登録。スコープは「Provider インタフェース追加」「MessagingGateway / MessageSender / RequestContextExtractor の移行」「JMS traceId 欠落監視ロジック」。
- 🔁 次アクション:
  1. Worker A: Provider インタフェースと `TraceContextBridge` 仮実装を `server-modernized/src/main/java/open/dolphin/infrastructure/trace/` に追加し、単体テストで MDC 引き継ぎを確認。
  2. Worker C: JMS 周り（`MessagingGateway`, `MessageSender`）を Provider API に移行し、`SessionTraceManager` への依存を削除。
  3. Worker D: PHASE2 OPS から Grafana/Alertmanager へ JMS traceId 欠落 WARN の通知ルールを追加。
- ✅ チケット情報を `docs/server-modernization/phase2/notes/static-analysis-plan.md` および `docs/server-modernization/phase2/notes/ops-observability-plan.md` にリンク予定。

## 2026-06-14 追記: Static-Analysis-First-Run-Triage（担当: Codex）
- ✅ Jenkins `Server-Modernized-Static-Analysis` / GitHub Actions `Server Static Analysis` の最新成果物を `tmp/static-analysis-20260614.log` で採取し、SpotBugs High 14・Medium 1,149、Checkstyle 3,255、PMD priority3 48 / priority4 280 を照合。両 CI の数値差分なし。
- ⚠️ SpotBugs High の新規要対応は `server-modernized/src/main/java/open/dolphin/mbean/KanaToAscii.java:601`（`String#replace` 未再代入）と `server-modernized/src/main/java/open/dolphin/touch/session/EHTServiceBean.java:881`（`ObservationModel` リストから `IPhysicalModel` を削除）。Legacy DTO/Converter 由来の High は既存分類範囲内。
- 📝 チケット候補: `SA-TOUCH-PHYSICALS-GENERICS`（Worker E）、`SA-MBEAN-KANA-RETURNVALUE`（Backend 山本）、`SA-MSG-MMLHELPER-IMMUTABILITY`（Worker D）を Jira 起票予定。担当者と実装・回帰テスト計画を擦り合わせる。
- 🛠️ CI 改善案: Checkstyle `WhitespaceAround` を info 化して diff gate へ集約、SpotBugs High 差分検出を `scripts/run-static-analysis-diff.sh` に追加、Slack 通知へ重大度サマリを添付。対応後に Runbook / `static-analysis-plan.md` を更新する。
- 🔜 次アクション: 上記チケット登録、Ops/Backend と通知スクリプト改修・`spotbugs-exclude.xml` 更新のスケジュール確定、次回スタンドアップで進捗確認。

## 2026-06-14 追記: Nightly-CPD-Implementation（担当: Codex）
- ✅ Jenkins 夜間 CPD パイプラインを `ci/jenkins/nightly-cpd.groovy` として追加。`cron('H 3 * * *')`／`mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:cpd -Dcpd.failOnViolation=false -B`／メトリクス抽出／Slack・PagerDuty 通知までを Jenkins Declarative Pipeline として整理し、アーティファクト（`server-modernized/target/site/cpd.{xml,html}`, `cpd-metrics.json`）は 30 日保持に設定。
- ✅ CPD メトリクス抽出スクリプト `ops/tools/cpd-metrics.sh` を実装し、BigQuery 取り込み用 JSON を生成できることをサンプル XML で検証。BigQuery 反映クエリ `ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql` と Grafana 追加パネル定義 `ops/analytics/grafana/static_analysis_cpd_panels.json` を整備し、既存ダッシュボードへ取り込める状態にした。
- ⚠️ サンドボックスでは Jenkins / Slack / PagerDuty / BigQuery / Grafana へアクセスできないため、初回ジョブログ・通知リンク・アラート証跡・ダッシュボード更新スクリーンショットは未取得。Ops チームが本番環境でジョブを登録・初回実行後に証跡を収集し、本メモと `docs/server-modernization/phase2/notes/static-analysis-findings.md` へ追記する。
- 📝 次ステップ: 1) Ops による Jenkins ジョブ作成と実行・証跡共有。2) BigQuery `static_analysis.duplicate_code_daily` テーブル作成と `cpd-metrics.json` の定期ロード手順化。3) Grafana `Static Analysis` ダッシュボードへパネル追加と Slack Info 通知閾値（前日比 +10%）の運用確認。

## 2026-06-14 追記: Ops-Credential-Setup（担当: Codex）
- ⚠️ サンドボックスでは Jenkins / GitHub へのアクセス権が無く、`slack-static-analysis-webhook` / `pagerduty-static-analysis-routing-key` および `SLACK_STATIC_ANALYSIS_WEBHOOK` / `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY` の登録・監査ログ取得は未実施。Ops へ棚卸しと証跡収集を依頼済み。
- 📝 Jenkins `Server-Modernized-Static-Analysis` / GitHub Actions `Server Static Analysis` の通知テストは未実行。Ops が手動失敗を発生させた際にビルド番号・Slack メッセージ Permalink・PagerDuty インシデント ID・テンプレ調整内容を共有し、本メモと `static-analysis-plan.md` に追記する必要あり。
- ✅ static-analysis-plan.md に資格情報登録手順、通知テンプレ改善案、Runbook 追記案を整理し、Ops 実施時のガイドとして利用可能な状態を整備。

## 2025-11-06 追記: Touch/REST RuntimeDelegate テスト復旧（担当: Codex）
- ✅ JAX-RS 実装非依存で `Response` を生成できる `open.dolphin.testsupport.TestRuntimeDelegate` を追加し、テスト用基底 `RuntimeDelegateTestSupport` から登録。`jackson-*` 依存を 2.17.1 系に揃えて `RuntimeDelegate` 呼び出し時の `NoSuchMethodError` を解消。
- ✅ `TouchStampServiceTest` / `TouchPatientServiceTest` / `DolphinResourceVisitTest` / `SystemResourceTest` / `PVTResource2Test` / `AdmissionResourceFactor2Test` にレスポンスアサーションと lenient 設定を補強し、Access Reason・Consent Token・監査詳細など業務的な期待値を明示。
- ✅ `mvn -f pom.server-modernized.xml test -pl server-modernized -Dtest=AdmissionResourceFactor2Test,SystemResourceTest,TouchStampServiceTest,TouchPatientServiceTest,PVTResource2Test,DolphinResourceVisitTest` で単体確認済み。`mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false -Dtest=<同上>` でも静的解析プロファイルを通過 (`tmp/static-analysis-targeted.log`)。
- 📝 未着手: Mockito Strictness 対応が未整備な既存テスト群（`DemoResourceAspTest` など）が static-analysis 全体実行時に失敗するため、別途 lenient 設定またはスタブ拡充の横展開が必要。

## 2026-06-13 追記: SpotBugs EI_EXPOSE_REP 分類（担当: Codex）
- ✅ `spotbugs-opendolphin-{common,server}.xml` の `EI_EXPOSE_REP*` 934 件を棚卸し、Legacy DTO/コンバータ 837 件と手動実装 97 件に分類。`docs/server-modernization/phase2/notes/static-analysis-findings.md` にサマリ表・リスク評価・対応方針を追記。
- ✅ Legacy 互換コード（`open.dolphin.{infomodel,converter}`, `open.dolphin.{adm10,adm20,touch}.converter`, `ICarePlan*`）を `spotbugs-exclude.xml` で除外する案を整理。手動実装は REST/Touch DTO・セキュリティ設定・運用系コンポーネントの 3 グループに分け、チケット草案を作成。
- 📝 次ステップ: 1) `spotbugs-exclude.xml` への具体的な `<Match>` 追記と CI プロファイル確認。2) `SA-REST-DTO-IMMUTABILITY` ほか優先チケット化と実装オーダー調整。3) 防御的コピー導入後に SpotBugs 再実行／JSON・JMS ラウンドトリップテストの追加を検討。

## 2026-06-12 追記: Static-Analysis-CI 組み込み（担当: Codex）
- ✅ ルートに `Jenkinsfile` を追加し、`Server-Modernized-Static-Analysis` マルチブランチパイプラインで SpotBugs/Checkstyle/PMD を二段階実行。`server-modernized/target/static-analysis/**/*` をアーティファクト化し、失敗時は Slack/PagerDuty へ通知。
- ✅ GitHub Actions Workflow `Server Static Analysis`（ジョブ ID: `static-analysis`）を新設。PR と `main` push で同等の静的解析を実行し、PR 時は `scripts/run-static-analysis-diff.sh` による差分ゲートを適用。成果物は `static-analysis-reports` として保存。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に CI 実装手順・通知設定・運用ルールを反映し、Slack/PagerDuty シークレット名を明示。
- 📝 次ステップ: 1) Nightly 用 `pmd:cpd` ジョブのスケジュール実装とダッシュボード整備。2) PagerDuty 通知テンプレートを Ops と擦り合わせて Runbook 化。3) Checkstyle/PMD レポートの自動 triage（重大度タグ付け）を検討。

## 2026-06-12 追記: Ops-Credential-Setup（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に Jenkins 資格情報 (`slack-static-analysis-webhook`, `pagerduty-static-analysis-routing-key`) / GitHub Secrets (`SLACK_STATIC_ANALYSIS_WEBHOOK`, `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY`) 登録手順と疎通テストのダウンタイムレスな実施方法を追記。Slack/PagerDuty の通知テンプレート・JSON 雛形も記録。
- ⚠️ サンドボックス環境では外部 Webhook 実行と資格情報登録が不可のため、実際の登録・疎通テストは Ops 環境で実施が必要。Runbook (`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`) へ追記する作業を Ops に引き継ぎ。
- 📝 次ステップ: 1) Ops が本番 Jenkins / GitHub Actions に資格情報を登録し、手動失敗トリガーで Slack/PagerDuty 通知を確認。2) 成果を Runbook に記録し、定期的な Webhook 健全性チェック手順（例: 月次ドライラン）を設定。3) PagerDuty インシデントレビューで通知テンプレートの文言・自動エスカレーションポリシーを確定。

## 2026-06-12 追記: Nightly-CPD-Design（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-findings.md` に Nightly PMD CPD ジョブ設計（Jenkins 優先・GHA 代替）、アーティファクト保管、Grafana/BigQuery ダッシュボード案、Slack 情報通知閾値案を記載。
- ✅ 週次レビュー体制案を整理。Phase2 静的解析スタンドアップ（木曜 10:00 JST）で CPD 指標・SpotBugs/PMD backlog をレビュー。参加者: Backend (Lead: 山本), Ops (担当: 佐々木), QA (担当: 田中)。議事録は `static-analysis-review-minutes.md`（新規予定）へ格納予定。
- 📝 次ステップ: 1) Jenkins に `Server-Modernized-Static-Analysis-Nightly` ジョブを作成し、`cron('H 3 * * *')` で稼働開始。2) Ops が CPD XML → BigQuery 連携スクリプトを整備し、Grafana ダッシュボードを公開。3) Slack `#dev-quality` への Info 通知テンプレートを試行し、閾値を調整。

## 2026-06-14 追記: SA-DOC-OPERATIONS（担当: Worker D）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に `SA-INFRA-MUTABILITY-HARDENING` 実施計画を追記。JMS ヘルパー / MBean キャッシュ / 外部接続ラッパーの 3 クラスタごとに担当・検証観点（JMS ラウンドトリップ、MBean Exposure IT、Plivo/ORCA WireMock など）・完了目安（6/21・6/25・6/28）を明文化。
- ✅ `docs/server-modernization/phase2/notes/ops-observability-plan.md` を新設し、Nightly CPD ジョブ (`ci/jenkins/nightly-cpd.groovy`) の前提、Slack/PagerDuty 資格情報、証跡保存ディレクトリ `ops/analytics/evidence/nightly-cpd/<date>/`、BigQuery/Grafana 連携（`ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql`, `ops/analytics/grafana/static_analysis_cpd_panels.json`）を整理。`docs/web-client/operations/TEST_SERVER_DEPLOY.md` で定義された WildFly + PostgreSQL リファレンス環境を前提条件として明示。
- ✅ `docs/server-modernization/phase2/notes/test-data-inventory.md` を新設し、`ops/tests/api-smoke-test/`、`scripts/api_parity_response_check.py`、監査ログ検証で必要なテストデータ・SQL・成果物保存ルール・Python 実行制約時の代替手順（curl / Postman / `psql`）を一覧化。追加作成すべき手動資材（`test_config.manual.csv`, `ops/tools/send_parallel_request.sh` など）も記録。
- ✅ `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8〜10 の備考を更新し、観測性・回帰テスト・ドキュメント運用タスクから上述ノートを参照できるようにした。
- 🔁 残タスク: 1) Ops が Nightly CPD を本番 Jenkins で 3 連続実行し、Slack/PagerDuty Permalink と Grafana パネル更新スクリーンショットを `ops-observability-plan.md` へ追記。2) `test-data-inventory.md` で定義した手動テスト資材を実体化し、CI と同じ成果物格納ルールを整備。3) 各 `SA-INFRA-MUTABILITY-HARDENING` クラスタ完了時に SpotBugs 件数差分とラウンドトリップテストログを本メモへ追記。

## 2026-06-12 追記: Static-Analysis-First-Run-Triage（担当: Codex）
- ⚠️ サンドボックスでは CI 実行不可のため、現行レポートは 2025-11-06 時点のローカル実行結果ベース。件数サマリと対応計画を `static-analysis-findings.md` に追記。
- ✅ SpotBugs High/Medium の優先順位を整理し、`SE_BAD_FIELD` の継続対応と `OBL_UNSATISFIED_OBLIGATION_EXCEPTION_EDGE` の 6 月末解消目標を明記。Checkstyle/PMD は差分ゲート + Nightly CPD で監視する方針。
- ✅ チケット化候補を整理（`JIRA-SERVER-2345`: Serializable 警告継続対応、`JIRA-SERVER-2410`: PMD 未使用メソッド/重複コード対応）。正式なチケット発行はプロジェクト JIRA 管理者へ依頼。
- 📝 次ステップ: 1) 初回 CI 実行後に実データで再トリアージし、High/Medium の新規検知を `static-analysis-findings.md` へ更新。2) SpotBugs 差分ゲートをスクリプトに組み込む案を評価（実行時間測定、ルールの増減）。3) Slack 通知に警告件数サマリを含めるか検討（SARIF 集計 or `jq` 集計スクリプト）。
## 2026-06-11 追記: Static-Analysis-Diff-Gating（担当: Codex）
- ✅ `scripts/run-static-analysis-diff.sh` を新規作成し、`git diff` に含まれる Java ファイルのみへ Checkstyle / PMD を適用するラッパーを整備。`--base` / `--target` / `--cached` オプションで PR / ローカル双方のワークフローに対応。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-findings.md` に Jenkins / GitHub Actions 向け二段階ジョブ（フルレポート採取 → 差分ゲート）のドラフトと運用注意点を追記。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に「新規・変更ファイルは警告ゼロ」「既存警告は技術負債として記録」「例外申請は findings.md へ記録」等の差分ゲート運用ルールを整理。
- 🧪 ダミー差分でラッパースクリプトを実行し、Checkstyle / PMD 共に警告ゼロであることを確認。手順と結果を `static-analysis-findings.md` へ記録済み。
- 📝 次ステップ: 1) 既知 PMD 警告（特に `AvoidInstantiatingObjectsInLoops`）の棚卸しと対応優先度分類。2) Jenkinsfile/GitHub Actions への本格導入に向けたジョブ作成と試験実行。3) 差分スクリプトでの SpotBugs 連携可否（SARIF 連携含む）を検討。

## 2026-06-10 追記: Layer-Decoupling-POC（担当: Codex）
- ✅ `ChartEventSessionKeys` / `ChartEventStreamPublisher` を `open.dolphin.session.support` に新設し、`ChartEventServiceBean` から REST 実装への直接依存を排除。`ChartEventSseSupport` をインタフェース実装として CDI 注入できる構造に整理した。
- ✅ `open.dolphin.msg.dto.AccountSummaryMessage` インタフェースを追加し、`OidSender`・`MessageSender`・`AccountSummary` 間を共通契約で接続。メッセージング層からセッション層クラスへの参照を削減しつつ、JMS ペイロード互換性を維持。
- ✅ `docs/server-modernization/phase2/notes/server-layer-map.md` に Layer-Decoupling-POC の依存図を追記し、本メモへ進捗を反映。
- 📝 次ステップ:  
  1. SSE 配信とロングポーリングの並列配送を自動テストで確認し、`ChartEventSessionKeys` 参照箇所の回帰検証を整備。  
  2. `AccountSummary` を `common` / `infomodel` へ移す場合の依存整理（Velocity テンプレート・序列化互換）を調査し、移行計画の是非を判断。  
  3. `OidSender` の CDI 化または `MessagingGateway` 経由の送信統合案を検討し、Activity レポート経路との統合可否をレビュー。

## 2026-06-09 追記: server-modernized レイヤーマップ作成（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/server-layer-map.md` を新規作成し、REST / Session / Msg / Security / Metrics / Support レイヤーごとに主要パッケージ・代表クラス・責務を表形式で整理。
- ✅ レイヤー間の依存フローと循環参照（`rest↔session`, `session↔msg`, `session↔touch.converter`, `rest↔touch`）を洗い出し、改善案を併記。
- ⚠️ `open.dolphin.session.ChartEventServiceBean` が REST 実装へ依存しているため、SSE 定数とサポートクラスの切り出しが必要。影響範囲調査と分離計画を別タスク化したい。
- 📝 次ステップ: 1) `AccountSummary` の移動可否を `common` モジュール側と調整。2) Touch コンバータを共有 DTO へ抽出する案を検討し、既存クライアント互換性を確認。

## 2026-06-08 追記: Infrastructure-Filter-Trace レビュー（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` を新規作成し、LogFilter → RequestMetricsFilter → SessionTraceManager の時系列整理と監査/JMS へのトレース伝搬経路を図式化。
- ⚠️ HTTP traceId とセッション traceId の系列が分離している点、`identityToken` が LogFilter を経由せず監査に traceId が残らない点、`RequestMetricsFilter` がテンプレート解決失敗時に動的パスをタグへ記録する点を重大ギャップとして記録。
- 📝 次ステップ:  
  1. `SessionOperationInterceptor` で MDC の traceId を受け取り SessionTraceManager へ継承する案の PoC を実施。  
  2. `identityToken` フローへ最小限の監査記録と traceId 付与を追加する設計を起こし、既存クライアント互換性テスト方針を整理。  
  3. Request メトリクスのパステンプレート抽出とステータスタグ追加の開発規模を見積もり、Grafana ダッシュボード更新手順を ops チームと擦り合わせる。

## 2025-11-06 追記: Trace-Propagation-Enhancement（担当: Codex）
- ✅ `LogFilter` で `identityToken` を含む全リクエストに traceId を割り当て、`X-Trace-Id` ヘッダーへ返却。403 応答時の警告ログにも `traceId=...` を出力。
- ✅ `SessionTraceManager`／`SessionOperationInterceptor` が HTTP traceId を継承し、`org.jboss.logmanager.MDC` と `org.slf4j.MDC` を双方向に同期するよう改修。`MessagingGateway` は traceId 欠落時に WARN を発砲しつつ新規採番して JMS プロパティへ設定。
- ✅ `RequestMetricsFilter` にパス正規化フォールバックと `status` タグ／`opendolphin_auth_reject_total` を追加し、サンプルメトリクスを `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` へ記録。
- 🧪 `mvn -f pom.server-modernized.xml test -DskipTests`、`mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=LogFilterTest,RequestMetricsFilterTest test`
- 🔜 Grafana の path/status タグ更新、および JMS WARN 発生時のアラート調整を ops チームと擦り合わせる。

## 2025-11-06 追記: Static-Analysis-Profile-Implementation（担当: Codex）
- ✅ `pom.server-modernized.xml` と各モジュールに `static-analysis` プロファイルを追加し、SpotBugs（FindSecBugs付）、Checkstyle、PMD を `verify` で連鎖実行できるよう整備。設定ファイルは `server-modernized/config/static-analysis/` に配置。
- ✅ `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を実行し、初回レポート（`server-modernized/target/static-analysis/`）を採取。結果サマリは `docs/server-modernization/phase2/notes/static-analysis-findings.md` に記録。テスト込み実行では既存の REST/Touch テストが多数失敗する点を確認。
- ✅ 2025-11-06: `DM_DEFAULT_ENCODING`（common 5 / server 13 件）を全箇所解消。`OrcaApi`／`PlistConverter`／`PlistParser` で UTF-8 を明示し、Touch/ADM 側の `Base64Utils`・`EHTResource`（Stamp/Tree）・`DemoResource`／`DemoResourceASP`／`DolphinResourceASP`／`KanaToAscii` でも `String#getBytes()`・`new String(byte[])` を Charset 指定へ置換。軽量テスト (`OrcaApiEncodingTest`, `Base64UtilsTest`, `KanaToAsciiTest`) を追加し `mvn -f pom.server-modernized.xml test -pl server-modernized,common -DskipTests=false -Dtest=OrcaApiEncodingTest,Base64UtilsTest,KanaToAsciiTest` → `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` で回帰確認。`SE_BAD_FIELD`（server 14 件）は同日対応済み。Medium は DTO に起因する `EI_EXPOSE_REP*` が大半（両モジュール合計 494 件）。
- 📝 次ステップ:  
  1. DM_DEFAULT_ENCODING / SE_BAD_FIELD など即対応が必要な警告を技術負債チケット化し、担当アサイン。  
  2. SpotBugs 除外フィルタに InfoModel／自動生成 DTO を追加しつつ、本番コードでの実害有無を棚卸し。  
  3. Checkstyle / PMD を差分限定で走らせるラッパー（`git diff` 連携）案を検討し、運用ルールを整備。  
  4. Jenkins / GitHub Actions に `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を組み込むワークフローをドラフト化し、CI チームへ共有。

## 2025-11-06 追記: SpotBugs-SE_BAD_FIELD 対応（担当: Codex）
- ✅ `open.dolphin.adm10/adm20/touch` の `IDocument*` 系 DTO と `ICarePlanModel` / `IOndobanModel30` に `serialVersionUID` を追加し、`IAttachmentModel`・`IUserModel`・`ICarePlanItem` を `Serializable` 化して Session/Touch 経路のシリアライズ互換を確保。JMS/REST いずれもフィールド構造は不変のため後方互換性リスクはなし。
- 🧪 `mvn -f pom.server-modernized.xml test -pl server-modernized -Dtest=Touch* -Dsurefire.failIfNoSpecifiedTests=false` を実行。`jakarta.ws.rs.ext.RuntimeDelegate` 実装がテストクラスパスに無い既知課題で複数テストが失敗することを再確認（TouchModule/DolphinResource 系）。コード変更による追加エラーは検出されず。
- 🧮 `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を再実行し、`server-modernized/target/static-analysis/spotbugs/spotbugs-opendolphin-server.xml` から `SE_BAD_FIELD` 検出が消失したことを確認。
- 📝 `docs/server-modernization/phase2/notes/static-analysis-findings.md` に対処内容を追記し、本メモへ記録。

## 2026-06-08 追記: 静的解析ツール導入方針整理（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` を新規作成し、SpotBugs / Checkstyle / PMD の比較表、Jakarta 10 での適用条件、段階的な導入ステップを整理。
- ✅ `pom.server-modernized.xml` を基点にした `static-analysis` プロファイル設計案と、SpotBugs 除外フィルタ / Checkstyle ルール配置ディレクトリの案を提示。
- 📝 次ステップ:  
  1. `server-modernized/config/static-analysis/` に SpotBugs 除外フィルタ・Checkstyle 設定ファイルを追加し、現状検出件数をサンプリング。  
  2. Jenkins / GitHub Actions へ `mvn -f pom.server-modernized.xml -Pstatic-analysis verify` を組み込むテンプレートを作成し、レポート保管先（アーティファクト or S3）を決定。  
  3. SpotBugs High/Medium 検出のトリアージ結果を `static-analysis-findings.md`（新設予定）へ記録し、優先対応チケットを起票。  
- 🧪 リソース要件:  
  - CI: Maven 3.9+ / Temurin 17 / 4GB RAM ノード 1 台。SpotBugs 実行で +4 分、Checkstyle/PMD で +3 分程度の追加所要を想定。  
  - Dev: SpotBugs GUI を利用する場合は X11 転送 or HTML レポート閲覧環境を確保。差分解析用に Git フック or ラッパースクリプト整備が必要。

## 2026-06-07 追記: PHR-2FA-Audit 実装準備（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/phr-2fa-audit-implementation-prep.md` を作成し、S3 ストレージ・Secrets 自動検査・監査ハッシュ検証・第三者提供 API のチケット草案と優先度/作業ブロック/受入条件を整理。
- ✅ `ops/check-secrets.sh`（Secrets 事前検査スクリプト案）を追加し、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に検査対象変数・CI 失敗条件・ドライラン結果を追記。ダミー値でのテスト実行を記録。
- ⚠️ 監査ハッシュ検証はローカル DB にデータがなく手動再現できず。Stage DB へ `d_audit_event` サンプルを投入し、通知ワークフローを含めたフルドライランが必要。
- 📝 次ステップ:  
  1. CI 環境（Jenkins or GitHub Actions）に `bash ops/check-secrets.sh` を追加し、Vault 連携と Slack/PagerDuty 通知を有効化。  
  2. Ops と連携して S3 バケット/IAM/Terraform 草案をレビューし、`PHR_EXPORT_S3_*` Secrets をステージ環境に投入。  
  3. セキュリティレビュー: 監査ハッシュ検証ジョブの設計と PagerDuty 通知テンプレートをセキュリティ委員会へ諮問。  
  4. 第三者提供 API の業務フロー定義ワークショップを開催し、API 設計レビュー→実装タスクを割り当てる。  
- 🧪 リソース要件:  
  - CI: Maven 実行可能なビルドエージェント（Linux）1 台 + Vault 読み取り権限。  
  - Ops: AWS アカウント権限（S3/IAM/CloudTrail）、Terraform 管理リポジトリ更新。  
  - Security: PagerDuty サービス連携、監査ログ保全ポリシー承認、手動異常対応 Runbook 更新。  
  - QA: Stage 環境での `PHRResourceTest` / `AdmissionResourceFactor2Test` 実行ログの収集と証跡保管。

## 2026-06-06 追記: ClaimItem / DocInfoModel / ModuleInfoBean DB 差分検証（担当: Codex）
- ✅ `ClaimItem` の追加フィールドはモジュール XML (`ModuleModel.beanBytes` → `IOSHelper.toXMLBytes`) に格納されることを確認。`DocInfoModel.admFlag` は `d_document.admflag`, `ModuleInfoBean.performFlag` は `d_module.performflag` 列を前提としており、Flyway には列追加 DDL が存在しない点を洗い出した。
- ⚠️ `IClaimItem` コンバータ（adm10/adm20 双方）が新フィールドを保持せず、REST 経路で保存すると `numberCodeName`・`santeiCode`・`dose*` が欠落する。`PhrDataAssembler` はこれらの getter を利用しており、現状では常に null 応答になる。
- ⚠️ `DocInfoModel#clone()` と `ModuleInfoBean#clone()` が `admFlag`／`performFlag` を複製しておらず、文書複製・スタンプ複製時にフラグが失われる恐れあり。
- 📝 Ops ランブックへ `information_schema.columns` による `admflag`／`performflag` 列存在チェックと不足時の `ALTER TABLE` 追加手順を追記。コンバータ更新＋XML 再生成テスト、Bean の複製漏れ修正、Flyway マイグレーション有無の Ops への確認をフォローアップタスクとして登録する。

## 2026-06-06 追記: PHR / 監査 / 2FA 実装計画整理（担当: Codex）
- ✅ `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-N-Z.md` に PHR 非同期ジョブ・第三者提供記録・2FA DTO の実装計画と優先度付きギャップ一覧を追記し、Flyway／Secrets／監査の整合性確認ステップを明文化した。
- ✅ `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の 検証フロー 4-7 に「2FA / 監査 / Secrets チェック」を追加し、`d_factor2_*` および `d_audit_event` の Flyway 適用確認、Secrets 検査、監査ハッシュ検証の手順を Runbook 化した。
- 📝 S3 PHR ストレージ実装可否の判断、`PHR_EXPORT_SIGNING_SECRET` の Secrets 管理方針、`ops/check-secrets.sh` への必須キー追加、Micrometer 監視項目整備をチケット化し Phase2 backlog に登録する。
- ⚠️ 現状は CI で `AdmissionResourceFactor2Test` やハッシュチェーン検証が走っておらず、手動チェックに依存している。Maven 実行環境整備と nightly 実行フローを Ops/QA と調整する必要がある。

## 2026-06-06 追記: Touch FirstEncounterModel 統合対応（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/touch/session/IPhoneServiceBean` から `FirstEncounter0/1Model` 参照を除去し、`FirstEncounterModel` へのクエリ一本化と `getFirstEncounterModels`／`getLatestFirstEncounter` を追加。
- ✅ `common/src/main/java/open/dolphin/infomodel/FirstEncounterModel` に `docType` 列を読み取り専用で公開し、シングルテーブル継承メタデータを整理。`beanBytes` の取り扱いは既存ロジックを継承。
- ✅ `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md` に Touch REST API／クライアント依存／`d_first_encounter` の影響と互換性確認手順を追記。
- 📝 互換性確認フロー: ① モダナイズ環境で `SELECT docType, COUNT(*) FROM d_first_encounter GROUP BY docType;` を実行し Legacy 由来の docType 値（`FirstEncounter0Model` 等）を確認。② Touch サービスから代表レコードの `beanBytes` を `IOSHelper.xmlDecode` でデコードし、既存クライアントが解釈できることを確かめる。③ Touch REST API に docType フィルタを公開する際は UI/クライアント仕様書へ docType 一覧とリクエスト例を追記する。

## 2026-06-05 追記: Common DTO A〜M 差分棚卸し（担当: Codex）
- ✅ `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md` を新設し、Jakarta 版と Legacy (`e17c06d8`) の差分をクラス別に整理。新規 DTO（監査ログ / 2FA / CarePlan）と Legacy 未収録 DTO を把握した。
- ⚠️ `FirstEncounter0/1/2Model` が Jakarta 版から削除されている一方、`server/src/main/java/open/dolphin/touch/session/IPhoneServiceBean` で引き続き参照されており、Touch 系ビルドが成立しない。代替 DTO（`FirstEncounterModel`）へのリファクタ or Touch API の廃止可否を決定する必要あり。
- 📝 `ClaimItem` / `DocInfoModel` / `ModuleInfoBean` に追加したフィールドの DB スキーマ（Flyway 適用）と Legacy サーバーでの互換性確認、`IInfoModel` 定数削除に伴う利用箇所洗い替えを継続する。

## 2026-06-04 追記: Common DTO N〜Z 差分棚卸し（担当: Codex）
- ✅ `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-N-Z.md` を新設し、Legacy（`upstream/master`）との差分を Jakarta 置換状況 / フィールド追加 / 新規 DTO ごとに整理。`PHRAsyncJob` や `ThirdPartyDisclosureRecord` などの新設エンティティを含めた互換性影響と優先度付きフォローアップを記録した。
- ✅ `PHRBundle` の `facilityNumber` 追加や `PHRClaimItem` の用法・投与量フィールド拡張、Hibernate 6 への `@JdbcTypeCode(SqlTypes.CLOB)` 置換など、Legacy 実装との不整合点を棚卸し。`OrcaAnalyze`/`CacheUtil`/`LegacyBase64` など周辺コンバータ・ユーティリティの Jakarta 対応も併せて一覧化した。
- 📝 フォローアップとして (1) PHR 出力スキーマと旧クライアントの互換検証、(2) `phr_async_job` Flyway 適用状況の自動チェック、(3) 第三者提供記録の実装計画策定、(4) Jakarta Mail 依存のビルド確認を進める。

## 2026-06-04 追記: デバッグチェックリスト初版作成（担当: Codex）
- ✅ `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を新設し、server-modernized デバッグタスクをフェーズ別チェックリストとして整理。現時点で完了済みの棚卸し事項と未着手タスクを明確化した。
- ✅ 本メモへ進捗を追記し、今後の更新時にチェックリストと連動してステータスを管理する運用方針を定義。

## 2026-06-04 追記: フェーズ1ビルド検証・設定レビュー（担当: Codex）
- ✅ `mvn -f server-modernized/pom.xml clean verify -DskipTests` を実行し、WAR を生成。コンパイル時に `Base64Utils`（Touch 系）、`Long(long)` / `Character(char)` など Java SE 非推奨 API の警告を確認し、要フォロー項目としてチェックリストへ追記。
- 📝 非推奨 API 警告は開発完了後にまとめて解消する方針とし、チケット化対象として記録（即時対応は行わない）。
- ✅ `common` モジュールをローカルインストールし（`mvn -f common/pom.xml install -DskipTests`）、`opendolphin-common-2.7.1-jakarta.jar` を取得。server-modernized ビルド時の依存解決が完了することを確認。
- ✅ `META-INF/persistence.xml`（3.1 スキーマ）および `META-INF/ejb-jar.xml`（4.0 スキーマ）を確認し、Jakarta EE 10 対応のスキーマ／データソース設定が整合していることを記録。

## 2026-06-04 追記: WildFly CLI 冪等化（担当: Worker S2）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の JDBC データソース（`java:/jboss/datasources/ORCADS` / `PostgresDS`）を `if (outcome != success)` 判定で増分更新し、旧 SSL 設定の有無に応じたプロパティ整理を行った。
- ✅ ActiveMQ Artemis の `java:/queue/dolphin` / `java:/JmsXA` / `default-resource-adapter-name=activemq-ra` を冪等作成し、従来キューとの互換を保ったまま MDB 連携を有効化。
- ✅ `ee-concurrency` サブシステムへ `DolphinContext` / `DolphinExecutor` / `DolphinScheduler` / `DolphinThreadFactory` を追加し、デフォルト参照先をまとめて JNDI 化。CLI ログには `:read-resource-description` で最終状態を記録。
- ✅ `ops/modernized-server/docker/Dockerfile` に手動ビルド検証のコメントを追記し、CLI スクリプト完走確認手順を明示。

## 2025-11-06 追記: OQS サブモジュール追加（担当: Codex）
- ✅ `ext_lib/OpenDolphin-ORCA-OQS` を Git サブモジュールとして追加し、オンライン資格確認（OQS）および電子処方箋ワークフロー実装時に参照するコードベースをリポジトリへ取り込んだ。
- ✅ `docs/server-modernization/phase2/README.md` / `docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md` を更新し、OQS 連携の位置づけ、Jakarta EE 10 対応状況、REST→OQS ブリッジ設計や Secrets 管理・CI 組み込みタスクを明記。
- 📝 フォローアップ: `server-modernized` ビルドへ OQS SDK を組み込む Maven 設計（モジュール追加 or BOM 連携）と、資格確認 API・電子処方箋電文の統合テスト手順（鍵・証明書の保管ポリシーを含む）を作成する。

## 2025-11-05 追記: Secrets 配布ワークフロー整備（担当: Worker S1）
- ✅ `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` へ `FACTOR2_AES_KEY_B64` の生成・ローテーション手順と Jakarta EE 10 向け Secrets 配布フローを追加し、未設定時の失敗条件と監査対応を明文化。
- ✅ `.env.sample` / `server-modernized/config/server-modernized.env.sample` / `docker-compose.modernized.dev.yml` に Secrets 必須項目のコメントを追記し、本番では Vault 等から値を注入する必要がある旨と未設定時の挙動を明記。
- ✅ `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` へ Secrets 手順への参照を追加し、2FA 鍵欠落時の対応先を統一。

## 2026-06-03 追記: Ops 自動検証スクリプト導入（担当: Worker S3）
- ✅ WildFly 必須リソースを `docker exec` と `jboss-cli.sh` で検証する `ops/modernized-server/checks/verify_startup.sh` を追加。`set -euo pipefail` でブロッカーを即検知できるよう、各ステップで `[INFO]` / `[OK]` ログを整備。
- ✅ スクリプトの前提条件と使用例を `ops/modernized-server/checks/README.md` に整理し、Ops チームがジョブ基盤へ組み込みやすいよう参照手順を明文化。
- ✅ `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` に「Ops 自動検証スクリプト」節を追加し、チェック対象リソースと導入意図をリンク付きで記載。

## 2026-06-03 追記: WildFly 33 運用ランブック整理（担当: Worker S4）
- ✅ `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` にモダナイズ版起動前チェックリストを新設し、Worker S1 の Secrets 配布手順／Worker S3 の検証スクリプト／JMS・Concurrency リソース確認を連携させた。
- ✅ `docs/archive/2025Q4/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md` へ JMS 設定完了証跡と CLI／`verify_startup.sh` を用いた検証フローを追記し、ログ保存場所とフェールオーバーテストの手順を明文化。
- ✅ `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` に Concurrency リソース整備済みである旨と `executor.*` メトリクス監視のフォローアップタスクを追加。
- 📝 本メモを更新し、Documentation Runbook の進捗を記録。

## 2026-06-02 追記: server-modernized 起動ブロッカー整理（担当: Codex）
- ✅ 起動を阻害している依存リソースを調査し、`docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` に 2FA 秘密鍵・JDBC データソース・JMS・Jakarta Concurrency の不足点と対応手順をまとめた。
- ✅ `docs/web-client/README.md` のナビゲーションへ上記ドキュメントを追加し、フロントエンド側からも参照できるようリンクを更新。

## 2026-05-27 Update: API parity tooling (owner Codex)
- Added `scripts/api_parity_eval.py` to aggregate coverage by matching legacy OpenAPI (`docs/server-modernization/server-api-inventory.yaml`) and the parity matrix (`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`).
- `[x]` combined with the complete symbol is treated as fully migrated; uncovered entries and OpenAPI gaps are listed in the CLI output for follow-up.
- Introduced `scripts/api_parity_response_check.py` to send mirrored requests to both servers and compare status/body based on a JSON definition. Destination IPs are supplied via `LEGACY_API_BASE` / `MODERN_API_BASE` or `--legacy-base` / `--modern-base`.
- Published `scripts/api_parity_targets.sample.json` as a template for request definitions and documented the workflow in `docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md`.

## 2025-11-03 追記: PVTResource2 / SystemResource パリティ再点検（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/PVTResource2.java` の POST/GET 実装と `server-modernized/src/test/java/open/dolphin/rest/PVTResource2Test.java` のカバレッジを確認し、`/pvt2` POST・`/pvt2/pvtList` GET を `[x]` 判定へ更新。facility ID 再紐付けと `PatientVisitListConverter` 包装処理の単体テスト証跡を取得済み。
- ✅ `DELETE /pvt2/{pvtPK}` の削除正常系／施設不一致例外系を `PVTResource2Test#deletePvt_removesVisitForAuthenticatedFacility`／`#deletePvt_throwsWhenFacilityDoesNotOwnVisit` として追加し、`PVTServiceBean#removePvt` 呼び出しパラメータと `ChartEventServiceBean#getPvtList` の副作用を検証。マトリクスと Runbook を `[x]` 化済み。
- ✅ 2025-11-04: Worker E が `SystemResourceTest` を追加し、`/dolphin` 5 エンドポイントの正常系／例外系・監査ログ分岐をモック検証。Runbook SYS-PARITY-20251104-01 とマトリクス更新で証跡を反映。
- 📎 ドキュメントを更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（PVT2 行と SystemResource 行の最新判定）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（検証ログ追記）、`docs/web-client/README.md`（更新概要を反映）。

## 2025-11-04 追記: SystemResource 監査整備（担当: Worker E）
- ✅ `server-modernized/src/test/java/open/dolphin/rest/SystemResourceTest.java` を新設し、hellowDolphin/addFacilityAdmin/getActivities/sendCloudZeroMail/checkLicense の全ユースケースを Mockito でモック化。成功・失敗それぞれの `AuditTrailService` への記録を `ArgumentCaptor` で検証し、ライセンス処理は `InMemoryLicenseRepository` で IO 副作用を遮断。
- ✅ `server-modernized/src/main/java/open/dolphin/rest/SystemResource.java` に監査ヘルパーを追加し、`SystemServiceBean` 呼び出し前後で成功/失敗詳細（facilityId・traceId・reason）を記録。`LicenseRepository`（ファイル実装含む）を導入し、読込/書込例外・上限超過を明示的にハンドリングするよう更新。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` と `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を更新し、SystemResource 行を `[x]`／◎ に変更。Runbook には検証 ID `SYS-PARITY-20251104-01` を登録。
- ⚠️ ローカル環境に Maven CLI が無く `mvn -pl server-modernized test -Dtest=SystemResourceTest` は未実施。CI 環境または Maven 導入後に当該コマンドを実行し、Runbook の備考へログ（監査テーブル確認結果含む）を追記する必要がある。

## 2025-11-04 追記: PHRResource 監査整備と Export API 実装（担当: Worker F）
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java` を全面改修し、11 既存エンドポイントへ監査ログ・施設 ID 突合・TouchErrorResponse を導入。新規エンドポイント（`POST /20/adm/phr/export`, `GET/DELETE /20/adm/phr/status/{jobId}`, `GET /20/adm/phr/export/{jobId}/artifact`）を実装し、署名付き URL を返却できるようにした。
- ✅ `PhrExportJobWorker`・`PhrDataAssembler`・`PhrRequestContext` などサポートクラスを追加し、ZIP 生成→ファイルシステム保存→`SignedUrlService` による HMAC 署名を完結。`PHRAsyncJobServiceBean#cancel` で PENDING ジョブの取消にも対応。
- ✅ REST 向け単体テスト `PHRResourceTest` を追加し、アクセスキー参照／エクスポート要求／成果物ダウンロードの代表ケースを Mockito で検証。ローカル環境では `mvn` 不在のため実行不可 (`bash: mvn: command not found`)。CI で `mvn -f pom.server-modernized.xml -pl server-modernized test -Dtest=PHRResourceTest` を必ず回し、結果ログを Runbook 手順 6 へ添付すること。
- ✅ ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（PHR 行を `[x]`／◎ 化＋ export 系を追記）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（Blocked 解除・curl/SQL 手順を追加）、`docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`（結果概要更新）、`docs/web-client/README.md`（更新概要リンクを追加）。

## 2025-11-04 追記: DolphinResource Document API モダナイズ（担当: Worker A）
- ✅ `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java` の `/touch/document/progressCourse`・`/touch/idocument(2)` を JSON 応答へ刷新し、`DolphinTouchAuditLogger`＋`TouchErrorResponse` で監査・例外を統一。施設 ID 突合とトレース ID 付き失敗レスポンスを実装。
- ✅ `server-modernized/src/main/java/open/dolphin/touch/dto/DolphinDocumentResponses.java` と `DolphinTouchAuditLogger.java` を追加し、カルテ本文 DTO／監査ロガーを共通化。ProgressCourse 変換では schema Base64・ClaimItem の用法/日数を保持。
- ✅ `server-modernized/src/test/java/open/dolphin/touch/DolphinResourceDocumentTest.java` を新設し、正常保存・施設不一致・バリデーション失敗・一覧取得をカバー。`mvn` が未導入のため CLI 実行は不可（`bash: mvn: command not found`）だが、IDE/CI 導入後に `-Dtest=DolphinResourceDocumentTest` での実行を予定。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` を更新し、該当 3 行を `[x]`／◎ へ変更。監査ログ・TouchErrorResponse 整備およびテストケース（DolphinResourceDocumentTest）をメモ欄へ追記。

## 2025-11-04 追記: Touch Module API 移行（担当: Worker B）
- ✅ `/touch/module*`／`/touch/item/laboItem` を `TouchModuleService` + JSON DTO へ刷新し、`TouchAuthHandler` で施設ヘッダー突合・`TouchModuleAuditLogger` で監査ログを統一。キャッシュは `CacheUtil`（TTL 10 秒・キー `method:paramHash`）で実装。
- ✅ `TouchModuleResourceTest` を追加し、モジュール／RP 多剤／診断／ラボ結果／Schema Base64／キャッシュヒット／施設ガードの各パリティを検証。`mvn -pl server-modernized -Dtest=TouchModuleResourceTest test` は Maven 未導入により実行失敗（`bash: mvn: command not found`）。
- 📄 ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch モジュール 6 行を `[x]` 化）、`domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md`（実装サマリとキャッシュキー方針）、`phase2/README.md`（推奨アクション追記）、`docs/web-client/README.md`（関連リンク追加）。
- 📌 残タスク: `/touch/patient/*`・`/touch/stamp*` など未移植 13 件は引き続き legacy XML 実装のため `[ ]` 継続。Touch ドキュメント系のキャッシュ共有 (`TouchResponseCache`) は Worker A の実装待ち。

## 2025-11-03 追記: EHTResource API パリティ完了（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java` と `ADM20_EHTServiceBean` を拡張し、旧サーバーの `/20/adm/eht/*` 43 エンドポイントを全移植。CLAIM 送信／バイタル／身体所見系に Jakarta 版のトランザクション境界とレスポンス順序（`order by`）を反映。
- ✅ 監査ログを拡充（`EHT_CLAIM_SEND(2)`, `EHT_PHYSICAL_*`, `EHT_VITAL_*`）し、`EHTResourceTest`（sendClaim/vital/physical）を追加。`API_PARITY_MATRIX.md` と `EHT_SECURITY_AUDIT_CHECKLIST.md` を刷新し、Runbook 4.2 にテスト ID `EHT-RUN-20251103-*` を登録。
- ⚠️ ローカルに Maven が存在せず `mvn -pl server-modernized test` は `bash: mvn: command not found`（2025-11-03 14:15 JST）。ユニットテストは追加済みのため、Maven 導入後に実行ログを取得し Runbook/監査テーブルを確定させる。ORCA／CLAIM 実機検証は Worker E・Worker A へ引き続き依頼済み。

## 2025-11-03 追記: PHR/MML API パリティ再確認（担当: Worker D）
- ✅ `PHRResource` の 11 エンドポイント全てが Jakarta 版で実装されていることをコード確認。`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` と `API_PARITY_MATRIX.md` を修正し、実装済みである一方テスト証跡が無いことを `△ 要証跡` として明示。
- ✅ `MmlResource` の Labtest/Letter 系エンドポイント（`/mml/labtest/*`, `/mml/letter/*`）が現行ソースに存在することを確認し、`STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` を更新。Runbook/マトリクスから「未移植」表記を除去し、テスト未整備のフォローを追記。
- ⚠️ PHR エクスポート基盤は REST エンドポイント・ジョブワーカーが未実装。`PhrExportJobManager` が未定義クラス `ManagedExecutorFactory` を参照、`PhrExportJobWorker` クラス欠如、S3 ストレージはスタブのままと判明。Runbook (`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`) の手順 6 を **Blocked** 表記へ差し替え。
- 📌 Flyway DDL `server-modernized/tools/flyway/sql/V0220__phr_async_job.sql` は存在するが適用ログ無し。`WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` にタスクとして (1) REST 実装、(2) ジョブワーカー整備、(3) DDL 適用手順、(4) テスト・監視追加 を列挙。実装完了まで `PHRResource` の API チェックボックスは `[ ]` のままとし、証跡取得後に `[x]` へ引き上げる。

## 2025-11-04 更新: DemoResourceASP 完了（担当: Worker G）
- ✅ `ModuleModel` import 復旧、`BundleDolphin#setOrderName`／ProgressCourse オーダ整合、ラボ `comment2` フォールバック、施設・ユーザーヘッダー検証＋`AuditTrailService` 連携を実装。`DemoResourceAspTest` を 15 エンドポイントの正常／異常系へ拡張し、`fixtures/demoresourceasp/*` で legacy 期待値と JSON 比較。Runbook `DEMO-ASP-20251104-01` にテスト手順・curl 比較観点・IDE 実行ログを追記。
- ⚠️ ローカルに Maven が無いため `mvn -f pom.server-modernized.xml test -Dtest=DemoResourceAspTest` は未実行。CI 導入後に実行ログと `d_audit_event` 監査確認を取得して Runbook を完結させる。

## 2025-11-04 追記: Touch 個人情報 API モダナイズ（担当: Worker B）
- ✅ `/touch/patient/{pk}` `/touch/patientPackage/{pk}` `/touch/patients/name/{param}` を `TouchPatientResource`＋`TouchPatientService` へ移行し、施設整合チェック・`X-Access-Reason`／`X-Consent-Token` 必須化・`AuditTrailService` 連携と JSON 正規化を実装。`TouchPatientServiceTest` で consent 未設定・施設不一致・カナ検索分岐を検証。
- ✅ `/touch/stamp/{param}` `/touch/stampTree/{param}` を `TouchStampResource` に分離し、`TouchResponseCache`（TTL 10 秒）でレスポンスをキャッシュ。`TOUCH_STAMP_FETCH`／`TOUCH_STAMP_TREE_FETCH` 監査ログを追加し、`TouchStampServiceTest` でキャッシュヒットとヘッダー不足時 403 をカバー。
- ✅ `/touch/user/{param}` を `TouchUserResource` へ移管し、`userName`／`password` ヘッダー検証・施設 ID 正規化・S3 Secret マスクを実装。`TouchUserServiceTest` でヘッダー突合とサニタイズ済みレスポンスを確認。
- 📄 ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch patient/stamp/user 行を `[x] ◎` 判定へ更新しテスト ID を追記）、`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`（新リソースと監査要件を掲載）、`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`（`X-Access-Reason`／`X-Consent-Token` 運用と PIA 監査ログ確認フローを追記）。
- ⚠️ フォローアップ: `/touch/idocument(2)` からのキャッシュ失効と SSE エラー連携は未実装。`mvn -pl server-modernized test` は Maven 未導入のため `bash: mvn: command not found`（2025-11-04 17:20 JST）。

## 2025-11-04 追記: Touch 来院履歴 API 移植（担当: Worker C）
- ✅ `GET /touch/patient/firstVisitors|visit|visitRange|visitLast` を QueryParam 化し、`facility/offset/limit/sort/order` を RESTEasy で受け付けるよう改修。legacy `{param}` 形式は互換のため維持。
- ✅ `IPhoneServiceBean#getPatientVisitWithFallback` へ前日再検索ロジックを移設し、`fallbackApplied` フラグを監査に残す。施設突合・ロール判定は `403` で明示し、監査イベントを「来院履歴照会」「施設突合失敗」に統一。
- ✅ Micrometer カウンタ/タイマ (`touch_api_requests_total` / `_error_total` / `_duration`) を追加し、`DolphinResourceVisitTest` で施設不一致・権限不足・limit 境界・Fallback 正常系を検証。マトリクスと Runbook を更新。
- 📄 更新ドキュメント: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch 来院履歴行を `[x]` 化）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（QueryParam 仕様・監査/メトリクス手順を追記）、`docs/web-client/README.md`（更新概要リンク）。

## 2026-05-27 追記: セッション層ログの SLF4J 移行（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/session/` 配下のセッション Bean、`session/framework`、`security/`（FIDO/TOTP 含む）、`metrics/MeterRegistryProducer` の `java.util.logging` 呼び出しを `org.slf4j.Logger` ベースへ統一。ログレベル・メッセージ文面は既存実装を踏襲しつつ、クラス単位でロガーを取得する形に整理した。
- ✅ `server-modernized/pom.xml` に `org.slf4j:slf4j-api:2.0.13`（provided）を追加し、コンパイル時に SLF4J API を解決できるようにした。WildFly 33 標準の `slf4j-jboss-logmanager` バインディングで自動的に JBoss LogManager へルーティングされるため、追加の運用設定は不要。
- ℹ️ 監査ログや Micrometer 連携は SLF4J への移行後も既存のログカテゴリ名を維持する。`logging.properties` 側のカテゴリ指定を変更する必要はないが、WildFly コンソールで `org.slf4j` ロガーを有効化すると新メッセージを確認できる。

## 2025-11-03 追記: DolphinResourceASP / JsonTouch 再点検（担当: Worker C）
- 🔍 `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java:26-1488` と `DolphinResourceASP.java:25-1446` を確認し、legacy 実装のコピーであること・`System.err` ログ／施設 ID 突合・監査・キャッシュが未導入であることを再確認。`server-modernized/src/main/webapp/WEB-INF/web.xml:20-46` に `open.dolphin.touch.DolphinResourceASP` が登録されておらず RESTEasy から到達できないため、API パリティでは `[ ]` 継続とした。
- 🔍 `JsonTouch` 系は `/jtouch`（touch）／`/10/adm/jtouch`（adm10）／`/20/adm/jtouch`（adm20）に分散しているが、ADM10 側の document/mkdocument を Jakarta リソースへ実装し、`JsonTouchAuditLogger` で監査ログを統一。`JsonTouchResourceParityTest` を 17 ケース（document/mkdocument/interaction/stamp の正常・異常＋監査ログ検証）へ拡張し、touch/adm10/adm20 のレスポンス整合を確認した。
- ✅ 2025-11-08: `server-modernized/src/test/java/open/dolphin/adm/AdmConverterSnapshotTest.java` を追加し、`ops/tests/fixtures/adm/adm10|adm20/patient_model.json` をレガシー基準スナップショットとして管理（旧 `tmp/legacy-fixtures` には Stub を残置）。`mvn -f pom.server-modernized.xml -pl server-modernized -am test -Dtest=AdmConverterSnapshotTest#patientModelSnapshot -DskipITs -Dsurefire.failIfNoSpecifiedTests=false` で touch/adm10/adm20 の JSON を比較し、`artifacts/parity-manual/adm-snapshots/20251108T063545Z/patient_model/adm20/diff.txt` に `reserve1`〜`reserve6` 欠落の証跡を保存。`adm20` の `IPatientModel` へ欠落 getter を再追加し、`docs/server-modernization/phase2/notes/rest-touch-diff-report.md` / `notes/test-data-inventory.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を更新して証跡を連結。
- ✅ 2025-11-08: `AdmConverterSnapshotTest` に `visitPackageSnapshot` / `laboItemSnapshot` / `registeredDiagnosisSnapshot` を追加し、現在は `ops/tests/fixtures/adm/adm10|adm20/<scenario>.json` に touch 基準の JSON を保存。`mvn` 不在のため `jshell --class-path "<依存クラスパス>"` でテストクラスを反射呼び出しし `adm.snapshot.update=true` でフィクスチャを再生成、`adm.snapshot.update=false` で再実行して ADM10/20 双方とも差分なしを確認した。新規シナリオでは diff が発生しなかったため `artifacts/parity-manual/adm-snapshots/<timestamp>/` の追加は無し。手順・コマンドは `docs/server-modernization/phase2/notes/test-data-inventory.md#6` と `notes/rest-touch-diff-report.md#5` に追記済み。

## 2025-11-11 追記: ADM スナップショット再検証（担当: Codex）
- ✅ RUN_ID=`20251111T161746Z`。`mvn -f reporting/pom.xml install -DskipTests` で `opendolphin-reporting-2.7.1.jar` をローカルリポジトリへ配置後、`mvn -f server-modernized/pom.xml test -Dtest=AdmConverterSnapshotTest -DskipITs -Dsurefire.failIfNoSpecifiedTests=false` を実行し、`patient_model` / `visit_package` / `labo_item` / `registered_diagnosis` の 4 シナリオすべてが `adm.snapshot.update=false` のままパスすることを確認。`ops/tests/fixtures/adm/adm10|adm20/*.json` は未変更、`artifacts/parity-manual/adm-snapshots/` への新規書き出し無し。
- 📁 実行ログは `server-modernized/target/surefire-reports/open.dolphin.adm.AdmConverterSnapshotTest.{txt,xml}` に保存済み。テスト実行中に SAXParseException（`XMLドキュメント構造は...`）が INFO レベルで再現したが、既知のタッチ XML fixture の欠損警告であり期待動作。次回は CI で同コマンドを定期実行し、差分発生時に `artifacts/parity-manual/adm-snapshots/<UTC>/` を保存するフローを整備する。
- ✅ RUN_ID=`20251116TadmSnapshotZ1`。`RUN_ID` を環境変数に設定し `mvn -f server-modernized/pom.xml test -Dtest=AdmConverterSnapshotTest -DskipITs=false` を再実行。Git 管理へ移動した `ops/tests/fixtures/adm/adm{10,20}/*.json` を参照しても差分は発生せず、`artifacts/parity-manual/adm-snapshots/20251116TadmSnapshotZ1/README.md` にコマンド・結果・ログ参照先を記録した。Surefire 証跡は前回同様 `server-modernized/target/surefire-reports/open.dolphin.adm.AdmConverterSnapshotTest.{txt,xml}`（2025-11-12 23:26 JST）を参照。
- 🔁 次アクション: (1) Snapshot テストを Phase2 モダナイズ CI へ常設し、`ADM_SNAPSHOT_RUN_ID` 命名・Surefire アーティファクト保存・`ops/tests/fixtures/adm/` 更新通知を自動化（Checklist #78 継続）、(2) `adm.snapshot.update=true` 実行ガイドを `test-data-inventory.md` へリンクし、フィクスチャ追加時は同ガイド＋`rest-touch-diff-report.md` RUN_ID 節を即日更新、(3) `adm.snapshot.fixtureDir` 変更時に備えて Runbook へ環境変数化手順を追記。
- 🧪 CI 取り込み設計完了: `mvn -f reporting/pom.xml install -DskipTests` → `mvn -f server-modernized/pom.xml test -Dtest=AdmConverterSnapshotTest -DskipITs=false` を 1 ジョブにまとめ、`ADM_SNAPSHOT_RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)` を用いた RUN_ID 命名・Surefire ログのアーティファクト保存・`artifacts/parity-manual/adm-snapshots/${ADM_SNAPSHOT_RUN_ID}` への差分退避案を `notes/rest-touch-diff-report.md` に追記済み。CI では差分ディレクトリ検出後に `upload-artifact` へ渡すだけでよく、Docker 起動は不要。
- 📦 フィクスチャ管理メモ: `ops/tests/fixtures/adm/adm10|adm20` は計 40 KB・年数回更新見込みで Git 管理へ昇格済み。旧 `tmp/legacy-fixtures` には Stub を残し、Runbook から新ディレクトリへ誘導する。サイズ・更新頻度・再生成コマンド・CI での扱いは `notes/rest-touch-diff-report.md` に記録済みで、アップデート時は Checklist/DOC_STATUS を即時更新する。
- 🔁 次アクション: (1) Maven 実行環境が整い次第（もしくは CI 上で）`mvn -f server-modernized/pom.xml test -Dtest=AdmConverterSnapshotTest -DskipITs=false` を定期実行し、Surefire ログと `artifacts/parity-manual/adm-snapshots/<RUN_ID>/README.md` を更新、(2) `ops/tests/fixtures/adm/` の変更が入った場合は即座に RUN_ID を採番し `rest-touch-diff-report.md` へ追記、`tmp/legacy-fixtures` Stub も忘れず最新化する。
- 📝 `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の DolphinResourceASP・JsonTouchResource 行を更新し、未登録・未テストのギャップを明記。`docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md` と `docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` に再点検メモを追記。
- ⚠️ 次アクション: ① RESTEasy 登録＋エンドポイント露出の確認、② Touch 用キャッシュ／認可／監査実装、③ Reverse Proxy 手順の更新と `/20/adm/jtouch` 系の監査統合、④ 残るエラー応答フォーマット統一。完了後に API パリティを `[x]` へ更新する。

## 2025-11-03 追記: DolphinResourceASP 移植設計着手（担当: Worker C）
- ✅ `docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md` を作成し、旧 `/touch/*` 19 エンドポイントのレスポンス構造・認可ギャップ・キャッシュ要件を整理。Worker F（スタンプキャッシュ）／Worker E（Touch UI 例外統一）との連携タスクを明文化した。
- 🔍 旧サーバー実装 (`server/src/main/java/open/dolphin/touch/DolphinResourceASP.java`) を精査し、`getProgressCource` など大容量レスポンスと `postDocument(2)` のデータ更新パスを特定。キャッシュ導入時に患者単位の無効化が必要なことを確認。
- ⚠️ モダナイズ実装では `TouchResponseCache`・`TouchErrorResponse`・`TouchXmlWriter`（仮称）の新設、および施設 ID 整合チェック／UI 例外イベント連携を次ステップで実装する。Worker F からスタンプキャッシュ方針、Worker E からエラー payload 仕様を取得次第、本メモと Runbook を更新する。

## 2025-11-03 追記: Admission/System 2FA API 移植検証（担当: Worker A）
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` で `AdmissionResource` 28 件・`SystemResource` 5 件をすべて `◎ 移行済み` へ更新し、FIDO2/TOTP 系／carePlan 系の未チェック行を解消。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java` に 2FA 失敗時の `*_FAILED` 監査ロギングと `status` フラグを追加し、`TotpHelper#verifyCurrentWindow` を ±90 秒ウィンドウへ拡張。
- ✅ 新規ユニットテスト `AdmissionResourceFactor2Test` / `TotpHelperTest` / `TotpSecretProtectorTest` を追加し、2FA API と暗号化ユーティリティの互換性を検証可能にした（`mvn -f pom.server-modernized.xml test` で実行）。
- ✅ 2025-11-03: `AdmissionResourceFactor2Test` に FIDO2/TOTP の成功・異常系カバレッジを追加（`startFidoRegistrationRecordsAuditOnSuccess` / `finishFidoRegistrationRecordsAuditOnNotFound` / `finishFidoAssertionRecordsAuditOnSecurityViolation` ほか計 8 ケース）。`API_PARITY_MATRIX.md` のメモと `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の手順 4-3 を更新。
- ⚠️ ローカル環境に Maven バイナリが無いためテストコマンド実行は未完了。2025-11-03 時点でも `mvn -f pom.server-modernized.xml test` は `bash: mvn: command not found` で失敗。`mvn` が利用可能になり次第、上記テスト群を実行して Runbook の手順 4-3 を完了させる必要がある。

## 2025-11-03 追記: Stamp / Letter 監査ログ整備（担当: Worker F）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/StampResource.java` に `AuditTrailService` 連携と 404 応答処理を実装。単体テスト `StampResourceTest`（削除成功／不存在／一括削除シナリオ）を追加し、監査ペイロードを検証できるようにした。
- ✅ `server-modernized/src/main/java/open/dolphin/rest/LetterResource.java` に監査ログ記録と 404 応答処理を実装。取得・削除双方のテスト `LetterResourceTest` を作成し、`LETTER_DELETE` 監査アクションをカバー。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` と `docs/server-modernization/phase2/domains/STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` を更新し、監査テスト実施状況と Runbook ID（STAMP-AUDIT-20251103-01 / LETTER-AUDIT-20251103-01 / ORCA-COMPAT-20251103-01）を明記。
- 🔍 ORCA 連携 `PUT /orca/interaction` はソース比較で互換性を確認済み。ORCA テスト DB が未整備のため、実データ検証は Runbook ORCA-COMPAT-20251103-01 でオープン。
- ⚠️ ローカル環境には Maven が存在せず、`mvn -f server-modernized/pom.xml test` が `bash: mvn: command not found` で失敗。CI でのテスト実行と `d_audit_event` 確認、スタンプキャッシュ連携試験は Pending。Runbook 検証ログにフォローアップを記載済み。

## 2025-11-03 追記: DemoResourceASP JSON モダナイズ（担当: Worker B）
- ✅ DemoResourceASP 専用の新 REST クラス `open.dolphin.rest.DemoResourceAsp` を実装し、`web.xml` の `resteasy.resources` に登録。共通 DTO `open.dolphin.rest.dto.DemoAspResponses` を整備して InfoModel → JSON 変換を統一。
- ✅ ユニットテスト `DemoResourceAspTest` を追加し、ユーザー認証・患者/来院リスト・処方・カルテ本文・ラボ・診断・パッケージ API の JSON 形状を Mockito で検証（`mvn` 未導入につきローカル実行は Pending）。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の DemoResourceASP 行を `◎ 移行済み` へ更新し、`docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md` に JSON 変換ルール・サンプルペイロード・pad フラグ扱いを追記。
- 🔄 `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ DemoResourceAspTest 実行待ちのメモを追記予定。Maven セットアップ後に `DemoResourceAspTest` を含む `mvn -f pom.server-modernized.xml test` を実施し、Runbook テストログへ結果を反映する。

## 2025-11-04 追記: Jakarta Naming API 再適用（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/MeterRegistryProducer.java` と `open/orca/rest/ORCAConnection.java`（モダナイズ版）の `javax.naming.*` 参照を `jakarta.naming.InitialContext` / `NamingException` へ戻し、WildFly 33 の Jakarta EE 10 API と整合。
- ℹ️ 旧サーバーモジュール（`server/`）は Java EE 7 / WildFly 10 前提のため `javax.naming` を維持し、Jakarta 化は実施しない方針を再確認。
- ✅ `pom.server-modernized.xml` に JBoss Public Repository (`https://repository.jboss.org/nexus/content/groups/public-jboss/`) を登録しつつ、`jakarta.websocket` については Maven Central で取得できる `2.1.0` 系へ明示的に固定。WildFly BOM が要求する `*-jbossorg-2` 系は引き続きローカルからは取得できないためバージョンを上書きした。
- ⚠️ `mvn -f pom.server-modernized.xml -pl server-modernized -am -DskipTests compile` は `jakarta.naming.InitialContext` を提供する Jakarta Naming API がリモートリポジトリ（JBoss Public Repository）経由で取得できず失敗。Jakarta EE 10 向け `jakarta.naming` の公開先が JBoss リポジトリのみである点と、リポジトリ側が 403 を返すため依存解決が進まない事象を確認した。

## 2025-11-03 追記: REST API パリティマトリクス整備（担当: Codex）
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` を新設し、旧サーバー OpenAPI とモダナイズ版インベントリを正規化パス＋HTTP メソッドで突合。1:1 対応 106 件・未移植 150 件・モダナイズ専用 13 件を算出した。
- ✅ `docs/server-modernization/rest-api-modernization.md` にマトリクスへの参照を追加し、API 移植状況レビュー時の導線を整備。
- ℹ️ 未移植の主要領域は 2FA 系 (`AdmissionResource`)、旧 ASP リソース群、`EHTResource`、`StampResource`、`PHRResource`。対応完了後はマトリクスの該当行を `◎` に更新する運用とする。

## 2025-11-03 追記: EHTResource 監査ログ対応（担当: Worker D）
- ✅ `docs/server-modernization/phase2/domains/EHT_SECURITY_AUDIT_CHECKLIST.md` を作成し、`/20/adm/eht/*` の現状棚卸し・セキュリティギャップ・法令準拠観点・外部連携テスト手順を整理。`docs/web-client/README.md` へリンクを追記。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java` に監査ログ記録処理を追加（メモ／アレルギー／診断／ドキュメントの POST/PUT/DELETE 成功時）、`SessionTraceManager` の traceId を監査詳細へ連携。
- ✅ `ADM20_EHTServiceBean` を `@ApplicationScoped` + `@Transactional` 化し、Jakarta EE 10 の CDI ベーストランザクション境界へ移行。
- ⚠️ ローカル環境に Maven が存在せず `mvn -pl server-modernized -am -DskipTests package` が実行できない。コンパイルテストは Maven 導入後に再実施する必要あり。

## 2025-11-03 追記: 外部インターフェース互換ランブック整備（担当: Codex）
- ✅ `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を作成し、API パリティ確認・設定移行・Smoke テスト・切替手順を統合した運用ガイドを整理。
- ✅ `docs/web-client/README.md` へランブックの導線を追加し、Web クライアント開発チームからも参照できるようにした。

## 2025-11-03 追記: DemoResourceASP デモデータ移行仕様整理（担当: Codex）
- ✅ `docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md` を新設し、旧 ASP 実装 15 エンドポイントのデータローディング仕様・モダナイズ側コンスタント差分・変換方針・QA テストケース・UX 影響を一括で整理。
- ✅ `docs/web-client/README.md` に同資料の導線を追加し、フロントエンド担当が `ONE_SCREEN` ガイドと合わせて参照できるようにした。
- 🔄 Worker F 連携タスク: スタンプ変換（`BundleDolphin`）の品目名・用法文言の整合確認を依頼。`getModule`/`getProgressCource` 実装差分レビュー待ち。

ℹ️ 以下 2025-11-03 記録は `javax.naming` への一時移行履歴として保存。
## 2025-11-03 追記: Micrometer JNDI `javax.naming` 置換（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/MeterRegistryProducer.java` の JNDI 参照を `jakarta.naming.*` から Java 17 標準の `javax.naming.InitialContext` / `NamingException` へ差し替え。Wildcard 型判定ロジックは従来どおり維持。
- ✅ `rg "jakarta.naming"` で `server-modernized` 配下および `pom.xml` に余剰依存が残っていないことを確認。Jakarta Naming API の `provided` 依存は不要となり、WildFly 付属の JNDI 実装を使用する前提を整理。
- ⚠️ `mvn -pl server-modernized -DskipTests compile` を 2025-11-03 (JST) に実行したが、ローカル環境に Maven CLI が存在せず `bash: mvn: command not found`。Maven 導入後に再実行するフォローアップタスクを残す。

## 2025-11-03 追記: WildFly 33 PostgreSQL モジュール配置修正（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の `module add` に `--module-root-dir=/opt/jboss/wildfly/modules/system/layers/base` を追加し、WildFly 33 のレイヤ化構成で PostgreSQL JDBC モジュールが認識されるように調整。
- ✅ 同 CLI の `ORCADS` / `PostgresDS` データソースにおける `connection-url` のデフォルト DB 名を `${env.DB_NAME:opendolphin_modern}` へ更新し、モダナイズ用 DB に揃えた。
- ℹ️ JMS 定義や Undertow 設定は既存のまま保守。`ops/modernized-server/docker/Dockerfile` が CLI を COPY/実行するフローを確認し、追加変更の必要がないことを再確認。

## 2025-11-03 追記: WildFly CLI SSL ルート証明書ガード修正（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の `DB_SSLROOTCERT` 判定をセンチネル文字列比較へ変更し、未設定時に CLI が空行と誤認して失敗する問題を解消。接続プロパティへ渡す値は必ず引用付き文字列として指定。
- ℹ️ Docker ビルドおよび WildFly 起動検証は依頼者が実施予定（本作業では未実行）。

## 2025-11-03 追記: OpenPDF 3.0.0 PdfPKCS7 署名追随（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/reporting/PdfSigningService.java` の `PdfPKCS7` 生成時に CRL 配列引数（現状は `null`）を追加し、OpenPDF 3.0.0 が要求するシグネチャ `PdfPKCS7(PrivateKey, Certificate[], CRL[], String, String, boolean)` に整合。OpenPDF 1.3 系とも互換。
- ℹ️ OpenPDF 3.0.0 では `com.lowagie.*` から `org.openpdf.*` へのパッケージ移行と `java.time` 対応が進行中。署名ワークフローの BouncyCastle/TSA 構成は変更せず、後続タスクで import の置換と `ZonedDateTime` 利用検討を行う。
- ⚠️ `mvn -pl server-modernized -DskipTests compile` の実行はローカル方針（Maven 未導入・Docker 経由で実行）により未実施。検証は `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml run --rm server-modernized-dev mvn -pl server-modernized -DskipTests compile` で実施予定。

## 2025-11-03 追記: WebAuthn 2.6.0 / TOTP ユーティリティ追随（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/security/totp/TotpHelper.java` を新設し、SMS OTP／TOTP／バックアップキー生成と検証ロジックを共通化。`AdmissionResource`・`ADM20_EHTServiceBean` から旧 `open.dolphin.adm20.OTPHelper` 依存を排除。
- ✅ `ADM20_EHTServiceBean` の FIDO2 実装を Yubico WebAuthn 2.6.0 の段階付きビルダーへ合わせ、`com.yubico.webauthn.CredentialRepository` へのパッケージ移動と `RegistrationResult#getAttestationType()` の非 Optional 化に伴うメタデータ保存処理を更新。
- ⚠️ `mvn -pl server-modernized -DskipTests package` を 2025-11-03 (JST) に実行したが、環境に Maven CLI が存在せず `bash: mvn: command not found`。Maven 導入後に同コマンドで再検証するタスクを継続。
- ℹ️ `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md` および `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md` を更新し、Secrets 運用と WebAuthn 2.6.0 追随内容を反映。

## 2025-11-03 追記: Worker0/1 モダナイズビルド検証（担当: Codex）
- ✅ `mvn -f pom.server-modernized.xml -pl common -DskipTests -ntp package` で共通モジュールのビルドに成功。Apache Maven 3.9.6 を `~/.local/apache-maven-3.9.6` へ展開し `PATH` を一時追加して実行。
- ⚠️ `mvn -f pom.server-modernized.xml -s ops/shared/docker/settings.xml -pl server-modernized -am -DskipTests -ntp package` はコンパイルエラーで失敗。`ADM20_EHTServiceBean` の `com.yubico.webauthn.credential.*`、`MeterRegistryProducer` の `jakarta.naming.*`、`ChartEventStreamResource` の `jakarta.ws.rs.sse.SseElementType` など未解決シンボルが多発。
- ⚠️ 引き続き `PlivoSender`／`MessageSender` で `okhttp3.*`・`ConnectionSpec`・`TlsVersion` が解決できず、`Logger#log(Level, Supplier, Throwable)` 呼び出しシグネチャ不一致、`PdfSigningService` の `char`→`String` 変換エラーも発生。
- ✅ `ExternalServiceAuditLogger` の `log*` メソッドを `public` 化し、`MessageSender` に Claim/Diagnosis リクエスト監査ログを追加。内部で `Supplier<String>` を用いた遅延評価に切り替え、ログフォーマットは従来どおり維持。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカル環境に Maven CLI が存在せず `mvn: command not found`。ツール整備後にモジュールビルドの再検証が必要。
- ⚠️ `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml build server-modernized-dev` でも Maven ステージで同一エラーにより WAR（`server-modernized/target/opendolphin-server.war`）が生成されず。
- ℹ️ 再現手順: `export PATH=$HOME/.local/apache-maven-3.9.6/bin:$PATH` を設定し、上記コマンドを必ず `pom.server-modernized.xml` と `ops/shared/docker/settings.xml` を指定して実行。エラーログはローカルで `tee /tmp/mvn_server.log`・`/tmp/docker_build.log` に保存。

## 2025-11-03 追記: SSE/OkHttp/JNDI コンパイルエラー対応（担当: Codex）
- ✅ `ChartEventStreamResource` から旧 `@SseElementType` 参照を排除し、`ChartEventSseSupport` の `OutboundSseEvent` で JSON メディアタイプを設定する Jakarta REST 3.1 互換構成へ整理。
- ✅ `MessagingGateway`／`MessageSender`／`SessionOperationInterceptor` の `Logger#log` 呼び出しを Java 17 が提供する `log(Level, String, Throwable)` へ統一し、監査ログの文言を維持したままシグネチャ不整合を解消。
- ✅ `server-modernized/pom.xml` に `com.squareup.okhttp3:okhttp`／`logging-interceptor`（compile）と `jakarta.naming:jakarta.naming-api:2.1.1`（provided）を追加し、`PlivoSender`／`MeterRegistryProducer` の `ClassNotFoundException` を未然防止。`DEPENDENCY_UPDATE_PLAN.md` にライセンス・運用メモを追記。
- ⚠️ `~/.local/apache-maven-3.9.6/bin/mvn -pl server-modernized -DskipTests package` は JDK 未導入のため失敗（`Unable to locate a Java Runtime.`）。JDK 17 を導入後に同コマンドで WAR ビルドを再検証するタスクを残す。

## 2025-11-03 追記: OpenPDF 1.3.41 への後退（担当: Codex）
- ✅ `server-modernized/pom.xml` の `openpdf.version` を 1.3.41 に固定し、`PdfDocumentWriter` / `PdfSigningService` を `com.lowagie.text.*` API と旧 `PdfPKCS7` シグネチャに合わせて修正。BouncyCastle 1.82 維持でコンパイル互換性を静的確認。
- 📄 `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`、`docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`、`docs/server-modernization/reporting/LICENSE_COMPATIBILITY.md`、`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` を OpenPDF 1.3.41 前提へ更新。
- ⚠️ `mvn -pl server-modernized -am -DskipTests package` は `mvn: command not found` により未実行。Homebrew の `shellenv` 内で `/bin/ps` へのアクセスが拒否されたログ（`/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 18: /bin/ps: Operation not permitted`）後に Maven バイナリ欠如で停止。ローカルに Maven CLI を導入後に再試行が必要。

## 2025-11-03 追記: Hibernate 6 CLOB マッピング整理（担当: Codex）
- ✅ `PatientMemoModel` / `LetterText` / `PatientFreeDocumentModel` / `NurseProgressCourseModel` の `@Type(type="org.hibernate.type.StringClobType")` を `@Lob + @JdbcTypeCode(SqlTypes.CLOB)` に差し替え、Hibernate 6 互換のアノテーション構成へ刷新。`org.hibernate.annotations.Type` 依存を排除し、Jakarta Persistence 3.1 でビルド可能な前提を整備した。
- ⚠️ `mvn -pl common -DskipTests package` を実行したがローカルに Maven CLI が無く `command not found`。環境整備後に共通モジュールのビルド成功を確認するタスクが継続課題。

## 2025-11-03 追記: ORCA XPath 内部 API 排除（担当: Codex）
- ✅ `common/src/main/java/open/dolphin/common/OrcaAnalyze.java` から `com.sun.org.apache.xpath.internal.*` 依存を除去し、`javax.xml.xpath` ベースにリファクタ。`OrcaPatientInfo` DTO を導入して XML 解析結果をテストで検証できるようにした。
- ✅ `common/src/test/java/open/dolphin/common/OrcaAnalyzeTest.java` を追加し、サンプル XML で患者 ID と保険区分が抽出されることを静的検証（コードレビュー）した。JUnit 4.13.2 を `test` スコープで追加。
- ⚠️ `mvn -pl common test` はローカルに Maven CLI が無く `mvn: command not found`。環境整備後に新規テストを実行し、Jakarta EE 10 / Java 17 でのビルド確認を行うこと。

## 2025-11-03 追記: モダナイズ後 TODO 整理（担当: Codex）
- TODO 2025-11-06 Worker C: `ops/legacy-server/docker/Dockerfile` および `ops/modernized-server/docker/Dockerfile` から Hibernate 5 互換 `StringClobType` 生成ステップを削除し、CI キャッシュ更新＋`docker-compose.modernized.dev.yml` での回帰ビルド結果を Slack #server-modernization へ共有。
- TODO 2025-11-08 Worker 4: CLAIM / PVT Java ビルダーと旧 XSLT の差分を自動検証する単体テスト + ORCA Stub を用いた E2E を追加し、`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md` の ⚠️ を解消。
- TODO 2025-11-09 Worker 2: Swing 共通ユーティリティの `Project#getFloat(String)` / `setFloat(String)` を `BigDecimal` ベースの新 API へ置換し、影響箇所を `docs/web-client/planning/phase2/CONFIG_MIGRATION_CHECKLIST.md` に記録。

## 2025-11-02 追記: OpenPDF/FIDO2 アップデート（担当: Codex）
- ✅ `server-modernized/pom.xml` の OpenPDF を 3.0.0、BouncyCastle を 1.82 へ引き上げ。`PdfDocumentWriter`/`PdfSigningService` を `org.openpdf.*` パッケージと自前 PKCS#7 署名フローに対応させ、TSA フォールバックも維持。
- ℹ️ 2025-11-03 追記: Java 17 向けビルドに支障が出たため OpenPDF は 1.3.41 へ後退。`PdfDocumentWriter`/`PdfSigningService` は `com.lowagie.text.*` API に戻して維持する。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` に OpenPDF/BouncyCastle のライセンス告知セクションを追加し、`DEPENDENCY_UPDATE_PLAN.md`・`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`・`LICENSE_COMPATIBILITY.md` を最新バージョンへ更新。
- ✅ Yubico WebAuthn 2.6.0 の段階付きビルダーへ追従し、`ADM20_EHTServiceBean` の `StartRegistrationOptions`／`FinishRegistrationOptions`／`AuthenticatorSelectionCriteria` 呼び出しを更新。除外クレデンシャルは `CredentialRepository` に委譲し、関連ドキュメントを刷新。
- ✅ `common` を含む ORCA 連携コードが `jakarta.mail`／`jakarta.jms` へ統一されていることを確認し、該当ドキュメントの残課題表記を修正。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカルに Maven CLI が無く `command not found`（再現）。後続ワーカーは Maven 導入後に署名／FIDO のコンパイル確認と回帰テストを実施すること。

## 2025-11-02 追記: Micrometer 移行と監査突合準備（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java` と `DatasourceMetricsRegistrar.java` を Micrometer `MeterRegistry` ベースへ移行。`MeterRegistryProducer` を追加し WildFly Micrometer レジストリを CDI から取得できるようにした。
- ✅ `ops/legacy-server/docker/configure-wildfly.cli` に Micrometer 拡張・Prometheus レジストリ・Undertow 統計有効化コマンドを追加し、`MICROMETER_*` 環境変数でエクスポート先と間隔を調整できるようにした。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` を Micrometer 前提へ更新。監査ログとメトリクス突合の運用チェックリストを追記し、`IMPACT_MATRIX.md` のオブザーバビリティ行を更新。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカル環境に Maven CLI が無いため `command not found`。既存の Maven 未導入課題と同様に、環境整備後にビルド検証を再実施する。

## 2025-11-02 追記: CLAIM JMS 復旧と Servlet/CDI スキーマ更新（担当: Codex）
- ✅ `server-modernized/src/main/webapp/WEB-INF/web.xml` を Jakarta Servlet 6.0 スキーマへ更新し、RESTEasy フィルタ/サーブレットの `async-supported` 設定が最新仕様に沿うよう調整。
- ✅ `server-modernized/src/main/webapp/WEB-INF/beans.xml` を CDI 4.0 (`beans_4_0.xsd`) に差し替え、`open.dolphin.session.framework.SessionOperationInterceptor` を `<interceptors>` に登録。`SessionOperation` バインディングが確実に適用される構成を確認した。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java` を JMS 3.0 ベースの実装に刷新。`java:/JmsXA`／`java:/queue/dolphin` を利用して ObjectMessage を enqueue し、失敗時は従来の同期送信へフォールバックするように監査ログと併せて整備。
- ✅ `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` を Jakarta Messaging MDB として再実装。CLAIM／Diagnosis／PVT／AccountSummary／Activity 配信を元の振る舞いへ戻し、`MessagingConfig` から施設 ID・接続パラメータを取得するよう統一。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java` の `ClaimSettings` に施設 ID を含め、JMS 側でも `custom.properties` と ORCA 設定を再利用できるようにした。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/KARTE_ORDER_JAKARTA_STATUS.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）へギャップ整理と次アクションを反映。
- ⚠️ `mvn -pl server-modernized -DskipTests package` を実行したが `mvn: command not found`。ローカルに Maven CLI が無いため、後続ワーカーは `scripts/setup_codex_env.sh` などで Maven を導入した上でビルド検証を再開すること。

## 2025-11-02 追記: Elytron フィルタ準備と MFA Secrets 強化（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java` を更新し、`jakarta.security.enterprise.SecurityContext` から `Principal` を取得するフックを追加。ヘッダフォールバック時には WARNING/TODO を出力し、`X-Trace-Id` を `org.jboss.logmanager.MDC(traceId)` へ投入して Micrometer / AuditTrail / ExternalService ログの相関 ID を統一。
- ✅ `docs/server-modernization/security/ELYTRON_INTEGRATION_PLAN.md` を新設し、Elytron HTTP 認証の構成案と Phase2→Phase4 の移行ステップ、Trace ID 伝播方針を整理。
- ✅ `server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java` の固定開発キー フォールバックを廃止。`FACTOR2_AES_KEY_B64` 未設定時は `IllegalStateException` を送出し Secrets 配布漏れを起動直後に検知。`FACTOR2_AES_KEY` の旧環境変数は INFO ログのみに留めて無視するよう変更。
- ✅ `server-modernized/pom.xml` に `org.jboss.logmanager:jboss-logmanager`（scope=`provided`）を追加し、`LogFilter` の MDC 依存をビルド時に解決可能とした。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を OkHttp 5.2.1 の `Duration` API へ対応させ、接続 10 秒 / 読み書き 30 秒 / 呼び出し 45 秒 + TLS1.2/1.3 固定の Builder を採用。`DEPENDENCY_UPDATE_PLAN.md` に標準タイムアウト値・TLS 方針を追記。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md`, `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`, `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）を更新。
- ⚠️ `mvn -pl server-modernized -am -DskipTests compile` を実行したが `mvn: command not found`。ローカル環境に Maven CLI が未導入のため、`scripts/setup_codex_env.sh` 実行や Maven インストール後に再ビルドすること。

## 2025-11-02 追記: Jakarta EE 10 ビルド依存整理（担当: Codex）
- ✅ `common/pom.xml` を Java 17 / Jakarta API 前提へ更新し、Hibernate ORM 6.4.4.Final を provided 参照に切替。`commons-codec` は 1.17.1 へ引き上げ、`maven-compiler-plugin` で `release 17` を明示。
- ✅ `server-modernized/pom.xml` の `dependencyManagement` に Jakarta BOM と Plivo 5.46.0 / OkHttp 5.2.1 / OpenPDF 1.3.41 / BouncyCastle 1.78.1 / Yubico WebAuthn 2.6.0 を登録。WAR 依存は BOM 管理下へ再配置し、OkHttp 依存を追加。
- 🔁 `pom.server-modernized.xml` テンプレートは現状どおりで問題なし（対象モジュールは `common` と `server-modernized` のみ）。追加モジュールは不要と判断し、差分なし。
- ❌ `mvn -pl server-modernized -am -DskipTests package` を実行したが、ローカル環境に Maven (`mvn`) が未導入のため `command not found` で終了。後続ワーカーは `scripts/setup_codex_env.sh` で環境を整備するか、Maven をインストールした上で再実行すること。
- 📎 ドキュメント更新: `foundation/JAKARTA_EE10_GAP_LIST.md` のビルド依存セクションと `PHASE2_PROGRESS.md`（本ファイル）へ反映済み。

## 2025-11-02 追記: ActiveMQ Artemis 設定復旧と Plivo HTTP 設定調整（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` に `messaging-activemq` サブシステム設定を追加し、`/server=default` 配下へ `jms-queue=dolphinQueue`（`java:/queue/dolphin`／`java:jboss/exported/jms/queue/dolphin`）、`pooled-connection-factory=JmsXA`（`java:/JmsXA`）、`connection-factory=DolphinConnectionFactory` を idempotent で登録。Micrometer 監視と整合させるコメントも追記済み。
- ✅ `server-modernized/src/main/java/open/dolphin/infrastructure/concurrent/ConcurrencyResourceNames.java` を新設し、`ServletStartup`／`ScheduleServiceBean` が `java:jboss/ee/concurrency/scheduler/default` を明示参照。`ScheduleServiceBean` はスケジューラ経由で `MessagingGateway.dispatchClaim` を即時タスク投入し、トランザクション完了後に JMS enqueue できるよう調整。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java` に `PLIVO_HTTP_CONNECT_TIMEOUT`／`READ_TIMEOUT`／`WRITE_TIMEOUT`／`CALL_TIMEOUT`／`RETRY_ON_CONNECTION_FAILURE`（および `custom.properties` の `plivo.http.*`）を解釈するロジックを追加。ISO-8601 形式や `5000ms` 等の単位付き表記を許容し、不正値はデフォルトへフォールバックする。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を前項設定と連動させ、リトライ可否と各種タイムアウトを設定依存に変更。負値／0 の場合は FINE ログを出した上で安全値へ補正する `sanitizeDuration` を実装。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` を更新し、ActiveMQ CLI 追記・Concurrency 定数化・Plivo HTTP 設定キーを記録。本ファイルにも反映。
- ⏳ フォローアップ: Docker Compose で ActiveMQ Artemis を起動し `java:/queue/dolphin` への enqueue→consume を検証、Micrometer 収集との整合を確認する。Plivo HTTP タイムアウト値は運用チームと標準値を合意し、監査ログでの可視化方針を決める。

## 2025-11-02 追記: ReceptionPage サイドバー統合（担当: Codex）
- ✅ 旧 `ReceptionVisitSidebar` を廃止し、`ReceptionSidebarContent` を採用。`AppShell` の右サイドバーにタブ（受付／患者／履歴）を常設し、選択済み受付が無い場合は患者タブへ自動フォールバックする挙動を実装。
- ✅ 受付タブに呼出トグル・カルテ遷移・詳細操作導線を集約。`callState` のペンディング／エラー状態をバッジとフィードバックで可視化し、監査ログ（`visit_call_start`／`visit_call_cancel`／`visit_call_toggle_failed`）には `source: reception-sidebar` を付与。
- ✅ 患者タブでは `PatientEditorPanel` を `layout="sidebar"` で読み込み、モード切替・自動受付作成設定・保存成功ログをサイドバー側で補完。保存時は `patient_upsert_from_sidebar` を送出し、完了後は受付タブへ戻す。
- ✅ 履歴タブで `useVisitHistory` / `usePatientKarte` を連動。`karteFromDate` 入力は REST 形式へ正規化し、空欄時は `defaultKarteFromDate()` を再適用。カルテ文書は最近 10 件までをサマリ表示。
- ✅ `ReceptionPage` の URL 同期（`rid` / `pid`）とローカル `autoCreateReceptionEnabled` 永続化を整理し、サイドバー内操作で重複保存が発生しないよう状態を統合。
- 🔍 検証: `npm run typecheck` は成功。`npm run lint` は既存課題（`Button.tsx` の未使用変数、`DocumentTimelinePanel.tsx` の Fast Refresh 指摘など 6 件）で失敗。`npm run test -- --watch=false` は従来からの `letter-api.converts summary safely` と `appointment-api.fetches appointments...` が失敗。`npm run build` は管理画面／ChartsPage 周辺の既知 TypeScript エラーが継続（`StampManagementPage.tsx`, `UserAdministrationPage.tsx`, `LoginPage.tsx` ほか）。
- 📎 ドキュメント反映: `docs/web-client/README.md`（直近更新履歴）、`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`（サイドバー仕様）、本ファイルへ追記。
- 🚩 ToDo: lint/test/build の既存失敗は継続課題として別ストーリーで対応。サイドバーのトースト通知・履歴タブからのカルテ遷移ショートカットは未実装のため、次スプリントで検討。

## 2025-11-02 追記: common モジュール Jakarta Persistence ビルド確認（担当: Codex）
- ⚠️ `mvn -pl common -DskipTests package` を実行したが `bash: mvn: command not found` が発生。ローカル環境に Maven CLI が導入されていないため、Jakarta 変換後ビルドは未実施。
- 🚩 対応案: `mvn` の導入または Maven Wrapper (`mvnw`) をリポジトリへ追加した上で再実行が必要。現時点では環境整備の依頼待ち。

## 2025-11-01 追記: ChartsPage レイアウト仕上げ（担当: Worker E）
- ✅ `PageShell`／`ContentGrid` の CSS 変数を整理し、1366px 基準で左 264px・中央 ≒ 763px・右 264px が収まるよう `--charts-central-dynamic-width` を導入。列間ギャップは最大 24px、外周パディングは 12〜20px に制限。
- ✅ `AppShell` の Body コンテナから `contentMaxWidth` 制限を外し、患者一覧・受付一覧・カルテ画面がウィンドウ幅に合わせて無段階に拡張するよう統一。
- ✅ 患者未選択時は `PatientHeaderBar` をコンパクトモード（約 60px 高さ）で描画し、カルテ閲覧画面特有の上部余白を圧縮。患者選択後は通常モードへ自動復帰。
- ✅ `PatientHeaderBar` のグリッドと余白を再調整（横パディング = `var(--charts-content-padding-x) + 12px`、列間 10px / 18〜26px）、`LeftRail`・`WorkspaceStack`・`CentralScroll` のギャップを 10px / 12px / 12px に統一し、ヘッダーと初期カードの空白が 24px を超えないよう調整。
- ✅ `RightRail` 折りたたみ時はカラム幅を 48–56px に固定し、中央カラムが残余幅をすべて取得するよう上限 `clamp()` を撤廃。1600px / 1920px でも余白なしで滑らかに拡張することを確認。
- 📏 実測（CSS 変数算出値）:
  - 1366×768: 左 264px / 中央 ≒ 763px（内側 731px） / 右 264px、列間 21.8px、外周 15.7px。中央スクロール高は 640px でページスクロール無し。
  - 1440×900: 左 264px / 中央 ≒ 835px（内側 803px） / 右 264px、列間 22px、外周 16.6px。
  - 1920×1080: 左 288px / 中央 1,256px（内側 1,224px） / 右 288px、列間 24px、外周 20px、端の余白は計 8px。
  - 右ペイン折りたたみ: 1366px 時 264px / 976px / 56px、1600px 時 288px / 1180px / 56px、1920px 時 288px / 1488px / 56px。
- 🔍 検証: `npm run lint` は既存の未解決課題（`Button.tsx` や `DocumentTimelinePanel.tsx` の未使用変数など 12 件の error）で失敗。`npm run test:unit` はスクリプト未定義のため代替で `npm run test` を実行し、既存の API テスト 2 件（`appointment-api.fetches appointments...` と `letter-api.converts summary safely`）が失敗することを確認。
- 📎 ドキュメント反映: `docs/web-client/ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` に寸法・ギャップの最終値を追記。`docs/web-client/README.md` と本ファイルへ更新概要を記録済み。
- 🚩 ToDo: lint の未解決エラーと vitest 失敗ケースは別チケットでフォロー。スクリーンショット取得は次回 GUI セッション時に実機で再確認する。

## 2025-11-01 追記: DocumentTimeline 安定化（担当: Codex）
- ✅ 左レール `DocumentTimelinePanel` のカテゴリ切替時に選択が外れる不具合を解消し、利用可能カテゴリがゼロになった場合でも直近の有効カテゴリへフォールバックするよう調整。
- ✅ `InlineFeedback` のトーンと文言を整理。読み込み＝`neutral`、空状態＝`neutral`、API エラー＝`danger` とし、例外メッセージはそのまま表示する。タイトル更新成功時は `info`、失敗時は `danger` トーンでフィードバック。
- ✅ MSW モック（`npm run dev` 起動で自動有効化）にタイムライン関連 API (`/api/pvt2/pvtList` `/api/chartEvent/*` `/api/karte/docinfo/*`) のフィクスチャを追加し、エラー・リトライ動作をローカルのみで再現できるようにした。
- 🔄 残タスク: 実 API 接続時のスローダウン計測。`npm run preview -- --host` で WildFly 接続テストを走らせ、DocInfo 取得が 3 秒を超えるケースの調査を次スプリントで実施。
- 📎 ドキュメント反映: `docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` `docs/web-client/ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md` `docs/web-client/ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` を更新済み。開発手順は `web-client/README.md#開発モックmswとバックエンド切替` に追記。

## 2025-11-01 追記: Swing 版レイアウトに合わせたカルテ画面再配置計画（担当: Codex）
- ✅ 旧 Swing クライアント（スクリーンショット 1280×720）を基準に、左 264px／中央 736px／右 264px の 3 カラム寸法を採寸。Web 版 `ChartsPage` の `ContentGrid`・`OrderConsole`・左レールカードへ反映するリサイズ計画を整理。
- 🔄 タスク分解
  - `T1` グリッドレイアウト再定義 (`clamp` 対応、ヘッダー/フッタ高さ調整)。
  - `T2` 左レール圧縮（パディング再設定、ProblemList/SafetySummary のレイアウト再設計）。
    - 2025-11-01: VisitChecklist / ProblemListCard / SafetySummaryCard を 264px 幅・内側パディング12px・本文0.82rem・行間約8pxに調整し、参照テキスト6行での省略表示を確認。Storybook 静的ビルド（`npm run build-storybook`）でスタイル崩れは検出されず。1366×768 / 1280×720 の GUI 手動確認はローカル CLI 環境の都合で未実施のため、次回 GUI セッションで追試予定。※2025-11-06 時点で VisitChecklist は廃止され、ProblemListCard が左レール先頭となった。
  - `T3` 右ペイン 2 段構成（アイコンバー導入・コンテンツパネル縮小）。
  - `T4` WorkSurface/PlanComposer の余白最適化とフォントサイズ調整。
  - `T5` ブレークポイント別 QA（1366/1600/1920）スクリーンショット比較とアクセシビリティ確認。
- ✅ ドキュメント更新: `ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` に設計指針を追記。本メモおよび `docs/web-client/README.md` へリンクを追加。
- 🔜 次アクション: `phase2` スプリント 18 で T1/T2 着手、スプリント 19 で T3/T4、完了後にドクター試用アカウントでユーザーテストを実施し承認を得る。QA 完了前に `OrderConsole` の Storybook を用意し、幅圧縮時の操作性をレビューする。
- 🔄 `T1` (2025-11-01 Codex): `ContentGrid`/`CentralColumn` を `clamp()` 基調へ移行し、1600px・1280px・1100px・1000px・768px での列幅と折りたたみ挙動を Swing 版採寸どおりに再調整。右ペイン強制折りたたみ閾値を 1100px に更新。1366px/1600px/1280px のレイアウト確認スクリーンショットは 2025-11-03 午前の QA セッションで取得予定。
- 🔄 `T4` (2025-11-01 Codex): WorkSurface タブと Plan カードの余白・フォントを 0.82rem 帯域に再配分し、Plan アクション群の 1 行維持を確認。Plan Composer/Plan カードの操作スクリーンショット（A/P 面、CentralColumn 内）を 2025-11-03 午後の手動 QA と合わせて取得予定。

### 2025-11-01 進捗: T3 OrderConsole アイコンバー実装（担当: Codex）
- ✅ `OrderConsole` を縦アイコンバー(48px)＋内容パネル(最大216px) に再構成し、ホバー／クリックでフェード展開するトランジションを導入。各アイコンには `title` ベースのツールチップと `aria-pressed` を付与して操作フィードバックを明確化。
- ✅ 1000px 未満では強制折りたたみ状態のまま内容をモーダルに切り替え、Tab/Enter/Space 操作での遷移を確認。意図的なホバー展開との挙動差分を取り扱いドキュメント要件（ONE_SCREEN_LAYOUT_GUIDE.md / KARTE_SCREEN_IMPLEMENTATION.md）に整合。
- ✅ 意思決定支援バナーをパネル先頭に整理し、Plan 編集カード・会計編集 UI など既存機能を保持したままアクセシビリティの更新（`aria-labelledby` 管理）を実施。
- ⚠️ MSW モックでのスクリーンショット取得は `npm run build` / `npm run preview` が既存 TypeScript エラーで停止するため未完。ビルド環境復旧後に `docs/server-modernization/phase2/assets/order-console-1366.png` へ保存予定。

## サマリ
- `/user/{fid:userId}` 認証フローめEWeb UI に実裁E��、MD5 ハッシュ・clientUUID 自動生成�Eログアウト操作を一貫させた、E
- `/patient/*` API を利用した患老E��索と安�E惁E��パネルを構築。警告メモ・アレルギーを常時可視化し、クリチE��で患老E��細を�Eり替え可能、E
- `/karte/pid` を利用したカルチE��歴�E�EocInfo�E�取得を β 実裁E��取得開始日めEUI で変更でき、注意フラグを強調表示するタイムラインを提供、E
- 2026-05-27: charts �����܂��� TypeScript �^�� DocInfoSummary�^DocumentModelPayload �ɓ��ꂵ�ACLAIM �đ������ECareMap�E�J���e�^�C�����C���̌^�s�����������AE
- `/karte/document` 保存と `/chartEvent/subscribe` ロングポ�Eリングを絁E��合わせ、カルチE��雁E��EOAP�E�と排他制御めEWeb 版で再現した、E
- アプリシェルの固定�EチE��・フッタ・左右カラムを�Eレイアウトし、中央カラムのみスクロール可能な 3 カラム UI を最適化した、E

## 実裁E��イライチE
### 2025-11-11 19:48 JST: Docker リスタート後の疎通チェック（担当: Codex）
- `scripts/start_legacy_modernized.sh start --build` 実行直後に `docker ps` を確認し、`opendolphin-server`／`opendolphin-server-modernized-dev`／`opendolphin-postgres(-modernized)`／`opendolphin-minio` が起動済み（WildFly は health:starting → 数十秒で healthy）であることを記録（コマンドログ: `tmp/start_legacy.log`）。
- Legacy 側 `curl http://localhost:8080/openDolphin/resources/serverinfo/jamri` は 401、Modernized 側 `curl http://localhost:9080/openDolphin/resources/serverinfo/jamri` は 403 を返却。LogFilter/Touch fallback が働き Unauthorized レスポンスに X-Trace-Id が付与されているのを `docker logs opendolphin-server(-modernized-dev)` で確認（`Unauthorized user: … traceId=…`）。
- WildFly ログに既知の `standalone_xml_history/current` rename 警告と OTLP Collector 未到達 WARN が出ているが、アプリは `/dolphin` への GET を正常応答しているため、次のステップ（trace_http / rest_error 再取得）へ進む前提条件を満たしている。Evidence: `tmp/legacy_serverinfo.txt`, `tmp/modern_serverinfo.txt`, `docker logs opendolphin-server*.log`。

### 2025-11-13 08:46 JST: 環境ヘルスチェック（RUN_ID=`20251118TenvCheckZ1`, 担当: Codex）
- `./scripts/start_legacy_modernized.sh status` の結果を `artifacts/parity-manual/env-status/20251118TenvCheckZ1/docker_compose_status.txt` に保存。`opendolphin-{minio,postgres,postgres-modernized,server,server-modernized-dev}` が全て `Up (healthy)` で、8080/9080/9000-9001/5432/55432/9990/9995 がホストへ公開されていることを確認した。
- Legacy 側 `curl -H'userName: 9001:doctor1' -H'password: doctor2025' http://localhost:8080/openDolphin/resources/serverinfo/jamri` は即時 200。`jamri.code` 未設定のためボディは空だが、レイテンシ・HTTP ヘッダー・トレース ID を `artifacts/parity-manual/env-status/20251118TenvCheckZ1/legacy.headers.txt` / `legacy.body.txt` / `legacy.meta.json` に採録し、次の環境チェックからも同 RUN_ID フォルダへ追記できる状態にした。
- Modernized 側 `curl --max-time 10 -H'userName: 9001:doctor1' -H'password: doctor2025' http://localhost:9080/openDolphin/resources/serverinfo/jamri` は SYN/ACK 後に 10 秒で timeout（`modern.curl.log` に記録、`modern.headers.txt` / `modern.body.txt` は未生成）。同時に `docker compose --project-name legacy-vs-modern logs server-modernized-dev --tail 200`（`server-modernized-dev.logs.txt`）では `/dolphin` 健康チェックが継続しアプリ層は応答していることが分かったため、`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §8` で管理している Docker Desktop port-forward 復旧待ちステータスを継続。port-forward が復旧し次第、同 RUN_ID で `modern.meta.json` を含む証跡を補完し 9080 の 200 応答を確認する。
- 2025-11-13 09:46 JST: `docker restart opendolphin-server-modernized-dev` で Docker Desktop の port-forward を再登録し、`curl -H'userName: 9001:doctor1' -H'password: doctor2025' http://localhost:9080/openDolphin/resources/serverinfo/jamri` が < 1 秒で `HTTP/1.1 200 OK` を返却することを確認。`artifacts/parity-manual/env-status/20251118TenvCheckZ1/modern.headers.txt` / `modern.body.txt` / `modern.meta.json` を追記し、RUN_ID=`20251118TenvCheckZ1` の環境ステータスを「9080 復旧済み」に更新した。
- 2025-11-13 10:05 JST: 上記 RUN_ID を固定 ID として `ops/tools/env-status-check.sh` を新規追加。`docker compose ps`・`docker compose logs --tail 200 server{,-modernized-dev}` と 8080/9080 への `curl /serverinfo/jamri` をまとめて `artifacts/parity-manual/env-status/<RUN_ID>/` へ保存する。再取得時は `ops/tools/env-status-check.sh --run-id 20251118TenvCheckZ1 --legacy-note 'jamri.code unset, body empty' --modern-note 'port-forward recovered'` のように notes を書き分け、9080 が不通の間は `--skip-modern` で helper 手順 (Runbook §8) と併用する。

### 2025-11-13 12:33 JST: 環境ヘルスチェック（RUN_ID=`20251119TenvCheckZ2`, 担当: Codex）
- `./ops/tools/env-status-check.sh --run-id 20251119TstackRecoveryZ1 --compose-file docker-compose.yml --compose-file ops/base/docker-compose.yml --compose-file docker-compose.modernized.dev.yml --log-target server --log-target server-modernized-dev` を 2025-11-13 17:16 JST に実行。`docker_compose_status.txt` では `opendolphin-{minio,postgres,postgres-modernized,server,server-modernized-dev}` が全て `Up ... (healthy)` で、8080/9080/5432/55432/9000-9001/9990/9995 が公開されていることを確認した。
- Legacy 8080 (`legacy.*`) は Basic 認証未付与時に 401 を返す参照用エンドポイントとして継続監視（`status=401` / `X-Trace-Id=36b4e484-...`）。本番監視対象ではない旨を README と本節へ明記した。
- Modernized 9080 (`modern.*`) は Basic + ヘッダ認証で `HTTP/1.1 200 OK` を返すことを確認済み（`Accept: text/plain`, password ヘッダは `doctor2025` の MD5）。`modern.meta.json` / `modern.headers.txt` / `modern.body.txt` を 200 応答に差し替えた。
- `server.logs.txt` は `/dolphin` への GET が 30 秒周期で継続しており、WARN/ERROR なし。`server-modernized-dev.after-otel.log`（`logs/otel_collector/` 配下）では Collector 稼働後に WARN が消えていることを記録。
- 共有メモ: Legacy は参照のみ、Modernized が主監視対象。Collector 稼働中は `MICROMETER_OTLP_ENDPOINT=http://otel-collector:4318/v1/metrics` を有効化し、停止時は README/PHASE2 へ WARN 再発有無を追記する。証跡は `artifacts/parity-manual/env-status/20251119TstackRecoveryZ1/` へ集約。
- TODO (監視/OTLP Collector): Collector 停止 → 再起動手順を `env-status` Runbook に追記し、PROM スクレイプを導入する際は `ops/monitoring/otel-collector-config.yaml` の exporter を拡張する。

### 2025-11-13 13:27 JST: Modernized 9080 停止調査（RUN_ID=`20251119TenvCheckZ2`, 担当: Codex）
- マネージャー指示に従い再起動禁止のまま `docker exec opendolphin-server-modernized-dev netstat -tlnp` を実行したが、`No such container` で失敗し、modernized コンテナ自体が未作成／削除状態であることを確認した。
- `docker ps --format '{{.Names}}'` と `docker ps -a --format '{{.Names}}\t{{.Status}}'` を取得したところ、稼働中は ORCA 連携用コンテナのみで `opendolphin-server-modernized-dev` 系が一切存在しない。現状の RUN_ID では 9080/modernized WildFly 用の Docker 資産が停止ではなく消滅している点を `artifacts/parity-manual/env-status/20251119TenvCheckZ2/modern-investigation.log` に記録した。
- ホスト OS 側でも `lsof -iTCP:9080 -sTCP:LISTEN` および `netstat -an | grep 9080` は出力なしで、TCP 9080 を待受するプロセスが存在しない。curl (7) は SYN 送信前に `status=000` / `curlExitCode=7` へ落ちている。
- 暫定結論: modernized 側 WildFly コンテナが未起動のため 9080 が死んでいる。再起動／再作成が必要だが再起動禁止指示のためマネージャー判断待ち。必要作業（`scripts/start_legacy_modernized.sh start --profiles modernized`、`docker volume` 状態採取、再度 `serverinfo/jamri` 取得）も `modern-investigation.log` の Next Action に列挙済み。

### 2025-11-13 18:30 JST: Basic 200 / OTLP Collector 起動（RUN_ID=`20251119TstackRecoveryZ1`, 担当: Codex）
- `ops/db/local-baseline/stamp_public_seed.sql` を適用して `d_users.userid='9001:doctor1'` を復元後、`curl -isS -u '9001:doctor1:doctor2025' -H 'Authorization: Basic OTAwMTpkb2N0b3IxOmRvY3RvcjIwMjU=' -H 'userName: 9001:doctor1' -H 'password: 632080fabdb968f9ac4f31fb55104648' -H 'Accept: text/plain' http://localhost:9080/openDolphin/resources/serverinfo/jamri` が `HTTP/1.1 200 OK` を返すことを確認。`modern.headers.txt` / `modern.body.txt` / `modern.meta.json` へ 200 応答を保存し、`notes` に Basic + MD5 パスワード条件を明記した。
- `.env` へ `MICROMETER_OTLP_ENDPOINT=http://otel-collector:4318/v1/metrics`, `MICROMETER_STEP_SECONDS=60`, `MICROMETER_PROMETHEUS_CONTEXT=/metrics/application` を追加し、`ops/monitoring/otel-collector-config.yaml` / `ops/monitoring/docker-compose.otlp.yml` で collector サービスを定義。`docker compose --profile otlp -f docker-compose.yml -f ops/base/docker-compose.yml -f docker-compose.modernized.dev.yml -f ops/monitoring/docker-compose.otlp.yml up -d otel-collector` を実行して `opendolphin-otel-collector` を起動、`artifacts/parity-manual/env-status/20251119TstackRecoveryZ1/logs/otel_collector/` に collector 起動ログ・`server-modernized-dev` の WARN 解消ログ・`curl http://localhost:9464/metrics` の抜粋を保存。以降 60 秒周期の `/dolphin` 健康チェックのみが出力され、`UnknownHostException: otel-collector` WARN は再発していない。

### 2025-11-13 21:45 JST: env-status RUN_ID=`20251121TenvCheckZ3`（Basic 200 維持 + OTLP 常駐、担当: Codex）
- `ops/tools/env-status-check.sh` へ `--basic-auth-file`（1 行 `username:password` を base64 化して `Authorization: Basic ...` を付与）と `--otel-profile`（すべての `docker compose ps/logs` に `--profile <name>` を付加）を実装し、root README の env-status 節に利用例を追記。Basic 認証ファイル名は `modern.meta.json.auth.basicAuthFile` に記録するよう更新した。
- 上記スクリプトを `--project-name opendolphin_webclient --compose-file {docker-compose.yml,ops/base/docker-compose.yml,docker-compose.modernized.dev.yml,ops/monitoring/docker-compose.otlp.yml} --log-target {server,server-modernized-dev,otel-collector} --basic-auth-file /tmp/env-status-basic-auth.txt --password 632080fabdb968f9ac4f31fb55104648 --otel-profile otlp` で実行し、`artifacts/parity-manual/env-status/20251121TenvCheckZ3/modern.{headers,body,meta}.txt` に `HTTP/1.1 200 OK`（`X-Trace-Id=6d0ab042-57ec-4af7-ab8c-f0b3da3bf5ca`）を保存。OTLP collector の定期 INFO / duplicate label WARN を `otel-collector.logs.txt` に採取し、collector 常駐状態を証跡化した。
- Legacy 8080 への `curl` は 10 秒 timeout で `status=000`（`legacy.curl.log`）。`opendolphin-server` が Compose ラベル無しで起動しているため `docker compose logs server` ではログ取得できず、`server.logs.txt` は空のまま。次回確認時は Legacy サービスを Compose プロジェクトに再結合するか、`--skip-legacy` と手動 `docker logs opendolphin-server` の併用で証跡補完する。
- `docker_compose_status.txt` では `opendolphin-{server-modernized-dev,postgres,postgres-modernized,minio}` と `opendolphin-otel-collector`、`opendolphin_webclient-helper-1` が `Up (healthy)`。9080/9000-9001/55432-55433/4318/9464 が開放されており、OTLP profile 常駐状態で再実行できる体制を確認済み。

### 2025-11-13 22:20 JST: env-status RUN_ID=`20251122TenvCheckZ4`（Legacy skip + duplicate label fix、担当: Codex）
- `./ops/tools/env-status-check.sh --run-id 20251122TenvCheckZ4 --project-name opendolphin_webclient --compose-file {docker-compose.yml,ops/base/docker-compose.yml,docker-compose.modernized.dev.yml,ops/monitoring/docker-compose.otlp.yml} --log-target server-modernized-dev --log-target otel-collector --basic-auth-file ~/.opendolphin/env-status-basic-auth.txt --password 632080fabdb968f9ac4f31fb55104648 --otel-profile otlp --skip-legacy` を実行し、証跡を `artifacts/parity-manual/env-status/20251122TenvCheckZ4/` に保存。Legacy 8080 は compose 管理外のままなので `docker logs opendolphin-server --tail 400 > opendolphin-server.manual.log` で補完し、`RESTEASY002010` WARN と 405 応答を収集した。
- `docker_compose_status.txt` では `opendolphin-{server-modernized-dev,postgres,postgres-modernized,minio,otel-collector}` と helper が `Up (healthy)` で、Legacy コンテナは一覧に現れない。Compose への再結合が完了するまでは manual log を RUN_ID 配下に束ねる運用を継続する。
- Modernized 9080 は Basic 認証（`Authorization: Basic OTAwMTpkb2N0b3IxOmRvY3RvcjIwMjU=`）＋ `userName: 9001:doctor1` ／ `password: 632080fabdb968f9ac4f31fb55104648` で `HTTP/1.1 200 OK` を継続（`modern.headers.txt` に `X-Trace-Id=58364c00-b47b-453d-a8bf-b8511c084a37` を記録）。`modern.meta.json` の `auth.basicAuthFile=env-status-basic-auth.txt` から Basic ファイル参照を確認できる。
- `ops/monitoring/otel-collector-config.yaml` に `metricstransform/rename_deployment_label`（Micrometer 側ラベル `deployment` → `deployment_source`）と `resource/deployment_env`（resource 属性 `deployment=local-dev` を upsert）を追加して `opendolphin-otel-collector` を再起動。`artifacts/parity-manual/env-status/20251122TenvCheckZ4/otel-collector.logs.txt` を `rg 'duplicate label'` してもヒットがなく、ログは 60 秒周期の INFO のみとなった。

### 認証とセチE��ョン管琁E
- ログインペ�Eジで施設ID/ユーザーID/パスワーチE任意�EclientUUIDを�E力。未入力時は UUID を�E動生成してセチE��ョンに保存、E
- 認証惁E��はセチE��ョンストレージへ保存し、`AuthProvider` ぁEHTTP ヘッダーへ自動付与。ログアウトでストレージを確実に破棁E��E
- マルチタブでのログアウトを `storage` イベント経由で同期、E

### 患老E��索・安�E惁E��
- 氏名�E�漢孁Eカナ）、患老ED、番号�E�Eigit�E�検索に対応。検索結果はチE�Eブル表示、E��択患老E��右パネルで詳細表示、E
- `appMemo` めE`reserve*` の安�E惁E��を警告バチE��で表示。アレルギー・患老E��モめE`/karte/pid` から取得して同パネルに雁E��E��E
- 検索エラーめE��果ゼロの際�Eユーザーへ日本語メチE��ージで通知、E

### カルチE��歴タイムライン
- DocInfo をカード形式で表示。`hasMark` を検知して警告バチE��を表示、確定日/診療私EスチE�Eタスを併記、E
- 取得開始日を日付�E力で刁E��替え可能。�E部では `yyyy-MM-dd HH:mm:ss` 形式で API を呼び出す、E
- 患老E��モめE��レルギーを同カードに表示し、安�E惁E��の一允E��を図る、E

### カルチE��雁E�E排他制御
- `features/charts` を新設し、受付リスト�E診察開始�ESOAP 編雁E�E保存までめE1 画面で完結するフローを実裁E��E
- `useChartLock` ぁE`clientUUID` と `BIT_OPEN` を用ぁE�� `/chartEvent/event` を送信。�E端末のみが編雁E��能な状態を維持し、終亁E��にロチE��解除、E
- SOAP ノ�Eト�E ProgressCourse モジュールとしてシリアライズし、`/karte/document/pvt/{pvtPk,state}` で保存と状態�E移を同時に実行。XML エンコードされた `beanBytes` を生成して既存サーバ�E形式を踏襲、E
- `useChartEventSubscription` ぁE`/chartEvent/subscribe` のロングポ�EリングをラチE�Eし、React Query キャチE��ュを更新。褁E��端末で受仁EカルチE��態が即時反映される、E

### レイアウト調整
- `AppShell` のナビゲーション/サイドバーめE`position: sticky` に変更し、中央カラムのみスクロール。�EチE��・フッタは常時固定、E
- 2025-11-01: 23インチ(1920px)フルHDを基準にgrid-template-columnsをminmax(240px,22%) / minmax(0,56%) / minmax(240px,22%)へ更新し、左/右レール最小幅240pxを固定。1600px/1280pxでは24/52/24 -> 28/44/28へ段階調整し、1000px未満は右レールを強制折りたたみ+ホバー展開で固定。SOAP入力領域は最小780pxを確保し、23インチでタイムラインとオーダ操作を同時表示できることを確認。
- `TextArea` コンポ�Eネントを追加し、SOAP 入力欁E��統一したアクセシビリチE��とバリチE�Eションを提供、E

## 既存ユーザー影響と移行メモ
- 既孁ESwing クライアントと同一賁E��惁E��を利用。clientUUID を未入力にすると自動採番されるため、新要EWeb 端末の刁E��時も運用フローを変更せずに移行可能、E
- 共有端末ではログアウト操作が忁E��。ログアウト時にセチE��ョンストレージを削除するため、追加のクリーニング作業は不要、E
- フロントエンドでの安�E惁E��表示は参�Eのみであり、サーバ�EチE�Eタ形式に変更なし。既存データ移行�E不要、E
- SOAP 保存に ProgressCourse モジュールの XML を採用してぁE��ため、既存サーバ�Eは追加移行不要。Swing と Web の併用でもカルチE��ータ形式�E互換、E
- ロングポ�Eリングは 60 秒タイムアウト＋即時�E接続。クライアント�Eで持E��バックオフを実裁E��みであり、既存サーバ�E設定変更は不要、E

## チE��トと検証
- Vitest で認証/患老EカルチEAPI ラチE��ーの単体テストを追加し、リクエストパスと変換ロジチE��を検証、E
- `features/charts/__tests__/progress-note-payload.test.ts` で ProgressCourse モジュールのシリアライズを検証。SOAP/Plan の XML ぁEbase64 で保存されることを確認、E
- 手動動作確誁E ログイン→受付リストから診察開始�ESOAP 入力�E保存�E診察終亁E�Eシナリオを通し、他端末でのロチE��表示・解除がリアルタイムに同期されることを確認、E

## 次のスチE��チE
- SOAP チE��プレート（定型斁E�Eスタンプ）やプラン編雁EUI の拡張。`ProgressCourse` 以外�E ModuleModel�E��E方・検査�E��E保存フロー設計、E
- `/chartEvent/event` を用ぁE��征E��スチE�Eタス更新 UI を左カラムへ統合。看護師画面とのスチE�Eタス整合性検証、E
- ORCA 連携の準備として、患老E��細パネルに保険惁E��サマリ�E�健康保険 GUID�E�を表示する案を検討、E

## 2026-06-15 追記: SA-DOC-OPERATIONS-Continuation（担当: Worker D）
- ✅ Nightly CPD をサンドボックスで手動実行し、`ops/analytics/evidence/nightly-cpd/20240615/` に `build-local-sandbox.log` と `cpd-metrics.json`（duplicate_lines=21837, duplication_count=258, file_count=175）を保存。Slack / PagerDuty / Grafana 証跡は取得不可のためプレースホルダを配置し、本番ジョブ後に差し替える運用を `docs/server-modernization/phase2/notes/ops-observability-plan.md` に追記。
- ✅ `ops/tools/cpd-metrics.sh` を LF 化し、リポジトリルート自動検出と絶対パス対応を実装。CPD XML から BigQuery 取り込み JSON を生成する標準手順を Evidence ディレクトリへ記録。
- ✅ Python 禁止時の API 回帰資材として `ops/tests/api-smoke-test/test_config.manual.csv`・`headers/*.headers`・`payloads/`・`README.manual.md` と `ops/tools/send_parallel_request.sh` を追加。`docs/server-modernization/phase2/notes/test-data-inventory.md` に環境変数・保存先・監査ログ収集フローを反映。
- ⚙️ `static-analysis-plan.md` / `static-analysis-findings.md` に `PlivoSender` / `ORCAConnection` / `CopyStampTreeBuilder` の残課題、テスト案（PlivoSenderDefensiveCopyIT / ORCAConnectionSecureConfigTest / CopyStampTreeRoundTripTest）とブロッカー（Plivo Sandbox 資格情報、ORCA 接続設定）を追記し、`SA-INFRA-MUTABILITY-HARDENING` 着手状況を共有。
- 📌 Next: Ops が Jenkins 本番ジョブで Slack/PagerDuty Permalink と Grafana スクショを採取し Evidence を更新。Worker D は外部接続ラッパーの実装・テストを 2026-06-21 までに開始し、MBean/JMS 防御的コピー残件を並行削減する。


## 2025-11-10 追記: フェーズ4-2 予約/紹介状/ラボ/スタンプ REST parity 再測（担当: Codex）
- RUN_ID=`20251110T123655Z` で `ops/tools/send_parallel_request.sh --profile compose` により `PUT /appo`, `GET /schedule/pvt/2025-11-09`, `PUT /odletter/letter`, `GET /lab/module/WEB1001,0,5`, `PUT /stamp/tree` を実行。HTTP 本体・ヘッダー・メタは `artifacts/parity-manual/{appo,schedule,letter,lab,stamp}/20251110T123655Z/` に保存し、TraceId 単位のコンテナログは同ディレクトリの `logs/` 以下へ退避。
- `PUT /appo`: Legacy/Modern とも 500。Modern 側は `IllegalArgumentException: attempt to create delete event with null entity`（`artifacts/parity-manual/appo/20251110T123655Z/logs/modern_trace_rootcause.log`）で `d_appo` seed 未投入が原因。監査 (`d_audit_event`) と JMS は 0 件。
- `GET /schedule/pvt/2025-11-09`: Legacy は `PatientVisitModel` 1 件を返却、Modern は `{"list":null}` のまま。`remoteUser=anonymous` のため施設フィルタが機能せず、監査証跡も生成されなかった（`artifacts/parity-manual/schedule/20251110T123655Z/schedule_get/{legacy,modern}/response.json` を参照）。
- `PUT /odletter/letter`: Legacy 200（PK=8）に対し Modern は `Unable to locate persister: open.dolphin.infomodel.LetterModule` で 500（`artifacts/parity-manual/letter/20251110T123655Z/logs/modern_trace_rootcause.log`）。Jakarta Persistence に `LetterModule` が未登録で、監査の書き込みも行われなかった。
- `GET /lab/module/WEB1001,0,5`: Legacy 200／空レスポンス、Modern 500（`UnknownEntityException: NLaboModule`）で停止。ラボ系エンティティと `d_nlabo_*` テーブルが Flyway/Persistence から抜けている（`artifacts/parity-manual/lab/20251110T123655Z/logs/modern_trace_rootcause.log`）。
- `PUT /stamp/tree`: Legacy 200（id=9）／ Modern 500（`UnknownEntityException: StampTreeModel`）。`d_stamp_tree` テーブルが存在せず、Persistence unit に `StampTreeModel` が登録されていない（`artifacts/parity-manual/stamp/20251110T123655Z/logs/modern_trace_rootcause.log`）。
- 5 ケースすべてで `d_audit_event` は Legacy/Modern とも 0 件、JMS publish も検出できなかったため、`docs/server-modernization/phase2/notes/domain-transaction-parity.md` 付録A.2 と `docs/web-client/planning/phase2/DOC_STATUS.md` へブロッカー（担当/期限付き）を追記。

## ORCA 接続検証レポートテンプレ

ORCA 接続検証を実施した際は、以下テンプレをそのまま貼り付けて記入し、Runbook・証跡ディレクトリと相互リンクさせる。

```markdown
- Run ID: `<YYYYMMDDThhmmssZ or run label>`
- 使用コンテナ: `orca=<image/tag>`, `server-modernized=<compose profile>`, `その他=<任意>`
- 確認 API 範囲: `#5 マトリクスの番号/カテゴリを列挙`
- 証跡パス: `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` / `artifacts/orca-connectivity/<UTC>/`
- 結果サマリ: `OK | NG（理由／エスカレーション先）`
```

### 記入例

```markdown
- Run ID: `20251112TorcaCheckZ1`
- 使用コンテナ: `orca=jma-receipt-docker:2025.1`, `server-modernized=compose:modernized-dev`, `helper=socat-sidecar:v1`
- 確認 API 範囲: `#5-01 基本操作, #5-05 会計一覧, #5-12 受診履歴`
- 証跡パス: `docs/server-modernization/phase2/operations/logs/2025-11-12-orca-connectivity.md` / `artifacts/orca-connectivity/20251112T103000Z/`
- 結果サマリ: `OK（ServerInfo claim.conn=server / API 3件 200, 差分なし）`
```

### 週次エビデンスリンク（W18〜W19）
- **W18（2025-11-08, RUN_ID=`20251108T101538Z`）**: ホスト／compose 双方から `http://localhost:8000/` を叩き WebORCA ログイン画面の 200 応答を確認し、`docker ps` と `docker network inspect jma-receipt-docker-for-ubuntu-2204_default` で `claim.host=orca` 配置と ORCA/DB コンテナ稼働を証跡化。Evidence: [artifacts/orca-connectivity/20251108T101538Z/](../../../artifacts/orca-connectivity/20251108T101538Z/)。
- **W19（2025-11-18, RUN_ID=`20251118T120000Z`）**: ORCA 接続テンプレートを RUN_ID 付きディレクトリへコピーし、`node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` の通過ログ（`namer_check.log`）まで採取して命名ポリシー順守を確認。各ファイルに placeholder 出力を 1 行ずつ加え、次週以降の再取得準備を Evidence として残した。Evidence: [artifacts/orca-connectivity/20251118T120000Z/](../../../artifacts/orca-connectivity/20251118T120000Z/)。
- **W18 追加（2025-11-13, RUN_ID=`20251113TorcaP0OpsZ1`）**: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` に P0 #1-5 の直打ち結果を記録。`/api01rv2/patientgetv2` は 404、`/orca14/appointmodv2`・`/api21/medicalmodv2`・`/orca11/acceptmodv2` は 405 で遮断され、`acceptlstv2` のみ 200（`Api_Result=13` ドクター未登録）だった。`serverinfo/claim/conn` は `LOCAL.FACILITY.0001:dolphin` ユーザーで 200 (`server`) を取得。Evidence: [artifacts/orca-connectivity/20251113T002140Z/](../../../artifacts/orca-connectivity/20251113T002140Z/)。備考: Runbook §4.5 に 404/405 ハンドリング節を追加済み。
- **W21 追加（2025-11-13, RUN_ID=`20251113TorcaP0OpsZ2`）**: Physician_Code=00001 テンプレを用いて P0 API #1-5 を再実行。HTTP 200/`Api_Result=21` の `acceptlstv2` 応答に `Physician_Code=00001` が含まれ、ドクターマスタ投入済みであることを確認。`/api01rv2/patientgetv2` は 404、その他 POST 系は 405 のままのため ORCA 側 REST Enable 未反映。Evidence: [artifacts/orca-connectivity/20251113T012013Z/P0_retry/](../../../artifacts/orca-connectivity/20251113T012013Z/P0_retry/)。ログは同日ファイルへ追記し、`Api_Result=00` 取得前に受付ダミーデータ seed/TODO を Runbook へ連携。
- **W22 追加（2025-11-15, RUN_ID=`20251115TorcaPHRSeqZ1`）**: Task-D（PHR Phase-A/B）対応として `scripts/orca_prepare_next_run.sh` で RUN テンプレを展開し、PHR-02/03/10 + PHR-01/04/05/08/09 を `curl --cert-type P12` で実施。1回目は PKCS#12 pass 不明で `curl exit=58`。Ops から pass=`FJjmq/d7EP` を受領後の 2 回目は TLS 相互認証まで成功したが、WebORCA 本番に `/20/adm/phr/*` が存在しないため全 API が HTTP 404（JSON/HTML）。`httpdump/` と `trace/` に 404 応答を保存し、Modernized REST 経路での再測を次アクションに設定。`server-modernized-dev` は未起動のため `serverinfo/claim_conn.json` は未取得。詳細: `docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md` / `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#7-task-d-phr-phase-a-b-実測証跡取得2025-11-15-実施`。Evidence: [artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/](../../../artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/)。
- **W22 追加（2025-11-15, RUN_ID=`20251119TorcaPHRSeqZ1`）**: Task-F（PHR Phase-C/D/E）を `curl --cert-type P12` で再実施。PKCS#12 pass=`FJjmq/d7EP` で mTLS/Basic は成功し、PHR-06=HTTP 405、PHR-07=HTTP 404、PHR-11=HTTP 404 を取得。`httpdump/phr0{6,7,11}_*/response.*`、`trace/phr-0{6,7,11}_*.log`、`screenshots/phr-0X_*_response.png` を更新し、`serverinfo/claim_conn.json`（HTTP 200, body=`server`）と `wildfly/phr_20251119TorcaPHRSeqZ1.log` を採取。ORCA 本番に `/20/adm/phr/*` が存在しないため 200/403 + 監査ログは Modernized REST 実装待ち。Evidence: [artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/](../../../artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/)。
- **W22 追記（2025-11-21, RUN_ID=`20251121TrialPHRSeqZ1-CDE`）**: Task-F を Trial 環境（`https://weborca-trial.orca.med.or.jp`, Basic `trial/weborcatrial`）で再実測。PHR-06 `/identityToken` は HTTP405（Allow: OPTIONS, GET）、PHR-07 `/image/{patientId}` と PHR-11 `/20/adm/phr/{facility,...}` は HTTP404（JSON `{\"Code\":404,...}`）。`trialsite.md#limit` の「お使いいただけない機能」ポリシーにより `/20/adm/phr/*` が公開対象外であることを確認し、Blocker=`TrialLocalOnly` を Phase-C/D/E 表に追記。Evidence: [artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/](../../../artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/)、ログ: `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-phaseCDE.md`。Modernized REST 実装で `PHR_LAYER_ID_TOKEN_ISSUE` / `PHR_SCHEMA_IMAGE_STREAM` / `PHR_CONTAINER_FETCH` を e2e する方針を維持。
- **W22 追記（2025-11-21, RUN_ID=`20251121TtaskGImplZ1`）**: Task-G（PHRContainer DTO & Signed URL フォールバック）を実装し、`PHRContainer` の Jackson 注釈＋defensive setter、`PHRResource#toJobResponse` の `PHR_SIGNED_URL_{ISSUED,ISSUE_FAILED,NULL_FALLBACK}` 監査・フェールオーバー、`HmacSignedUrlService` の Secrets fail-fast、`PHRResourceTest` の null/例外テストを完了。Evidence: `docs/server-modernization/phase2/operations/logs/2025-11-20-phr-dto-review.md#6-実装結果`。残タスクは S3 Export Track（フェーズF Blocker: `S3PhrExportStorage` 実装）。
- **W22 追記（2025-11-21, RUN_ID=`20251121TrialPHRSeqZ1-A/B`）**: Task-D を Trial 環境 (Basic `trial:weborcatrial`) で再実測。PHR-02/03/10 (AccessKey 登録/照会/削除) と PHR-01/04/05/08/09 (閲覧テキスト) はすべて HTTP404 または 405 (`{"Code":404/405,"Message":"Not Found/Method Not Allowed"}`) となり、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/{crud/PHR_PHASE_AB,httpdump,trace,logs/curl_summary.log}` と `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` へ証跡を保存。GUI 不可のため `screenshots/phase-*.png` は placeholder を維持し、`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` に Blocker=`TrialEndpointMissing`（`trialsite.md` Snapshot 行2-7）を追記。Modernized RESTEasy 側で Phase-A/B を 200/403 + `PHR_ACCESS_KEY_*` / `PHR_*_TEXT` 監査まで前進させ、GUI 端末で実 UI を再撮影することを次アクションに設定。
- **W22 追加（2025-11-15, RUN_ID=`20251120TrialConnectivityWSLZ1` / `20251120TrialAppointCrudZ1` / `20251120TrialAppointWriteZ1` / `20251120TrialMedicalCrudZ1` / `20251120TrialAcceptCrudZ1`）**: Task-C（Trial CRUD 実測）を WSL2 Ubuntu 24.04.3 LTS から実行。`nslookup`/`openssl s_client`/`curl -vv api01rv2/acceptlstv2` で DNS/TLS/TLS1.2 証跡を `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/{dns,tls,crud}/` に再取得し、`trialsite.md` Snapshot（stat: 2025-11-15 08:24 JST）を README へ引用。`/20/adm/phr/phaseA` は 404（未公開機能）、`/orca14/appointmodv2` は HTTP 405（Allow: OPTIONS, GET）、`api01rv2/appointlstv2`・`acceptlstv2`・`api/api21/medicalmodv2` は HTTP 200 でも `Api_Result=91/13/12/14` と doctor seed 欠落（`PHASE2_PROGRESS.md#W60` 既知 Blocker）が再現した。Evidence: [artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/](../../../artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/)、[.../20251120TrialAppointCrudZ1/](../../../artifacts/orca-connectivity/20251120TrialAppointCrudZ1/)、[.../20251120TrialAppointWriteZ1/](../../../artifacts/orca-connectivity/20251120TrialAppointWriteZ1/)、[.../20251120TrialMedicalCrudZ1/](../../../artifacts/orca-connectivity/20251120TrialMedicalCrudZ1/)、[.../20251120TrialAcceptCrudZ1/](../../../artifacts/orca-connectivity/20251120TrialAcceptCrudZ1/)。ログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`。
- **W22 メモ（2025-11-21, RUN_ID=NA）**: 週次エスカレーション準備中。`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-escalation.md` に trialsite 行117-142の引用と Task-D/F 実測ログをまとめ、(1) Trial で閉じている `/20/adm/phr/*` 一覧、(2) ORCA 側で開放すべき設定（データ出力・CLAIM サーバ・マスタ更新等）、(3) Modernized 暫定対応（Task-H）、(4) 週次レビューでの論点を整理した。Checklist Task-I と DOC_STATUS W22 行から参照できるよう備考へ追記予定。
- **追加（2025-11-14, RUN_ID=`20251113TorcaProdCertZ1`）**: WebORCA 本番証明書／接続先設定の棚卸しタスク。`docs/server-modernization/phase2/operations/assets/orca-use-guides/raw/glserver_ssl_client_verification4.md`（CN/SAN とクライアント配布）、`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §7（`curl --cert-type P12` 手順）、`docs/server-modernization/phase2/notes/orca-api-field-validation.md`（`app.weborca.orcamo.jp` / `weborca.cloud.orcamo.jp` 先）を再確認し要件を整理。`ORCAcertification/103867__JP_u00001294_client3948.p12`＋パスファイル＋Basic 情報がすべて 700 権限/平文で同一ディレクトリに存在していたため、`chmod 600` と Secrets 管理（Keychain/Vault 等）への退避が必要と判断。`ops/shared/docker/custom.properties` は依然 `claim.host=orca` なので、本番向け `weborca.cloud.orcamo.jp:443` や `cloud.weborca.*` 系キーが未設定。`2025-11-14 09:27 JST` 時点で outbound HTTPS を許可した端末から `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" -X POST 'https://weborca.cloud.orcamo.jp/api/api01rv2/acceptlstv2?class=01'` を 1 回だけ実行し、HTTP 200 / `Api_Result=21 (対象の受付はありませんでした。)` を取得、`acceptlstv2.{headers,json}` は `artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/` に保存済み（`jq` で `Acceptance_Id` / `Patient_Information` を削除済み）。再開条件は「`weborca.cloud.orcamo.jp:443` への outbound HTTPS が許可された端末 + `ORCAcertification/` への 600 権限アクセス + 作業後の `unset ORCA_PROD_*`」の 3 点で、同条件を満たさない端末では curl 実行を保留する。
- **W37（2025-11-13, RUN_ID=`20251113TorcaApiPrefixW37`）**: `/api/apiXX` プレフィックスの POST 可否を取得。`/api/api21/medicalmodv2?class=01` は 200 (`Api_Result=10`/患者未登録) で REST ハンドラ到達、一方 `/api/api11/acceptmodv2` と `/api/api14/appointmodv2` は 404 (`{"message":"APIが存在しません"}`) かつ `Allow` ヘッダー無し。`tmp/orca-api-payloads/*` を `--data-binary` で送らないと WebORCA が panic するため、リクエスト生成フローも Runbook §4.5 に追記。Evidence: [artifacts/orca-connectivity/20251113T015626Z/api-prefix-test/](../../../artifacts/orca-connectivity/20251113T015626Z/api-prefix-test/)。Runbook/オペログは `2025-11-13-orca-connectivity.md` へ追記済み。
- **W41 追加（2025-11-13, RUN_ID=`20251113TorcaRouteTemplateW41`）**: ORCA ルーティング定義の自動生成スクリプトが存在しないことを `rg --files -g '*route*'` / `rg 'receipt_route'` で確認し、`artifacts/orca-connectivity/templates/receipt_route.template.ini`・`route.template.yaml` をテンプレとして整備。Runbook §4.5 Step2 に再配置手順と `questions/RECEIPT_ROUTE_REQUEST.md`（サポート問い合わせテンプレ）を追記した。WebORCA クラウドでは route 編集を実施しない方針のため、テンプレは Evidence としてのみ保持し、実環境へ適用する場合はサポート回答待ちである点を明記。Evidence: [artifacts/orca-connectivity/templates/](../../../artifacts/orca-connectivity/templates/)（テンプレ） / `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`（route 不在ログ）。
- **W45 追加（2025-11-13, RUN_ID=`20251113TorcaRouteApplyW45`）**: receipt_route テンプレ（INI/YAML）を RUN_ID 配下へコピーして WebORCA コンテナへ `docker cp` → `chown orca:orca` → `chmod 640` で配置後、`su - orca -c '/opt/jma/weborca/mw/bin/weborca stop && ... start'` を複数回試行したが `weborca` バイナリは `stop` を解釈せず常に二重起動となり `listen tcp :8000` で失敗。`weborca_restart.log` に失敗ログを残しつつ、最終的に `docker restart jma-receipt-docker-orca-1` で再読み込み。再起動後も `GET /api01rv2/patientgetv2?id=000001` は 404、`POST /orca11/acceptmodv2?class=01` は 405（`Allow: OPTIONS, GET`）のままで route テンプレ適用による改善は確認できず。Evidence: [artifacts/orca-connectivity/20251113TorcaRouteApplyW45/receipt-route-test/](../../../artifacts/orca-connectivity/20251113TorcaRouteApplyW45/receipt-route-test/)（`patientgetv2_direct.http`, `acceptmodv2_direct.http`, `README.md`）。Runbook §4.5 に当該 RUN_ID を追記し、`questions/RECEIPT_ROUTE_REQUEST.md` へ escalaton 方針を連携済み。
- **W59 追加（2025-11-13, RUN_ID=`20251113TorcaAcceptEnableZ1`）**: `receipt_route.ini` / `online.env` / `jma-receipt.env` を `docker cp` で採取し、Runbook §4.5「API enable 手順」で求められる `API_ENABLE_*` が一切定義されていないことを確認。`env | grep -E 'API|ROUTE|HYBRID'` や `online.env` 抜粋（HTTP/DB 設定のみ）を Evidence として `artifacts/orca-connectivity/20251113TorcaAcceptEnableZ1/config/` に保存した。既存設定のまま `curl -sv -X POST http://localhost:8000/orca11/acceptmodv2?class=01 --data 'dummy=1'` を実行すると `HTTP/1.1 405 Method Not Allowed`（`Allow: OPTIONS, GET`）で、`docker logs --since 30m` も `System Error:405 code=405` を出力。指示通り `acceptmodv2_enable/NOT_FIXED.txt` へ不足設定（API_ENABLE_ACCEPT=1 等）と再現ログをまとめ、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` / Evidence Index に RUN_ID を登録。POST 開放には API enable 手順（WebORCA サポートへのエスカレーション）が依然必須である点を Blocker として維持。
- **W56 追加（2025-11-13, RUN_ID=`20251113TorcaPatientAutoStdZ1`）**: `tbl_syskanri (kanricd=1009)` を標準 8 桁連番へ更新し、`tbl_hknjainf_user/_plus` に `InsuranceProvider_Number=06123456` を登録したうえで `/orca12/patientmodv2` を XML 送信。`Api_Result=00`／`Patient_ID=00002` を取得し、`tbl_ptinf/tbl_ptnum` を 8 桁へ補正後に `/api/api21/medicalmodv2` を再実行したが、`Physician_Code` の参照先が未整備で `Api_Result=14 (ドクターが存在しません)` が継続。doctor マスタと REST ルートの紐付けが次ステップ。Evidence: [artifacts/orca-connectivity/20251113T084607Z/](../../../artifacts/orca-connectivity/20251113T084607Z/)（`patientmodv2_auto/`, `api21_patientmod_auto/`）。Runbook §4.5 / マトリクス #3,#14 に備考を追記済み。
- **W60 追加（2025-11-13, RUN_ID=`20251113TorcaDoctorManualW60`）**: `/api01rv2/system01lstv2?class=02` を再取得しても `Api_Result=11 (対象がありません。)` で `Code=00001` 医師マスタが返らず、そのまま `/api/api21/medicalmodv2?class=01` も `Api_Result=14 (ドクターが存在しません)` のまま停止することを確認。`tmp/orca-api-payloads/03_medicalmodv2_payload.xml` の `Physician_Code=00001` は一致しているため、ORCA 側 doctor seed が欠落している点を Evidence として `artifacts/orca-connectivity/20251113T123843Z/doctor_manual/`／`.../api21_doctor_manual/` に保存。`orca/http.log` tail では system01→medicalmodv2 の順に COBOL ジョブが完了しており、REST ルートや患者 seed は問題ないため doctor マスタの再投入が唯一の残課題であることを PHASE2 マトリクス #3 へ反映。Runbook §5 と Evidence Index も同 RUN_ID で更新。

- **W62 追加（2025-11-13, RUN_ID=`20251113TorcaManageUsersZ1`）**: `/orca101/manageusersv2` の Request_Number=02/03/04（登録/変更/削除）を XML (`docs/server-modernization/phase2/operations/assets/orca-api-requests/manageusers_{register,update,delete}.xml`) から送信したが、いずれも `HTTP/1.1 405 Method Not Allowed`（`Allow: OPTIONS, GET`）で遮断され、`tbl_list_doctor` / `tbl_syskanri` / `tbl_srykarrk` / `tbl_sryact` に `taro`→`jiro` doctor が作成されないことを `table_checks.txt` で確認。Evidence: `artifacts/orca-connectivity/20251113T150730Z/manageusers/`（レスポンス + weborca/postgres ログ）。同 RUN で `/api/api21/medicalmodv2?class=01` を再実行しても `Api_Result=14 (ドクターが存在しません)` が継続 (`.../api21_manageusers/response.xml`)、API #32 の POST を有効化しない限り doctor seed を API ベースで投入できないと結論付けた。Runbook §5（#32 行）と Evidence Index を更新済み。
- **W63 追加（2025-11-13, RUN_ID=`20251113TorcaLegacyStaffZ1`）**: Legacy Swing クライアントと `server/` コードを再読し、職員登録は `/user` REST (`UserResource`→`UserServiceBean`) のみで完結し ORCA API を経由しないこと、`UserModel#orcaId` は doctor コードの転記であることを確認。`ext_lib/OpenDolphin-ORCA-OQS` の `getManageusersres` は import 先が無く未配線で、firecrawl 取得仕様 (`assets/orca-tec-index/raw/api_userkanri.md`) および `manageusers_{register,update,delete}.xml` も参照用途に限定。`receipt_route.template.ini`（`artifacts/orca-connectivity/templates/`）には `/orca101` ブロックが存在しないため、405 解消には WebORCA 側ルーティングで POST を開放する追加作業が必要と整理した。Evidence: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` 「Legacy 参照」節 / `artifacts/orca-connectivity/20251113T150730Z/manageusers/`（既存 405 証跡）。
- **W63A 追記（2025-11-13）**: 上記調査結果を踏まえ、フェーズ2では ORCA 側 `/orca101/manageusersv2` を用いた自動登録/変更/削除機能の実装を一時見送り、医師マスタ整備は UI 手順またはサポート経由の設定展開で対応する方針へ変更。`ext_lib/OpenDolphin-ORCA-OQS` に残る manageusersv2 関連コードは将来の再開に備えて維持し、`API_ENABLE_*` が公開された時点で再計画する。タスク棚卸し: `PHASE2_PROGRESS` → `phase2/orca-manageusers-deferred`（新規行）に Deferred フラグを追加し、`DOC_STATUS.md` の ORCA 連携カテゴリも「Deferred (API enable info pending)」へ更新する。Runbook §5 には当面の暫定手順（UI で doctor を登録→Api21/P0 API を再検証）を追記済み。
- **W46 追加（2025-11-13, RUN_ID=`20251113TorcaPatientmodCliW46`）**: `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 curl --data-binary @/tmp/14_patientmodv2_request.xml http://localhost:8000/api/orca12/patientmodv2?class=01` を CLI で再現し、`docs/server-modernization/phase2/operations/assets/orca-api-requests/14_patientmodv2_request.xml` をコンテナへ `docker cp`→`/tmp/14_patientmodv2_request.xml` へ配置してから実行。相対パスのまま送信すると `Content-Length: 0` で panic（HTTP 500）になることを `http_log_tail.txt` に保存し、再送後も `Api_Result=01 (患者番号未設定)` で 8 桁 Patient_ID は自動採番されなかった。`tbl_ptinf/tbl_ptnum/tbl_ptkohinf/tbl_pthkninf` は `ptid=1` の seed から変化せず、前提未達のため `/api/api21/medicalmodv2` は未実行（`NOT_EXECUTED.txt` へ理由を記録）。Evidence: [artifacts/orca-connectivity/20251113T065012Z/patientmodv2_official_cli/](../../../artifacts/orca-connectivity/20251113T065012Z/patientmodv2_official_cli/)（patientmod 応答＋DB洗い出し）と [artifacts/orca-connectivity/20251113T065012Z/api21_patientmod_cli/](../../../artifacts/orca-connectivity/20251113T065012Z/api21_patientmod_cli/)（API21 再実行手順メモ）。
- **W28 追加（2025-11-13, RUN_ID=`20251113TorcaP0OpsZ2`）**: Physician_Code=`00001` へ更新したテンプレで P0 API #1-#5 を再実行し、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` および `artifacts/orca-connectivity/20251113T011831Z/P0_retry/` にレスポンス JSON/headers を保存。#1 (patientget) は 404、#2-#4 (appointmod/medicalmod/acceptmod) は 405 で `Allow: OPTIONS, GET` を取得、#5 (acceptlstv2) は 200 だが `Api_Result=14`（診療内容情報が存在しません）となり P0 目的の `Api_Result=00` には未達。診療行為 seed の追加か POST API 開放が必要なため、Runbook §4.5/§4.2 に NG 継続として反映。
- **W36 追加（2025-11-13, RUN_ID=`20251113TorcaP0OpsZ3`）**: ORCA DB (`jma-receipt-docker-for-ubuntu-2204-db-1`) へ患者 ID `000001` のダミーデータと当日受付 (`tbl_ptinf`/`tbl_ptnum`/`tbl_uketuke`/`tbl_ptmemoinf`) を投入し、`Medical_Information=01` 指定で `POST /api01rv2/acceptlstv2?class=01` を再実行。HTTP 200 / `Api_Result=00` （`Patient_ID=000001`）を `artifacts/orca-connectivity/20251113T015810Z/seed/acceptlstv2_response.http` に記録し、Runbook §5 行#5 備考へ「受付 seed 追加済み (RUN_ID=20251113TorcaP0OpsZ3)」と証跡パスを追記。ログ/証跡: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`。
- **W50 追加（2025-11-13, RUN_ID=`20251113Tapi21RetryZ1`）**: `tmp/sql/api21_medical_seed.sql` に `tbl_ptinf` / `tbl_ptnum` / `tbl_pthkninf` / `tbl_ptkohinf` を追記して ORCA DB へ再投入後、`/api/api21/medicalmodv2?class=01` を再実行。HTTP 200 だが `Api_Result=10`（患者番号未検出）が継続し、患者番号桁数または route 設定が未整備であることが再確認された。Evidence: [artifacts/orca-connectivity/20251113Tapi21RetryZ1/](../../../artifacts/orca-connectivity/20251113Tapi21RetryZ1/)（`response.json`, `orca.log`, `postgres.log`）。Runbook §4.5 / §5 マトリクス #3 に `/api/api21` 経路→`Api_Result=10` を追記。
- **W53 追加（2025-11-13, RUN_ID=`20251113T044130Z`）**: 公式 seed（7 桁 `patient_id_1` / `ptnum` + 保険/公費 + `tbl_uketuke` 受付）を `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` へ統合し直したうえで WebORCA コンテナ内から `curl`（XML/UTF-8）で `/api/api21/medicalmodv2?class=01` を再実行。HTTP 200・`X-Hybridmode: normal` だが `Api_Result=10` が継続したため、`artifacts/orca-connectivity/20251113T044130Z/api21_seed_retry/` に payload／レスポンス／`docker logs`／`psql_apply.log` を証跡化し、Runbook §5 (#3) 備考へ再試行内容を追記。
- **W55 追加（2025-11-13, RUN_ID=`20251113TorcaApi21SeedZ1`）**: `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` を 8 桁 `patient_id_1` / `ptnum`（`00000001`）へ更新し、`docker exec -i jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca < ...` で再投入。`seed_verification.txt` で `ptnum=00000001 (length=8)` を確認後、`/tmp/orca-api-payloads/03_medicalmodv2_payload.xml` も 8 桁へ更新して `/api/api21/medicalmodv2?class=01` を実行したが `Api_Result=10 (患者番号に該当する患者が存在しません)` が継続。`artifacts/orca-connectivity/20251113T061111Z/`（seed）と `.../20251113T061159Z/api21_seed_retry/`（curl 応答＋http.log＋postgres log tail）を Evidence 化し、Runbook §4.5 / マトリクス #3 へ「8 桁 seed 後も Api_Result=10」検証を追記。

## 2025-11-13 追記: ライセンス Secrets Vault 実投入（担当: Codex）
- **RUN_ID=`20251119TlicenseVaultZ1`**: `hashicorp/vault:1.15.5` dev モードを起動し、`vault secrets enable -path=kv kv-v2` → `vault kv put kv/modernized-server/license/dev license.key=<rand32> license.secret=<rand32> license.uid_seed=<uuid> rotated_at=2025-11-13` で Dev パスを初期化。`vault kv get -format=json ...` を `OPS_SECRET_FETCH` の暫定実装として処理し、`tmp/license/license.properties` と `system_license_post_body.txt`（`<uid_seed>-20251119TlicenseVaultZ1`）を生成 → Legacy/Modernized 双方へ `docker cp` → `/etc/opendolphin/license/license.properties` シンボリックリンクを再構築した。作業完了後は `tmp/license/*` と Vault dev コンテナを削除。
- **HTTP 検証**: helper コンテナ（`--network legacy-vs-modern_default`）から `TRACE_RUN_ID=20251119TlicenseVaultZ1 PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers PARITY_BODY_FILE=tmp/license/system_license_post_body.txt ops/tools/send_parallel_request.sh --profile modernized-dev POST /dolphin/license license_post_manual` を実行し、Modernized=`200`（body `0`）/Legacy=`404`。続けて `GET /dolphin/license`（Modernized=`405`, Legacy=`404`）と `GET /system/license`（双方 `404`）を採取。証跡は `artifacts/parity-manual/license/20251119TlicenseVaultZ1/{post,get,get-system,logs}/` と `README.md` に保存。
- **残課題**: Modernized では Vault 由来のライセンスで `SYSTEM_LICENSE_CHECK` まで成功したが、Legacy REST (`POST /dolphin/license`) は未だ 404。`docs/server-modernization/phase2/notes/license-config-check.md` に既知事象として追記し、Legacy 側の API 公開（または `/system` エイリアス）対応を追跡する。

## 2025-11-13 追記: Vault フロー自動化スクリプト（担当: Codex）
- **RUN_ID=`20251119TlicenseVaultAutoZ1`**: `ops/tools/fetch_license_secrets.sh` を新規作成し、`vault kv get` → `jq` → `license.properties`/`system_license_post_body.txt` 生成 → `docker cp` → `docker exec -u 0 chown && ln -sf` を自動化。`RUN_ID` を指定すると POST ボディを `<license.uid_seed>-<RUN_ID>` に更新し、`--artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/` へ結果を複製できる。Dev Vault 非接続端末では `--dry-run` でフォーマットのみを確認し、接続可能な環境ではそのままヘルパー経路で `ops/tools/send_parallel_request.sh POST /dolphin/license` を実行して証跡を保存する運用とした。
- **成果物**: `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/` に README・サニタイズ済みファイル構造を保存。`docs/server-modernization/phase2/operations/SECURITY_SECRET_HANDLING.md`（2.4.1）と `docs/server-modernization/phase2/notes/license-config-check.md` に手順/「自動化済み」メモを追記済み。

## 2025-11-22 追記: ライセンス監視ジョブ自動化（担当: Codex）
- **RUN_ID=`20251122TlicenseNightlyZ1`**: `ops/tools/license_monitor_job.sh` を新規追加し、Vault → ライセンス API（Modernized のみ）→ `d_audit_event` TSV → Slack/PagerDuty 通知ログ → 最新ステータス更新までを 1 コマンドで実行できるようにした。`ops/tools/send_parallel_request.sh` / `ops/tests/api-smoke-test/run.sh` へ `--targets {modern|legacy|dual}` を実装し、HTTP/headers/meta/ログは `artifacts/parity-manual/license/20251122TlicenseNightlyZ1/` および `latest_status.json` に保存している。
- **監査データ整備**: `ops/db/maintenance/license_audit_cleanup.sql` で Legacy/Modernized 両 DB の `SYSTEM_LICENSE_CHECK` 行を JSON + trace_id 形式へ統一し、ログを `artifacts/parity-manual/license/maintenance/20251113TlicenseCleanupZ1/` に保存。Modernized 側では `trace_id=RUN_ID`／`payload.status=success` が揃い、Legacy は参考ログ扱いへ移行した。
- **ドキュメント更新**: `docs/server-modernization/phase2/notes/license-config-check.md` §7.9（ジョブ実績）／§7.10（クレンジング）、`SWING_PARITY_CHECKLIST.md` 自動監視行、`DOC_STATUS.md` ライセンス行を最新化し、監視 Gate を Modernized のみに限定する方針を明記した。
- **次ステップ**: CI/cron への組み込み、本番 Webhook/Key の登録、Legacy 側監査の是正または監視対象外化、ジョブ README 整備を順次進める。

## 2025-11-22 追記: env-status & OTLP 常駐化（担当: Codex）
- **RUN_ID=`20251122TenvCheckZ4`**: `ops/tools/env-status-check.sh` に `--basic-auth-file` と `--otel-profile` を追加。Modernized 9080 は Basic+MD5 認証で `HTTP/1.1 200 OK` を維持し、Legacy 8080 は compose 管理外のため `--skip-legacy` 実行＋`docker logs opendolphin-server --tail 400` を Evidence として添付。OTLP Collector は `ops/monitoring/otel-collector-config.yaml` へ metricstransform/resource processor を追加して重複ラベル WARN を解消し、`otel-collector.logs.txt` には INFO のみが残る状態を確認した。
- **成果物/ドキュメント**: `artifacts/parity-manual/env-status/20251122TenvCheckZ4/` に README/ログ一式を保存し、`README.md` の env-status 節に `--basic-auth-file`／`--skip-legacy`／`--otel-profile otlp` の運用を追記。`PHASE2_PROGRESS.md` 監視節と `DOC_STATUS.md` を RUN_ID=`20251122TenvCheckZ4` で更新し、Legacy は参考ログ添付、Modernized+OTLP 監視が Gate 条件であることを明示した。
- **課題**: Legacy 8080 を compose プロジェクトへ再結合するか、`--skip-legacy` 実行時の docker logs 添付を正式ルール化する。OTLP 設定変更後の Micrometer ダッシュボードで `deployment` ラベルを `deployment_source` へ切り替える検討を継続。

## 2025-11-22 追記: ORCA HTTP 404/405 テンプレ本番適用（担当: Codex）
- **RUN_ID=`20251121TorcaHttpLogZ1`／`20251122TorcaHttpLogZ1`**: `scripts/orca_prepare_next_run.sh` でテンプレ展開後、Handbook §7 の tail -F／docker logs --since／rg 抜粋／httpdump／Slack 報告を実施。Basic 無しは 401、`curl -u <DEV_ORCA_BASIC>` は 404 まで進む挙動を `httpdump/api01rv2_patientgetv2{,_basic}/response.http` と `http_live_20251113T131848Z.log` に記録し、Echo panic stacktrace を `echo_panic_stacktrace.txt` へ抽出した（接続先・認証詳細は `mac-dev-login.local.md` 参照）。
- **設定整理**: `receipt_route.ini`／`online.env`／`jma-receipt.env` の更新手順と Basic 運用ポリシーをログ台帳へ追記し、docker restart だけで反映できることを明文化。`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` と `PHASE2_PROGRESS.md` ORCA節を更新し、次アクション（API_ENABLE, Basic 認証の公式キー取得など）を明示した。
- **次ステップ**: ORCA サポートからの `API_ENABLE_*`／Basic 情報を受領後、設定ファイルを正式値に差し替えて再テスト。`orca_http.log` から panic stacktrace を継続採取するか Go Echo 側の handler を調査する。

## 2025-11-22 追記: DB Gate 再実証 & down/up ログ整備（担当: Codex）
- **RUN_ID=`20251122TbaselineGateZ2`**: `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml down db db-modernized` → `up -d db db-modernized` のログを `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/down.log`／`.../20251122TbaselineGateZ2/up.log` に保存し、`MODERNIZED_POSTGRES_PORT=55433` でポート競合を解消。Legacy/Modernized 両 DB に `local_synthetic_seed.sql` を再適用し、Legacy は `LOCAL.FACILITY.0001:nurse` を追加入力、Modernized は `d_users=4` を確認。`flyway_schema_history` を DROP してから `flyway baseline→migrate→info` を実行し、v0227 まで SUCCESS を記録した。
- **証跡/ドキュメント**: `artifacts/parity-manual/db-restore/20251122TbaselineGateZ2/` に `legacy_schema_dump.sql`, `modern_schema_apply.log`, `psql_{legacy,modern}_{dt,public_table_count,d_users_count}.log`, `legacy_seed_nurse*.log`, `modern_seed.log` を集約。`POSTGRES_BASELINE_RESTORE.md` §6.2 と `PHASE2_PROGRESS.md` Gate 節へ down/up ログ取得・55433 ポート再公開・nurse シード再適用・`flyway_schema_history` DROP を追記し、`DOC_STATUS.md` の DB 行を STABLE/RUN_ID=`20251120TbaselineGateZ1` へ更新した。
- **注意事項**: firecrawl の Postgres 5432 競合を避けるため停止中。必要に応じて `docker start firecrawl-nuq-postgres-1` で復旧する。以後 Gate #4 以降に進む際は `20251122TbaselineGateZ2` の証跡を参照して差分を確認する。
