# セキュリティと品質改善サマリ（フェーズ 4 相当）

フェーズ 4 で実施したセキュリティ強化・品質改善・監査整備を統合し、運用チームと開発者が参照しやすい形で整理しました。対象コードは `web-client/src/libs/security`、`web-client/src/libs/audit`、`web-client/src/libs/monitoring/performanceTracker.ts`、および関連する features 配下の実装です。

## 1. 通信セキュリティとヘッダポリシー
- `initializeSecurityPolicies` で Content-Security-Policy、X-Frame-Options、Referrer-Policy を統一適用。Vite 開発サーバー/プレビュー環境は HTTPS 強制。
- 認証ヘッダーの取り扱いを `libs/http` に集約し、監査ログへ機微情報が流出しないようフィルタリングを実装。
- CSRF 対策として `ODW_XSRF` クッキーと `<meta name="csrf-token">` を監視し、`X-CSRF-Token` を自動付与。419 応答時は再取得してリトライ。

## 2. キャッシュ・ストレージ制御
- すべての HTTP リクエストに `Cache-Control: no-store` と `Pragma: no-cache` を付与し、患者情報がブラウザキャッシュへ残らないよう統制。
- 認証セッションは `sessionStorage` を優先し、利用不可の場合はインメモリ保持へフォールバック。`localStorage` は使用しない。

## 3. 監査ログと操作ログ
- `libs/audit` を新設し、HTTP 監査と業務操作のバッファリングを実装。`recordOperationEvent` が `sendBeacon` → フェイルバック送信の順で `/audit/logs` に送信。
- ログイン、患者検索・選択、カルテ保存、ORCA 併用禁忌チェックなど主要操作を監査イベント化。
- カルテ保存成功時に `progress_note_save` を記録し、保存モジュール数・請求モード・CLAIM 送信有無をメタデータとして出力。

## 4. アクセシビリティ
- `AppShell` の a11y 自動テストを Vitest + `vitest-axe` で実行。Skip Link やランドマークの動作を検証。
- 通知やボタンへ `aria-*` 属性と日本語の状態メッセージを追加し、画面リーダーで状態変化が把握できるようにした。

## 5. 性能モニタリング
- `measureApiPerformance` で患者検索・カルテ取得・ORCA 検索のレスポンス時間を収集し、閾値（3 秒 / 5 秒）超過時は監査ログへ警告を送出。
- 監視指標 `performance:<metric>` を導入し、ダッシュボードで SLA 達成状況を追跡。

## 6. 負荷テスト自動化
- `web-client/scripts/load-test.ts` と `npm run test:load` を追加し、最大 30 クライアントの並列アクセスをシミュレーション。P50/P90/P99 を出力。
- ベース URL・対象エンドポイント・反復回数は環境変数で調整可能。

## 7. アラート疲労対策
- ORCA 併用禁忌チェック結果を重大／注意／参考の 3 段階に分類し、重大のみ操作遮断。軽微通知は折りたたみ表示で情報量を調整。
- 重大通知件数は UI と監査ログで強調し、運用チームが閾値超過を把握できるようにした。

## 8. 既存ユーザー・運用への配慮
- ブラウザ単位で保持するスタンプお気に入り、Order セットの保存形式を変更せず、既存ユーザーのデータを破壊しない。
- 自費モードの導入で保険情報が欠落した受付は自動的に CLAIM 停止。保険モードでは選択保険の GUID を `DocInfoModel` へ連携し、誤送信リスクを低減。
- 文書テンプレートはブラウザの印刷ダイアログと HTML ダウンロードにフォールバックでき、Swing クライアントと同じ運用フローを維持。

## 9. 参考
- 監査エンドポイント `/audit/logs` は冪等なバッチ受信を前提とするため、サーバー側の 400/419 応答設定に注意。
- セキュリティポリシーに CDN を追加する場合は `initializeSecurityPolicies` の許可リストを更新する。
- 負荷テストのエンドポイント一覧は `LOAD_TEST_ENDPOINTS`（`METHOD /path` 形式）で指定。既定値は患者検索・カルテ取得・ORCA 検索。
