# Web クライアント ドキュメントハブ（RUN_ID=`20251214T082236Z`）
> 2025-12-14 時点の最新版。デバッグ用 Web クライアント（ログイン＋Reception/Charts/Outpatient Mock シェル）を起点に、フル電子カルテ版の実装計画を整理した。

## 概要
- 現行実装はログイン＋デモシェルのみが実 API 接続（ログイン API）。Reception/Charts/Outpatient Mock では RUN_ID を発行し tone/banner carry-over を確認できる。
- 今後の開発は `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` を主計画として、画面別仕様・API・UX・テレメトリを統合して進める。
- ドキュメント更新時はガバナンスチェーン `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → マネージャーチェックリストを踏襲し、RUN_ID／証跡／DOC_STATUS を同一値で併記する。

### 最新更新サマリ（2025-12-14 / RUN_ID=`20251214T082236Z`）
- module_json JSON 化手順を README / server-modernized Operations に反映し、RUN_ID=`20251214T082236Z` で証跡を整理。新規 Runbook `docs/server-modernization/phase2/operations/MODULE_JSON_DEVELOPMENT.md` を追加し、beanJson 優先・beanBytes フォールバック、polymorphic typing、Flyway `V0225` 前提と検証手順を明文化（証跡: `docs/web-client/planning/phase2/logs/20251214T082236Z-module-json-docs.md`）。
- module_json ガントの親 RUN=`20251214T022944Z` を維持しつつ、キックオフ・Flyway・Converter・KarteServiceBean 組み込みの各ドキュメント/ログを参照チェーンで統一。
- module_json テスト/ビルド検証（RUN_ID=`20251214T084510Z`）を実施。ModuleJsonConverter 正常系の単体テストを追加し Maven ビルド成功。perf-env-boot.js 修正後に msw smoke 1/1 pass（証跡: `docs/web-client/planning/phase2/logs/20251214T084510Z-module-json-test-build.md`）。
- Charts 外来の fetch レイヤー統一、エラー/リトライ規約、セッション/権限ガード、API 契約テーブルなど 2025-12-13 までの更新内容は据え置き（次の UI 実装タスク開始待ち）。

## 現在のドキュメント（Active）
- `src/modernization/module_json/キックオフ_RUN_ID採番.md` — module_json モダナイズ計画ガント起点（RUN_ID=`20251214T022944Z`）。
- `src/modernization/module_json/テストとビルド検証.md` — module_json テスト/ビルド/Smoke（RUN_ID=`20251214T084510Z`）。
- `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` — 画面別実装計画（本更新の中心）。
- `planning/phase2/DOC_STATUS.md` — 棚卸し台帳（RUN_ID 同期済み）。
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` — Charts Production（外来・本番品質）ガント起点（RUN_ID=`20251212T130647Z`）。
- `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md` — Charts 本番外来（受付→診療→会計）カバレッジ定義（RUN_ID=`20251212T131901Z`）。
- `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md` — ChartsPage の現状棚卸しとギャップ（RUN_ID=`20251212T140014Z`）。
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md` — Charts 外来 API 契約（監査・UI 透過・再試行/ガードの単一ソース、RUN_ID=`20251212T143720Z`）。
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md` — Charts セッション/権限ガード方針（RUN_ID=`20251213T000432Z`）。
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md` — Charts エラー/リトライ規約（RUN_ID=`20251213T121500Z`）。
- `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md` — Charts 外来 fetch レイヤー統一（RUN_ID=`20251213T133932Z`）。
- `architecture/future-web-client-design.md` — 次期画面配置と機能サマリ（RUN_ID=`20251210T141208Z`）。
- `architecture/web-client-api-mapping.md` — 外来 API マッピングと監査メタ（RUN_ID=`20251208T124645Z`）。
- UX ポリシー: `ux/reception-schedule-ui-policy.md`, `ux/charts-claim-ui-policy.md`, `ux/patients-admin-ui-policy.md`, `ux/config-toggle-design.md`, `ux/admin-delivery-validation.md`, `ux/playwright-scenarios.md`, `ux/ux-documentation-plan.md`。
- Ops/Debug: `operations/debugging-outpatient-bugs.md`（外来 API 差分ログ）。
- 証跡ログ: `planning/phase2/logs/20251214T082236Z-module-json-docs.md`、`planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`、`planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md`、`planning/phase2/logs/20251213T000432Z-charts-session-permission-guard.md`、`planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`、`planning/phase2/logs/20251212T140014Z-charts-page-gap.md`、`planning/phase2/logs/20251212T130647Z-charts-production-outpatient-governance.md`、`planning/phase2/logs/20251212T131901Z-charts-outpatient-coverage.md`、`planning/phase2/logs/20251211T172459Z-runid-governance.md`、`planning/phase2/logs/20251211T172459Z-web-client-plan.md`、`planning/phase2/logs/20251211T193942Z-administration-delivery.md`。過去 RUN_ID は DOC_STATUS を参照。
- Charts 実装ログ: `planning/phase2/logs/20251211T120619Z-charts-timeline.md`（DocumentTimeline/OrcaSummary/PatientsTab のデータバインド、RUN_ID=`20251211T120619Z`）。

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
