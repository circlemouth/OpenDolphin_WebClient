# 06 Touch / ADM / PHR API（Webクライアント接続）

## 前提ドキュメント
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`（E）
- `docs/web-client/ux/ux-documentation-plan.md`

## 対象リソース
- touch/* (DolphinResource, JsonTouch, EHT ほか)
- adm10/adm20 の JsonTouch / EHT / Admission / PHR

## 実装範囲
- Webクライアント側の API モジュール/画面導線を追加。
- 認証/権限ガードの整理。
- stub 可能 API の状態表示。

## 受け入れ条件
- 主要 endpoint が 200/4xx で整合。
- 監査ログとメトリクスが取得できる。
