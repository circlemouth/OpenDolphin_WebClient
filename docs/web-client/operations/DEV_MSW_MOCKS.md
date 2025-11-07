# 開発用 MSW モックセットアップ（2025-11-01）

## 概要
- `ChartsPage` 周辺機能のローカル検証を想定し、MSW（Mock Service Worker）でカルテ表示の必須 API をモック化した。
- 開発サーバー（`npm run dev`）起動時に自動でサービスワーカーを登録し、ブラウザーでページを開くと即時にモックレスポンスが返る。
- 本番ビルドでは `import.meta.env.DEV` 判定で MSW を読み込まず、バンドルへの混入を防止している。

## モック対象 API とレスポンス概要
- `GET /api/pvt2/pvtList`
  - 受付 ID `72001` のサンプル患者（氏名: 佐藤花子、内科、保険 GUID `c3af...`）を 1 件返却。
  - `patientModel.healthInsurances[].beanBytes` に XML 文字列を収録し、既存の復元ロジックを検証できる。
- `GET /api/chartEvent/subscribe`
  - 上記受付に紐づく `PVT_STATE` イベントを即時返却し、`useChartEventSubscription` が受付ステートを更新できる。
- `PUT /api/chartEvent/event`
  - クライアントからの PUT を受けて `"1"` を返す（排他管理イベント投入の成功レスポンスを模倣）。
- `GET /api/karte/docinfo/{karteId,fromDate,includeModified}`
  - 2025-11-01 と 2024-10-15 のカルテ文書 2 件を返却。`pVTHealthInsuranceModel` や `hasRp` などのフラグをフルセットで含む。

## 利用手順
1. 依存関係をインストール後、`npm run dev` で開発サーバーを起動するだけでモックが有効化される。
2. ブラウザーで任意のページへアクセスすると、初回リクエスト時に `[MSW] 開発用モックを有効化しました。` がコンソールへ出力される。
3. MSW をアップデートした際は `npm run msw:init` を実行し、`public/mockServiceWorker.js` を再生成する。

## 動作確認メモ（2025-11-01）
- `npm run dev -- --port 5175` を起動し、`curl -k https://localhost:5175/mockServiceWorker.js` でサービスワーカーを取得できることを確認。
- `npm run typecheck` は成功。`npm run build` は既存テスト（`document-timeline-panel.test.tsx`）の構文エラーで失敗するが、今回の変更ファイルでは型チェックエラーなし。

## 本番ビルドへの影響
- `src/main.tsx` 内で `enableMocking()` を定義し、`import.meta.env.DEV` が `true` の場合のみ `@/mocks/browser` を動的 import。
- ビルド時のツリーシェイキングで当該コードは除去されるため、本番環境にはサービスワーカーもモックハンドラも含まれない。
