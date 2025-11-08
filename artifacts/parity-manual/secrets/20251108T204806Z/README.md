# Secrets propagation drill (2025-11-08T20:48:06Z)

| Case | Env profile | `start_wildfly_headless.sh` exit | Container outcome | `/actuator/health` | `/actuator/prometheus` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline | `tmp/secrets-repro/base.env` | 0 | `opendolphin-server-modernized-dev` healthy, DB healthy (see `baseline/docker_ps.log`) | 200 OK (`baseline/curl_actuator_health.log`) | 200 OK (`baseline/curl_actuator_prometheus.log`) | Serves as control sample before removing secrets. |
| Missing DB secret (`MODERNIZED_POSTGRES_PASSWORD=__MISSING__`) | `tmp/secrets-repro/missing_db_secret.env` | 0 | WildFly starts but JDBC auth fails repeatedly (`missing_db_secret/server_logs.log`); container stays healthy but logs emit `PSQLException` | 200 OK | 200 OK | Compose hides failure at health layer, but Micrometer should catch `opendolphin_db_active_connections == 0` and log-based alerts fire. |
| Missing Factor2 secret (FACTOR2 empty) | `tmp/secrets-repro/missing_factor2.env` | 0 | WildFly 33 boots; no `IllegalStateException` emitted (`missing_factor2/server_logs.log`). Behavior indicates secrets fallback still active. | n/a | n/a | Needs follow-up: `${FACTOR2_AES_KEY_B64:-default}` in compose prevents blank injection. Tracker opened in ops plan. |
| Missing SYSAD headers | `tmp/secrets-repro/missing_sysad.env` | 0 | Container healthy (health check ignores blank header) | 200 OK | 200 OK | Compose defaults also mask blank SYSAD values; alert must rely on `/actuator` probe with correct headers rather than compose health. |

Each subdirectory keeps `start.log`, compose logs, Docker status snapshots, and HTTP transcripts required by the checklist item `Secrets / 環境変数依存の不足時挙動`.
