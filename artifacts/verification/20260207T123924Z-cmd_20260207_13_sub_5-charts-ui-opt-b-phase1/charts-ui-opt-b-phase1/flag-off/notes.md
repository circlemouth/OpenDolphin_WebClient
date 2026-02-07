RUN_ID=20260207T123924Z-cmd_20260207_13_sub_5-charts-ui-opt-b-phase1
QA_LABEL=flag-off
baseURL=http://127.0.0.1:5205

目的:
- Charts UI opt B Phase1 の見た目差分（OFF/ON）を証跡化（UIのみ、機能変更なし）。

スクリーンショット:
- screenshots/1366x768.png
- screenshots/1440x900.png

確認観点（UIのみ）:
- 3カラム維持のまま中央（SOAP）が広めに見える
- 余白/ギャップ/罫線/影が軽量化されている
- SOAPカードが薄いティント/アクセント枠で主役化されている
- utility compact 時はショートカット一覧が表示されない
