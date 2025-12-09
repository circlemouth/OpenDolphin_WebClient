# RUN_IDセットとハブ確認

- **RUN_ID=20251209T192814Z**（今回の外来デバッグ系タスクで共通利用）。
- YAML ID: `src/modernized_outpatient_debug/preparation/RUN_IDセットとハブ確認.md`
- ステータス: done（参照チェーン確認とメモ作成のみ。ドキュメント本体の更新は未実施）。

## 1. 目的
- マネージャー指示の RUN_ID を全外来デバッグ関連タスクで共有し、参照チェーンを再確認する。
- DOC_STATUS の更新方針と証跡パスを明示し、更新対象/非対象を切り分けておく。

## 2. 参照チェーン再確認（更新なし）
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/operations/debugging-outpatient-bugs.md`
- 現時点で内容のみ確認。各ファイルは参照専用で、今回のメモでは改訂していない。

## 3. DOC_STATUS 更新方針メモ
- 更新タイミング: 外来デバッグの追加ログを取った後に `docs/web-client/planning/phase2/DOC_STATUS.md` の「Web クライアント UX/Features」行へ RUN_ID と証跡パスを追記する。
- 証跡パス（今回指示されたもの）:
  - `docs/server-modernization/phase2/operations/logs/20251209T094600Z-debug.md`
  - `artifacts/webclient/debug/20251209T150000Z-bugs/`
- 本メモでは DOC_STATUS への書き込みは未実施。実施時は同 RUN_ID を備考に併記し、README/manager checklist と同日付で同期する。

## 4. 更新対象・非対象の整理
- **対象**: 外来デバッグ関連の運用ログ/証跡（上記パス）と DOC_STATUS 備考欄。必要に応じて `docs/web-client/operations/debugging-outpatient-bugs.md` へ追記。
- **非対象**: `server/` 以下の旧サーバー資産や Legacy クライアント資産（`client/`, `common/`, `ext_lib/`）には手を入れない。

## 5. 次アクション（メモ）
- 指定 RUN_ID を使って追加ログを取得した後、DOC_STATUS と関係ハブ（README / manager checklist / debugging-outpatient-bugs）に同 RUN_ID・証跡を同期する。
- Stage/Preview 復旧後の再検証ログも同 RUN_ID でまとめる。
