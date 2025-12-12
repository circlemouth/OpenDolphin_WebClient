# 02 ChartsPage 現状棚卸しとギャップ（webclient charts production outpatient plan）

- RUN_ID: `20251212T140014Z`
- 期間: 2025-12-17 09:00 〜 2025-12-19 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: gemini cli（棚卸し担当: codex）
- YAML ID: `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md`
- 突き合わせ対象:
  - 計画: `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md`（特に 2.4 Charts）
  - 実装: `web-client/src/features/charts/*`
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251212T140014Z-charts-page-gap.md`

## 0. 結論（現状の位置づけ）
- 現状の `ChartsPage` は **「ORCA トーン連携デモ」** として、`runId/missingMaster/cacheHit/dataSourceTransition` の carry-over と `aria-live` の基本形、テレメトリの funnel 連携を確認する実装になっている（本番業務フローの “診療記録作成/保存/送信/会計/印刷” は未統合）。
- 計画書 2.4 が求める “運用可能な Charts（カルテ）” との間には、**患者コンテキスト・監査粒度・実 API 連携・編集/保存/送信の実体** が大きく不足している。

---

## 1. 現状棚卸し（実装が提供しているもの）

### 1.1 画面構造（`web-client/src/features/charts/pages/ChartsPage.tsx`）
- `ChartsPage` は `ChartsContent` を描画し、ヘッダーに “デモ説明” と `RUN_ID / dataSourceTransition / missingMaster / cacheHit` の pill を表示。
- `AdminBroadcastBanner` で Administration 配信通知を表示（surface=`charts`）。
- Cards として以下を表示:
  - `ChartsActionBar`（送信/ドラフト/診療終了/キャンセル/ロック解除）
  - `AuthServiceControls`（フラグ手動切替）
  - `DocumentTimeline`（Reception 由来の一覧・トーン・監査イベント表示）
  - `OrcaSummary`（`/orca21/medicalmodv2/outpatient` 応答の “サマリ/プレビュー”）
  - `PatientsTab`（Reception 由来の患者一覧・詳細の簡易表示、メモの疑似編集）
  - `TelemetryFunnelPanel`（funnel ログ表示）

### 1.2 データ取得（現状の API 連携）
- `fetchClaimFlags()`（`web-client/src/features/reception/api.ts`）:
  - 候補: `/api01rv2/claim/outpatient/mock` → `/api01rv2/claim/outpatient`
  - 目的: `runId/cacheHit/missingMaster/dataSourceTransition/fallbackUsed/auditEvent` を取得（2分間隔でポーリング）
- `fetchAppointmentOutpatients({date})`（`web-client/src/features/reception/api.ts`）:
  - 候補: `/api01rv2/appointment/outpatient/list` → `/api01rv2/appointment/outpatient` → `/api01rv2/appointment/outpatient/mock`
  - 目的: ReceptionEntry を取得（UI 上は “患者一覧” の材料）
  - 注意: 空の場合は `SAMPLE_APPOINTMENTS` を埋める（障害を覆い隠す可能性）
- `fetchOrcaOutpatientSummary()`（`web-client/src/features/charts/api.ts`）:
  - 候補: `/orca21/medicalmodv2/outpatient`
  - 目的: 応答 payload をサマリ表示し、observability meta を更新

### 1.3 監査/テレメトリ（現状）
- UI 監査:
  - `ChartsActionBar` が `logUiState()` と `logAuditEvent()` を実行（ただし “疑似実行”）。
  - `AuthServiceProvider` が flag 変更を `logUiState(action=tone_change)` と `recordOutpatientFunnel('resolve_master', ...)` で記録。
- テレメトリ:
  - `handleOutpatientFlags()` が `recordOutpatientFunnel('charts_orchestration', ...)` を記録。
  - `ChartsActionBar` が `recordOutpatientFunnel('charts_action', ...)` を記録。
- 欠落:
  - 計画書にある `audit.logUiState(action=ORCA_CLAIM_OUTPATIENT, recordsReturned, traceId)` の粒度/命名に未到達。
  - `patientId/encounterId` 等の業務コンテキストが監査へ一貫して入っていない。

---

## 2. 計画（2.4 Charts）との突き合わせ（要件→実装→ギャップ）

> 状態: ✅ 実装 / 🟡 部分実装 / ❌ 未実装（本番要件）

### 2.1 UI レイアウト/導線
- ヘッダー: 患者基本/受付ID/保険-自費トグル、`dataSourceTransition` pill、`runId` 表示
  - 現状: 🟡 `runId/dataSourceTransition/missingMaster/cacheHit` の表示はあり（デモ説明中心、患者/受付/保険コンテキストなし）
- “Reception へ戻る” 導線
  - 現状: ❌ Charts から Reception へ戻る UI がない（ナビで手動遷移は可能だが文脈保持なし）

### 2.2 アクション（診療終了/送信/ドラフト/キャンセル）
- missingMaster=true で送信無効化 + 警告トースト
  - 現状: ✅ `ChartsActionBar` でブロック・通知・監査ログ出力あり
- 実際の送信/保存/キャンセルの API 統合
  - 現状: ❌ `sleep()` による疑似実行（業務結果が残らない）

### 2.3 DocumentTimeline（時系列/トーン/ハイライト）
- ToneBanner + タイムライン、missingMaster 行ハイライト、`aria-live` のトーン連動
  - 現状: 🟡 基本形は実装（一覧は ReceptionEntry ベースで “医療記録” の時系列ではない）
- “受付→診療→ORCAキュー” の業務時系列としての表現
  - 現状: ❌ キュー状態はバッジ的に提示されるが、診療記録/送信結果の履歴としては未統合

### 2.4 OrcaSummary（請求/予約サマリ + バッジ/警告）
- `cacheHit/missingMaster/dataSourceTransition/fallbackUsed` の説明・警告
  - 現状: 🟡 表示とトーンはあり（“請求/予約サマリ” の業務情報としては未整備）
- “請求（会計）” と “予約” の統合表示（計画書の意図）
  - 現状: ❌ `medicalmodv2/outpatient` の payload プレビュー中心で、会計向けサマリ/印刷導線なし

### 2.5 PatientsTab（検索/一覧/詳細/編集ガード）
- missingMaster=true で編集禁止（ガード文言、案内）
  - 現状: 🟡 `missingMaster` または `dataSourceTransition!==server` で readOnly にする実装はある
- “基本・保険・過去受診” のタブ構成 + `/orca12/patientmodv2/outpatient` への更新
  - 現状: ❌ ReceptionEntry を流用した簡易表示で、患者更新 API は未統合

### 2.6 監査（auditEvent / 操作ログ）
- 全操作の `audit.logUiState`（業務結果に紐づける粒度、traceId 等）
  - 現状: 🟡 UI 操作ログはあるが、命名/粒度/必要メタ（traceId, encounter 等）が不足
- “recordsReturned”等のサーバ応答メタと結びつく監査
  - 現状: ❌ 画面上に表示はあるが、監査規約として固定されていない

---

## 3. ギャップ分類（P0/P1/P2）

### P0: 運用不可（本番フローが成立しない）
- 実アクション未統合: 診療終了/送信/ドラフト/キャンセルが “疑似実行” で業務結果が残らない（`ChartsActionBar`）。
- 患者コンテキスト不足: Charts ヘッダーに患者/受付/保険or自費/診療科が無く、刷新/直リンク/再読込で文脈が消える（`navigate('/charts', { state })` 依存）。
- 患者更新ができない: `PatientsTab` は簡易表示で `/orca12/patientmodv2/outpatient` による更新が未実装（保険・公費含む）。
- 会計/印刷の導線が無い: 請求サマリの業務表示/会計状態遷移/印刷・出力が未実装（計画書 2.5 との連携含む）。
- 監査の粒度/必須メタ不足: action 命名（例: ORCA_CLAIM_OUTPATIENT 相当）、traceId、patientId/encounterId 等が固定されていない。

### P1: 運用に支障（成立はするが事故/手戻りが大きい）
- エラー可視化不足: 取得失敗時でもサンプルデータで “それっぽく表示” され、障害検知が遅れる（`fetchAppointmentOutpatients()`）。
- `aria-live` の一貫性: 成功トーストも `assertive` など、優先度に応じた通知制御が不十分（特に `ChartsActionBar`）。
- “戻る/再取得” の業務導線不足: missingMaster/fallbackUsed からの復帰（Reception での解決→Charts 再送）を明示する UI が弱い。

### P2: 品質改善（UX/保守性/観測性）
- Charts の表示が “デモ説明” 中心で、業務 UI としての情報設計が未確定（見出し/カード粒度/用語）。
- 監査・テレメトリのイベント名/属性が画面ごとに揺れる余地がある（規約化が必要）。
- コンテキスト入力（patientId/appointmentId）の永続化（URL パラメータ化、localStorage、またはサーバ再取得）方針未決。

---

## 4. Charts 外の依存（入口/出口）と責務分離（決定案）

### 4.1 入口（Reception → Charts）
- 入口責務（Reception）:
  - “患者/受付/予約/保険” の選択と、その時点の `runId` を確定して遷移する
- 入口責務（Charts）:
  - URL から復元できる形で “患者コンテキスト” を受け取り、欠ける場合は Reception へ誘導（または患者選択 UI を提供）
- 決定案:
  - `location.state` 依存をやめ、`/charts?patientId=...&appointmentId=...` 等へ移行（リロード耐性・共有可能性を優先）

### 4.2 出口（Charts → Patients）
- 出口責務（Charts）:
  - 患者サマリの閲覧（Read）と “編集が必要なときの誘導”
- 出口責務（Patients）:
  - 患者基本/保険/公費の編集（Write）と監査（operation=create|update|delete）
- 決定案:
  - Charts 内 `PatientsTab` は “閲覧/ガード/リンク” に絞り、編集は `PatientsPage` に委譲（戻り時に Charts が再取得して反映）

### 4.3 出口（Charts → Administration）
- Charts 側の責務:
  - 配信通知の表示（AdminBroadcastBanner）と “再読込/再取得” の案内
- Administration 側の責務:
  - 接続先/配信/キューの管理と権限ガード

---

## 5. 次タスク（本棚卸しからの派生）
- P0 優先: “Charts の患者コンテキストを URL で固定” → “送信/ドラフトの実 API 統合” → “患者更新の round-trip（Patients へ委譲）”。
- P1 優先: “サンプルデータ注入は MSW のみに限定し、実 API 失敗を UI に出す” → “通知（aria-live）規約の統一”。

