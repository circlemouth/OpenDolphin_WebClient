# Elytron / LogFilter 移行メモ（2026-06-16 更新）

## 1. 背景
- `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java` では Elytron (Jakarta Security) による `SecurityContext` を優先し、Principal が取得できない場合のみ `userName` / `password` ヘッダでのフォールバック認証を行っている。
- 本番リリースに向けてヘッダベース認証を段階的に廃止し、Elytron + 2FA (TOTP/FIDO2) のみでアクセス可能な構成へ切り替える必要がある。
- 2026-06-16 の対応で以下が追加済み。
  - `LOGFILTER_HEADER_AUTH_ENABLED` 環境変数（Compose から WildFly コンテナへ渡される）。
  - `ops/tools/logfilter_toggle.sh` による `.env` 自動編集。
  - `LogFilter` 内でのトグル判定（env / system property / filter init-param を優先順位付きで参照）。

## 2. トグル操作手順
| フェーズ | 操作 | コマンド例 | 期待結果 |
| --- | --- | --- | --- |
| 現状把握 | 現在値を確認 | `ops/tools/logfilter_toggle.sh status` | `LOGFILTER_HEADER_AUTH_ENABLED is not set (effective default: true)` のように表示。 |
| 有効化 | フォールバックを維持 | `ops/tools/logfilter_toggle.sh enable` | `.env` に `LOGFILTER_HEADER_AUTH_ENABLED=true` を追記。`docker compose up -d` 後も従来通りヘッダ認証可。 |
| 無効化 (Staging) | Elytron のみ許可 | `ops/tools/logfilter_toggle.sh disable` | `.env` に `...=false` を記録。再起動後、ヘッダだけでのアクセスは 403 になり、`LogFilter` の WARNING ログに `Header-based authentication is disabled` が出力される。 |

補足:
- `docker-compose.yml` / `docker-compose.modernized.dev.yml` とも `LOGFILTER_HEADER_AUTH_ENABLED` を `environment:` に追加済み。`.env` を更新すれば `scripts/start_legacy_modernized.sh` からも引き渡される。
- `LogFilter` は `filterConfig` の `header-auth-enabled`、JVM system property `opendolphin.logfilter.header-auth.enabled` も解釈するため、WildFly CLI 等での暫定制御も可能。

## 3. リリース判定基準（ドラフト）
1. **Phase A – 並行稼働**  
   - `LOGFILTER_HEADER_AUTH_ENABLED=true` のまま Elytron 認証を有効化し、`ops/tools/send_parallel_request.sh` に `--loop` オプションを付けて `/serverinfo/*` / `/user/*` の疎通を継続監視。  
   - 成果物: `artifacts/parity-manual/observability/*.log` にヘルスチェック結果を保存（現状は WildFly 未起動のため `Connection refused` を記録）。
2. **Phase B – Staging でのフォールバック無効化**  
   - `ops/tools/logfilter_toggle.sh disable` を適用し、`artifacts/parity-manual/factor2_*` ケースで 403 応答になることを確認。  
   - `d_audit_event` に `FIDO2_ASSERT_COMPLETE_FAILED` が出力されるかを `artifacts/parity-manual/audit/` へ保存（現環境では DB 未整備のため設計メモのみ）。
3. **Phase C – 本番デフォルト切り替え**  
   - `.env` および Secrets 管理ストアの既定値を `false` に変更。  
   - `FACTOR2_RECOVERY_RUNBOOK.md` に従い Secrets 欠落時の復旧手順を整備し、Go/No-Go 判定でヘッダフォールバックを再有効化しない方針を合意。

## 4. 未解決課題
- `scripts/start_wildfly_headless.sh` がリポジトリに存在せず、WildFly 単体起動での再現ができない。`scripts/start_legacy_modernized.sh start --build` を実行すると Docker BuildKit が Maven 依存取得中にタイムアウトし (`artifacts/parity-manual/secrets/wildfly-start.log`)、到達不能。ヘッドレス起動スクリプトを追加するか、Docker が利用できるホストで証跡を採取する必要がある。
- `ops/tests/security/factor2/*.http` は未整備。既存の `ops/tests/api-smoke-test` を流用し、`--loop` 実行時の 403 応答／監査ログをテンプレート化する。
- 実運用で Elytron のみになった場合のリリース判定（例: サポート依頼時の一時フォールバック許可）フローを運用チームと詰める必要がある。

## 5. 参考資料
- `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`（2026-06-16 時点で env トグルに対応）
- `docs/server-modernization/security/ELYTRON_INTEGRATION_PLAN.md`（基本方針）
- `artifacts/parity-manual/secrets/env-loading-notes.md`（.env / configure-wildfly 読み込み順メモ）

## 6. 実測ログ（2026-06-18）
- `scripts/start_wildfly_headless.sh` でモダナイズ版のみを起動し、`.env` の `LOGFILTER_HEADER_AUTH_ENABLED` を `ops/tools/logfilter_toggle.sh --env-file .env (disable|enable)` で切り替えた。
- `BASE_URL_{LEGACY,MODERN}=http://localhost:9080/openDolphin/resources`、`PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/legacy-default.headers` を指定して `ops/tools/send_parallel_request.sh GET /user/doctor1 logfilter_disabled` を実行。結果は `artifacts/parity-manual/logfilter/logfilter_disabled/modern/meta.json` および `.../logfilter_enabled/modern/meta.json` に保存している。
- いずれの状態でも Modernized 側は `500 Session layer failure in ... UserServiceBean#getUser`（DB ベースライン欠落により `doctor1` が存在しない）となり、期待していた 401/200 切替は検証できなかった。再度 `d_user` を復元したうえで `/user/doctor1` か `/serverinfo/version` を用いた再計測が必要。
- `open.dolphin.rest.LogFilter` の INFO ログ（`docker logs opendolphin-server-modernized-dev | rg "LogFilter header fallback"`）には `header fallback is disabled/enabled` が出力されるため、トグル反映自体は確認済み。
- `/dolphin` のような認証不要 API では両状態とも 200 となる（`artifacts/parity-manual/logfilter/logfilter_disabled_dolphin/*`）。401/403 カウンタの Micrometer 指標（`opendolphin_auth_reject_total`）を確認するには、Elytron 認証用の Basic 認証または DB 復元が前提。
