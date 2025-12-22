# KRT-03 /karte/image PathParam 修正
- 期間: 2025-12-28 09:00 - 2025-12-29 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_karte_gap/KRT_03_karte_image_PathParam修正.md`

## 目的
- `GET /karte/image/{id}` の `@PathParam` 名不一致を解消し、API 仕様と実装のズレをなくす。

## スコープ
- モダナイズ版サーバーの `KarteResource` の PathParam 修正。
- 既存のレスポンス形式（`SchemaModelConverter`）は維持する。

## 対応内容
- `@Path("/image/{id}")` に対し `@PathParam("id")` を使用するよう統一する。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
  - `GET /karte/image/{id}` が `@PathParam("id")` を受け取る実装になっていることを確認済み。
  - 既存の `SchemaModelConverter` を維持してレスポンス形式を変えていない。

## 非スコープ
- 監査ログの証跡取得。
- Web クライアント側の API 呼び出し変更（必要性があれば別タスク）。

## 参照
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_前提ドキュメント整備.md`
- `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`（Legacy/Archive 参照）
