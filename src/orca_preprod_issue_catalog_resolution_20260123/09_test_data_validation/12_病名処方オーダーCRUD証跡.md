# 12 病名/処方/オーダー CRUD 証跡

- RUN_ID: 20260125T141328Z
- 作業日: 2026-01-25
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

## 未確認（残件）
- 更新/削除の CRUD 証跡が未取得。
  - `operation=update/delete` の request/response と監査ログが必要。
  - ORCA Trial では CRUD の制約が残るため、localhost WebORCA か実環境で再測する。
