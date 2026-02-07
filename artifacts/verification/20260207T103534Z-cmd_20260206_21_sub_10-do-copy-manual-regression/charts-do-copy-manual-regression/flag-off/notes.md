RUN_ID=20260207T103534Z-cmd_20260206_21_sub_10-do-copy-manual-regression
QA_LABEL=flag-off
baseURL=http://127.0.0.1:5195

手動回帰（最小）:
- 入力: SOAP Subjective を入力
- ドラフト保存: ActionBar の「ドラフト保存」を実行（toast/状態変化の有無を確認）
- 印刷: 「印刷/エクスポート」を開く（disabled の場合は guard 表示を確認）
- 文書モーダル: ユーティリティドロワーの「文書」タブを開き、文書作成パネルが落ちないことを確認
- 左右パネル: PatientsTab / SOAP / Timeline / ORCA Summary / PastHub の存在を確認

証跡:
- screenshots/01..05
- meta.json（flags/panelsチェック）
- console.json（consoleログ）
