# Charts キーボード操作と ARIA 監査ログ（RUN_ID=`20251217T113616Z`）

- 目的: Charts 本番外来の主要導線をキーボードのみで完走できるようフォーカス順とショートカットを固定し、ToneBanner/トースト/エラー表示の `role`/`aria-live` を Reception と一致させる。モーダルのフォーカストラップ統一と、キーボード操作後も Topbar の `runId`/`dataSourceTransition` が書き換わらないことを監査観点に組み込む。
- 成果物: `src/charts_production_outpatient/ux/21_キーボード操作とARIA監査.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## インプット
- `docs/web-client/ux/charts-claim-ui-policy.md`（ARIA/トーン基準）
- `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`（フォーカス順のベース配置）
- `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md`（aria-live 抑制/ピル順序）
- `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md`（a11y DoD）
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`, `12_エラーハンドリングとリトライ規約.md`

## 決定サマリ
1. Tab/Shift+Tab + Enter/Space + Esc で「患者切替→タブ移動→検索→送信/印刷→戻る」を完走するフォーカス順・ショートカットを固定（Alt+P/Ctrl+F/Ctrl+Shift+Arrow/Alt+S/Alt+E/Alt+I など）。タブ切替やドロワー開閉後もフォーカスとスクロール位置を保持。
2. 通知の `role`/`aria-live` を統一: ToneBanner=alert + assertive/polite（トーン依存）、ピル=role=status + aria-live=off、トースト=status/polite、インラインエラーは aria-describedby で重複読み上げを防止。`aria-atomic=false` を既定。
3. すべてのモーダル（送信/印刷/警告）に共通フォーカストラップ・Esc クローズ・呼び元へのフォーカス復元を義務化し、Backdrop クリックでは閉じない。
4. キーボード操作後も Topbar の `runId`/`dataSourceTransition`/`missingMaster`/`fallbackUsed`/`cacheHit` を再宣言しない。manualRefresh・タブ移動・送信ダイアログ開閉後もピルが同じ値を保持することを QA/Playwright で検証。
5. Playwright に「キーボード完走」「読み上げ 1 回」「FocusTrap」「runId 不変性」を追加し、MSW ON/OFF 両方で証跡（HAR/trace）を `artifacts/webclient/e2e/<RUN_ID>-keyboard-aria/` に保存するテスト計画を追加。多重モーダル（送信→印刷プレビュー）と印刷プレビュー中の読み上げ抑止も検証に含める。

## 更新ファイル
- `src/charts_production_outpatient/ux/21_キーボード操作とARIA監査.md`
