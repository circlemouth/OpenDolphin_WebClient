# RUN_ID=20251113TorcaRouteApplyW45

- 作業日時: 2025-11-13 12:20-12:40 JST（W45 指示）
- テンプレ配置: artifacts/orca-connectivity/templates/receipt_route.template.ini / route.template.yaml を config_dump へコピーし、`docker cp` で `/opt/jma/weborca/app/etc/` へ反映。`chown orca:orca` + `chmod 640` 適用済み。
- 再起動: Runbook 指示どおり `su - orca -c '/opt/jma/weborca/mw/bin/weborca stop && ... start'` を試行したが、`weborca` バイナリは `stop` を解釈せず常に新規起動し、既存プロセスがポートを掴んでいるため `listen tcp :8000: bind: address already in use` で失敗。証跡は `weborca_restart.log` に連続追記。最終的に `docker restart jma-receipt-docker-orca-1` で再起動して反映した。
- HTTP 検証 (`ormaster:change_me` Basic 認証):
  - `GET /api01rv2/patientgetv2?id=000001` → 404 (`{"Code":404,"Message":"code=404, message=Not Found"}`)
  - `POST /orca11/acceptmodv2?class=01` + 04_acceptmodv2_request.json → 405 (`Allow: OPTIONS, GET`)
  - Evidence: `patientgetv2_direct.http`, `acceptmodv2_direct.http`。
- 所見: receipt_route テンプレ単体では route が登録されず、404/405 は改善せず。`weborca` 再起動後もログに route 読み込みメッセージが出力されない。`questions/RECEIPT_ROUTE_REQUEST.md` の照会事項に沿って API_ENABLE_* / route サービス公開手順を追加確認する必要あり。
