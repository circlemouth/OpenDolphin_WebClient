# 03 モダナイズ外来 API 契約テーブル確定（webclient charts production outpatient plan）

- RUN_ID: `20251212T143720Z`
- 期間: 2025-12-19 09:00 〜 2025-12-21 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: cursor cli
- YAML ID: `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
- 参照: `docs/web-client/architecture/web-client-api-mapping.md`（RUN_ID=`20251208T124645Z`）、`web-client/src/libs/http/httpClient.ts`、`web-client/src/features/reception/api.ts`、`web-client/src/features/charts/api.ts`、`web-client/src/features/charts/ChartsActionBar.tsx`
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`

---

## 0. 結論（Charts 観点での固定事項）
- 外来 API の単一ソースは `OUTPATIENT_API_ENDPOINTS`（httpClient）と本書の契約テーブル。Playwright も同じ値（header/body/metadata）でフィクスチャを作る。
- `runId/traceId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` は **リクエストヘッダー → サーバ応答 → Observability → UI 表示 → auditEvent/logUiState** の順で透過する。UI で見えない値は監査にも載せない方針を撤廃し、「表示＋監査の両方」で揃える。
- `missingMaster=true` または `fallbackUsed=true` は Charts で “送信/保存/印刷など結果が残る操作” をブロックし、`outcome=BLOCKED` と理由を audit に残す。再試行導線（手動更新/Reception へ戻る）がない状態を禁止する。

---

## 1. 外来 API 契約詳細（呼び出し条件・ヘッダー・監査・UI 反映）

### 1.1 `/api01rv2/claim/outpatient/*`（請求バンドル）
- 呼び出し元/条件: `fetchClaimFlags`（Reception/Charts 初期表示後に 2 分間隔ポーリング、欠損時は mock → server の順にフォールバック）。
- リクエスト: `POST`/`application/json`、ヘッダー `X-Run-Id`/`X-Trace-Id`/`X-Cache-Hit`/`X-Missing-Master`/`X-DataSource-Transition`/`X-Fallback-Used`（Observability）、`x-use-mock-orca-queue`/`x-verify-admin-delivery`（header-flags）、`userName/password/X-Facility-Id`（stored dev auth）。
- レスポンス → UI: `runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt/recordsReturned` を Charts ヘッダー pill と DocumentTimeline/OrcaSummary/PatientsTab/TelemetryFunnel に表示。`missingMaster=true` は ChartsActionBar の送信ガード文言に連動。
- 監査: サーバ `auditEvent.details` に上記 metadata + `claimBundles` 件数。UI 側は `logUiState(screen='charts/action-bar', action='send')` で outcome と理由（missingMaster/fallbackUsed/通信失敗）を必ず記録。
- 再試行/ガード: 非 2xx または `cacheHit=false` は “再取得” ボタンを提示。`missingMaster=true` は送信不可、`fallbackUsed=true` は警告＋送信を保留。

### 1.2 `/api01rv2/appointment/outpatient/*`（予約/来院リスト）
- 呼び出し元/条件: `fetchAppointmentOutpatients({date})`（Charts/Reception の患者リスト表示時）。空レスポンス時のサンプル注入は MSW fixture のみで許可し、実 API では空のまま表示する。
- リクエスト: `POST`、ヘッダーは 1.1 と同一セット（Observability + header-flags + dev auth）。
- レスポンス → UI: `runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt` を患者行の badge とヘッダー pill に表示。`source`（slots/reservations/visits）を ReceptionStatus へマップ。
- 監査: `auditEvent.details` に `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned`。UI 側は `recordOutpatientFunnel('charts_orchestration')` で取得・ポーリング結果を funnel へ追加。
- 再試行/ガード: 5xx/timeout は “再取得” 導線、401/403 は “再ログイン/戻る”。`missingMaster`/`fallbackUsed` true のままでは患者更新・送信の導線を無効化する。

### 1.3 `/orca21/medicalmodv2/outpatient`（外来医療記録）
- 呼び出し元/条件: `fetchOrcaOutpatientSummary`（Charts 初期表示時に 1 回、手動更新時に再実行）。
- リクエスト: `POST`、ヘッダーは 1.1 と同一。`traceId` は必ず生成し `X-Trace-Id` として送信。
- レスポンス → UI: `runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt/recordsReturned` を OrcaSummary と DocumentTimeline の meta 行に表示。`outpatientList` length を `recordsReturned` として扱う。
- 監査: サーバ `auditEvent.action=ORCA_MEDICAL_OUTPATIENT`（想定）で `recordsReturned/outcome/traceId/requestId` を details に格納。UI は `logUiState(action='charts_record_fetch')` を実行し、`traceId` を TelemetryFunnel に併記する。
- 再試行/ガード: 5xx/timeout は “再取得” ボタン＋`aria-live=assertive`。`fallbackUsed=true` は送信/保存/印刷を警告付きで保留。

### 1.4 `/orca12/patientmodv2/outpatient`（患者基本・保険更新）
- 呼び出し元/条件: Patients/Administration からの CRUD（Charts からの “編集” 導線後）。`missingMaster=true` または `dataSourceTransition!==server` の場合は **呼び出し自体をブロック**。
- リクエスト: `POST` もしくは API 定義に応じたメソッド。ヘッダーは 1.1 と同一 + `operation=create|update|delete` を body または query に含める。
- レスポンス → UI: `runId/cacheHit/missingMaster/fallbackUsed` と `operation` を保存結果トーストに表示し、Charts へ戻る際に pill と PatientsTab readOnly 判定を更新。
- 監査: `auditEvent.action=ORCA_PATIENT_MUTATION`、`details` に `operation/patientId/facilityId/runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/traceId/outcome` を必須とする。UI 側も `logUiState(action='patient_update')` を出力。
- 再試行/ガード: `missingMaster/fallbackUsed` は保存禁止（`outcome=BLOCKED`）。409/412 は “再読込してから保存” を案内、5xx/timeout は再試行ボタンを提示。

### 1.5 `/api01rv2/patient/outpatient/*`（患者基本・保険・来院履歴取得）
- 呼び出し元/条件: PatientsTab/PatientsPage の閲覧時。Charts では “閲覧のみ” のため編集導線は PatientsPage へ委譲。
- リクエスト: `POST`/`GET`（API 実装に合わせる）、ヘッダーは 1.1 と同一。
- レスポンス → UI: `runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt` を PatientsTab の meta カラムとヘッダー pill に表示。`missingMaster=true` は “編集不可” バナー表示。
- 監査: `auditEvent.details` に `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned`。UI は `logUiState(action='patient_fetch', screen='patients')` を追加し、missingMaster/fallbackUsed を telemetry に渡す。
- 再試行/ガード: 5xx/timeout で “再取得” 導線。`missingMaster`/`fallbackUsed` true の場合は PatientsTab を readOnly に固定。

---

## 2. 透過ルール（runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed）
- 取得順序: **リクエストヘッダー → レスポンスヘッダー → レスポンスボディ → ObservabilityMeta → UI state → auditEvent/logUiState**。欠損時は既存 meta を温存し、UI と audit で同じ値を表示・記録する。
- UI 露出箇所（最低ライン）:
  - Charts ヘッダー pill: `runId` / `dataSourceTransition` / `missingMaster` / `cacheHit` / `fallbackUsed`
  - DocumentTimeline / OrcaSummary / PatientsTab: meta rowに `runId`/`transition`/`cacheHit`/`missingMaster`/`fallbackUsed`/`recordsReturned`
  - ChartsActionBar: トースト・statusLine に `runId`/`transition`、ガード理由に `missingMaster`/`fallbackUsed`
  - TelemetryFunnelPanel: 各エントリに `runId`/`transition`/`missingMaster`/`cacheHit`/`traceId`
- auditEvent 透過: 上記メタは **全エンドポイントで details に必須**。UI 側 `logUiState` も同じキーで揃え、`outcome=BLOCKED|SUCCESS|ERROR` を明示する。
- Playwright: `extraHTTPHeaders` に `X-Run-Id`/`X-Trace-Id`/`X-DataSource-Transition` 等を注入し、MSW fixture も同じ値を返す。取得した meta をスクリーンショット/trace の assertion に使う。

---

## 3. エラー時の再試行・ガード整理（Charts での扱い）
- 送信/保存/印刷系: `missingMaster=true` または `fallbackUsed=true` なら **即ブロック**。`ChartsActionBar` は `outcome=blocked` を audit へ送信し、再送導線（Reception へ戻る/再取得）を同時に提示する。
- 取得系: `cacheHit=false` かつ 5xx/timeout のときは “再取得” ボタンを必須表示。`dataSourceTransition=server` で 404/401/403 を受けた場合は “戻る/再ログイン” を提示し、`runId` を保持したまま audit に残す。
- トーン/ARIA: Block/Warn/Error は `aria-live=assertive`、Success/Info は `polite`。トースト・バナーには `runId` と `traceId` を含め、監査と視覚通知を同一内容にする。

---

## 4. Playwright / フィクスチャの単一ソース化
- フィクスチャは本書の値をそのまま使用し、API ごとに以下の組み合わせを最低担保する:
  - 正常系: `dataSourceTransition=server`, `cacheHit=true`, `missingMaster=false`, `fallbackUsed=false`, `recordsReturned>0`
  - マスタ欠損: `missingMaster=true`, `fallbackUsed=false`（送信ブロックを検証）
  - フォールバック: `fallbackUsed=true`, `dataSourceTransition=snapshot`（警告＋送信保留を検証）
  - タイムアウト/5xx: `cacheHit=false` + エラー（再取得導線/aria-live を検証）
- `extraHTTPHeaders` とレスポンスボディは同じ `runId/traceId` を共有し、TelemetryFunnel と auditEvent の突合せに使う。

---

## 5. 更新対象（本 RUN で同期すべきドキュメント）
- `docs/web-client/README.md` — Active リストと最新更新サマリへ追加（RUN_ID=`20251212T143720Z`）。
- `docs/web-client/planning/phase2/DOC_STATUS.md` — 備考に RUN_ID と本書/ログを追記。
- `docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md` — 本作業の証跡。

---

## 6. documentRevision 取り扱い方針（ドラフト突合用）
- 現行の契約テーブルには `documentRevision` 項目が存在しないことを確認。クライアント側でフェイクの `documentRevision` を生成・送信することはしない。
- 方針: 外来記録の保存/更新 API 応答ペイロードに `documentRevision`（整数の連番）と `updatedAt` を追加するようサーバー契約を拡張する。ドラフト突合はこの応答値と `contentHash` を併用する。
- 契約更新前の暫定措置: UI の競合判定は `contentHash` と `updatedAt` のみで行い、`reason=server_newer` を表示する。契約更新後に Playwright/MSW フィクスチャへ `documentRevision` を追加し、本章の表にも追記する。
