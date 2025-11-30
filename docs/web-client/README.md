# Web クライアント ドキュメントハブ（ログイン専用版）

## 概要
- 本リポジトリ配下で唯一稼働する Web クライアントはログイン画面のみとなっており、`src/LoginScreen.tsx` で既存 API を直接呼び出す形に再構成されています。
- そのため docs/web-client 以下も最小セットに集約し、不要な機能仕様や UX 施策は削除しました。
- ドキュメント更新時は `AGENTS.md` が示す Phase2 ガバナンス必読チェーン（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → マネージャーチェックリスト）を踏襲し、RUN_ID／証跡／DOC_STATUS を同一値で併記してください。

## 現在のドキュメント一覧（Active）
- `docs/web-client/README.md`（本ファイル）—ログイン画面再構成のハブ。RUN_ID=`20251130T120000Z`。
- `docs/web-client/planning/phase2/DOC_STATUS.md` — doc の棚卸し台帳。RUN_ID=`20251130T120000Z` で更新済。
- `docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md` — ログイン再構成に伴う実装計画と次アクション。
- `docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` — ログイン専用化の経緯と legacy 資料のアーカイブ指針。
- `docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md` — 受付状況処理画面の空枠設計ドラフト。
- `docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md` — カルテ記入画面の空枠設計ドラフト。
- `docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md` — カルテ全般管理画面の空枠設計ドラフト。
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` — 本対応の証跡ログ。README／DOC_STATUS に書かれた RUN_ID と同一。

## 運用方針
1. 本 README 以外の Web クライアント固有ドキュメントを新設する場合、Phase2 DOC_STATUS のコメント欄に RUN_ID・証跡パスを記載し、README にリンクを追加してください。
2. ログイン以外の画面や機能の追加は当面予定にないため、再開時には必ず `planning/phase2/LOGIN_REWORK_PLAN.md` をもとに Scope を再評価してください。
3. 設計証跡や検証ログを残す際は、`docs/web-client/planning/phase2/logs/` 配下に RUN_ID ベースの Markdown を作成し、DOC_STATUS の備考欄にリンクを添えてください。
4. README／DOC_STATUS／新規ドキュメントで RUN_ID を共有していない構成や資料は即時 Archive に移行し、必要なら `docs/archive/<YYYYQn>/` に保存してください。

## 参照チェーン
- `AGENTS.md`（最上位ガバナンス）
- `docs/web-client/README.md`（本ファイル）
- `docs/server-modernization/phase2/INDEX.md`（サーバーモダナイズ連携）
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` など各マネージャーチェックリスト

## Legacy 参照
- `docs/archive/2025Q4/web-client/legacy-archive.md` に旧ドキュメント一覧と削除時の背景をまとめています。必要な内容は Git 履歴（`git log -- docs/web-client/...`）から復元し、再利用する場合は README/DOC_STATUS/LOGIN_REWORK_PLAN/LEGACY_ARCHIVE_SUMMARY の順で RUN_ID を共有してください。

本 README を含むすべての更新には RUN_ID=`20251130T120000Z` を併記し、証跡として `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` を参照してください。
