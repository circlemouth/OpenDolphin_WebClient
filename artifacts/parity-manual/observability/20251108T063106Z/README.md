# Observability Run (2025-11-08T06:31:06Z)

## Reproduction Steps
1. `scripts/start_wildfly_headless.sh start --build`
2. `PARITY_OUTPUT_DIR=artifacts/parity-manual/observability/20251108T063106Z PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/legacy-default.headers ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin observability_loop`
3. `curl http://localhost:9080/actuator/{health,metrics,prometheus}` and `curl http://localhost:9080/metrics/application` (see `actuator_*.log`, `metrics_application.log`).
4. `docker compose --project-name modernized-headless --file docker-compose.modernized.dev.yml logs server-modernized-dev > wildfly_start.log`
5. `scripts/start_wildfly_headless.sh down`

## Notes
- Legacy (`http://localhost:8080/openDolphin/resources`) is not available in the headless compose profile, so `curl` against that base URL fails with `curl: (7) Failed to connect ...` and is recorded in each `observability_loop_loop###/legacy/meta.json`.
- Modernized server responds on `http://localhost:9080/openDolphin/resources`; `/dolphin` currently returns `HTTP 404` because the DB baseline for doctor1 is not loaded in this environment, but the responses still produce Micrometer metrics for the failure path.
- Reverse proxy wiring exposes WildFly management metrics on `/actuator/*`; `/metrics/application` remains available as the canonical Prometheus scrape path via the same port for direct health checks.
