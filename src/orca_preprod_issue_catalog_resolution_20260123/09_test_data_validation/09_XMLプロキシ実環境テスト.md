# 09 XML プロキシ実環境テスト

- RUN_ID: 20260125T141328Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/09_XMLプロキシ実環境テスト.md
- 対象IC: IC-56
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 実施内容
- 未実施（方針統一のみ反映）。
