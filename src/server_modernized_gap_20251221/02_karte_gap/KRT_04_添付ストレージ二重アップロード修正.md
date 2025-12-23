# KRT-04 添付ストレージ二重アップロード修正
- 期間: 2025-12-29 09:00 - 2025-12-31 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_karte_gap/KRT_04_添付ストレージ二重アップロード修正.md`

## 目的
- 添付保存時に外部ストレージ（S3）へのアップロードが二重実行される事象を防止し、冪等に保存できるようにする。

## スコープ
- モダナイズ版サーバーの添付保存処理における冪等性の担保。
- 既存の監査イベント/レスポンス形式は維持する。

## 対応内容
- すでに S3 に配置済みの添付は再アップロードしないようにする。
- 失敗時のロールバック時に外部ストレージの削除が行えるようにする（S3 利用時）。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/storage/attachment/AttachmentStorageManager.java`
  - `uploadToS3` で `location == "s3"` かつ `uri` が設定済みの添付はアップロードをスキップする実装になっていることを確認済み。
  - 例外時のロールバックで削除が走る `TransactionSynchronizationRegistry` のフックが実装済み。
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
  - `addDocument` / `updateDocument` で `persistExternalAssets` が呼ばれているが、S3 側は冪等チェックにより二重アップロードを回避する前提となっている。

## 非スコープ
- 実運用環境でのアップロード検証（証跡取得は最終段階で実施）。
- Web クライアント側の挙動修正。

## 参照
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_前提ドキュメント整備.md`
- `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`（Legacy/Archive 参照）
