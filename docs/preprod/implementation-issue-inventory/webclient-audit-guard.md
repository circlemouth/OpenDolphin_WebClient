# Webクライアント 監査ログ/権限ガード UI 棚卸し

- RUN_ID: 20260122T102944Z
- 実施日: 2026-01-22
- 対象: Webクライアント（`web-client/src`）
- 目的: 監査ログ導線と権限ガード UI の実装差分を整理し、未整備点を優先度付きで提示する。
- 参照: `docs/DEVELOPMENT_STATUS.md`, `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照ドキュメント
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/web-client/architecture/future-web-client-design.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`

## 1. 現状の対応範囲（確認済み）

### 1-1. system_admin ガード（UI/導線）
- Navigation: `/administration` は `NAV_LINKS` で role 判定し、未許可時はトースト + 監査ログ（`source=authz`, `note=navigation access denied`）。
- Administration: `isSystemAdminRole` を用いた read-only ガード + 操作ブロック理由表示 + `admin/guard` 監査ログ。
- Debug 系: `/debug/*` は `VITE_ENABLE_DEBUG_PAGES=1` + `system_admin` でゲート。未許可時は画面メッセージ + 監査ログ（`debug access denied`）。

### 1-2. 操作ブロック理由（UI）
- Charts: `ChartsActionBar` / `DocumentTimeline` / `DocumentCreatePanel` などでブロック理由を表示し、`logAuditEvent` へ `blocked` を記録。
- Patients: 編集ブロック理由を UI 表示（master/tone, status, role, draft）。保存ブロック時はトースト表示。
- Administration: system_admin 以外の操作は UI で明示的にブロックし、詳細を `admin/guard` へ記録。

### 1-3. 監査イベント要約（UI）
- Charts: `AuditSummaryInline` で最新監査イベントをメタバーに表示。
- Patients: 監査履歴一覧 + `AuditSummaryInline`（最新監査イベント）を表示。
- Reception: 監査履歴検索パネル（一覧・集計）あり。

## 2. 未整備/差分（優先度付き）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 区分 | 画面/導線 | 現状 | 差分/課題 | 影響 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AG-01 | system_admin ガード | `/f/:facilityId/administration` 直接アクセス | UI 上は read-only ガード + 監査ログのみ。Route レベルでのアクセス遮断なし。 | 直接 URL で閲覧可能（system_admin 以外でも情報が表示される）。「画面ブロック」要件との差分。 | 仕様上の権限境界が UI に依存、情報漏洩リスク。 | `web-client/src/AppRouter.tsx`（`FacilityShell` で administration route を常時登録）、`web-client/src/features/administration/AdministrationPage.tsx` | P1 |
| AG-02 | system_admin ガード | ナビゲーション / `NAV_LINKS` | `roles: ['system_admin']` のみ判定。`admin` / `system-admin` は `isSystemAdminRole` で許可対象だが、ナビは無効扱い。 | ロール同義語の UI/アクセス判定が不一致。 | 正常な管理者でもナビ経由で到達できない。 | `web-client/src/AppRouter.tsx`（`NAV_LINKS` 判定）、`web-client/src/libs/auth/roles.ts` | P2 |
| AG-03 | 操作ブロック理由 | Patients: 保存ブロック (`save`) | UI トースト + `logUiState` のみ。 | 監査ログ（`logAuditEvent`）に「保存ブロック理由」が残らない。 | 監査上、UI ブロックの証跡が不足。 | `web-client/src/features/patients/PatientsPage.tsx`（`save` の blocking 分岐） | P1 |
| AG-04 | 操作ブロック理由 | Charts > PatientsTab: 編集ブロック（role/status/master/tone） | UI にガード理由は表示されるが `logAuditEvent` は未送出。 | 画面上のブロック理由と監査ログが紐付かない。 | 不正操作・権限制御の追跡が不完全。 | `web-client/src/features/charts/PatientsTab.tsx`（`guardMessage` / 編集ブロック判定） | P1 |
| AG-05 | 操作ブロック理由 | Reception: Charts 新規タブ遷移（patientId 欠損） | `logUiState` に `blockedReason` を記録するが、ユーザー通知や監査イベントはなし。 | UI では理由が見えず、監査にも残らない。 | 受付担当の「遷移失敗理由」が可視化されない。 | `web-client/src/features/reception/pages/ReceptionPage.tsx`（`handleOpenChartsNewTab`） | P2 |
| AG-06 | 監査イベント要約 | Administration / Debug / Reception（トップ） | Charts/Patients にのみ `AuditSummaryInline`。Administration/Debug/Reception は最新要約が未表示。 | 監査イベント要約の UI が画面間で非統一。 | 運用時の「最新監査状態」把握が画面によりばらつく。 | `web-client/src/features/shared/AuditSummaryInline.tsx`, `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/patients/PatientsPage.tsx` | P2 |

## 3. 補足メモ
- Administration のガードは UI/ARIA/監査ログまで整備済みだが、**閲覧遮断ではなく read-only** である点が差分。
- 患者編集・保存ブロックは UI の理由表示はあるが、監査ログとしては UI 操作ログ（`logUiState`）止まり。
- Reception の監査パネルは履歴検索が可能だが、最新監査イベントの「要約ピル」などは存在しない。

## 4. 次アクション案（ドラフト）
- AG-01/02: `AppRouter` の `Route`/`NAV_LINKS` 判定を `isSystemAdminRole` へ統一し、未許可は 403 相当の明示ブロックへ寄せる。
- AG-03/04/05: UI ブロック時に `logAuditEvent` を追加し、`outcome=blocked` と詳細理由（role/status/master/tone/ID欠損）を `payload.details` に統一。
- AG-06: `AuditSummaryInline` を Reception/Administration のヘッダに追加し、最新監査イベントを一貫表示。
