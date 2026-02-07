RUN_ID=20260207T130447Z-cmd_20260207_13_sub_6-charts-ui-opt-b-regression3
QA_LABEL=flag-off
baseURL=http://127.0.0.1:5178
facilityId=1.3.6.1.4.1.9414.72.103
patientId=01415
visitDate=2026-02-07

目的:
- Charts UI opt B の flag OFF/ON で、最小UI回帰（入力/保存/送信/印刷/文書/パネル）を実測し証跡化する。

実施内容（最小）:
- Charts 画面表示（msw=1）
- Topbar 開閉
- Utility panel: document を開く→閉じる（右パネルの開閉）
- SOAP Subjective 入力
- ドラフト保存（結果は banner/toast を目視）
- ORCA送信ダイアログの開閉（blocked の場合は banner 証跡）
- 印刷/帳票ダイアログの開閉 + outpatient preview の best-effort

スクリーンショット:
- screenshots/*.png（1366x768 / 1440x900）

エラー: なし
