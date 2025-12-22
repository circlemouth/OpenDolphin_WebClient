# KRT_前提ドキュメント整備
- 期間: 2025-12-25 09:00 - 2025-12-26 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_karte_gap/KRT_前提ドキュメント整備.md`

## 目的
- KRT-01/02/03/04 の実装に必要な前提文書と参照リンクを先行整備し、実装タスクの着手準備を揃える。
- 互換ヘッダー/監査/既存 API 差分の整理観点を明文化し、実装判断と証跡取得のブレを防ぐ。

## 前提・制約
- Phase2 文書は Legacy/Archive（参照専用）。更新対象外。
- 旧サーバー資産（`server/`）は変更禁止。
- 変更対象は Web クライアント資産と `server-modernized/` のみ。
- モダナイズ版サーバーと Web クライアントは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、認証情報はスクリプト記載のものを使用する。
- ORCA 実環境に接続する場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の RUN_ID ルールに従う。

## 対象 KRT 一覧
- **KRT-01**: `PUT /karte/document`（本文更新）
- **KRT-02**: `SafetySummary` 系 API（Masuda/SafetySummary）
- **KRT-03**: `GET /karte/image/{id}` の `@PathParam` 修正
- **KRT-04**: 添付ストレージ二重アップロード解消

## 参照リンク（現行）
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/server-modernization/server-api-inventory.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/ux/charts-claim-ui-policy.md`
- `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_01_Document更新API.md`
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_02_Masuda_SafetySummary_API.md`
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_03_karte_image_PathParam修正.md`
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_04_添付ストレージ二重アップロード修正.md`
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
- `server-modernized/src/main/java/open/dolphin/session/AttachmentStorageManager.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/`（SafetySummary 系 DTO）

## 参照リンク（Legacy/Archive）
- `docs/server/LEGACY_REST_API_INVENTORY.md`
- `docs/server-modernization/phase2/notes/karte-clinical-review-20251119T133348Z.md`
- `docs/server-modernization/phase2/notes/karte-clinical-review-20251119T134836Z.md`
- `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`

## 作業手順書（KRT 前提整備）
1. `MODERNIZED_REST_API_INVENTORY` と `server-api-inventory.md` を参照し、KRT-01/02/03/04 の対象エンドポイント/責務を整理する。
2. Web クライアントの依存 API（カルテ/安全性サマリ/添付/画像）を `web-client-api-mapping.md` と `charts-claim-ui-policy.md` で照合し、UI の期待値（レスポンス形状・監査項目）を箇条書き化する。
3. `KarteResource`/`KarteServiceBean`/`AttachmentStorageManager` の現状実装を確認し、KRT-01〜04 の差分がどこで発生するかを特定する。
4. Legacy/Archive の KRT 系ノートから、SafetySummary 実装方針・PathParam 修正・添付二重アップロードの経路を要点だけ抜き出して整理する（更新は行わない）。
5. 互換ヘッダー/監査/既存 API 差分の整理観点を下記「整理観点」にまとめ、KRT 実装タスクの前提として固定する。

## 互換ヘッダー/監査/既存 API 差分の整理観点
- **互換ヘッダー運用**: `X-Client-Compat` の有無で挙動が分岐する場合は、既存 API を壊さないことを最優先とし、互換層で差分を吸収する。
- **監査イベントの整合**: 既存の `recordAudit`/`recordMasterAudit` で不足する場合は、API ルート・アクション名・`traceId/requestId` を同一方針で記録できるように設計する。
- **既存 API との差分定義**: Legacy の `PUT /karte/document`（本文更新）と Modernized の `PUT /karte/document/{id}`（タイトル更新）の差分を明示し、KRT-01 実装時に混乱を起こさない。
- **SafetySummary の互換性**: Legacy 実装のレスポンス項目と Web クライアントの期待 JSON を突合し、欠落項目があれば DTO を先行整備する。
- **画像取得の PathParam**: `GET /karte/image/{id}` の `@PathParam` 名が誤っている場合、API 仕様と一致するよう `id` に統一する。
- **添付ストレージの冪等性**: 添付保存の二重アップロードを排除し、失敗時のロールバック・再試行条件を整理する。
- **証跡/テスト観点**: KRT-01〜04 は「200 応答 + 監査ログ証跡」を最小成果物に含める前提で整理する。

## 期待成果物
- KRT-01/02/03/04 の前提文書（本ファイル）と参照リンク一覧。
- 互換ヘッダー/監査/既存 API 差分の整理観点の明文化。

## 非対象
- Phase2/Legacy 文書の更新。
- ORCA 実接続・Stage/Preview 実測。
- 旧サーバー（`server/`）の改修。
