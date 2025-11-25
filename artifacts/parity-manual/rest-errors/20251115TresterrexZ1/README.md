# 2025-11-12 REST 4xx/5xx 例外再取得 (RUN_ID=20251115TresterrexZ1)

## 実行条件
- `docker ps` 上で `opendolphin-server` / `opendolphin-server-modernized-dev` を稼働させたまま、WAR のホットデプロイのみ実施（`scripts/start_legacy_modernized.sh --build` は未使用）。
- `PARITY_OUTPUT_DIR=artifacts/parity-manual/rest-errors/20251115TresterrexZ1` を指定し、`tmp/rest-error-headers/trace_http_*_20251115TresterrexZ1.headers` からヘッダーを読み込んで `ops/tools/send_parallel_request.sh --profile compose` を実行。
- `tmp/rest-error-headers/trace_http_401_*.headers` は password 行を削除済み、400/500 用は `trace_http_*.headers` テンプレートの `{{RUN_ID}}` を置換して利用した。

## ケース別結果
| Case | Legacy | Modernized | JSON/Notes |
| --- | --- | --- | --- |
| `rest_error_bad_request` (`GET /dolphin/activity/2025,04`) | 400 (`error=invalid_activity_param`) | 400 (`error=invalid_activity_param`) | `requestParam` と `reason` が両系統で揃い、`traceId=trace-http-400-20251115TresterrexZ1` をエコーバック。 |
| `rest_error_unauthorized` (`GET /touch/user/...` password 無) | 401 (`error=unauthorized`, `reason=authentication_failed`) | 401 同左 | `WWW-Authenticate` ヘッダーと `principal` 情報を JSON に出力。LogFilter WARN も traceId 付きで記録。 |
| `rest_error_internal` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 (`error=karte_lookup_failed`, `context=pid_lookup`) | 500 同左 | `KarteServiceBean` が null を返す経路を toConverter で捕捉し、HTML 500 から JSON 500 へ統一。 |

## 収集物
- `rest_error_{bad_request,unauthorized,internal}/{legacy,modern}/response.json` … HTTP ボディ差分
- `rest_error_*/*/headers.txt` … `X-Trace-Id` と `WWW-Authenticate` の比較
- `logs/send_parallel_request.log` … CLI 実行ログ

追加で `docker logs` から `open.dolphin` WARN を確認済み（`logfilter_env` への追記は不要な差分のみ）。EOF
