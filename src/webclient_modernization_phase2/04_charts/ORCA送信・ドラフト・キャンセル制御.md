# ORCA送信・ドラフト・キャンセル制御（RUN_ID=20251211T193257Z）

- 対象: Charts アクションバー（診療終了・ORCA送信・ドラフト保存・キャンセル）のガード強化。missingMaster で送信をブロックし、fallbackUsed を警告。長時間処理はスケルトン＋トーストを表示し、エラー時はリトライ導線を用意。
- 監査・テレメトリ: `logUiState` と `recordOutpatientFunnel(stage=charts_action)` に action/outcome/duration を記録し、UI ロック状態も audit に残す。
- ロック: 各アクション完了で UI をロックし、明示的な「ロック解除」操作を追加。missingMaster=true 時は ORCA 送信ボタンを aria-disabled とトーストで警告。
- コード: `web-client/src/features/charts/{ChartsActionBar.tsx,pages/ChartsPage.tsx,styles.ts,TelemetryFunnelPanel.tsx}`、`src/libs/{telemetry/telemetryClient.ts,audit/auditLogger.ts}` を更新。
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251211T193257Z-charts-action-bar.md`。
