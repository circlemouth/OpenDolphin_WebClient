# Web クライアント ドキュメントハブ（RUN_ID=`20251211T075709Z`）
> 2025-12-11 時点の最新版。デバッグ用 Web クライアント（ログイン＋Reception/Charts/Outpatient Mock シェル）を起点に、フル電子カルテ版の実装計画を整理した。

## 概要
- 現行実装はログイン＋デモシェルのみが実 API 接続（ログイン API）。Reception/Charts/Outpatient Mock では RUN_ID を発行し tone/banner carry-over を確認できる。
- 今後の開発は `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` を主計画として、画面別仕様・API・UX・テレメトリを統合して進める。
- ドキュメント更新時はガバナンスチェーン `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → マネージャーチェックリストを踏襲し、RUN_ID／証跡／DOC_STATUS を同一値で併記する。

### 最新更新サマリ（2025-12-11 / RUN_ID=`20251211T075709Z`）
- docs/web-client 配下とデバッグ UI を網羅レビューし、画面別の必須機能・API・ARIA/監査・テレメトリを統合した実装計画書を新設。
- README / DOC_STATUS を再構成し、Active 文書の入口と証跡を明示。
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251211T075709Z-web-client-plan.md`。

## 現在のドキュメント（Active）
- `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` — 画面別実装計画（本更新の中心）。
- `planning/phase2/DOC_STATUS.md` — 棚卸し台帳（RUN_ID 同期済み）。
- `architecture/future-web-client-design.md` — 次期画面配置と機能サマリ（RUN_ID=`20251210T141208Z`）。
- `architecture/web-client-api-mapping.md` — 外来 API マッピングと監査メタ（RUN_ID=`20251208T124645Z`）。
- UX ポリシー: `ux/reception-schedule-ui-policy.md`, `ux/charts-claim-ui-policy.md`, `ux/patients-admin-ui-policy.md`, `ux/config-toggle-design.md`, `ux/admin-delivery-validation.md`, `ux/playwright-scenarios.md`, `ux/ux-documentation-plan.md`。
- Ops/Debug: `operations/debugging-outpatient-bugs.md`（外来 API 差分ログ）。
- 証跡ログ: `planning/phase2/logs/20251211T075709Z-web-client-plan.md` ほか、過去 RUN_ID は DOC_STATUS を参照。

## 参考（Archive / Legacy）
- ログイン専用化までの計画・ログ (`planning/phase2/LOGIN_REWORK_PLAN.md`, `planning/phase2/logs/20251130T120000Z-login-rework.md` など) は Archive として保持。詳細は `docs/archive/2025Q4/web-client/legacy-archive.md` と DOC_STATUS の Legacy セクションを参照。
- 旧 RUN_ID（`20251203T203000Z` 等）のロールオフ手順: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md`。証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md`。

## 運用方針
1. 新規ドキュメント作成時は DOC_STATUS 備考に RUN_ID・証跡パスを追記し、本 README の Active リストへリンクを追加する。
2. Stage/Preview での実 API 検証は `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` のロードマップに沿い、証跡を `planning/phase2/logs/<RUN_ID>-*.md` と `docs/server-modernization/phase2/operations/logs/` に残す。
3. Active でない資料は `docs/archive/<YYYYQn>/` へ移し、RUN_ID を揃えて履歴管理する。

## ORCA 接続の現行方針
- 接続先・証明書は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を唯一のルールとして参照。違反となる WebORCA トライアル接続や `curl --cert-type P12` の乱用は禁止。
- `VITE_DISABLE_MSW` / `VITE_DEV_PROXY_TARGET` を用いた実 API 検証は証跡ログに RUN_ID 付きで保存する（例: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md`）。

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`（本ファイル）
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## Legacy 参照
- `docs/archive/2025Q4/web-client/legacy-archive.md` に旧ドキュメント一覧と削除時の背景を保持。必要に応じて Git 履歴から復元し、RUN_ID を共有する。
