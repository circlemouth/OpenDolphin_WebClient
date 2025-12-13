# Charts エラーハンドリング/リトライ規約ログ（RUN_ID=`20251213T121500Z`）

- 目的: Charts 本番外来で API 失敗時の表示・再試行・ガードを統一し、missingMaster/fallbackUsed 由来のブロックと部分失敗 UI のルールを固定する。
- 成果物: `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## インプット
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`（metadata 透過/監査ルール）
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`（セッション無効時のブロックと runId 破棄）
- `docs/web-client/ux/charts-claim-ui-policy.md`, `docs/web-client/ux/reception-schedule-ui-policy.md`（tone/aria-live/バナー carry-over）
- `docs/web-client/operations/debugging-outpatient-bugs.md`（スキーマ不一致時の採取手順）

## 決定サマリ
1. トーン/aria-live: timeout/5xx は error (`assertive`)、4xx は warning/info（理由別）、スキーマ不一致は error＋「データ構造を確認」を明示。再取得ボタンと runId/traceId を必ず表示する。
2. `missingMaster=true` または `fallbackUsed=true` は送信・編集・印刷をブロックし、Charts ヘッダー直下の ToneBanner（warning, assertive）で理由と「再取得/Receptionへ戻る/管理者へ共有」を提示。解除は `missingMaster=false` かつ `dataSourceTransition=server` を確認してから。
3. ErrorBoundary は初期化不可・セッション無効・必須設定欠損のみに使用し、API 単位の失敗はパネル内部分失敗（ToneBanner + 空状態 + 再取得）で扱う。他パネルは継続させる。
4. リトライ導線: ポーリング系は 3 連続失敗で error 昇格＋手動のみ、手動取得は同一 runId/traceId 継続で retry count を TelemetryFunnel に送る。送信/保存は自動再試行禁止・8 秒で pending から error に切替。
5. 監査/observability: すべての失敗で `runId/traceId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/status/reason/retryCount` を audit と logUiState に記録。ToneBanner/再取得ボタンに `data-run-id`/`data-trace-id` を付与し、HAR/Playwright で検証可能にする。

## 更新ファイル
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`

