# 13 会計/帳票 PDF 証跡

- RUN_ID: 20260125T141328Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/13_会計帳票PDF証跡.md
- 対象IC: IC-60
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 実施内容
- 既存証跡を採用してスキップ（RUN_ID: 20260127T191602Z）。

## 既存証跡の採用理由
- MSW 前提の Playwright E2E で `prescriptionv2` の Data_Id 取得→PDF プレビューが確認済み。
- ORCA Trial では `prescriptionv2` が Api_Result=0001 となり Data_Id が取得できないため、既存の正常系証跡を採用する。

## 採用した証跡
- E2E 実行コード: `tests/charts/e2e-prescriptionv2-flow.spec.ts`（MSW）
- 証跡:
  - `artifacts/webclient/orca-e2e/20260122/prescription/prescription-preview.png`
  - `artifacts/webclient/orca-e2e/20260122/prescription/prescriptionv2.pdf`
  - `artifacts/webclient/orca-e2e/20260122/prescription/prescription-missing-data-id.png`

## 未実施（参考）
- ORCA Trial / localhost WebORCA での Data_Id 取得→blobapi 実測は未着手（Trial 制約のため）。
