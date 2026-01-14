# 03_ORCA公式XMLプロキシ実装
- 期間: 2026-01-18 15:00 - 2026-01-20 15:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
- RUN_ID: 20260114T070545Z

## 対象API
- `/api01rv2/acceptlstv2`
- `/api01rv2/system01lstv2`
- `/orca101/manageusersv2`
- `/api01rv2/insprogetv2`

## 実装内容
- ORCA公式XMLプロキシ向けの API モジュールを追加し、XML2 payload を送信できるようにした。
- Content-Type/Accept を `application/xml; charset=UTF-8` に統一した。
- runId/traceId を observability header とレスポンスに透過し、監査ログへ連携できるようにした。
- Administration 画面に ORCA公式XMLプロキシ操作セクションを追加した。
  - エンドポイント切替、class 指定、XML 編集、送信/再送/テンプレ再生成を提供。
  - HTTP ステータス/Api_Result/Message/取得日時/エラー詳細を表示する。

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`
- `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `server-modernized/src/main/java/open/dolphin/rest/OrcaAcceptanceListResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java`

## 検証
- `npm --prefix web-client run typecheck`
