# API response parity checker

This note explains how to compare responses between the legacy server and the modernized server using the script in `scripts/api_parity_response_check.py`.

## Overview
- The checker sends the same HTTP request to both servers and compares their responses.
- Targets (HTTP method, path, payload, comparison mode) are defined in a JSON file.
- Comparison results are printed to stdout; the process exits with code `0` when all targets pass and `1` otherwise.

## Prerequisites
1. Python 3.9+ available on the workstation.
2. Network access from the workstation to both the legacy and modernized servers.
3. A configuration file (JSON) describing the endpoints to validate. Start from `scripts/api_parity_targets.sample.json`.

## Preparing a target list
1. Copy the sample file:
   ```
   cp scripts/api_parity_targets.sample.json configs/api_targets.json
   ```
2. Edit the copy to match the endpoints you want to exercise.
   - `method`: HTTP method (GET/POST/PUT/DELETE/…).
   - `path`: relative path (e.g. `/user/{userId}`).
   - `query`: optional query parameters. Use plain values; the script handles encoding.
   - `body`: optional request payload. When the value is an object the script sends JSON.
   - `compare`: one of `json`, `text`, `status`. Defaults to `json`.
   - `expected_status`: optional expected HTTP status code.
   - `ignore_keys`: list of JSON keys to drop from the top level before diffing (useful for timestamps).
   - `legacy_headers` / `modern_headers`: per-server headers (e.g. authentication tokens).

## Configuring destination IP addresses
You can adjust the destination addresses without modifying the script:
- Preferred: set environment variables before running the checker.
  ```
  set LEGACY_API_BASE=http://192.0.2.10:8080/opendolphin
  set MODERN_API_BASE=http://192.0.2.20:8080/opendolphin
  ```
  (Use `export` when running in bash.)
- Alternatively provide command line flags:
  ```
  python scripts/api_parity_response_check.py --legacy-base http://192.0.2.10:8080/opendolphin --modern-base http://192.0.2.20:8080/opendolphin --config configs/api_targets.json
  ```
Changing only the IP or port requires updating these environment variables or flag values; no source file edits are needed.

## Running the checker
```
python scripts/api_parity_response_check.py --config configs/api_targets.json
```
Optional flags:
- `--timeout 20` (seconds) to tweak the request timeout.
- `--fail-fast` to stop on the first mismatch.

## Reading the output
- `[PASS]` entries indicate matching responses (after applying ignore rules).
- `[FAIL]` entries include the reason (status mismatch, body mismatch, decode error, etc.).
- When failures occur, the final summary reports the number of failing targets; the process returns exit code `1`, making it usable inside CI pipelines.

Document history:
- 2026-05-27: Initial version (Codex).***

## 2025-11-09 追加メモ（手動比較）
- 目的: `/dolphin` のようにテキストレスポンスのみを返す API で JSON デコードエラーにならないよう `compare: "text"` を設定する。
- 手順例:
  ```bash
  mkdir -p tmp/parity-touch/20251109T060930Z
  cat <<'JSON' > tmp/parity-touch/20251109T060930Z/api_targets.json
  {
    "defaults": {
      "headers": {
        "userName": "1.3.6.1.4.1.9414.72.103:doctor1",
        "password": "doctor2025",
        "clientUUID": "parity-touch-client",
        "facilityId": "1.3.6.1.4.1.9414.72.103"
      },
      "expected_status": 200
    },
    "targets": [
      { "id": "dolphin_ping", "path": "/dolphin", "method": "GET", "compare": "text" },
      { "id": "serverinfo_jamri", "path": "/serverinfo/jamri", "method": "GET", "compare": "text" }
    ]
  }
  JSON

  python3 scripts/api_parity_response_check.py \
    --config tmp/parity-touch/20251109T060930Z/api_targets.json \
    --legacy-base http://localhost:8080/openDolphin/resources \
    --modern-base http://localhost:9080/openDolphin/resources \
    | tee tmp/parity-touch/20251109T060930Z/diff.txt
  ```
- 出力: 2 ターゲットとも `[PASS]`。`tmp/parity-touch/20251109T060930Z/diff.txt` を `artifacts/parity-manual/TRACEID_JMS/` へコピーすれば再利用可能。
- 注意: Compose が停止していると `exit code 7 (connection refused)` になるため、Docker 操作者と実行時間を調整する。
