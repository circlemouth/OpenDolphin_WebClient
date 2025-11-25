# Observability Run (2025-11-08T07:46:57Z, success)

## 背景
- `scripts/start_legacy_modernized.sh start --build` で legacy (WildFly10) / modernized (WildFly33) を同時起動し、`jboss-deployment-structure.xml` で `org.wildfly.micrometer.deployment` モジュールを除外することで Micrometer CDI 二重登録エラーを解消した。
- `ops/tests/api-smoke-test/headers/sysad-actuator.headers`（SYSAD ユーザー）を `PARITY_HEADER_FILE` として使用し、DB 未シード環境でも `/dolphin` が 200 を返すことを確認。
- 既存の 404 / 503 証跡 (`artifacts/parity-manual/observability/20251108T063106Z/`) と比較した差分: legacy 側 `curl: (7)` → 200、modernized 側 `/dolphin` 404 → 200、`/actuator/health` 503 → 200。

## 実施手順
1. `scripts/start_legacy_modernized.sh start --build`
2. `PARITY_OUTPUT_DIR=artifacts/parity-manual/observability/20251108T074657Z-success \\
   PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-actuator.headers \\
   ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin observability_loop`
   - 5 ループすべてで legacy/modernized の `status_code=200`（`observability_loop_loop###/*/meta.json` を参照）。
3. `curl -i http://localhost:9080/actuator/{health,metrics,prometheus}` （`actuator_*.log`）。
4. `curl -i http://localhost:9995/metrics/application`（管理ポート、`metrics_application.log`）。
5. `scripts/start_legacy_modernized.sh status` で `health: healthy` を確認後、必要なら `scripts/start_legacy_modernized.sh down` で停止。

## 収集物
- `observability_loop_loop001-005/` : legacy / modernized のリクエスト・レスポンス (`request.txt`, `response.txt`, `meta.json`).
- `actuator_health.log`, `actuator_metrics.log`, `actuator_prometheus.log`, `metrics_application.log`: 200 応答とレイテンシ差分の確認用。
- 比較対象: `../20251108T063106Z/`（404/503 ケース）。`diff -ru ../20251108T063106Z/observability_loop_loop00{1..5}/modern/meta.json observability_loop_loop00{1..5}/modern/meta.json` 等で差分可視化。
