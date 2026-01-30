# 画面横断UIレビュー 回帰確認ログ（2026-01-30）

- RUN_ID: 20260130T125310Z
- 実行日: 2026-01-30
- 目的: Reception / Charts / Patients の横断レビューに伴う回帰確認の再現性を担保する。
- 成果物方針: HAR/動画/スクリーンショットはローカル生成のみ（`artifacts/webclient/e2e/<RUN_ID>/` 等）。リポジトリにはコミットしない。

## 実行サマリ
- 単体テスト: missingMaster 復旧導線（PASS）
- E2E: 自動更新（stale）/汎用エラー復旧/再送（送信失敗→再送キュー）いずれも PASS
- 補足: Playwright 起動時に `baseline-browser-mapping` の更新警告が出るが、結果には影響なし。

## 実行ログ（要約）
### 1) missingMaster 復旧導線（Vitest）
- コマンド:
  - `cd web-client && npm test -- --run src/features/shared/__tests__/missingMasterRecovery.test.ts`
- 開始: 2026-01-30T12:54:56Z
- 終了: 2026-01-30T12:55:05Z
- 結果: PASS（5 tests）

### 2) 自動更新（stale）バナー
- コマンド:
  - `RUN_ID=20260130T125310Z npx playwright test tests/e2e/outpatient-auto-refresh-banner.spec.ts`
- 開始: 2026-01-30T12:55:11Z
- 終了: 2026-01-30T12:55:30Z
- 結果: PASS（1 test）

### 3) 汎用エラー復旧（401/403/404/5xx/network）
- コマンド:
  - `RUN_ID=20260130T125310Z npx playwright test tests/e2e/outpatient-generic-error-recovery.msw.spec.ts`
- 開始: 2026-01-30T12:55:37Z
- 終了: 2026-01-30T12:55:56Z
- 結果: PASS（5 tests）

### 4) 再送（送信失敗→再送キュー→Reception反映）
- コマンド:
  - `RUN_ID=20260130T125310Z PLAYWRIGHT_DISABLE_MSW=1 npx playwright test tests/e2e/charts/e2e-orca-claim-send.spec.ts --grep "再送キュー"`
- 開始: 2026-01-30T12:56:03Z
- 終了: 2026-01-30T12:56:20Z
- 結果: PASS（1 test）

## 備考
- 生成された `artifacts/webclient/e2e/20260130T125310Z/` と `artifacts/webclient/orca-e2e/20260130/` はローカル生成のみで削除済み。
- 再現手順の詳細は `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md` の 3.10.6 を参照。
