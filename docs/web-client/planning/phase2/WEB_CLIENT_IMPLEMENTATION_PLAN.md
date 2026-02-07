# Web クライアント実装計画書（RUN_ID=20251211T172459Z）

> 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本計画書。証跡ログ: `docs/web-client/planning/phase2/logs/20251211T172459Z-runid-governance.md`。
> 本計画は **電子カルテとして必要な Reception / Charts / Patients / Administration / 共通基盤** の機能を画面単位で網羅し、`web-client/src` のデバッグ UI と既存 UX/設計ドキュメントを統合した最新版です。

## 1. 前提・インプット
- 対象: 外来ワークフロー（受付→診療→会計）、患者管理、管理設定。入院系は範囲外。
- 実装ベース: `web-client/src/AppRouter.tsx`（RUN_ID 発行とナビ）、`features/reception/*`（ToneBanner/ResolveMaster/StatusBadge）、`features/charts/*`（AuthService + tone carry）、`features/outpatient/OutpatientMockPage.tsx`（MSW/telemetry プレフライト）。
- 参照ドキュメント: `architecture/future-web-client-design.md`, `architecture/web-client-api-mapping.md`, `ux/*`（reception/charts/patients-admin/config-toggle/admin-delivery/playwright-scenarios）。
- トーン語彙: `tone`(info/warning/error), `missingMaster`, `cacheHit`, `dataSourceTransition`, `resolveMasterSource`, `runId`。全て `auditEvent` と `telemetryClient` に透過。

## 2. 画面別の必須機能と仕様
以下は **UIレイアウト / データ入出力 / ARIA+監査 / 依存API / テレメトリ** をまとめた実装 ToDo であり、各項目を完了時に DOC_STATUS へ Active 記載する。

### 2.1 Login
- フォーム: 施設ID / ユーザーID / パスワード / clientUUID、入力検証とエラー表示 (role=alert, aria-live=assertive)。
- 認証: `/user/{facility:user}` GET、MD5 パスワード、成功で `runId` 発行・SessionContext 保存。
- 開発用: seed 保存 (localStorage) と RUN_ID コピー機能。ログは `audit.loginSuccess` に runId/traceId を記録。

### 2.2 グローバルシェル（全画面共通）
- Topbar: ブランド、施設、ユーザー、RUN_ID Pill、ログアウト。RUN_ID はクリックコピー可能。
- 左ナビ: Reception / Charts / Patients / Administration / Outpatient Mock。権限不足タブは disabled＋ツールチップ、警告件数バッジを表示。
- 通知: トーストスタック3件まで、Esc で閉じる。`role=status`。
- 状態共有: `AuthServiceProvider` で `missingMaster/cacheHit/dataSourceTransition/runId` を単一ソースに保持し Router へ注入。

### 2.3 Reception（受付・オーダー入口）
- ヘッダー: 日付/時刻、検索（診察券/氏名/生年月日/カナ）、フィルタ（診療科・診療種別・担当医・自費）、ソート。検索結果件数を aria-live=polite で告知。
- バナー: ToneBanner 1箇所（`tone=server`=warning assertive、error=alert、info=polite）。`data-run-id` と destination/nextAction を含む。
- リスト: 状態別セクション（受付中/診療中/会計待ち/会計済み）、件数バッジ、折りたたみ保持。列: 状態、患者ID、氏名、来院時刻、保険/自費、直近診療、ORCAキュー、メモ。行ダブルクリックで Charts 新タブ。
- 右ペイン: 患者概要カード、直近診療、オーダー概要、missingMasterノート。`OrderConsole` を統合し masterSource 切替・missingMaster/cacheHit トグル・ノート入力（aria-live=assertive when missingMaster=true）。
- API: `/orca/appointments/list/*`, `/orca/visits/list/*`, `/api/orca/queue`。呼び出し時に `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` をヘッダーと audit.details に送付。
- テレメトリ: `telemetryClient.recordOutpatientFunnel('resolve_master', …)`。フラグ変化ごとに stage 名と transition を記録。

### 2.4 Charts（カルテ・診療記録）
- ヘッダー: 患者基本/受付ID/保険-自費トグル、`dataSourceTransition` Pill、`runId` 表示。
- アクションバー: 診療終了、ORCA送信、ドラフト保存、キャンセル。missingMaster=true で送信を無効化し警告トースト。
- DocumentTimeline: ToneBanner + タイムライン (受付→診療→ORCAキュー)、missingMaster 行ハイライト。`aria-live` は tone に応じて assertive/polite。
- OrcaSummary: 請求/予約サマリ、`cacheHit`/`missingMaster` バッジ、`dataSourceTransition` 説明、fallbackUsed 時の警告。
- PatientsTab: 検索/一覧/詳細タブ（基本・保険・過去受診）。missingMaster=true で編集禁止、unlock は tone banner で案内。
- API: `/orca21/medicalmodv2/outpatient`、`/orca/appointments/list/*`、患者編集は `/orca12/patientmodv2/outpatient`。
- テレメトリ: `recordOutpatientFunnel('charts_orchestration', …)` と `audit.logUiState`（recordsReturned, traceId）。

### 2.5 Patients（患者管理）
- 左メニュー: フィルタ（診療科/担当医/属性/自費）、保存ビュー、Reception からのフィルタを復元。URL と localStorage 同期。
- 一覧: 状態バッジ（未紐付/要再送）、患者ID/氏名/次回予約/保険。行アクション: 編集、Receptionへ戻る。未紐付は warning + トースト。
- 右詳細: 編集フォーム、監査ログビュー、ORCA反映ステータス。保存で `auditEvent` に operation=create|update|delete と runId を送付。
- API: `/orca12/patientmodv2/outpatient`。`missingMaster`/`fallbackUsed` で保存禁止。

### 2.6 Administration（設定配信）
- ヘッダー: 配信モード（即時/次回リロード）、最終配信時刻、対象環境 (dev/stage/preview)。
- 設定フォーム: ORCA 接続先・証明書パス・ヘルスチェック間隔・MSW/モックトグル・配信フラグ。保存で broadcast と audit を送信。
- 配信キュー: 未配信バンドル、再送/破棄ボタン、遅延警告バナー。system_admin 権限のみ活性。
- 通知: Reception/Charts へバナーで設定変更を告知。

### 2.7 Outpatient Mock（QA/モック）
- 目的: MSW/Playwright で `cacheHit/missingMaster/dataSourceTransition` を注入し telemetry funnel を確認。
- 機能: `/orca21/medicalmodv2/outpatient` を POST して Flags を hydrate、ResolveMasterBadge と ToneBanner を Reception/Charts 両方で表示、funnel ログを画面表示し window へエクスポート。
- 使い分け: `VITE_DISABLE_MSW=1` で実 API、デフォルトは MSW フィクスチャ。

### 2.8 共通品質
- A11y: 主要バナーは `role=alert|status` + `aria-live`、`aria-atomic=false` で二重読み上げ回避。テーブル行にキーボードフォーカス移動、フォームに `aria-describedby`。
- 監査: 全 API に `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/recordsReturned/operation` を透過。UI 操作は `audit.logUiState` に残す。
- パフォーマンス: React Query キャッシュで `cacheHit` を制御、長時間 API 呼び出しにはスケルトン + トースト。
- エラー/復旧: 401/404/timeout 時の再送、fallbackUsed=true で警告。Stage/Preview の DNS/証明書失敗は telemetry に `reason` を付与。

## 3. 実装ロードマップ
1) **Shell/Base (Short)**: RUN_ID コピー・通知スタック・AuthService 共有化・ナビ権限ガード。受け口の tone banner を共通化。
2) **Reception/Charts 接続 (Mid)**: OUTPATIENT_API_ENDPOINTS と `resolveMasterSource` を本番ルートへ配線。`telemetryClient` の funnel を UI に表示し、missingMaster/cacheHit を carry-over。
3) **Patients/Administration (Mid)**: 患者編集/設定配信を API 化、監査ログとエラー表示を統合。配信キュー UI とトースト導線を追加。
4) **E2E/Monitoring (Late)**: Playwright で tone/aria-live/telemetry の自動確認、Stage/Preview 実 API で HAR と metrics を採取。運用 runbook と接続証跡を DOC_STATUS に同期。

## 4. テスト計画（要自動化）
- Unit: `ux/charts/tones.ts`、`telemetryClient` のパス分岐。
- Component: ToneBanner/ResolveMasterBadge/StatusBadge の aria-live・文言スナップショット。
- E2E (Playwright): Reception→Charts tone chain、Patients 保存ガード、Administration 配信キュー、Outpatient Mock funnel。MSW ON/OFF 両モード。
- Observability: `traceId/runId` が API 応答と telemetry ログに一致することを検証。

## 5. ドキュメント運用
- 本計画をハブに、画面別詳細は `docs/web-client/ux/*.md`、API 詳細は `architecture/web-client-api-mapping.md` にリンクする。
- 変更時は RUN_ID を再採番し、`planning/phase2/DOC_STATUS.md` 備考へ RUN_ID + 証跡ログを追記、README の Active リストを更新する。
- Stage/Preview 実行時は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を遵守し、ログを `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へ保存。
