# 03 ORCA公式 XML プロキシ（Webクライアント接続）

## 前提ドキュメント
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`（B）
- `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`
- `docs/web-client/architecture/web-client-api-mapping.md`

## 対象API
- `/api01rv2/acceptlstv2`
- `/api01rv2/system01lstv2`
- `/orca101/manageusersv2`
- `/api01rv2/insprogetv2`

## 実装範囲
- Webクライアントから XML2 payload を送信する API モジュールの追加。
- Content-Type/Accept を `application/xml; charset=UTF-8` に統一。
- audit/observability へ runId/traceId を透過。

## 受け入れ条件
- XML 送受信が成功し、HTTP ステータスと Api_Result を UI で確認できる。
- 失敗時のエラー詳細/リトライ導線がある。
