# KRT-01 Document更新API
- 期間: 2025-12-26 09:00 - 2025-12-28 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_karte_gap/KRT_01_Document更新API.md`

## 目的
- Web クライアントが前提とする `PUT /karte/document` による本文更新をモダナイズ版サーバーで提供する。
- 既存のタイトル更新 API (`PUT /karte/document/{id}`) と共存し、互換ヘッダー運用の想定と矛盾しないことを確認する。

## スコープ
- モダナイズ版サーバーの `KarteResource` / `KarteServiceBean` に本文更新 API を用意する。
- 既存タイトル更新 API の継続提供（破壊的変更は行わない）。

## 対応内容
- `PUT /karte/document` を JSON (`DocumentModel`) で受け取り、本文・モジュール・添付を更新できるようにする。
- 更新時に削除されたモジュール/シェーマ/添付が DB から除去されるよう差分削除を実行する。
- 互換ヘッダー運用（`X-Client-Compat` の想定）とタイトル更新 API の混在が仕様上矛盾しないことを確認する。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
  - `@PUT /karte/document` で `DocumentModel` を更新するエンドポイントが実装済み。
  - `populateDocumentRelations` により関連参照を補完した上で `KarteServiceBean#updateDocument` を呼び出す。
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
  - `updateDocument(DocumentModel)` が実装済み。
  - 既存の子要素との差分削除（Modules/Schemas/Attachments）と添付外部保存の再同期を実施する。

## 互換/整合確認
- `PUT /karte/document/{id}`（タイトル更新 API）は維持し、本文更新 API とパスが衝突しないことを確認済み。
- 互換ヘッダー運用（例: `X-Client-Compat: legacy-doc-update`）は本文更新 API の利用を妨げない前提で整合を確認する。
  - 実際のヘッダー制御は API ゲートウェイ/運用レイヤで行うため、本実装ではヘッダー依存の挙動変更は行わない。

## 非スコープ
- 監査ログの 200 証跡取得（最終段階で実測・記録する）。
- Web クライアント側の API 呼び出し修正。

## 変更ファイル（記録）
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- 実測証跡は最終段階で一括取得するため、本タスクでは実施しない。

## 参照
- `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
- `docs/DEVELOPMENT_STATUS.md`
