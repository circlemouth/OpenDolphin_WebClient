# 06 Touch / ADM / PHR API（Webクライアント接続）

RUN_ID: 20260114T145507Z

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

## 実装内容
- Administration 画面に Touch/ADM/PHR API の疎通確認パネルを追加。
- endpoint ごとに 2xx/4xx 判定、content-type 判定、runId/traceId を表示。
- demo 系 endpoint を stub 可能として明示。
- 監査ログ/UiState ログを送信（screen=administration/touch-adm-phr）。

## 成果物
- `web-client/src/features/administration/touchAdmPhrApi.ts`
- `web-client/src/features/administration/TouchAdmPhrPanel.tsx`
- `web-client/src/features/administration/AdministrationPage.tsx`
- `web-client/src/features/administration/administration.css`
- `web-client/src/features/administration/__tests__/TouchAdmPhrPanel.test.tsx`
