直近週次: 2025-11-18 (W21) / RUN_ID=`20251118T120000Z`
- DOC_STATUS: W21 (2025-11-12〜2025-11-18) / Codex
- 主な変更: `PHASE2_PROGRESS.md` の ORCA テンプレ節へ W18/W19 RUN_ID と Evidence パスを紐付け、`docs/web-client/README.md` ORCA セクションに「直近週次: 2025-11-13 (W21)」を追加してハブ同期を確認。週次棚卸しテーブル（本行）で進捗ログと依存ドキュメントの整合性を更新。
- 次回アクション: W22 で 9080 port-forward 復旧後に Modernized 側 200 応答を含む ORCA 実測（`artifacts/orca-connectivity/<新RUN_ID>/`）を採取し、PHASE2_PROGRESS / DOC_STATUS / README を再同期。
- Evidence: ORCA 接続テンプレートを RUN_ID 付きディレクトリへコピーし、`node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` の通過ログ（`namer_check.log`）まで採取して命名ポリシー順守を確認。各ファイルに placeholder 出力を 1 行ずつ加え、次週以降の再取得準備を Evidence として残した。Evidence: [artifacts/orca-connectivity/20251118T120000Z/](../../../artifacts/orca-connectivity/20251118T120000Z/)。
