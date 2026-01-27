# 12 病名/処方/オーダー CRUD 証跡

- RUN_ID: 20260127T193045Z
- 作業日: 2026-01-28
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/12_病名処方オーダーCRUD証跡.md
- 対象IC: IC-59
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 実施内容
- 既存ログを精査し、作成系の証跡は確認済み（RUN_ID: 20260127T191602Z）。
- Local WebORCA + modernized server で更新/削除の CRUD 証跡を取得（RUN_ID: 20260127T193045Z）。
  - `OPENDOLPHIN_ENVIRONMENT=dev` / `OPENDOLPHIN_STUB_ENDPOINTS_MODE=allow` で stub 系エンドポイントを許可。

## 既存証跡（作成系）
- 20260122 の実測で患者作成→病名作成→オーダー作成→診療履歴取得まで正常系を確認済み。
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-disease-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/response-disease-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-order-bundle-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/response-order-bundle-mutation.json`
  - 参照まとめ: `docs/preprod/implementation-issue-inventory/data-transactions.md`
- API-only Trial 互換テストで `/orca/disease` `/orca/order/bundles` の正常応答を確認済み。
  - `docs/server-modernization/orca-claim-deprecation/05_ORCA_API互換テスト_結果.md`
  - `artifacts/orca-connectivity/20260105T142945Z/`

## 更新/削除の証跡（本実測）
- 証跡ルート: `artifacts/orca-preprod/20260127T193045Z/12-disease-order-crud/`
  - サマリ: `artifacts/orca-preprod/20260127T193045Z/12-disease-order-crud/README.md`
- 病名（/orca/disease）
  - update request/response: `.../requests/disease-update.json` / `.../responses/disease-update.json`
  - delete request/response: `.../requests/disease-delete.json` / `.../responses/disease-delete.json`
  - 反映確認（import）: `.../responses/disease-import-after-update.json` / `.../responses/disease-import-after-delete.json`
- 処方/オーダー束（/orca/order/bundles）
  - update request/response: `.../requests/order-bundles-update.json` / `.../responses/order-bundles-update.json`
  - delete request/response: `.../requests/order-bundles-delete.json` / `.../responses/order-bundles-delete.json`
  - fetch 結果: `.../responses/order-bundles-after-update.json` / `.../responses/order-bundles-after-delete.json`
  - DB 反映: `.../logs/document-snapshot.tsv` / `.../logs/module-snapshot.tsv`
- 診療反映（medical records）:
  - `.../requests/medical-records-final.json` / `.../responses/medical-records-final.json`
- 監査ログ:
  - `.../logs/audit-events.tsv` / `.../logs/audit-events-success.tsv`

## 未確認（残件）
- なし（更新/削除の CRUD 証跡を取得済み）。
