# OutpatientMockのQA運用整備

- RUN_ID: 20251228T120603Z
- 期間: 2025-12-28
- ステータス: done
- 進捗: 100
- YAML ID: src/webclient_productionization/outpatient_mock/60_OutpatientMockのQA運用整備.md
- 参照ガント: .kamui/apps/webclient/webclient-productionization-plan-20251226.yaml

## 進捗記入ルール
- 担当者は作業開始時に RUN_ID/期間/ステータス/進捗 を更新する。
- 実施ログに日付・作業内容・成果物（コミット/証跡パス）・検証結果・残課題を追記する。
- 進捗更新時は docs/DEVELOPMENT_STATUS.md の懸念点有無も確認し、必要ならここに反映する。

## 進捗メモ（担当者が更新）
- 担当者: CodexCLI3
- 更新日: 2025-12-28
- 根拠: Outpatient Mock の MSW シナリオ選択と runId/dataSourceTransition の QA 操作を UI に明示する対応を開始。
- 次アクション: 完了（追加対応があればRUN_IDを更新して実施）。


## 目的
- Outpatient Mock の QA 運用で MSW シナリオ/障害注入を安全に切替できるようにし、runId/dataSourceTransition の切替操作を明示して
  Reception/Charts/Patients のテレメトリ確認を再現可能にする。

## 依存関係の意図
- Patients の導線固定（42）と Administration の配信バナー反映（53）の完了後に QA 運用を組み立てる。
- QA で確認する runId / dataSourceTransition / バナー表示を実運用導線と一致させるため、両系統の完了を前提とする。

## 受け入れ基準 / Done
- Outpatient Mock 画面で MSW シナリオ選択が明示され、VITE_DISABLE_MSW=1 時に QA 向け警告が表示されること。
- runId と dataSourceTransition の切替操作が UI 上で明示され、切替後の runId/transition がトーン/telemetry に反映されること。
- QA 操作手順が本ドキュメントに記載され、実施ログに RUN_ID 付きの検証結果が残っていること。

## QA 操作手順（runId / dataSourceTransition 切替）
1. `RUN_ID=<採番> VITE_DISABLE_MSW=0 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動する。
2. `/outpatient-mock?msw=1` を開き、シナリオを選択する。
3. `runId` 入力欄で任意の RUN_ID を入力し「runId を適用」を押す（空白は適用不可、推奨形式は `YYYYMMDDThhmmssZ`）。
4. `dataSourceTransition` のセレクトを切替える。
5. 画面上部の RUN_ID / dataSourceTransition 表示、Reception/Charts の ToneBanner と Telemetry funnel が更新されることを確認する。
6. VITE_DISABLE_MSW=1 で再起動し、警告表示が出てシナリオ/上書きが無効になることを確認する。

## 実施ログ
- 2025-12-27: 依存関係の意図を追記（RUN_ID: 20251227T221802Z）。
- 2025-12-28: QA 用の runId/dataSourceTransition 切替 UI と MSW 無効時警告の整備に着手（RUN_ID: 20251228T120603Z）。
- 2025-12-28: MSW runId 上書きと警告文を実装、QA 手順を更新。`npm -C web-client test -- medicalOutpatient` 実行済み。`WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=0 MODERNIZED_POSTGRES_PORT=15433 MINIO_API_PORT=59002 MINIO_CONSOLE_PORT=59003 MODERNIZED_APP_HTTP_PORT=59080 MODERNIZED_APP_ADMIN_PORT=59995 ./setup-modernized-env.sh` で起動確認（RUN_ID: 20251228T120603Z）。
- 2025-12-28: VITE_DISABLE_MSW=1 時の警告表示を Playwright で実証。ログ: `artifacts/webclient/debug/20251228T120603Z-outpatient-mock/logs/msw-disabled-setup.log` / `.../logs/msw-disabled-ui-body.txt` / `.../logs/msw-disabled-ui.txt`、スクリーンショット: `artifacts/webclient/debug/20251228T120603Z-outpatient-mock/screenshots/msw-disabled-warning.png`（RUN_ID: 20251228T120603Z）。
