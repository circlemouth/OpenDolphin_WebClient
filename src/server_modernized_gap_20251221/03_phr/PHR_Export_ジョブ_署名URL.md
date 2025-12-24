# PHR Export ジョブ/署名URL
- 期間: 2026-01-02 13:00 - 2026-01-05 13:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`

## 目的
- PHR Export ジョブの実行と署名 URL 発行の安全運用を確立する。

## スコープ
- Export ジョブ管理と署名 URL 生成の設定整理。

## 対応内容
- 署名 URL 発行/検証フロー
  - `PHRResource` のエクスポート状況取得で署名 URL を発行し、失敗時はベースパスにフォールバックする。
  - 成果物ダウンロードでは `expires` と `token` を検証し、署名不一致は 403 と失敗監査に記録する。
- HMAC 署名仕様
  - `HmacSignedUrlService` で `HmacSHA256` を使用し、`basePath|facilityId|expires` を署名。
  - 署名は URL-safe Base64、検証は constant-time 比較で改ざん耐性を確保。
- Export ストレージ
  - Filesystem/S3 の切替は `PhrExportStorageFactory` で実施。
  - S3 はストリーミング送信でメモリ全量展開を避け、SSE(KMS/AES256) を許容。
- 監査/帯域ポリシー整合
  - 署名 URL 監査に `bandwidthProfile=phr-container` と `kmsKeyAlias=alias/opd/phr-export` を出力。
  - 監査には秘密情報を出力しない前提を維持する。

## 実装状況
- HMAC 署名 URL の生成ロジックは実装済み（`HmacSignedUrlService`）。
- 署名 URL の検証とエラーパス監査は実装済み（`PHRResource`）。
- Filesystem への出力は実装済み（`FilesystemPhrExportStorage`）。
- S3 出力を実装済み（`S3PhrExportStorage`：S3 保存/取得、SSE=KMS/AES256 設定、アクセスキー明示指定に対応）。

## 未実施
- S3/署名 URL 実測と監査証跡取得（最終段階で実施）。

## 完了条件
- S3 出力の実装と運用設定が整っていること（`PHR_EXPORT_S3_*` の設定整備）。
- 署名 URL 発行に必要な設定が運用で確定していること。
  - `PHR_EXPORT_SIGNING_SECRET`（署名鍵）
  - `PHR_EXPORT_TOKEN_TTL_SECONDS`（デフォルト 300 秒、0 以下はエラー）
  - `PHR_EXPORT_STORAGE_TYPE` / `PHR_EXPORT_STORAGE_FILESYSTEM_BASE_PATH`
- PHR Export の S3 設定キー（主な追加分）
  - `PHR_EXPORT_S3_ACCESS_KEY` / `PHR_EXPORT_S3_SECRET_KEY`（未設定時は DefaultCredentialsProvider を利用）
  - `PHR_EXPORT_S3_SERVER_SIDE_ENCRYPTION`（`AES256` / `aws:kms` / `kms`）
  - `PHR_EXPORT_S3_KMS_KEY`（KMS 指定時に任意。未設定時は警告ログ）
  - 資格情報の取得順序: 明示キー（`PHR_EXPORT_S3_ACCESS_KEY` / `PHR_EXPORT_S3_SECRET_KEY`）→ DefaultCredentialsProvider
  - 転送方式: ストリーミング送信（メモリへの全量展開を避ける）
- 監査イベント（`PHR_EXPORT_*` / `PHR_SIGNED_URL_*`）の維持は継続し、実測証跡は最終段階で取得する。
- 監査メタの `bandwidthProfile` と `kmsKeyAlias` が運用ポリシーと整合していること。
- 最終段階での実測証跡取得が完了していること。

## 実装済みコンポーネント
- `server-modernized/src/main/java/open/dolphin/adm20/export/HmacSignedUrlService.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportConfig.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportStorageFactory.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/S3PhrExportStorage.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/FilesystemPhrExportStorage.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_コンテナ_画像_薬剤変換.md`
- `src/server_modernized_gap_20251221/03_phr/PHR_IdentityToken_Secrets.md`
- `docs/DEVELOPMENT_STATUS.md`
