# 証跡ログ: 37 ユーティリティ導線統合確認（RUN_ID=20260112T062500Z）

## 実施環境
- 作業ディレクトリ: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1768198209708-37bcec`
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（既存起動を利用）
- Web クライアント: `http://localhost:5175/charts?msw=1`
- MSW: `VITE_DISABLE_MSW=1`（Playwright route stub を使用）

## 修正内容
- `web-client/src/features/charts/PatientsTab.tsx` の検索入力に `id="charts-patient-search"` を追加し、Alt+P/Ctrl+F のフォーカス導線を復旧。

## route stub（MSW 無効時の 401/404 回避）
- `/api/user/*`
- `/api/admin/config`
- `/api/admin/delivery`
- `/api01rv2/appointment/outpatient*`
- `/api01rv2/claim/outpatient*`
- `/orca21/medicalmodv2/outpatient*`
- `/api/orca/queue*`
- `/api01rv2/patient/outpatient*`
- `/orca/disease/import/*`
- `/orca/order/bundles*`

## 手順
1. Charts ログイン（施設ID=0001 → ユーザーID=doctor1/パスワード=pass）。
2. DockedUtilityPanel の compact 状態で ActionBar/DocumentTimeline/ORCA サマリとの重なりを確認。
3. Ctrl+Shift+U で DockedUtilityPanel を開き、フォーカス移動を確認。
4. Alt+P で `#charts-patient-search` へのフォーカス移動を確認。
5. DockedUtilityPanel を閉じてフォーカス復帰を確認。
6. 診療操作/処方/オーダー/文書のタブ切替を確認。
7. 病名クイック導線（病名へ移動ボタン）で `#charts-diagnosis` へフォーカス移動を確認。
8. expanded 状態で ActionBar/DocumentTimeline/ORCA サマリとの重なりを確認。

## 結果
- DockedUtilityPanel の開閉・主要導線の重なりは問題なし。
- Ctrl+Shift+U の開閉とフォーカス移動は OK。
- **Alt+P で `#charts-patient-search` へのフォーカス移動が成功**。
- 診療操作/処方/オーダー/文書切替と病名クイック導線は OK。

## 証跡
- `artifacts/utility-panel-integration/20260112T062500Z/result.json`
- `artifacts/utility-panel-integration/20260112T062500Z/compact.png`
- `artifacts/utility-panel-integration/20260112T062500Z/expanded.png`
