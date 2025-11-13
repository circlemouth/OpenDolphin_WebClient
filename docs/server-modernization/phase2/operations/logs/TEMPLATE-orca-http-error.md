# ORCA HTTP 404/405 対応チェックリスト

> 目的: HTTP 404/405 発生時に Runbook §4.5 の手順抜けを防ぎ、Evidence を `artifacts/orca-connectivity/<UTC_RUN>/` と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に揃えて保存する。

## 0. メタ情報
- [ ] RUN_ID: `{{YYYYMMDD}}Torca{{Priority}}OpsZ{{#}}` を採番し、すべての証跡に同じ ID を使用した。
- [ ] UTC_RUN: `$(date -u +%Y%m%dT%H%M%SZ)` を `export` し、`artifacts/orca-connectivity/${UTC_RUN}/` を作成済み。
- [ ] ログファイル: `docs/server-modernization/phase2/operations/logs/{{YYYY-MM-DD}}-orca-connectivity.md` へ本テンプレをコピペし、RUN_ID 見出しを追加した。

## 1. ServerInfo 認証
- [ ] `curl -s -u "${CLAIM_USER}:${CLAIM_PASS}" -H 'X-Client-UUID:00000000-0000-0000-0000-000000000000' http://localhost:9080/openDolphin/resources/serverinfo/claim/conn -w ' %{http_code}\n'` を実行し、HTTP 200 / `server` 応答を取得した。
- [ ] 実行結果を `artifacts/orca-connectivity/${UTC_RUN}/serverinfo_claim_conn_${UTC_RUN}.txt` に保存し、ログファイルへリンクした。
- [ ] 401/403 が発生した場合、代替アカウントと対策内容を Evidence として記載した。

## 2. API 有効化設定確認
- [ ] `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 grep -E 'api|rest' /opt/jma/weborca/app/etc/online.env` などの設定確認コマンドを実行し、結果を `artifacts/.../orca_api_enable_${UTC_RUN}.txt` に保存した。
- [ ] `receipt_route.ini` など関連ファイルの差分を `config_diff_${UTC_RUN}.txt` にまとめた。
- [ ] ログファイルの「API 有効化設定」節へ確認ハッシュまたは差分サマリを追記した。

## 3. `/api/apiXX` 試行
- [ ] 実施 API（例: `/api01rv2/appointlstv2`）を明記し、OpenDolphin 経由 (`http://localhost:9080/openDolphin/resources/claim/...`) と ORCA 直打ち (`http://orca:8000/...`) の両方で `curl -v -X POST -H 'Content-Type: application/json' --data @assets/orca-api-requests/<api>.json` を実行した。
- [ ] 各リクエスト/レスポンスを `artifacts/.../requests/<api>/openDolphin_${UTC_RUN}.json` / `orca_${UTC_RUN}.json` に保存した。
- [ ] 結果サマリ（HTTP コード、`Api_Result`, `Allow` ヘッダーなど）をログファイルへ表形式で転記した。

## 4. `docker logs --since` 採取
- [ ] `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 15m 2>&1 | tee artifacts/.../logs/orca_since_${UTC_RUN}.log` を実施し、404/405 の直前 15 分以上を取得した。
- [ ] 必要に応じて `--since 2h` や `tail -F /var/log/orca/http.log` で補完し、再取得したログファイル名を記録した。
- [ ] `docker logs opendolphin-server-modernized-dev --since 15m` も取得し、traceId と RUN_ID をログファイル内でクロスリファレンスした。

## 5. Evidence Index 更新
- [ ] `artifacts/orca-connectivity/${UTC_RUN}/README.txt` を更新し、ServerInfo／API 試行／ログ採取／差分ファイルへの相対パスを列挙した。
- [ ] `docs/server-modernization/phase2/operations/logs/{{YYYY-MM-DD}}-orca-connectivity.md` に「HTTP 404/405 対応チェックリスト」節を追加し、本テンプレ全項目の結果を記載した。
- [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` と `PHASE2_PROGRESS.md` の当該週次エントリに RUN_ID と「HTTPエラー対応テンプレ」実施済みである旨を追記した。
