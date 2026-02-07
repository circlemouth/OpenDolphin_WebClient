# cmd_20260207_13_sub_6: Charts UI opt B 最小UI回帰（flag OFF/ON）

- RUN_ID: 20260207T130447Z-cmd_20260207_13_sub_6-charts-ui-opt-b-regression3
- 依存: 足軽4 `cmd_20260207_13_sub_5` 完了（RUN_ID=20260207T123924Z-cmd_20260207_13_sub_5-charts-ui-opt-b-phase1）
- 方法: 同一シナリオを flag OFF/ON で実施（UIのみ回帰。機能変更なし）
- MSW gate: `VITE_ENABLE_MSW=1` / `VITE_DISABLE_MSW=0` / URL `?msw=1`（外部依存を排し安定化）

## 証跡

- flag OFF: `./flag-off/`
  - `./flag-off/notes.md`
  - `./flag-off/meta.json`
  - `./flag-off/screenshots/`（1366x768/1440x900）
- flag ON (`VITE_CHARTS_UI_OPT_B=1`): `./flag-on/`
  - `./flag-on/notes.md`
  - `./flag-on/meta.json`
  - `./flag-on/screenshots/`（1366x768/1440x900）

## 最小回帰チェック（実施）

`docs/verification-plan.md` の `cmd_20260207_13` 節に従い、以下を OFF/ON ともに実測:

- 入力: SOAP Subjective 入力
- 保存: ドラフト保存
- 送信: ORCA送信ダイアログを開閉（未実送信）
- 印刷: 印刷/帳票ダイアログを開閉 + outpatient preview を起動（best-effort）
- 左右パネル: 右ユーティリティ（Document）を開閉
- Topbar: 概要の開閉

備考:
- `meta.json` の `flags:*` で `data-charts-ui-opt-b` が OFF=0 / ON=1 であることを機械確認。
