# LOGIN Rework Plan（RUN_ID=`20251130T120000Z`）

## 背景
- モダナイズ版 Web クライアントの現行の唯一の UX はログイン画面であり、他の画面・機能・ドキュメントは legacy も含めてすべて廃止しました。
- このため Web クライアント領域のドキュメントも再編し、ログイン再構成のみを記録する最小セットへ集約する必要があります。

## 現在の構成
| 項目 | 内容 | 備考 |
| --- | --- | --- |
| ログイン UI | `src/LoginScreen.tsx` が認証ヘッダー + MD5 / fetch を用いて `/api/user/{facilityId}:{userId}` へ接続。周辺ライブラリや AuthContext などは削除済み。 | `web-client/src/main.tsx` にて `LoginScreen` を直接描画。 |
| ドキュメンテーション | `docs/web-client/README.md`（本ハブ）、`planning/phase2/DOC_STATUS.md`、本計画書、`planning/phase2/logs/20251130T120000Z-login-rework.md` の4ファイル。 | RUN_ID=`20251130T120000Z` を共有。 |

## 進行済タスク
1. `docs/web-client/README.md` をログイン専用構成の説明に書き換え、不要なカテゴリを削除。
2. `docs/web-client/planning/phase2/DOC_STATUS.md` をスリム化し、本対応のステータスを記述。（後述）
3. `docs/web-client` 以下の `architecture/`・`features/`・`guides/`・`operations/`・`ux/`・`process/`・`planning/phase0/`・`planning/phase1/` を archive もなしで削除し、ログイン再構成と直接関係するファイルのみを残存させた。
4. `web-client` ソースツリーを単一の `LoginScreen.tsx` + `styles/global.css` + `main.tsx` に再構成し、`npm run build` で生成物が得られることを確認。
5. 本対応の証跡を `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` に記録。
6. Legacy 資料の所在と再導入手順を `docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` および `docs/archive/2025Q4/web-client/legacy-archive.md` に整理し、README/DOC_STATUS へリンクを貼った。

## 今後の作業目標
- ログイン画面に変更が生じる場合、本計画書の `Next steps` 欄を随時更新し、RUN_ID を変える場合は README/DOC_STATUS/ログに追記する。
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` は証跡として再利用可能な範囲で詳細を残す（コマンド・結果・確認ファイルを記録）。
- 画面追加や UX 変更を再開する際には、この計画書を起点として Scope を再定義し、関連タスクを Phase2 DOC_STATUS に追加する。
- Legacy 資料の復元や新規ドキュメント追加には、本ファイルに加えて `LEGACY_ARCHIVE_SUMMARY` とこのアーカイブ文書を必ず見直すこと。

## Next steps
1. ファイル／ディレクトリを追加する場合は、DOC_STATUS の行を新規作成してステータス（Active/Dormant/Archive）と RUN_ID を記載。README にもリンク。
2. Legacy 資料を再導入する場合は、まず `docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` を更新し、`docs/archive/2025Q4/web-client/legacy-archive.md` に復活対象・RUN_ID・証跡を追記。
2. `docs/web-client/planning/phase2/logs/` に新しい証跡ファイルを置き、ログの冒頭で RUN_ID と command を記録。
3. ログイン画面の UI・API 仕様が変わる場合は、`LoginScreen` に対応する短い計画メモ（この plan を参照）と evidence log を必ず残す。

## 関連証跡
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`
