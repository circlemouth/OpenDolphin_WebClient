# 20251119TlicenseScenarioZ1

- helper コンテナ（`docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy`）から `ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev --run-id 20251119TlicenseScenarioZ1` を実行。
- HTTP 成果物は `post/license_post/`, `get/license_get/`, `get-system/license_get_system/` 配下に Legacy/Modern それぞれ `headers.txt` / `meta.json` / `response.json` で保存。
- 参照基準 `artifacts/parity-manual/license/20251118TlicenseDeployZ1` と `response.json` を比較し、全ケースで完全一致（POST=200, GET=405, GET-system=404）。
- 差分は `X-Trace-Id`（RUN_ID 置換）、`Date` ヘッダー、`meta.json` の `time_total` のみで、機能差異は無し。
