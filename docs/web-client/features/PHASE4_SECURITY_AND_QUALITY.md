# フェーズ4 品質・安全性強化サマリ

フェーズ4のゴールに沿って、Web クライアントへ以下の改善を適用した。

## 1. 通信セキュリティ・ヘッダポリシー
- Vite 開発サーバおよびプレビューサーバを HTTPS 強制とし、自己署名証明書による検証環境を標準化。
- `index.html` と `initializeSecurityPolicies` で Content-Security-Policy、X-Frame-Options、Referrer-Policy 等を強制。`/src/libs/security` に実装を集約。
- 認証ヘッダーの取扱方針をドキュメント化し、`axios` リクエストから監査ログに機微情報を送出しないようフィルタリングを実施。
- CSRF 対策として、`ODW_XSRF` クッキー/`<meta name="csrf-token">` からトークンを取得し、`X-CSRF-Token` を自動付与。419 応答時にはトークンを再取得。

## 2. キャッシュ・ストレージ制御
- すべての HTTP リクエストに `Cache-Control: no-store` と `Pragma: no-cache` を付与し、ブラウザキャッシュへ患者情報が残らないよう統一。
- 認証セッションは `sessionStorage` 優先、未対応ブラウザはインメモリにフォールバックすることで `localStorage` 永続化を排除。

## 3. 監査ログ・操作ログ
- `src/libs/audit` を新設し、HTTP 監査・業務操作のバッファリングと SIEM 連携用エンドポイント `/audit/logs` への送出を実装。可用性確保のため `sendBeacon` とフェイルバック送信を実装。
- ログイン、患者検索・選択、カルテ取得、ORCA 併用禁忌チェックに対する操作ログを記録。

## 4. アクセシビリティ改善
- `AppShell` に対して `vitest-axe` を用いた a11y 自動テストを追加。Skip Link や主要ランドマークの動作を検証。
- 通知・ボタンに `aria` 属性と日本語ガイダンスを追記し、状態変化を `role="status"` で周知。

## 5. 性能モニタリング
- `measureApiPerformance` で患者検索・カルテ取得・ORCA マスター検索のレスポンスを計測し、閾値 (3s/5s) 超過時に監査ログへ警告を記録。
- フェーズ4 SLA 監視指標として `performance:<metric>` イベントを導入。

## 6. 負荷テスト自動化
- `npm run test:load` で実行できる `scripts/load-test.ts` を追加。最大 30 クライアントの並列アクセスをシミュレーションし、P50/P90/P99 を集計。
- 環境変数でベース URL・エンドポイント・反復回数を調整可能。

## 7. アラート疲労対策
- ORCA 併用禁忌チェックに重大/注意/参考の 3 段階分類を導入し、重大通知のみ操作遮断対象に設定。軽微通知は折りたたみ可能。
- 重大通知件数を視覚的に強調し、ログにも件数を記録。

## 8. 関連コード一覧
- `web-client/src/libs/security/*`
- `web-client/src/libs/audit/*`
- `web-client/src/libs/monitoring/performanceTracker.ts`
- `web-client/src/features/patients/api/*`, `web-client/src/features/charts/api/orca-api.ts`
- `web-client/src/features/charts/components/OrcaOrderPanel.tsx`
- `web-client/src/app/layout/AppShell.tsx`
- `web-client/scripts/load-test.ts`
- `web-client/src/app/__tests__/AppShell.a11y.test.tsx`

## 運用上の注意
- `/audit/logs` は冪等なバッチ受信を想定。サーバ側で `X-CSRF-Token` を検証し、400/419 応答でリトライ発生がないよう設定する。
- `LOAD_TEST_ENDPOINTS` は `METHOD /path` 形式で複数指定可能。既定値は患者検索/カルテ取得/ORCA 検索の主要ルート。
- CSP 適用に伴い、外部 CDN を利用する場合は `initializeSecurityPolicies` の許可リストを更新すること。
