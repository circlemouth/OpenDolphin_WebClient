# PHR コンテナ/画像/薬剤変換
- 期間: 2025-12-28 09:00 - 2025-12-31 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_コンテナ_画像_薬剤変換.md`

## 目的
- PHRContainer の組み立て・画像ストリーミング・薬剤（処方）テキスト変換をモダナイズ版サーバーで提供し、PHR API の実レスポンスを成立させる。

## スコープ
- `PHRResource` / `PhrDataAssembler` を中心とした PHR 応答の生成。
- 画像取得と薬剤テキスト化の互換維持。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
  - `GET /20/adm/phr/medication/{patientId}` と `GET /20/adm/phr/image/{patientId}` を実装済み。
  - `GET /20/adm/phr/{param}` で `PHRContainer` を組み立てて返却する経路を実装済み。
- `server-modernized/src/main/java/open/dolphin/adm20/support/PhrDataAssembler.java`
  - `PHRContainer` / `PHRBundle` / `PHRClaimItem` の組み立てを実装済み。
  - `IOSHelper.xmlDecode` を用いた ClaimBundle 変換ルートが存在。

## 未実施
- PHR 実測（P99/レスポンス差分/画像帯域）に関する証跡取得。
- 禁忌語・用法の変換ロジックが要求どおりかの監査（仕様比較・テスト）

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_ヘッダー_監査ID整備.md`
- `docs/DEVELOPMENT_STATUS.md`
