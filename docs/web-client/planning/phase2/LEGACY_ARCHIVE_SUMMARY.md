# Legacy Archive Summary（RUN_ID=`20251130T120000Z`）

## 要約
- Web クライアントは RUN_ID=`20251130T120000Z` で「ログイン画面のみ」の構成へ移行しました。その結果、`docs/web-client` 以下に蓄積されていた architecture/UX/features/operations/process/phase0/phase1 のドキュメントは不要になったため削除し、`docs/archive/2025Q4/web-client/legacy-archive.md` に一覧と運用指針を残しました。
- この文書は現行 README・DOC_STATUS・LOGIN_REWORK_PLAN と連携し、legacy 資産がどこへ行ったか、再び必要になったときに何を参考にすべきかを一望できるよう整理することを狙いとしています。

## 経緯のトレースライン
1. `2025-11-30T12:00` JST に `docs/web-client` 以下の architecture/features/ux/operations/process/planning/phase0/phase1 を削除し、`docs/web-client/README.md` をログイン専用ハブへ再構成。証跡は `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` に記録済み。
2. `web-client/src` を単一の `LoginScreen.tsx` + `styles/global.css` + `main.tsx` に再構成し、`npm run build` に合格。ビルド結果・ログは同じ証跡ファイルを参照。
3. この summary と README/DOC_STATUS を同期し、legacy 資料の存置場所を `docs/archive/2025Q4/web-client/legacy-archive.md` で確定。新規ドキュメント追加時は、必ずこの summary へも記録してください。

## 運用ルール
- Legacy 資料を再度編集・活用する必要が出た場合は、まずここに対象ファイル名（Git 履歴のパス）、再開 RUN_ID、復活条件を追記します。
- README → DOC_STATUS → LOGIN_REWORK_PLAN → この summary → `docs/archive/2025Q4/web-client/legacy-archive.md` のチェーンで RUN_ID を共有し、証跡ログ `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` にリンクしてください。
- 今後 `docs/web-client/planning/phase2/DOC_STATUS.md` に項目を追加するとき、この summary を参照し、legacy 資料との整合性を必ず確認してください。

## 参照リンク
- `docs/archive/2025Q4/web-client/legacy-archive.md` – 削除済みドキュメントの一覧と次のステップ。
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` – 削除・再構成・ビルドの証跡。
