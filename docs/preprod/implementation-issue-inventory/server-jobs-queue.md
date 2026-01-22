# server-modernized バッチ/キュー/イベント処理 棚卸し

- RUN_ID: 20260122T200749Z
- 実施日: 2026-01-22
- 対象: server-modernized（`server-modernized/src/main/java`）
- 目的: 非同期処理/キュー/イベント処理の不足を可視化し、再送・破棄・復旧・監視の弱点を整理する。
- 参照: `docs/DEVELOPMENT_STATUS.md`, `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`, `src/modernized_review/モダナイズ版実装範囲整理.md`
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照ドキュメント
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md`
- `src/modernized_review/モダナイズ版実装範囲整理.md`
- `src/validation/ORCA実環境連携検証.md`
- `server-modernized/src/main/java/open/dolphin/rest/OrcaQueueResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/AdminConfigResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/ClaimOutpatientResponse.java`
- `server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java`
- `server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobManager.java`
- `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobWorker.java`
- `server-modernized/src/main/java/open/dolphin/adm20/session/PHRAsyncJobServiceBean.java`
- `common/src/main/java/open/dolphin/infomodel/PHRAsyncJob.java`

## 1. 現状の対応範囲（確認済み）

### 1-1. ORCA 送信キュー API（UI 連携用）
- `/api/orca/queue` は `runId/traceId` と `queue` 配列を返却し、`x-use-mock-orca-queue` または Admin 設定で mock を切替可能。
- `retry=1` 指定時は `retryRequested/retryApplied/retryReason` を返却（ただし live では未実装）。

### 1-2. PHR エクスポート非同期ジョブ
- `POST /20/adm/phr/export` で `PHRAsyncJob` を作成し、ManagedExecutor でバックグラウンド実行。
- `GET /20/adm/phr/status/{jobId}` で状態確認、`DELETE /20/adm/phr/status/{jobId}` で pending キャンセル。
- `PHRAsyncJob` に `progress/queuedAt/startedAt/finishedAt/heartbeatAt` を保持。

### 1-3. チャートイベント配信（SSE/Long-poll）
- `ChartEventServiceBean` が long-poll で通知し、SSE へもブロードキャスト。
- SSE 側は facility 単位で最新 100 件の履歴を保持し、gap 検知時に `chart-events.replay-gap` を送信。

## 2. バッチ/キュー/イベント処理の課題一覧

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 区分 | 対象 | 現状 | 差分/課題 | 影響 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BQ-01 | キュー実装不足 | ORCA 送信キュー `/api/orca/queue` | mock/空配列のみで、live 実装が存在しない。`x-orca-queue-mode=live` でも `queue=[]`。 | ORCA 送信の実キュー状態（待ち/処理中/失敗）が取得できず、UI の判断材料が欠落する。 | 配信遅延や失敗を現場が判定できず、二重送信/再送漏れのリスクが上がる。 | `OrcaQueueResource`（mockQueue/空配列）, `AdminConfigResource`（useMockOrcaQueue）, `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md` | P1 |
| BQ-02 | 再送/破棄未実装 | ORCA キュー再送 (`retry=1`) / `DELETE /api/orca/queue` | `retry=1` は `retryApplied=false` で `not_implemented` を返す。DELETE は実体を削除せず同じ応答を返す。 | 再送・破棄のオペレーションが機能せず、手動復旧が必要。 | 失敗伝票の復旧が遅延し、運用負荷が増大する。 | `OrcaQueueResource`（retryReason/not_implemented, DELETEがbuildQueueResponse呼び出し） | P1 |
| BQ-03 | キュー/送信履歴の永続化不足 | ORCA 送信履歴/queueEntries | `ClaimOutpatientResponse.queueEntries` が定義されているが、実際にセットされていない。 | 送信履歴・再送対象の保管先がなく、追跡不能。 | 監査・問い合わせ対応で「どの送信が失敗したか」追跡できない。 | `ClaimOutpatientResponse`（queueEntries定義）, `OrcaClaimOutpatientResource`（queueEntries未設定） | P2 |
| BQ-04 | ジョブ復旧不足 | PHR エクスポート非同期ジョブ | ManagedExecutor に投げるだけで、再起動後の再実行/再キュー処理がない。`EXPIRED` 状態も使われない。 | 途中で停止したジョブが `RUNNING` のまま残留し、復旧できない。 | データ抽出の欠損・再依頼が必要になる。 | `PhrExportJobManager`（executor.submitのみ）, `PHRAsyncJobServiceBean`（再キュー処理なし）, `PHRAsyncJob`（EXPIRED未使用） | P1 |
| BQ-05 | リトライ/冪等性不足 | PHR エクスポートジョブ | `retryCount` が定義されているが更新/活用がない。再送ポリシーやバックオフが無く、同一スコープの冪等性キーも無し。 | 失敗時の自動再試行ができず、重複実行の防止もない。 | 失敗時の復旧が手作業になり、重複出力が起きる。 | `PHRAsyncJob`（retryCount）, `PHRAsyncJobServiceBean`（更新なし）, `PhrExportJobManager`（常に新規作成） | P2 |
| BQ-06 | 監視/ヘルス不足 | PHR ジョブの監視 | `heartbeatAt` は更新するが、監視/アラート/タイムアウト判定を行う仕組みがない。 | スタックしたジョブ検知が遅れ、ユーザーに「進捗が止まる」状態が露出する。 | 調査に時間がかかり SLA を下げる。 | `PHRAsyncJobServiceBean`（heartbeat更新のみ） | P2 |
| BQ-07 | イベント配信の永続化不足 | ChartEvent SSE / long-poll | SSE の履歴は in-memory（最大 100 件）で、再起動や長期断で失われる。gap 時は reload 指示のみ。 | イベント欠損が起きても復元できず、UI 状態が不整合になる。 | 受付/外来/チャート状態の反映漏れが発生。 | `ChartEventSseSupport`（HISTORY_LIMIT=100, in-memory history）, `ChartEventServiceBean`（AsyncContext のみ） | P2 |

## 3. 監視/運用で不足している観点
- ORCA 送信キューの「遅延/失敗/再送中」の定量監視指標が未定義。
- PHR ジョブの滞留（heartbeat 停止）や失敗率のメトリクスがない。
- SSE/イベント配信の欠損発生率やリプレイ gap のアラートが未整備。

## 4. 確認ポイント（棚卸し観点）
- `/api/orca/queue` が live モードで実際の送信キューを返せるか（現状は mock/空配列）。
- `retry=1` と DELETE の実運用手順が存在するか（現状 not_implemented）。
- PHR ジョブの restart/復旧ポリシー（RUNNING/PENDING の再実行）が定義されているか。
- SSE イベント欠損時の復旧方針（reload 以外の再送/補正）があるか。
