# PHR Export ジョブ/署名URL
- 期間: 2026-01-02 13:00 - 2026-01-05 13:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`

## 目的
- PHR Export ジョブの実行と署名 URL 発行の安全運用を確立する。

## スコープ
- Export ジョブ管理と署名 URL 生成の設定整理。

## 実装状況
- HMAC 署名 URL の生成ロジックは実装済み（`HmacSignedUrlService`）。
- Filesystem への出力は実装済み（`FilesystemPhrExportStorage`）。
- S3 出力を実装済み（`S3PhrExportStorage`：S3 保存/取得、SSE=KMS/AES256 設定、アクセスキー明示指定に対応）。

## 未実施
- S3/署名 URL 実測と監査証跡取得（最終段階で実施）。

## 完了条件
- S3 出力の実装と運用設定が整っていること（`PHR_EXPORT_S3_*` の設定整備）。
- PHR Export の S3 設定キー（主な追加分）
  - `PHR_EXPORT_S3_ACCESS_KEY` / `PHR_EXPORT_S3_SECRET_KEY`（未設定時は DefaultCredentialsProvider を利用）
  - `PHR_EXPORT_S3_SERVER_SIDE_ENCRYPTION`（`AES256` / `aws:kms` / `kms`）
  - `PHR_EXPORT_S3_KMS_KEY`（KMS 指定時に任意。未設定時は警告ログ）
- 最終段階での実測証跡取得が完了していること。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_コンテナ_画像_薬剤変換.md`
- `src/server_modernized_gap_20251221/03_phr/PHR_IdentityToken_Secrets.md`
- `docs/DEVELOPMENT_STATUS.md`
