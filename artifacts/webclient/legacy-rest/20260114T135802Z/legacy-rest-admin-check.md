# Legacy REST 管理画面 疎通証跡

RUN_ID: 20260114T135802Z
日時: 2026-01-14
対象画面: /f/LOCAL.FACILITY.0001/administration
対象エンドポイント: /serverinfo

## 確認内容
- Administration の通常導線「Legacy REST 互換 API」パネルから疎通確認を実行
- 2xx 判定が UI に表示されることを確認（HTTP 200）
- 監査ログに legacy=true と endpoint が記録されることを確認

## 証跡
- スクリーンショット: `artifacts/webclient/legacy-rest/20260114T135802Z/legacy-rest-admin.png`
- 監査ログ抜粋: `artifacts/webclient/legacy-rest/20260114T135802Z/legacy-rest-admin-check.json`

## 実行コマンド
- `RUN_ID=20260114T135802Z LEGACY_REST_OUTPUT_DIR=artifacts/webclient/legacy-rest/20260114T135802Z node scripts/legacy-rest-admin-check.mjs`
