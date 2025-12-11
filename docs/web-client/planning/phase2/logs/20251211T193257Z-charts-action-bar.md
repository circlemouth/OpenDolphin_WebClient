# RUN_ID=20251211T193257Z / Charts ORCA送信・ドラフト・キャンセル制御

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` を確認。
- 目的: Charts アクションバーに missingMaster/fallbackUsed ガードを追加し、ORCA送信・診療終了・ドラフト保存・キャンセルを audit/telemetry へ記録。長時間処理はスケルトン＋トーストで可視化し、エラー時のリトライを提供。
- コード変更:
  - `web-client/src/features/charts/ChartsActionBar.tsx` 新規: アクションバーの UI ロック、警告トースト、リトライ。
  - `web-client/src/features/charts/pages/ChartsPage.tsx` へアクションバーを組み込み、lock 状態を `aria-busy` へ反映。
  - `web-client/src/features/charts/styles.ts` にアクションバー/トースト/スケルトンのスタイルを追加。
  - `web-client/src/features/charts/TelemetryFunnelPanel.tsx` と `src/libs/telemetry/telemetryClient.ts` を拡張し、`stage=charts_action` と subscriber を記録・表示。`auditLogger` に draft/finish/cancel/lock を追加。
- 動作ポイント:
  - missingMaster=true では ORCA 送信ボタンを無効化し、警告トーストと aria-describedby を付与。
  - fallbackUsed=true では送信実行時に警告を表示し、送信はエラー扱い→リトライ導線を提示。
  - アクション完了で UI をロック、明示的な「ロック解除」ボタンを用意。
- テスト: `npm run build -- --mode development` を実行したが `tsc: command not found` で失敗（TypeScript 未導入のため）。npm scripts に lint が無いため未実行。Playwright/E2E は未実施。
- 次アクション: Stage/Preview で ORCA 実 API 応答を確認し、`charts_action` テレメトリが実ログに出力されることを検証。DOC_STATUS を更新済み。
