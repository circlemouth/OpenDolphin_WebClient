# ライセンス設定ファイル検証メモ

> モダナイズ版サーバーと新 Web クライアントのライセンス API を安定させることが唯一の必須要件。Legacy サーバー／旧クライアントの挙動は参考情報として記録し、互換確保は求めない。

## 1. 実施概要
- **RUN_ID=`20251118TlicenseCheckZ1`（2025-11-12）**: `ops/tools/send_parallel_request.sh --profile compose GET /system/license license/20251118TlicenseCheckZ1` を実行し、Legacy/Modernized 両エンドポイントの HTTP 応答と `docker logs opendolphin-server{,-modernized-dev}` を採取した。証跡は `artifacts/parity-manual/license/20251118TlicenseCheckZ1/`。
- **RUN_ID=`20251118TlicenseCheckZ2`（2025-11-13）**: 9080/tcp のホスト転送問題を回避するため、`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc 'PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers TRACE_RUN_ID=20251118TlicenseCheckZ2 ops/tools/send_parallel_request.sh --profile modernized-dev GET /system/license license/20251118TlicenseCheckZ2'` を実施。helper 経由で `opendolphin-server`（Legacy）/`opendolphin-server-modernized-dev` に直接到達させ、HTTP/headers/meta と `docker logs` を `artifacts/parity-manual/license/20251118TlicenseCheckZ2/{legacy,modern,logs}/` へ保存した。
- `ops/tests/api-smoke-test/headers/sysad-license.headers` を新設し、`LOCAL.FACILITY.0001:dolphin` 用の `userName` / `password` / `facilityId` / `clientUUID` と `X-Trace-Id: license-{{RUN_ID}}` をテンプレ化した（header-auth fallback を利用するため Authorization ヘッダーは未使用）。
- **RUN_ID=`20251118TlicenseDeployZ1`（2025-11-13）**: `tmp/license/license.properties`（`license.key=test-key` / `license.secret=test-secret`）を作成し、`docker cp tmp/license/license.properties opendolphin-server{,-modernized-dev}:/opt/jboss/wildfly/license.properties` → `docker exec -u 0 ... chown jboss:jboss` → `/etc/opendolphin/license/license.properties` へシンボリックリンクを張った。helper コンテナから  
  `PARITY_OUTPUT_DIR=artifacts/parity-manual/license/20251118TlicenseDeployZ1/post TRACE_RUN_ID=20251118TlicenseDeployZ1 ops/tools/send_parallel_request.sh --profile modernized-dev --config ops/tests/api-smoke-test/configs/system_license_post.config --run-id 20251118TlicenseDeployZ1`  
  を実行し、Legacy/Modernized 双方の `POST /dolphin/license` で本文 `"0"` を取得。続けて `GET /dolphin/license`（405 になることを確認）と `GET /system/license`（404 継続）を `artifacts/parity-manual/license/20251118TlicenseDeployZ1/{get,get-system}/` に保存し、`logs/opendolphin-server{,-modernized-dev}.log` へトレースを採取した。
- **RUN_ID=`20251119TlicenseVaultZ1`（2025-11-13）**: `hashicorp/vault:1.15.5` dev モードで `kv/modernized-server/license/dev` を作成し、本番手順通りに `license.key`/`license.secret`/`license.uid_seed`/`rotated_at` を登録。`vault kv get -format=json ... | jq` を `OPS_SECRET_FETCH` の代替として用い、`tmp/license/license.properties`・`system_license_post_body.txt`（`<uid_seed>-20251119TlicenseVaultZ1`）を生成 → Legacy/Modernized 双方へ `docker cp`。helper から `TRACE_RUN_ID=20251119TlicenseVaultZ1 ops/tools/send_parallel_request.sh --profile modernized-dev POST /dolphin/license license_post_manual` を実行し、Modernized=200（body=0）/Legacy=404 を採取。続けて `GET /dolphin/license`（Modernized=405, Legacy=404）と `GET /system/license`（双方 404）を取得し、`artifacts/parity-manual/license/20251119TlicenseVaultZ1/{post,get,get-system,logs}/` と `artifacts/parity-manual/license/20251119TlicenseVaultZ1/README.md` に匿名化ログを整理した。完了後は `tmp/license/*` を削除し、Vault dev コンテナも停止。
- **RUN_ID=`20251119TlicenseVaultAutoZ1`（2025-11-13）**: Vault ハンドリングを恒久対応するため `ops/tools/fetch_license_secrets.sh` を新設し、`vault kv get`→`jq`→`license.properties`/`system_license_post_body.txt` 生成→`docker cp` を 1 コマンド化した（Vault フロー**自動化済み**）。`artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/` にはサニタイズ済みの出力フォーマットと README（実行手順）があり、Dev Vault に接続可能な環境で同スクリプトを実行すれば `RUN_ID` ごとに証跡を残せる。
- **RUN_ID=`20251119TlicenseLegacyFixZ1`（2025-11-13）**: Legacy WildFly へ展開済みの `SystemResource`（`@Path("/license")`）を再確認し、`docker exec opendolphin-server ls /opt/jboss/wildfly/standalone/deployments` と `curl -isS -H'userName:9001:doctor1' -H'password:doctor2025' http://localhost:8080/openDolphin/resources/dolphin/license` で 405 応答を取得。`tmp/license/system_license_post_body.txt` に `legacy-device-20251119TlicenseLegacyFixZ1` を投入後、`ops/tests/api-smoke-test/run.sh --scenario license --profile compose --run-id 20251119TlicenseLegacyFixZ1` を実施し、Legacy/Modernized とも `POST /dolphin/license = 200 body="0"`、`GET /dolphin/license = 405`、`GET /system/license = 405` まで揃った。証跡は `artifacts/parity-manual/license/20251119TlicenseLegacyFixZ1/` 配下へ転記し、`tmp/license/*` は削除済み。
- 既存 compose スタックは再起動せず、helper から `--profile modernized-dev` で両サーバーへ同時アクセスしている。

## 2. HTTP 応答サマリ
| 環境 | RUN_ID | メソッド | HTTP ステータス | 応答/例外 | 付記 |
| --- | --- | --- | --- | --- | --- |
| Legacy (`opendolphin-server`) | 20251118TlicenseCheckZ1 | `GET /system/license` | `401 Unauthorized` | `response.json` に `{"reason":"authentication_failed","principal":"1.3.6.1.4.1.9414.10.1:dolphin"}`。`headers.txt` に `WWW-Authenticate: Basic realm="OpenDolphin"` と `X-Trace-Id=f7f1d263-afc1-422f-91af-6200e0741a89`。 | `LogFilter` が資格情報を承認できず、REST 実装まで到達しない。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251118TlicenseCheckZ1 | `GET /system/license` | `curl: (56)` → HTTP `000` | `response.json`/`headers.txt` は空。`meta.json` は `exit_code=56`, `time_total=127s`。 | `localhost:9080` への port-forward が握り潰され、TCP が確立できなかった。 |
| Legacy (`opendolphin-server`) | 20251118TlicenseCheckZ2 | `GET /system/license` | `404 Not Found` | 本文は空。`headers.txt` に `X-Trace-Id: license-20251118TlicenseCheckZ2` と WildFly10 既定ヘッダーのみ。 | helper 経由で `LogFilter` 認証（`LOCAL.FACILITY.0001:dolphin`）は通過し、JAX-RS へ到達。`/resources/system/license` に対応するリソースが存在しないため 404。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251118TlicenseCheckZ2 | `GET /system/license` | `404 Not Found` | 本文は空。`headers.txt` に `Strict-Transport-Security` / `Content-Security-Policy` / `X-Content-Type-Options` を含む Undertow+WildFly33 応答。 | helper から `http://opendolphin-server-modernized-dev:8080/openDolphin/resources/system/license` へ到達済み。Modernized も `/system` パスを公開していないため 404。 |
| Legacy (`opendolphin-server`) | 20251118TlicenseDeployZ1 | `POST /dolphin/license` | `200 OK` | 本文 `0`（ライセンス新規登録）。`headers.txt` に `X-Trace-Id: system-license-20251118TlicenseDeployZ1`。 | `artifacts/parity-manual/license/20251118TlicenseDeployZ1/post/license_post/legacy/`。`license.properties` を書き込めることを確認。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251118TlicenseDeployZ1 | `POST /dolphin/license` | `200 OK` | 本文 `0`（`actionType=registered` ログ）。`headers.txt` には `X-Trace-Id: system-license-20251118TlicenseDeployZ1`。 | `artifacts/parity-manual/license/20251118TlicenseDeployZ1/post/license_post/modern/`。`FileLicenseRepository` が `license.properties` を新規作成できることを確認。 |
| Legacy (`opendolphin-server`) | 20251118TlicenseDeployZ1 | `GET /dolphin/license` | `405 Method Not Allowed` | `headers.txt` に `Allow: POST, OPTIONS`。本文なし。 | `GET` メソッドは未実装のため 405 で遮断される（`artifacts/.../get/license_get/legacy/`）。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251118TlicenseDeployZ1 | `GET /dolphin/license` | `405 Method Not Allowed` | `headers.txt` に `Allow: POST, OPTIONS`。本文なし。 | Modernized も同様に POST 専用。 |
| Legacy (`opendolphin-server`) | 20251118TlicenseDeployZ1 | `GET /system/license` | `404 Not Found` | 本文空。 | `/system` ルートが存在しないことを再確認（`artifacts/.../get-system/license_get_system/legacy/`）。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251118TlicenseDeployZ1 | `GET /system/license` | `404 Not Found` | 本文空。 | `/system` ルートは Modernized 側でも未実装（`artifacts/.../get-system/license_get_system/modern/`）。 |
| Legacy (`opendolphin-server`) | 20251119TlicenseVaultZ1 | `POST /dolphin/license` | `404 Not Found` | HTML 404。`X-Trace-Id: license-20251119TlicenseVaultZ1`。 | Legacy REST では `/dolphin/license` が未公開のため引き続き 404（`artifacts/parity-manual/license/20251119TlicenseVaultZ1/post/license_post/legacy/`）。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251119TlicenseVaultZ1 | `POST /dolphin/license` | `200 OK` | 本文 `0`。ログに `ライセンス新規登録: <uid>-20251119TlicenseVaultZ1`。 | `artifacts/parity-manual/license/20251119TlicenseVaultZ1/post/license_post/modern/`。Vault 投入値で初回登録成功。 |
| Legacy (`opendolphin-server`) | 20251119TlicenseVaultZ1 | `GET /dolphin/license` | `404 Not Found` | 本文空。 | Legacy 側はそもそも GET を公開していないため HTTP 404 のまま。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251119TlicenseVaultZ1 | `GET /dolphin/license` | `405 Method Not Allowed` | `Allow: POST, OPTIONS`。本文なし。 | Modernized では POST 専用挙動を維持（`artifacts/.../get/license_get/modern/`）。 |
| Legacy (`opendolphin-server`) | 20251119TlicenseVaultZ1 | `GET /system/license` | `404 Not Found` | 本文空。 | `/system` エイリアスが無いため、`artifacts/.../get-system/license_get_system/legacy/` で 404 を再確認。 |
| Modernized (`opendolphin-server-modernized-dev`) | 20251119TlicenseVaultZ1 | `GET /system/license` | `404 Not Found` | 本文空。 | Modernized も `/system` ルート非対応（`artifacts/.../get-system/license_get_system/modern/`）。 |

## 3. ログ採取結果
- Legacy: `artifacts/parity-manual/license/20251118TlicenseCheckZ1/logs/opendolphin-server.log` に `08:41:32,616 WARNING [open.dolphin] ... Unauthorized user: 1.3.6.1.4.1.9414.10.1:dolphin: /openDolphin/resources/system/license traceId=f7f1d263-afc1-422f-91af-6200e0741a89` を含むスタックを保存。`d_audit_event` への INSERT SQL も同ログで確認できる。
- Modernized: `.../opendolphin-server-modernized-dev.log` には検証時間帯の通常アクセスと OTLP 送信失敗 WARN (`Failed to publish metrics to OTLP receiver: UnknownHostException: otel-collector`) が残る一方、`/system/license` のリクエスト自体は到達していない。
- `artifacts/parity-manual/license/20251118TlicenseCheckZ2/logs/opendolphin-server{,-modernized-dev}.log` に helper 実行分の INFO ログを追記。いずれも `172.19.0.8 ... GET /system/license traceId=license-20251118TlicenseCheckZ2` を 2 件出力し、Modernized 側は Undertow のリバースプロキシ経由で `Strict-Transport-Security` などのセキュリティヘッダーを付けた 404 応答に至っている。
- `artifacts/parity-manual/license/20251118TlicenseDeployZ1/logs/opendolphin-server{,-modernized-dev}.log` では `POST /dolphin/license traceId=system-license-20251118TlicenseDeployZ1` が Legacy/Modernized 双方で `ライセンス新規登録` → `SYSTEM_LICENSE_CHECK status=success` を記録。続けて `GET /dolphin/license` は `Allow: POST, OPTIONS` を返し、`GET /system/license` は依然 404 であることがログ上でも確認できる。
- `artifacts/parity-manual/license/20251119TlicenseVaultZ1/logs/opendolphin-server{,-modernized-dev}.log` には Vault 取得した UID（`<uuid>-20251119TlicenseVaultZ1`）での登録成功ログと、Legacy 側が 404 のままである旨（`RESTEasy 404`）が残る。Modernized 側は `SYSTEM_LICENSE_CHECK` の JMS 送信まで完了しており、Legacy の 404 解消が残課題である。

## 4. ライセンスファイル探索パス
### 4.1 Legacy (WildFly 10)
- `server/src/main/java/open/dolphin/rest/SystemResource.java:195-224` で `System.getProperty("jboss.home.dir") + "/license.properties"` を直接参照し、例外時は「ライセンスファイル読込/保存エラー」として `"2"`/`"3"` を返している。つまり **探索パスは `${JBOSS_HOME}/license.properties` の 1 箇所のみ**。
- これまでは `/opt/jboss/wildfly/license.properties` が存在せず常に `"2"` を返していたが、RUN_ID=`20251118TlicenseDeployZ1` では `docker cp tmp/license/license.properties opendolphin-server:/opt/jboss/wildfly/license.properties` → `docker exec -u 0 ... chown jboss:jboss && chmod 644` → `ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` を実施済み。以降の POST では `0` を返し、同ファイルに `license.uid*` が追記される。

### 4.2 Modernized (WildFly 33)
- `server-modernized/src/main/java/open/dolphin/system/license/FileLicenseRepository.java:19-50` も `System.getProperty("jboss.home.dir")` のみを起点に同名ファイルを解決する。`ApplicationScoped` リポジトリを `SystemResource` が直接 DI しており、Legacy と同様に 1 パス固定となっている。
- `docker-compose.modernized.dev.yml` で `JBOSS_HOME=/opt/jboss/wildfly` が設定されているため、Modernized も同様に `/opt/jboss/wildfly/license.properties` を参照する。RUN_ID=`20251118TlicenseDeployZ1` では Legacy と同じファイル内容を `docker cp` で配置し、`chown jboss:jboss`＋`ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` を実施した結果、`FileLicenseRepository` が `store()` まで通過し `"0"` を返すことを確認した。

> 提案: Secrets で管理する実ファイルを `/etc/opendolphin/license/license.properties` へ配置し、起動時に `/opt/jboss/wildfly/license.properties` へシンボリックリンク（または `custom.properties` と同じ COPY）を行う。双方の WildFly で同じ配置に揃えれば parity 検証が容易になる。

### 4.3 `/system/license` ルーティング案の比較
| 案 | 実装概要 | 長所 | 影響 / 懸念 |
| --- | --- | --- | --- |
| **A. SystemResource へ `/system` エイリアスを追加** | `@Path("/{scope : dolphin|system}")` で class レベルのベースパスを2種類許容し、既存の `@Path("/license")` メソッドへ同じ実装を通す。Legacy/Modernized 両方の `SystemResource` に同じ変更を入れる。 | - REST 実装の責務内で完結し、監査ログ/メトリクス/例外メッセージが従来の `SystemResource` に集約される<br>- `/system/license` でも 401/403/405 など本来のレスポンスを返せるため、診断の際に 404 へ隠蔽されない<br>- 影響範囲は `SystemResource` に限定され、他の `/system/*` エンドポイントを後から別実装で追加しても干渉しない | - Legacy / Modernized の両方でビルド・リリース作業が必要<br>- Regex 付き `@Path` を導入するため、IDE の静的解析設定が古い場合に Annotation を再解釈させる調整が必要になる |
| **B. Undertow rewrite (`/system/(.*) → /dolphin/$1`)** | `configure-wildfly.cli` で Undertow の `rewrite` フィルタを追加し、`/openDolphin/resources/system/...` へ届いた HTTP をアプリケーションへ渡す前に `/dolphin/...` へ書き換える。 | - Java ソースを変更せずに適用でき、Legacy/Modernized どちらも CLI を流すだけで即座に反映できる<br>- `/system` 以外のアプリケーションコードには一切触れず、Rollback もフィルタ削除だけで済む | - Undertow レイヤで全 `/system/*` が書き換わるため、将来 `/system/info` 等を JAX-RS で実装する余地を奪う<br>- 書き換え後の URL がアクセスログに残らず、調査時に「本来のリクエスト」が追跡しづらい<br>- `/system` に対する 404 を検知していた監視が成立しなくなり、誤検知リスクがある |

### 4.4 選択案: SystemResource エイリアス追加
- `/system/license` が 404 になる原因は **JAX-RS ベースパスが `/dolphin` 固定**なことにあるため、アプリケーション層で alias を持たせる方が最小限の責務で完結する。
- Undertow rewrite は便利だが `/system/*` 全体へ波及し、将来 `/system/server-info` を追加した際に rewrite に阻まれる恐れがある。404 を 405/401 に置き換える目的だけで HTTP サーバーレイヤを複雑化するのは避けたい。
- Legacy/Modernized いずれも `SystemResource` は jakarta/ javax の違いのみで構造が同じなため、同一パッチで両方の parity を維持できる。

#### Java 差分イメージ（Legacy/Modernized 共通）
```diff
@@
-@Path("/dolphin")
+@Path("/{scope : dolphin|system}")
 public class SystemResource extends AbstractResource {
@@
     @POST
     @Path("/license")
     @Consumes(MediaType.TEXT_PLAIN)
     @Produces(MediaType.TEXT_PLAIN)
     public String checkLicense(String uid) throws IOException {
```
- 既存の `@Path("/license")` メソッドを共用し、HTTP メソッドは POST のまま維持する（`GET /system/license` は 404 → 405 へ変化し、想定外の read が入り込まない）。
- 追加項目: `SystemResource` を含む JAX-RS パッケージで `@Path` の regex サポートが有効か確認し、`jboss-deployment-structure.xml` に特別な設定が不要であることを `standalone-full.xml` 起動ログで確認する。
- ✅ 2025-11-13 (RUN_ID=`20251119TlicenseAliasZ1`):
  - `mvn -f pom.server-classic.xml -pl server -am -Plegacy-wildfly10 -DskipTests -Dmaven.test.skip=true clean package` → `docker cp server/target/opendolphin-server-2.7.1.war opendolphin-server:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war` → `docker exec opendolphin-server touch ...dodeploy` で Legacy へホットデプロイ。
  - `mvn -f pom.server-modernized.xml -pl server-modernized -am -DskipTests -Dmaven.test.skip=true clean package` → `docker cp server-modernized/target/opendolphin-server.war opendolphin-server-modernized-dev:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war` → `touch ...dodeploy` で Modernized へホットデプロイ。
  - helper コンテナ（`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy`）から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseAliasZ1` を実行。`POST /dolphin/license` は Legacy/Modernized 共に `HTTP 200 body=0`、`GET /dolphin/license` は 405、`GET /system/license` も 405 となり、`X-Trace-Id=license-20251119TlicenseAliasZ1-*` が両サーバーのログへ残ることを確認した。
  - HTTP/headers/meta の証跡は `artifacts/parity-manual/license/20251119TlicenseAliasZ1/{post,get,get-system}/{legacy,modernized}/` に保存し、`tmp/license/system_license_post_body.txt` は実行後に削除した。

- 今後の再実行手順（再確認が必要な場合）:
  1. 上記と同じ Maven プロファイルで WAR を再生成し、`docker cp`＋`.dodeploy` でホットデプロイ。
  2. helper から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id <RUN_ID>` を実行し、`artifacts/parity-manual/license/<RUN_ID>/` に POST/GET の 3 系列を採取する。
  3. `GET /system/license` が 405 で応答し続ける（＝alias ルートが有効）こと、`X-Trace-Id` が `/system` 実行時にも `SystemResource` へ伝搬することを `docker logs opendolphin-server{,-modernized-dev}` で確認する。

### 4.5 Undertow rewrite 案（参考、当面は保留）
- 旧スタックの緊急代替としては、下記のように WildFly CLI でリライトフィルタを追加すれば `/system/license` を即時復旧できる。

```cli
/subsystem=undertow/configuration=filter/rewrite=system-license:add(
    target="/openDolphin/resources/dolphin/$1",
    pattern="^/openDolphin/resources/system/(.*)$")
/subsystem=undertow/server=default-server/host=default-host/filter-ref=system-license:add(priority=10)
```
- ただし `/system/*` すべてが `/dolphin/*` へ転送されるため、本番投入時は **alias 実装が着地するまでの暫定措置** にとどめる。撤去時は `filter-ref` → `rewrite` の順で削除する必要がある。

### 4.6 RUN_ID=`20251119TlicenseMonitorZ2` Modernized 500 調査
**発生条件**
- 2025-11-13 05:11Z に `TRACE_RUN_ID=20251119TlicenseMonitorZ2 BASE_URL_MODERN=http://localhost:9080/openDolphin/resources ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseMonitorZ2` をホスト側で実行（`PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers`, `PARITY_BODY_FILE=tmp/license/system_license_post_body.txt`）。成果物は `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/{post,get,get-system}/` へ保存済み。
- Modernized 側は `POST /dolphin/license`・`GET /dolphin/license`・`GET /system/license` のいずれも **500 Internal Server Error**（HTML エラーページ）で即時失敗し、Legacy 側は従来どおり POST=200/GET=405 を維持。
- 同ディレクトリに `logs/opendolphin-server-modernized-dev.log` が含まれておらず、スタックトレース未取得。ログは `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z"` などで再採取する必要がある。

**原因仮説**
1. **フィルタ層での認証例外**: 3 つの HTTP メソッドが同時に 500 になっていることから、リクエストが `SystemResource` の 405/200 分岐まで到達していない可能性が高い。`LogFilter#doFilter`（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:90-160`）ではヘッダー資格情報を `UserServiceBean#authenticate` へ委譲しており、ここで DB 接続や Principal 解決に失敗すると `jakarta.ejb.EJBException` で即座に 500 になる。直前に `PHASE2_PROGRESS.md` で報告された Vault 配備（RUN_ID=`20251119TlicenseVaultAutoZ2`）や Postgres ベースライン再構築（RUN_ID=`20251119TbaselineFixZ1`）の影響で Modernized DB 側の sysad 資格情報キャッシュが無効化され、`userService.authenticate` が例外を投げた可能性がある。
2. **WAR 配備失敗またはアプリ未起動**: `GET /dolphin/license` すら 405 ではなく 500 になっている点は、`SystemResource` Alias パッチ（RUN_ID=`20251119TlicenseAliasZ1`）を含む WAR が `opendolphin-server-modernized-dev` に正常デプロイされていないケースとも一致する。WildFly 起動ログに `WFLYSRV0059` や `Failed to start service jboss.deployment.unit.opendolphin-server.war` が残っていないか要確認。

**次アクション**
- `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z" > artifacts/parity-manual/license/20251119TlicenseMonitorZ2/logs/opendolphin-server-modernized-dev.log` を実施し、スタックトレースと 500 応答時刻のログを証跡に追加。
- LogFilter のヘッダ認証経路が例外を投げていないかを確認するため、ログから `Unauthorized user`／`Missing credentials headers` 以外の `ERROR` を抽出し、必要に応じて `ops/tests/api-smoke-test/headers/sysad-license.headers` の値（`userName`, `password`, `Authorization`）を Vault ローテーション後の実値と突き合わせる。
- WildFly のデプロイメント状態を `docker exec opendolphin-server-modernized-dev /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands=\"deployment-info --name=opendolphin-server.war\"` で確認し、失敗している場合は `server-modernized/target/opendolphin-server.war` を再度 `docker cp` → `.dodeploy` してから `ops/tests/api-smoke-test/run.sh --scenario license` を helper コンテナ経由で再実行する。
- 500 の再発有無を確認するまでは `docs/web-client/planning/phase2/DOC_STATUS.md` のライセンス行を Pending のまま維持し、復旧後に STABLE へ戻す。

**2025-11-13 追加調査メモ（RUN_ID=`20251119TlicenseMonitorZ2`）**
- Modernized 側の HTTP 証跡では 3 リクエストすべてが `Date: Thu, 13 Nov 2025 05:11:26/27 GMT` で 500 を返し、`time_total` も 0.01〜0.03s と即時失敗。Legacy は同 RUN_ID・同ヘッダーで POST=200/GET=405 を維持しているため、スタック固有の問題に限定される。
- `PHASE2_PROGRESS.md`（RUN_ID=`20251119TlicenseVaultAutoZ2`, `20251119TlicenseAliasZ1`）および `SECURITY_SECRET_HANDLING.md §2.4-2.8` に記録された Vault ローテーションと SystemResource alias 配備が同日に実施されており、`LogFilter` のヘッダー認証が Vault 更新直後の `userName/password` を読み込む際に `userCache` を無効化できていない、もしくは DB（`UserServiceBean#authenticate` → JPA）との接続が一時的に切れている疑いがある。
- コード確認結果: `LogFilter` は (1) `SecurityContext` で Principal を取得、(2) 取得できない場合はヘッダー（`userName`, `password`, `X-Facility-Id`）で `userService.authenticate` を呼び出し、(3) `UserServiceBean` が JPA 経由で `UserModel` を検索してパスワード照合する。`userService.authenticate` は Query 例外を握り潰さず、`EntityManager` 未初期化やトランザクション切断時に `jakarta.ejb.EJBException` が伝播して 500 になる。`resolveEffectiveUser` が `facilityId` を組み立てられない場合は 401 へフォールバックするが、今回の 500 とは異なるため **JPA 例外** または **WAR デプロイ失敗** が濃厚。
- 再現条件整理: (a) Vault ローテーション（`rotated_at=2025-11-13T05:08:33Z`）直後に Modernized サーバーを再起動せずホスト側から `ops/tests/api-smoke-test/run.sh --scenario license` を叩く、(b) `SystemResource` alias を含む WAR を WildFly へ再コピーする前にライセンスシナリオを実行、のいずれかで 500 が再現する可能性が高い。
- 暫定修正案: ① `LogFilter` 内で `userService.authenticate` の例外を捕捉し 503 を返す／`userCache.clear()` を呼び出す、② Vault ローテーション後は `docker restart opendolphin-server-modernized-dev` を必須手順にし `PHASE2_PROGRESS.md` へ追記、③ alias デプロイ確認を `jboss-cli.sh deployment-info` で自動チェックしてからライセンス監視シナリオを実行。
- 追加で必要な証跡: `docker logs opendolphin-server-modernized-dev --since "2025-11-13T05:05:00Z"` と `standalone/log/server.log` 該当時刻。現状はコンテナ操作禁止のため取得保留。許可後に `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/logs/` へ格納し、本節へ追記する。

**ログ採取結果（2025-11-13 14:12 JST）**
- `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/logs/modernized_server.log` に `docker logs ... --since "2025-11-13T05:05:00Z"` の全量を保存。`rg -n 'license-20251119TlicenseMonitorZ2'` で抽出したライン `312/437/562` は、それぞれ POST `/dolphin/license`, GET `/dolphin/license`, GET `/system/license` の WARN に一致し、直後のスタックトレースでは `SQLState: 42P01`（relation `d_users`・`d_audit_event` 不在）→ `org.hibernate.exception.SQLGrammarException` → Undertow `UT005023` が連鎖している。よって 500 の一次原因は WAR/LogFilter ではなく **PostgreSQL 側のテーブル欠落（baseline 未適用）** で確定。
- 同ログには `org.postgresql.util.PSQLException: ERROR: relation "d_users" does not exist`（例: 行 326, 451, 566）と `ERROR: relation "d_audit_event" does not exist`（例: 行 331, 456, 571）が連続して記録され、`AuditTrailService` が audit イベントを取得できず 500 を返していることも確認。
- WildFly CLI で `deployment-info --name=opendolphin-server.war` を取得した結果（`logs/deployment_info.txt`）は `STATUS=OK` だったため、アプリデプロイメントは成功状態。DB 再構築後に再テストするまで `LogFilter` 修正よりも **Postgres baseline 復旧** が優先度高。

**2025-11-13 17:38 JST 再検証（RUN_ID=`20251119TlicenseMonitorZ2Rerun`）**
- `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` に従って Modernized DB を `RUN_ID=20251119TbaselineFixZ1` で再構築（`pg_dump --schema-only` 取り込み → `local_synthetic_seed.sql` → Flyway `0-0227`）したのち、同ヘッダー・同 body でライセンスシナリオを再実行。
- 結果: `POST /dolphin/license` は Legacy/Modernized とも `HTTP 200 body=0`、`GET /dolphin/license`／`GET /system/license` は双方 `405 Method Not Allowed` に復帰。証跡は `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/post|get|get-system/rerun-20251119TlicenseMonitorZ2Rerun/` 以下に保存。
- `logs/modernized_server_rerun.log` では `TraceId=license-20251119TlicenseMonitorZ2Rerun` の POST/GET が INFO のみで完了し、`d_users`/`d_audit_event` へのアクセスも例外なく成功。`logs/deployment_info/20251119TlicenseMonitorZ2Rerun.txt` でも `STATUS=OK` を確認したため、500 は **DB ベースライン欠落が原因** と確定。
- この再検証によりライセンス API は本来のフロー（POST=200, GET=405）を維持できる状態に戻った。今後は Modernized DB を再初期化する際に `RUN_ID=20251119TbaselineFixZ1` の手順（スキーマ import → シード → Flyway）を必須ゲートとして管理する。

## 5. 保留事項と次ステップ
1. ~~`sysad-license.headers` を `ops/tests/api-smoke-test/headers/` に追加し、facility 固有ヘッダーや `X-Trace-Id` を含めたライセンス専用プリセットを整備する。~~  
   → 2025-11-13 に `ops/tests/api-smoke-test/headers/sysad-license.headers` を作成し、`RUN_ID` プレースホルダー入りで `LOCAL.FACILITY.0001:dolphin` 認証をテンプレ化した。
2. ~~9080/tcp のポートフォワード復旧、もしくは helper コンテナ経由の `send_parallel_request.sh --profile modernized-dev` 実行で Modernized 応答を採取する（`PHASE2_PROGRESS.md` 記載の VPNKit 再登録完了が前提）。~~  
   → helper (`legacy-vs-modern_default`) から Modernized/Legacy 両方の HTTP 404 応答と `docker logs` を `artifacts/parity-manual/license/20251118TlicenseCheckZ2/` へ証跡化。`/system` パスが実装されていないことが判明したため、今後は `/dolphin/license`（POST, TEXT 応答）で 200 を得るか `/system` エイリアスを追加する必要がある。
3. ~~ライセンスファイルの実体を `/opt/jboss/wildfly/license.properties` に配置後、POST/GET（後者は 404→401 の動作確認のみ）を改めて実行し、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の該当 RUN_ID に 200 応答を添付する。~~  
   → 2025-11-13（RUN_ID=`20251118TlicenseDeployZ1`）にて `license.properties` のホットデプロイ＋`chown jboss:jboss`＋symlink を行い、`POST /dolphin/license` が Legacy/Modernized いずれも `HTTP 200` `body=0` になることを確認。`GET /dolphin/license` は仕様通り 405、`GET /system/license` は 404 のままであるため、証跡として `artifacts/parity-manual/license/20251118TlicenseDeployZ1/{post,get,get-system}/` を追記し、チェックリスト/進捗表へ反映した。
4. `/system` ルートを利用する既存クライアント（Swing 側 `UserDelegater#checkLicense` など）のエイリアス追加、またはクライアント実装を `/dolphin/license` へ移行する判断がまだ残っている。API 在庫 (`REST_API_INVENTORY.md`) と SWING parity checklist の記述を同期し、必要であれば `ServerInfoResource` か URL Rewrite で `/system/license → /dolphin/license` を吸収する方針を整理する。

## 6. CLI テンプレート（POST `/dolphin/license`）
- `ops/tests/api-smoke-test/configs/system_license_post.config`: `id=license_post`、`method=POST`、`path=/dolphin/license` を定義し、`header_file=ops/tests/api-smoke-test/headers/sysad-license.headers`・`body_file=tmp/license/system_license_post_body.txt` を defaults で参照できるようにした。`send_parallel_request.sh --profile modernized-dev --config ... --run-id <RUN_ID>` で再利用可能。
- `tmp/license/system_license_post_body.txt`: 登録対象 UID を 1 行で保持するテキスト。RUN_ID=`20251119TlicenseVaultZ1` では Vault から取得した `license.uid_seed`（UUID）に RUN_ID をサフィックスした `f7ee7a94-...-20251119TlicenseVaultZ1` を投入し、POST=200 を確認後 24 時間以内に削除した。

## 7. 監視運用計画
### 7.1 目的とカバレッジ
- 夜間帯に `ops/tests/api-smoke-test/run.sh --scenario license` を自動実行し、`POST /dolphin/license` が `HTTP 200 body=0`、`GET /dolphin|/system/license` が `405 Method Not Allowed` を返し続けることを日次で保証する。
- ライセンス POST が `SYSTEM_LICENSE_CHECK` を `d_audit_event` に必ず 1 件以上残し、Modernized / Legacy 両スタックで `payload.status=success` になっているかを監視ゲートにする。
- Vault から取得した `license.properties` / `system_license_post_body.txt` の展開、および `artifacts/parity-manual/license/<RUN_ID>/` への証跡保存を標準化し、失敗時は Slack / PagerDuty へ即通知する。

### 7.2 RUN_ID 命名規則と必須環境変数
| 項目 | 内容 |
| --- | --- |
| `RUN_ID` | `$(date -u +%Y%m%dT%H%M%SZ)licenseNightlyZ<SEQ>`（例: `20251120T140000ZlicenseNightlyZ1`）。夜間バッチ 1 回につき連番 `<SEQ>` を増分する。 |
| `TRACE_RUN_ID` | `${RUN_ID}` をエクスポートし、`sysad-license.headers` の `X-Trace-Id: {{RUN_ID}}` に展開させる（prefix 二重化を防止）。 |
| `FETCH_LICENSE_RUN_ID` | `ops/tools/fetch_license_secrets.sh` の `--run-id` 省略時のデフォルト。`RUN_ID` と同一値を渡し、生成ファイル名と POST body を同期させる。 |
| `VAULT_ADDR` / `VAULT_TOKEN` | Vault CLI が Dev/Stage Vault の `kv/modernized-server/license/dev` を取得するために必須。ジョブ実行ユーザーの Credentials Store から注入する。 |
| `SLACK_LICENSE_ALERT_WEBHOOK` | 失敗時に通知を送る Slack Incoming Webhook URL。 |
| `PAGERDUTY_ROUTING_KEY` | 連続失敗時に Escalation を発火させる Events API v2 Routing Key。 |
| `SEND_PARALLEL_REQUEST_PROFILE_FILE`（任意） | `--profile modernized-dev` が参照する env テンプレートをジョブ側で差し替える場合に利用。 |

### 7.3 夜間ジョブ シーケンス
1. **Vault シークレット同期**: `ops/tools/fetch_license_secrets.sh --run-id "$RUN_ID" --artifact-dir artifacts/parity-manual/license/$RUN_ID/secrets --log-json` を実行し、`license.properties` と `system_license_post_body.txt` を `/opt/jboss/wildfly`・`/etc/opendolphin/license` へ再配備する。`--artifact-dir` で生成物を `artifacts/parity-manual/license/$RUN_ID/secrets/` にコピーしておく。
2. **API スモーク実行**: `TRACE_RUN_ID` をエクスポートしたうえで `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id "$RUN_ID"` を実行。出力は標準で `artifacts/parity-manual/smoke/$RUN_ID/` に溜まるため、完了後に `rsync -a artifacts/parity-manual/smoke/$RUN_ID/ artifacts/parity-manual/license/$RUN_ID/http/` でライセンス専用証跡パスへコピーする。
3. **ログ・メタ情報集約**: `docker logs opendolphin-server{,-modernized-dev} --since "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" > artifacts/parity-manual/license/$RUN_ID/logs/{legacy,modernized}_server.log` を取得し、`metadata.json`・`license_fetch_meta.json` も同ディレクトリへ集約する。
4. **d_audit_event エクスポート**: `docker exec opendolphin-postgres psql -At -c "COPY (SELECT event_time, action, trace_id, payload->>'status' AS status, payload->>'uid' AS uid FROM d_audit_event WHERE action='SYSTEM_LICENSE_CHECK' AND trace_id LIKE 'license-$RUN_ID%') TO STDOUT WITH CSV HEADER" > artifacts/parity-manual/license/$RUN_ID/logs/d_audit_event_legacy_$RUN_ID.csv` を実行。Modernized も `opendolphin-postgres-modernized` で同じコマンドを流し、件数サマリを `logs/d_audit_event_summary.txt` へ追記する。
5. **ゲート判定**: (a) スクリプト終了コード、(b) HTTP 応答差異（200/405 以外）、(c) `d_audit_event` 件数 < 1、(d) `payload.status!='success'` のいずれかが発生したら失敗扱いにし、通知フローを起動する。

### 7.4 疑似 CLI スニペット（cron/Jenkins 共通）
```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)licenseNightlyZ${BUILD_NUMBER:-1}"
export TRACE_RUN_ID="${RUN_ID}"
export FETCH_LICENSE_RUN_ID="$RUN_ID"

ops/tools/fetch_license_secrets.sh \
  --run-id "$RUN_ID" \
  --artifact-dir "artifacts/parity-manual/license/${RUN_ID}/secrets" \
  --log-json

ops/tests/api-smoke-test/run.sh \
  --scenario license \
  --profile modernized-dev \
  --run-id "$RUN_ID"

rsync -a "artifacts/parity-manual/smoke/${RUN_ID}/" "artifacts/parity-manual/license/${RUN_ID}/http/"

for db in opendolphin-postgres opendolphin-postgres-modernized; do
  docker exec "$db" psql -At -c "COPY (SELECT event_time, action, trace_id, payload->>'status' FROM d_audit_event WHERE action='SYSTEM_LICENSE_CHECK' AND trace_id LIKE 'license-${RUN_ID}%') TO STDOUT WITH CSV HEADER" \
    > "artifacts/parity-manual/license/${RUN_ID}/logs/d_audit_event_${db}_${RUN_ID}.csv"
done
```

### 7.5 `d_audit_event` 件数ゲート
- 各 CSV を `wc -l` し（ヘッダーを差し引き）`>= 1` を確認する。`payload->>'status'` が `success` 以外の場合も異常扱いにして通知へ回す。
- テーブル件数チェックを自動化する場合は `docker exec <db> psql -At -c "SELECT COUNT(*) FROM d_audit_event WHERE action='SYSTEM_LICENSE_CHECK' AND trace_id LIKE 'license-$RUN_ID%'"` の結果を `artifacts/parity-manual/license/$RUN_ID/logs/d_audit_event_summary.txt` に追記し、比較用に前回値を保存しておく。
- Modernized 側で 0 件になった場合は Postgres baseline 崩壊または `SystemResource` デプロイ失敗の可能性が高いため、即座に `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` の手順を参照して復旧する。Legacy 側のみ 0 件であればヘッダー認証 or `license.properties` 配置に問題があるため `fetch_license_secrets.sh` の結果から `slot` 情報を突き合わせる。

### 7.6 失敗時通知フロー案
- **一次通知（Slack）**: 上記ゲートで失敗したら `SLACK_LICENSE_ALERT_WEBHOOK` に `{"text":"[license-nightly] RUN_ID=${RUN_ID} failed (stage=${STAGE}) → artifacts/parity-manual/license/${RUN_ID}"}` を送信。ステージは `VAULT_FETCH` / `API_SMOKE` / `AUDIT_CHECK` のいずれかをセットする。
- **二次通知（PagerDuty）**: 同一カレンダー日で 2 回連続失敗または Modernized 側の `d_audit_event` が 0 件のときは、Events API v2 で `routing_key=$PAGERDUTY_ROUTING_KEY`、`event_action=trigger` のペイロードを送信し、当番へ電話発報する。
- **成果物リンク**: 通知本文には `artifacts/parity-manual/license/${RUN_ID}/logs/`、`.../http/modernized/license_post/response.json`、`.../secrets/license_fetch_meta.json` への相対パスを含め、調査に要する最小限の手がかりを即時共有する。

### 7.7 RUN_ID=`20251120TlicenseNightlyZ1` ドライラン記録（2025-11-13 JST）
- **前提整備**
  - `PATH=$PWD/tmp/fakebin:$PATH VAULT_ADDR=http://dummy-vault.local VAULT_TOKEN=dummy` で `ops/tools/fetch_license_secrets.sh --run-id 20251120TlicenseNightlyZ1 --artifact-dir artifacts/parity-manual/license/20251120TlicenseNightlyZ1/secrets --log-json` を実行し、Legacy/Modernized 両 WildFly へ `license.properties` と `system_license_post_body.txt` を配備。
  - Legacy / Modernized Postgres へ `ops/db/local-baseline/local_synthetic_seed.sql` を投入し、`LOCAL.FACILITY.0001:dolphin` 認証を復旧。さらに両 DB で `CREATE SEQUENCE IF NOT EXISTS d_audit_event_seq OWNED BY d_audit_event.id; SELECT setval('d_audit_event_seq', COALESCE(MAX(id),0)+1, true);` を実行して欠落していたシーケンスを補完。
- **API 実行**
  - helper コンテナ (`opendolphin_webclient-helper-1`) から `TRACE_RUN_ID="${RUN_ID}" ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251120TlicenseNightlyZ1` を実行。成果物は `artifacts/parity-manual/license/20251120TlicenseNightlyZ1/http/` に保存。
  - HTTP 結果: Legacy/Modernized とも `POST /dolphin/license=200 (body=0)`, `GET /dolphin/license=405`, `GET /system/license={405 (Legacy), 404 (Modernized)}`。ヘッダー上の `X-Trace-Id` はテンプレ展開により `license-license-20251120TlicenseNightlyZ1` となった（`TRACE_RUN_ID` とヘッダー側の `license-` が二重化）。
- **d_audit_event 判定**
  - `docker exec <db> psql -c "COPY (SELECT event_time, action, trace_id, payload FROM d_audit_event WHERE action='SYSTEM_LICENSE_CHECK' AND trace_id LIKE 'license-license-20251120TlicenseNightlyZ1%') TO STDOUT"` で CSV を採取したが、Legacy/Modernized とも該当行 0 件。
  - Modernized DB には `SYSTEM_LICENSE_CHECK` 行が 3 件増加したものの `trace_id=''`、`payload` が UID 数値のみで RUN_ID と突合できず、ゲート条件（`trace_id` と `payload.status=success`）を満たせない。Legacy 側は `REST_UNAUTHORIZED_GUARD` の 401 ログのみが記録され、`SYSTEM_LICENSE_CHECK` 自体が未発火。
- **通知 / フォローアップ**
  - `logs/d_audit_event_summary.txt` に `legacy_count=0 / modern_count=0` を記録し、ステージ `AUDIT_CHECK` で失敗扱い。Slack / PagerDuty への試験送信はネットワーク制限のため実 HTTP を実行できず、`notifications/*.log` にペイロードと `curl` コマンドを Dry-run 形式で保存。
  - 課題: (1) Modernized `SystemResource` が `trace_id` / `payload.status` を永続化できていない、(2) Legacy 実装が `SYSTEM_LICENSE_CHECK` を出力していない、(3) `TRACE_RUN_ID` とヘッダーテンプレの prefix が二重化している。→ RUN_ID=`20251121TlicenseNightlyZ1` で (1)/(3) を解消済み。Legacy については引き続き監視対象外（Modernized のみゲート判定）とし、必要に応じて別タスクで対応する。
  - 証跡: `artifacts/parity-manual/license/20251120TlicenseNightlyZ1/{README.md,secrets/,http/,logs/,notifications/}`。

### 7.8 RUN_ID=`20251121TlicenseNightlyZ1` 本番想定ライン（2025-11-13 JST）
- **改善点**
  - Modernized `SystemResource`／`AuditTrailService` を修正し、`d_audit_event.trace_id` と `payload.status` が必ず書き込まれるようになった（WAR hot deploy 済み）。
  - `TRACE_RUN_ID` と `X-Trace-Id` を `RUN_ID` そのものに統一し、二重 prefix を解消。
  - Legacy スタックは引き続き `SYSTEM_LICENSE_CHECK` を出力しないため、監視ゲートは **Modernized 側のみ** を合否判定に使用する（Legacy 側は参考値として CSV を残す）。
- **手順**
  1. `PATH=$PWD/tmp/local-bin:$PATH VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root ops/tools/fetch_license_secrets.sh --run-id 20251121TlicenseNightlyZ1 --artifact-dir artifacts/parity-manual/license/20251121TlicenseNightlyZ1/secrets --log-json`。
  2. helper コンテナから `TRACE_RUN_ID=20251121TlicenseNightlyZ1 ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251121TlicenseNightlyZ1`。
  3. `rsync -a artifacts/parity-manual/smoke/$RUN_ID/ artifacts/parity-manual/license/$RUN_ID/http/`、`docker logs --since 10m` を `logs/{legacy,modernized}_server.log` へ保存。
  4. `payload::json->>'status'` / `payload::json->>'uid'` を抽出する CSV (`logs/d_audit_event_{legacy,modern}_$RUN_ID.csv`) と `d_audit_event_summary.txt` を更新。
  5. Slack / PagerDuty は成功時未送信のため `notifications/{slack.log,pagerduty.log}` に `status=not_triggered` を記録。
- **結果**
  - HTTP 応答: `POST /dolphin/license`=200 (body=0), `GET /dolphin/license`=405, `GET /system/license`=405(Legacy)/404(Modernized) を継続。
  - `d_audit_event`（Modernized）に `trace_id=20251121TlicenseNightlyZ1`、`payload.status=success` の行が 1 件作成され、ゲート条件を満たした。Legacy 側は 0 件のまま。
  - 成果物: `artifacts/parity-manual/license/20251121TlicenseNightlyZ1/{README.md,secrets/,http/,logs/,notifications/}`。

### 7.9 RUN_ID=`20251122TlicenseNightlyZ1` ライセンス監視ジョブ初回稼働（2025-11-13 JST）
- **ジョブ実装**: Vault→API→監査ゲートを 1 本化した `ops/tools/license_monitor_job.sh` を追加。`fetch_license_secrets.sh` 実行、`ops/tests/api-smoke-test/run.sh --scenario license --profile compose --targets modern` により **Modernized のみ** を HTTP チェックし、`docker logs` 採取後に `docker exec opendolphin-postgres{-modernized}` で `d_audit_event` を TSV エクスポートする。ゲート判定は `modern_count>=1` かつ `modern_non_success=0` のみ合格とし、Legacy 側は参考用途（`legacy_count`）に留めた。通知は Slack=常時ログ記録／PagerDuty=同日 2 連続失敗または `modern_count=0` 時のみ `events.v2` を送信する。
- **HTTP 結果**: `BASE_URL_MODERN=http://localhost:9080/openDolphin/resources` で `POST /dolphin/license=200 (body=0)`、`GET /dolphin/license=405`、`GET /system/license=405` を取得。Legacy ルートはスキップしたため `artifacts/parity-manual/license/20251122TlicenseNightlyZ1/http/` には `modernized/` のみ保存している。
- **監査ログ**: Modernized Postgres で `SYSTEM_LICENSE_CHECK` が 4 件 (`trace_id=20251122TlicenseNightlyZ1`, `payload.status=success`, `uid=UIDSEEDMOCK-20251122TlicenseNightlyZ1`) 記録され、Legacy 側は 0 件。`logs/d_audit_event_modern.tsv` は改行除去済み JSON を TSV 化しており、`logs/d_audit_event_summary.txt` に `modern_count=4 / modern_non_success=0 / legacy_count=0` を残した。
- **通知ログ**: Slack/PagerDuty とも `status=not_triggered` を `notifications/{slack.log,pagerduty.log}` に記録。失敗時のステージ（`VAULT_FETCH`/`API_SMOKE`/`AUDIT_CHECK`）と理由は `latest_status.json` に履歴化しており、ジョブ連続失敗判定はこのファイルを参照する設計。
- **成果物**: `artifacts/parity-manual/license/20251122TlicenseNightlyZ1/{secrets/,http/,logs/,notifications/,README.md}`。

### 7.10 `d_audit_event` Legacy 残骸のクレンジング
- `ops/db/maintenance/license_audit_cleanup.sql` を新設し、Legacy/Modernized 両 Postgres で `payload` が数値のみの `SYSTEM_LICENSE_CHECK` を JSON 形式へ変換。`trace_id` が空の行には `license-backfill-<timestamp>-<id>` を付与し、`pgcrypto` を用いて `payload_hash` / `event_hash` / `previous_hash` を全件再計算してチェーン整合性を維持する。
- 実行ログは `artifacts/parity-manual/license/maintenance/20251113TlicenseCleanupZ1/{legacy.log,modernized.log}` に保存。Modernized 側で 5 件が変換され（`status=unknown`, `actionType=backfilled_numeric_payload` を付与）、Legacy 側は `SYSTEM_LICENSE_CHECK` 自体が無いため対象 0 件だった。クレンジング後、`ops/tools/license_monitor_job.sh` の TSV エクスポートで JSON キャストエラーが発生しないことを確認。
