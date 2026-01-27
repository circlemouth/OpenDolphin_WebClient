# 09 XML プロキシ実環境テスト

- RUN_ID: 20260127T031057Z
- 作業日: 2026-01-27
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/09_XMLプロキシ実環境テスト.md
- 対象IC: IC-56
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 本タスクでの採用方針（指示準拠）
- acceptlstv2 / system01lstv2 / manageusersv2 は Trial の正常レスポンス証跡を採用し、本タスクでは実測をスキップした。
- 未確認の insprogetv2 のみを localhost WebORCA で実測した。
  - Trial 証跡の参照先:
    - `docs/server-modernization/phase2/operations/logs/20260112T060857Z-orca-trial-official-api.md`
    - `artifacts/orca-connectivity/20260112T060857Z/`

## 実施内容（insprogetv2 実測）
1. ローカル WebORCA 到達のため、コンテナ内からの接続先を `host.docker.internal:8000` に設定した。
2. worktree 専用ポートで modernized 環境を起動した（`setup-modernized-env.sh`）。
3. insprogetv2 を XML2 で送信し、HTTP 200 + `Api_Result=00` を確認した。

## 実行コマンド（要点のみ）
- 環境起動（ORCA 接続先を host 側 WebORCA に固定）:
  - `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19092 MODERNIZED_APP_ADMIN_PORT=19997 MODERNIZED_POSTGRES_PORT=55460 MINIO_API_PORT=19112 MINIO_CONSOLE_PORT=19113 ORCA_API_HOST=host.docker.internal ORCA_API_PORT=8000 ORCA_API_PORT_ALLOW_8000=1 ORCA_API_USER=ormaster ORCA_API_PASSWORD=change_me ORCA_MODE=weborca ORCA_API_SCHEME=http ./setup-modernized-env.sh`
- ログイン（Basic + facility 付き /user エンドポイント）:
  - `curl -u dolphindev:dolphindev -H \"X-Run-Id: 20260127T031057Z\" \"http://localhost:19092/openDolphin/resources/user/1.3.6.1.4.1.9414.10.1:dolphindev\"`
- insprogetv2（プロキシ経由 / 正常系）:
  - `curl -u dolphindev:dolphindev -H \"X-Run-Id: 20260127T031057Z\" -H \"X-Facility-Id: 1.3.6.1.4.1.9414.10.1\" -H \"Content-Type: application/xml; charset=UTF-8\" -H \"Accept: application/xml\" --data-binary @artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_request_with_provider.xml \"http://localhost:19092/openDolphin/resources/api/api01rv2/insprogetv2\"`
- insprogetv2（直叩き比較 / localhost WebORCA）:
  - `curl -u ormaster:change_me -H \"Content-Type: application/xml; charset=UTF-8\" -H \"Accept: application/xml\" --data-binary @artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_request_with_provider.xml \"http://localhost:8000/api/api01rv2/insprogetv2\"`

## 証跡（XML2 送受信）
- 作業ディレクトリ:
  - `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2`
- プロキシ経由（本タスクの完了証跡）:
  - リクエスト: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_request_with_provider.xml`
  - レスポンス: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_with_provider_response.xml`
  - レスポンスヘッダ: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_with_provider_response_headers.txt`
  - HTTP ステータス: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_with_provider_status.txt`
- 直叩き比較（localhost WebORCA）:
  - レスポンス: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_direct_orca_response.xml`
  - レスポンスヘッダ: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_direct_orca_response_headers.txt`
  - HTTP ステータス: `artifacts/orca-preprod/20260127T031057Z/xml-proxy-insprogetv2/insprogetv2_direct_orca_status.txt`

## 補足（障害の自律解消）
- `setup-modernized-env.sh` 実行時に Flyway 重複バージョン（`V0230`）で失敗したため、重複を解消した。
  - 対応: `server-modernized/tools/flyway/sql/V0230__letter_lab_stamp_tables.sql` を `V0232__letter_lab_stamp_tables.sql` へ改番。
  - 反映: `server-modernized/tools/flyway/sql/V0232__letter_lab_stamp_tables.sql`
