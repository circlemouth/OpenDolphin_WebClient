# Env loading snapshot (2026-06-16)
- 調査対象: `.env`, `.env.sample`, `web-client/.env.sample`, `docker-compose*.yml`, `ops/legacy-server/docker/configure-wildfly.cli`, `ops/modernized-server/docker/configure-wildfly.cli`。
- Compose 側の読み込み順は `.env` → `docker-compose.yml` → `docker-compose.modernized.dev.yml` のサービス `environment:` で展開し、WildFly 内部では `configure-wildfly.cli` が `${env.*}` を評価している。
- `FACTOR2_AES_KEY_B64` を空にした状態で `scripts/start_legacy_modernized.sh start --build` を実行したところ、Docker BuildKit が Maven 依存関係取得中にタイムアウト。WildFly 起動には未到達（詳細ログ: `artifacts/parity-manual/secrets/wildfly-start.log`）。
- `SecondFactorSecurityConfig` (server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java) では未設定時に `IllegalStateException` を投げる実装を確認。期待されるログ: `FACTOR2_AES_KEY_B64 must be provided via Secrets Manager...`。
