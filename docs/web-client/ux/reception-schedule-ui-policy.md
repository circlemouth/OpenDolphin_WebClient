# 07 Reception と Schedule UI構成方針 (RUN_ID=20251127T051615Z)

## 目的
受付と施設スケジュール周りの key コンポーネント・画面・データ依存を整理し、MSW ⇔ `VITE_DEV_PROXY_TARGET` 環境切り替え時に `progress` / `status` / `dataSourceTransition` の更新が TooltipFields で統一的に伝搬する構造を定義します。管理側は UI の入力制御・バナー・再取得トリガ・ログ出力の責務を hooks（例: `useReceptionActions` / `useReceptionPreferences`）に分離し、`dataSourceTransition` などの監査メタを外部観測トレースに通知することを前提とします。

## 1. 主要コンポーネントとデータ依存マップ
| コンポーネント | 画面 | API / エンドポイント | マスター / ORCA データ | RX / ログ | コメント |
| --- | --- | --- | --- | --- | --- |
| AppointmentManager | `ReceptionPage` 内の予約モーダル | `/orca/appointments/list`, `/orca/appointments/mutation`（`useAppointments` / `useSaveAppointments`） | 患者 visit（`PatientVisitSummary`）＋ORCA 予約メモ／医師／施設情報 | `audit.logReceptionAction`, `recordOperationEvent`（`useReceptionActions` 経由） | `visit` と `karteId` を注入し、保存・取消・リマインダー記録で `progress/status` を更新。`saveMutation.isPending` を `TooltipFields.progress` にバインドする。|
| FacilitySchedulePage | `/facility-schedule` | `/schedule/pvt/{date}`, `/schedule/document`, `/schedule/pvt/{param}`（`fetchFacilitySchedule`, `createScheduleDocument`, `deleteScheduledVisit`） | ORCA/予約のマスター予約スロット（`FacilityScheduleEntry.raw` は `RawPatientVisit`） | `recordOperationEvent` / `audit.logScheduleAction` / `facilityScheduleQueryKey` | 日付/担当医フィルタ・予約詳細ダイアログで `dataSourceTransition` 付きの `progress` 更新を `TooltipFields` で再利用。予約削除後は React Query invalidation で `progress` を `status` に反映。|
| ColumnConfigurator | `ReceptionPage` の表示列設定パネル | なし（`useReceptionPreferences` で localStorage） | 画面設定（`viewMode`, `visibleColumns`） | UI 設定変更の `audit.logUiState` で `progress=status` のトグルを記録 | `visibleColumns`（`status`, `patientId`, `memo` など）をテンプレ化し、選択変更時に `TooltipFields.status` を `aria-label` に伝播。|

## 2. 画面構造と依存の見える化
- **ReceptionPage**: 左側 VisitSidebar が `patientVisitsQueryKey` を使って ORCA `/patient/pvt*` を参照し、`AppointmentManager` と `ColumnConfigurator` が右側の詳細/列設定を担う。`useReceptionCallMutation` / `useReceptionMemoMutation` は `publishChartEvent` を通じて `chart-events.replay-gap` Monitoring へ `dataSourceTransition` を含む `status` を通知し、`dataSourceTransition` 変化時は `TooltipFields.banner`（`progress=connecting`, `status=retrying` など）を再描画します。
- **FacilitySchedulePage**: `useFacilitySchedule` が `fetchFacilitySchedule` を呼び出し、取得成功時は `SummaryCard`・`ScheduleTable` に `statusBadge` を描画。予約作成/削除（`createScheduleDocument` / `deleteScheduledVisit`）は `VITE_DEV_PROXY_TARGET` 切替で `progress=sync` → `status=confirmed` の tooltips を更新し、`TooltipFields.dataSourceTransition` を `recordOperationEvent` に付与して `statusBadge` の `title` を保持します。`ScheduleReservationDialog` は `FacilityScheduleEntry` を受け取り、`FacilityScheduleResponse.list` の `RawPatientVisit` を `TooltipFields.details` で `memo`/`firstInsurance` などを補足。
- **環境切替時**: MSW→server→snapshot など `VITE_DISABLE_MSW` および `VITE_DEV_PROXY_TARGET` の切替は `TooltipFields.dataSourceTransition` を `from/to/reason` 付きで必ず送出。各コンポーネントは `progress` ラベルを `TooltipFields.progress` に共通化し、バナー・StatusBadge・アラート欄に同じ文字列（例: `progress=fetching`, `status=server-only`）を表示します。

## 3. TooltipFields に沿った `progress` / `status` 更新
`TooltipFields` は Reception/Schedule の状態バッジ・警告バナー・監査ログが共通で利用するメタの集合です。
| フィールド | 内容 | 更新タイミング |
| --- | --- | --- |
| `progress` | UI 全体の動作状態（例: `syncing`, `conflicting`, `fetching`） | API fetch / mutation の Pending → Success / Error。 |
| `status` | 恒久的なマスター状態（例: `server`, `msw`, `fallback`） | `dataSourceTransition` が異なる経路へ移る都度に更新。 |
| `runId` | 該当操作の RUN_ID | `audit.log*` への記録 / Stage検証ログと一致。 |
| `dataSourceTransition` | `{from,to,reason}` のオブジェクト | MSW↔server 切替、fallback、`VITE_DEV_PROXY_TARGET` 変更時の監査フックで送出。 |
| `cacheHit` / `missingMaster` / `fallbackUsed` | マスター API のレスポンスメタ | `fetchFacilitySchedule` / `fetchAppointments` からの `measureApiPerformance` で取得し、`StatusBadge` tooltip に `missingMaster=true` などを表示。|
`AppointmentManager` / `FacilitySchedulePage` / `ColumnConfigurator` はこれらを `title` 属性・`StatusBadge`・`Banner` に一致させ、`audit.logReceptionAction` / `audit.logScheduleAction` / `recordOperationEvent` が `TooltipFields` を透過的に送るよう `useReceptionActions` などの hooks が仲介します。

## 4. 管理 UX の責務分離
1. **入力制御**: AppointmentManager の `saveMutation.isPending` や `FacilitySchedulePage` の `useMutation` には `disabled` / `aria-busy` を付与し、同時操作を抑止。`ColumnConfigurator` は `visibleColumns` がゼロにならない検証をフロントで完結させ、`audit.logUiState` で `status=columns_locked` を残す。
2. **バナー設計**: `TooltipFields.banner` として `progress`/`status` を `StatusBadge` に流用し、MSW 起動時は `warning` トーン、server ルートでは `info` ton。`useReceptionActions` は `publishChartEvent` の `nextState` を元に `setOpenBit` した `status` を `TooltipFields.status` へ反映し、ログが Stage/Live の `dataSourceTransition` を拾えるよう `recordOperationEvent` の `metadata` に差し込む。
3. **再取得トリガ**: `dataSourceTransition` の `reason=retry` は `useReceptionActions`／`useFacilitySchedule` の `onSuccess` で `TooltipFields.progress` を `recovered` へ更新。手動再取得ボタンは `progress=refreshing`→`status=server` を `aria-live` で読上げ、`chart-events.replay-gap` などで `dataSourceTransition` も追跡。再取得結果は `artifacts/e2e/*` へリンクされる証跡と `DOC_STATUS` に記録。
4. **ログ出力**: `useReceptionActions`（`publishChartEvent`）／`recordOperationEvent`／`audit.log*` は `progress/status/runId/dataSourceTransition` を必ず `metadata` に含め、観測ツール（logs/`artifacts`）と `docs/server-modernization/phase2/operations/logs/` の RUN_ID セクションに同期。UI では tooltip/badge だけでなく `SurfaceCard` フッターや `NoticeMessage` に `runId` を表示し、BI チームが `TooltipFields` で再現できるようにします。

## 5. 並列チェックリスト（Parallel Checklist）
| 項目 | 承認条件 | 証跡 / Notes |
| --- | --- | --- |
| コンポーネント依存のトレース | AppointmentManager / FacilitySchedulePage が `appointment` / `facility-schedule` / `schedule-document` / `visit` API を各マップ通りに呼ぶことをコードレビューで確認 | `web-client/src/features/...` の import / hook を参照。|
| TooltipFields の統一 | `status` / `progress` / `dataSourceTransition` が `StatusBadge` / `Banner` / `audit.log*` で共通値を表すことを検証 | `StatusBadge` の `title` 属性 / `recordOperationEvent` 送信 payload を Stage log で確認 |
| `VITE_DEV_PROXY_TARGET` 切替検証 | MSW → Stage server の切替で `dataSourceTransition={from:'snapshot',to:'server',reason:'proxy-switch'}` がログ・UI tooltip に現れること | Stage Playwright / `artifacts/e2e/*` の `dataSourceTransition` 節を参照 |
| 管理 UX の分離 | `useReceptionActions` が `onSuccess` で query invalidation と `dataSourceTransition` 通知を行い、`ColumnConfigurator` が localStorage 変更と `audit.logUiState` を切り分けていること | `logs/playwright` + `localStorage` spinner で `preferences` 変更後に `audit.logUiState` 送信を確認 |
| 監査メタの外部通知 | `recordOperationEvent` / `audit.log*` が `runId=20251127T051615Z` / `dataSourceTransition` / `missingMaster` / `fallbackUsed` / `cacheHit` を payload へ載せる | `docs/server-modernization/phase2/operations/logs` に `RUN_ID` セクションを追加予定 |

## 補足
- 本文書は Phase2 ガバナンス必読チェーンに従い、`docs/web-client/README.md` と `planning/phase2/DOC_STATUS.md` でリンクされます。
- 実装フェーズでは `TooltipFields` のフィールドセットを `docs/web-client/architecture/ui-api-mapping.md` と同期させ、`progress`/`status` の値を `StatusBadge` と `Banner` で共有してください。
