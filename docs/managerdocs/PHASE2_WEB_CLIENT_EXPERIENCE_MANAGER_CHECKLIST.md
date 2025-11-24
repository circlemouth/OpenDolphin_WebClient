# Phase2 Web クライアント Experience マネージャーチェックリスト（2025-11-14）

> **参照開始順**
> 1. `AGENTS.md`
> 2. `docs/web-client/README.md`（Web Client Hub）
> 3. `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` → `ux/ONE_SCREEN_LAYOUT_GUIDE.md` → `ux/KARTE_SCREEN_IMPLEMENTATION.md`
> 4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
>
> **報告テンプレ（RUN_ID / 証跡パス / DOC_STATUS 行）**
> - RUN_ID: `RUN_ID=<ID>`（ドキュメントのみは `RUN_ID=NA`）
> - 証跡パス: `docs/web-client/...`, `artifacts/...`, `logs/...`（更新したカテゴリを列挙）
> - DOC_STATUS 行: `docs/web-client/planning/phase2/DOC_STATUS.md`「Web クライアント UX/Features」行の更新内容
>
> **Archive 移行チェック（担当: Codex, 期限: 2025-11-29）**
> - [ ] Dormant 判定と根拠リンク
> - [ ] `docs/archive/2025Q4/` への移動と README / Hub からのリンク差替
> - [ ] `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` / `DOC_STATUS.md` 備考へアーカイブ結果を反映
>
> **開発端末手順の現行/Legacy 判定**
> - [ ] `docs/web-client/operations/mac-dev-login.local.md` = 現行手順
> - [ ] `docs/web-client/operations/mac-dev-login.local.md` = Legacy / Archive（Archive 候補時は DOC_STATUS と同期）

## 1. 背景
- Web クライアント関連資料は `docs/web-client/README.md` をハブとして「architecture / process / features / operations / ux / design-system」に整理されている。最新の棚卸しは `planning/phase2/DOC_STATUS.md`（Active 行: README, REPOSITORY_OVERVIEW, WEB_CLIENT_REQUIREMENTS, SERVER_MODERNIZATION_PLAN など）で管理。
- カルテ UI 変更時は `ux/CHART_UI_GUIDE_INDEX.md` → `ux/ONE_SCREEN_LAYOUT_GUIDE.md` → `ux/KARTE_SCREEN_IMPLEMENTATION.md` の順で要件を確認する。ChartsPage 系のタスクは AGENTS.md でも同様の参照が必須。
- Features カテゴリには CareMap/Lab/予約/証明書など業務別ガイドがあり、UI 改修や API 仕様変更時は関連ファイルをすべて更新する必要がある。
- Operations カテゴリ（`LOCAL_BACKEND_DOCKER.md`, `mac-dev-login.local.md`, `LEGACY_INTEGRATION_CHECKS.md`, `TEST_SERVER_DEPLOY.md` 等）はワーカーの環境構築・検証手順の基盤。証跡や secrets の取り扱いは各 Runbook に準拠。

## 2. 参照ドキュメントマップ
| 区分 | ドキュメント | 内容 / 役割 | 最終更新（2025-11-時点） |
| --- | --- | --- | --- |
| ハブ & 棚卸し | `docs/web-client/README.md` / `planning/phase2/DOC_STATUS.md` | 全資料ナビゲーションと Active/Dormant/Archive 管理。 | README: 2025-11-07 / DOC_STATUS: 2025-11-07 |
| アーキテクチャ | `architecture/REPOSITORY_OVERVIEW.md`<br/>`architecture/WEB_CLIENT_REQUIREMENTS.md`<br/>`architecture/SERVER_MODERNIZATION_PLAN.md` | リポジトリ構成・機能/非機能要件・サーバー計画。 | 2025-11-12 / 2025-11-12 / 2025-11-15 |
| プロセス | `process/ROADMAP.md`<br/>`process/SWING_PARITY_CHECKLIST.md`<br/>`process/API_UI_GAP_ANALYSIS.md`<br/>`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` | マイルストーンと UI/API ギャップ、セキュリティ改善。 | 2025-11-05〜11-12 |
| UX & デザイン | `ux/CHART_UI_GUIDE_INDEX.md`<br/>`ux/ONE_SCREEN_LAYOUT_GUIDE.md`<br/>`ux/KARTE_SCREEN_IMPLEMENTATION.md`<br/>`design-system/ALPHA_COMPONENTS.md` | ChartsPage レイアウト、レール比率、コンポーネント設計。 | 2025-11-01 / 2025-11-01 / 2025-11-01 / 2025-11-04 |
| 機能別ガイド | `features/CARE_MAP_TIMELINE.md`<br/>`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`<br/>`features/FACILITY_SCHEDULE_VIEW.md`<br/>`features/LAB_RESULTS_VIEWER.md`<br/>`features/ORDER_ENTRY_DATA_GUIDE.md`<br/>`features/MEDICAL_CERTIFICATES_AND_SCHEMA.md`<br/>`features/PHASE3_STAMP_AND_ORCA.md` | CareMap／受付／予約／検査／オーダ／文書／スタンプの仕様。 | 2025-11-01〜11-08 |
| 運用・手順 | `operations/LOCAL_BACKEND_DOCKER.md`<br/>`operations/mac-dev-login.local.md`<br/>`operations/CAREMAP_ATTACHMENT_MIGRATION.md`<br/>`operations/DEV_MSW_MOCKS.md`<br/>`operations/LEGACY_INTEGRATION_CHECKS.md`<br/>`operations/TEST_SERVER_DEPLOY.md` | ローカル環境、ログイン情報、MSW モック、統合・テスト手順。 | 2025-11-06〜11-13 |

## 3. タスクボード
- [ ] **タスクA: ハブ/棚卸し同期（担当A）**
  - [x] `docs/web-client/README.md` のカテゴリ一覧を最新化し、追加・更新した資料へ必ずリンクを追記する。（2025-11-16 RUN_ID=`20251116T170500Z`: `ux/API_SURFACE_AND_AUDIT_GUIDE.md` を追記）
  - [ ] `planning/phase2/DOC_STATUS.md` の Web クライアント行（README / architecture 系）を確認し、最終レビュー日と担当者を 2025-11 週次へ更新。
  - [ ] `README` に追加したリンクを `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` の Web クライアント行にも反映。
  - [ ] 【完了報告必須】更新内容・参照した行番号・RUN_ID（該当なしなら `RUN_ID=NA`）を記載。
- [ ] **タスクB: UX / ChartsPage 要件精査（担当B）**
  - [ ] `ux/CHART_UI_GUIDE_INDEX.md` → `ONE_SCREEN_LAYOUT_GUIDE.md` → `KARTE_SCREEN_IMPLEMENTATION.md` の順に確認し、レイアウト変更や新規ガイドが必要な場合はチェックリストへタスクを追加。
  - [ ] `features/CARE_MAP_TIMELINE.md` と `design-system/ALPHA_COMPONENTS.md` を突合し、DocumentTimeline や SafetySummaryCard など共通コンポーネントの状態管理が一致しているか確認。
  - [ ] ChartsPage 関連の作業をワーカーへ渡す際は、AGENTS.md で指定された UX 資料を参照済みかどうかをチェックし、【ワーカー指示】内に参照順序を記載。
  - [ ] 進捗は `DOC_STATUS.md` の「モダナイズ/カルテ UX」行（未作成の場合は行を追加）に残す。
- [ ] **タスクC: 機能別ガイド更新（担当C）**
  - [ ] `features/*.md` を API/UI ギャップ表（`process/API_UI_GAP_ANALYSIS.md`）と突合し、未反映の仕様差分や API 対応状況を補完。
  - [ ] `features/PHASE3_STAMP_AND_ORCA.md` と ORCA 関連 Runbook の整合を確認し、ORCA 側の変更が UI に波及する場合は ORCA マネージャーと連携してタスクを再割当。
  - [ ] 新規ドキュメントを作成した場合は `docs/web-client/features/README.md` が無いため、本チェックリスト §2 と README の該当カテゴリへリンクを追加。
  - [ ] マスターデータ補完ブリッジ（04計画）: 契約テスト結果を `#SP3` に添付し、リスク「完了条件」列に記載の監査メタ完了条件を確認。
  - [ ] SP3 ハッシュ・監査ログを `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP3` に添付（完了日: ____ / 証跡: ____）。
  - [ ] SP4 ハッシュ比較結果・E2E ログを `docs/server-modernization/phase2/operations/logs/20251124T000000Z-webclient-bridge.md#SP4` に添付（完了日: ____ / 証跡: ____）。
- [ ] **タスクD: 運用手順と環境整備（担当D）**
  - [x] Web クライアント Ops task の結果を ORCA/Server マネージャーへ共有する場合は、本チェックリストのタスクD欄に参照先を追記。→ 2025-11-16 RUN_ID=`20251116T170500Z` の UI サーフェス同期ログ（`docs/server-modernization/phase2/operations/logs/20251116T170500Z-orca-ui-sync.md`）を登録。
  - [ ] `operations/LOCAL_BACKEND_DOCKER.md` と `operations/mac-dev-login.local.md` の内容が一致しているか確認し、Secrets/認証情報の取り扱い手順を明記。
  - [ ] `operations/DEV_MSW_MOCKS.md` / `LEGACY_INTEGRATION_CHECKS.md` / `TEST_SERVER_DEPLOY.md` の手順で不足しているログ保存先や証跡をチェックし、必要に応じて `docs/server-modernization/phase2/operations/logs/` や `artifacts/` へのリンクを追加。
  - [ ] Web クライアント Ops task の結果を ORCA/Server マネージャーへ共有する場合は、本チェックリストのタスクD欄に参照先を追記。

## 4. 進捗確認ポイント
- README/DOC_STATUS のリンクと記載内容が一致しているか。
- ChartsPage/UX ガイドに最新レイアウト・ガード条件が反映されているか。
- Features ドキュメントと API/UI GAP 表の整合（差分がある場合はタスクを追加）。
- ローカル環境手順と実際の Secrets/ログ保管ディレクトリが一致しているか。

## 5. ワーカー指示・報告テンプレ
- 【ワーカー指示】には以下を必ず含める:
  1. 対象カテゴリ（Architecture / UX / Features / Operations）。
  2. 必読ドキュメントと参照順序。
  3. 更新後にリンクを追記するファイル（README, DOC_STATUS, 本チェックリスト）。
- 【ワーカー報告】には以下を記載:
  1. 修正ファイル一覧と行番号。
  2. RUN_ID（該当なしは `RUN_ID=NA`）。
  3. 証跡パス（スクリーンショット / artifacts / logs）。
  4. DOC_STATUS 更新有無と対象行。
  5. 追加で必要なワーカー/マネージャーへの連絡事項。

## 6. 更新ルール
- 各タスクのチェックボックスは進捗が変わった日に即更新し、日付入りコメントを残す。
- 本ファイルに記載したドキュメント一覧に追加・削除が発生した場合は、`PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と `docs/web-client/README.md` の両方を同時に更新する。
- ChartsPage 関連の修正を開始する前に、AGENTS.md で要求されている UX ガイド参照ルールが守られているか確認する。

> 最終更新: 2025-11-14 / 担当: Codex（Web クライアント UX/Features マネージャー）
