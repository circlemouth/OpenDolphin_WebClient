# 04 ChartEvent 履歴永続化（RUN_ID=20260124T143620Z）

## 目的
SSE `/chart-events` のイベント履歴を永続化し、再起動・再接続後も欠損を最小化する。再接続時の復元手順（クライアント/サーバー両面）を明文化する。

## 前提
- `docs/preprod/implementation-issue-inventory/issue-catalog.md`
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client/architecture/doctor-workflow-status-20260120.md`
- `docs/web-client/architecture/future-web-client-design.md`

## 現状整理
- SSE 実装は `server-modernized` の `ChartEventSseSupport` にあり、施設単位でメモリバッファ（履歴100件）を保持する。再起動で履歴が失われ、`Last-Event-ID` による再生は同一プロセス内のみ有効。
- `Last-Event-ID` が古く履歴範囲外の場合、`chart-events.replay-gap` を返却して UI に「再取得（reload）」を促す設計になっているが、永続化がないため再起動後は高頻度で gap が発生する。

## 永続化方針（設計）
### 1. 永続化対象
- SSE で配信する `ChartEventModel` を JSON 化したペイロードとイベント ID（連番）を保存する。
- 施設単位の順序保証を優先し、`facility_id` と `event_id` を主要キーにする。

### 2. データモデル案
- テーブル: `chart_event_history`
  - `event_id` BIGINT（単調増加、全施設で共有 or facility 別シーケンス）
  - `facility_id` VARCHAR
  - `issuer_uuid` VARCHAR
  - `event_type` INTEGER
  - `payload_json` JSONB/TEXT
  - `created_at` TIMESTAMP
  - `expires_at` TIMESTAMP（任意）
- インデックス: `(facility_id, event_id)`、`created_at`

### 3. 採番と書込み位置
- 採番は DB シーケンス（`chart_event_seq`）を使用し、再起動後も連続性を担保する。
- 書込みは SSE 配信直前の単一ポイントに限定する（例: `ChartEventSseSupport.broadcast`）。
  - `event_id` を採番 → DB に保存 → SSE の `id` として配信。
  - 既存の in-memory 履歴は「直近バッファ」として維持し、DB への write-through を追加する。

### 4. 保持期間/容量
- 施設ごとに「直近 N 件」または「T 時間」を保持する。初期案:
  - N=10,000 / 24時間のいずれか早い方。
- 定期クリーンアップ（バッチ or INSERT 時の削除）で古いレコードを削除する。
- 保持ポリシーは `chartEvent.history.retained` と連動させ、運用で調整可能にする。

## 再接続時の復元手順
### サーバー側
1. SSE 接続時に `Last-Event-ID` を受領。
2. `chart_event_history` から `event_id > Last-Event-ID` のイベントを取得し、上限（例: 200件）まで再送する。
3. `Last-Event-ID` が DB の最古 `event_id` より古い場合、`chart-events.replay-gap` を送信して UI にフルリロードを促す。
4. Replay 後は通常のストリーミングに移行する。

### クライアント側
1. 受信した SSE イベントの `id` を最新値として保持する（sessionStorage 推奨）。
2. 再接続時に `Last-Event-ID` をヘッダで送信する。
3. `chart-events.replay-gap` を受信した場合は以下の復元を実施:
   - 受付/予約一覧の再取得（`/orca/appointments/list`, `/orca/visits/list`）
   - 受付ステータス・キュー情報の再取得（`/api/orca/queue`, `/api01rv2/pusheventgetv2`）
   - UI の `dataSourceTransition`/`missingMaster` バナーを再同期

## 失敗時の最小化戦略
- 起動直後に DB の最新 `event_id` を読み込み、`ChartEventSseSupport` の in-memory 連番を補正する。
- DB が一時的に利用不可の場合、SSE 配信自体は継続しつつ `chart-events.replay-gap` を送出して UI 側のフルリロードに誘導する。
- 監査/可観測性として `chartEvent.history.gapDetected` を運用メトリクスに反映し、再接続欠損を監視する。

## 実装タスク（結果）
- [x] `server-modernized` に `chart_event_history` を追加（DDL/Flyway）。
- [x] `ChartEventSseSupport.broadcast` に永続化 write-through を追加。
- [x] `ChartEventStreamResource` の再接続時に DB から replay するルートを実装。
- [x] UI 側の `Last-Event-ID` 保存と再接続時送出を追加（SSE クライアント仕様に合わせる）。
- [x] `chart-events.replay-gap` 受信時の復元手順を画面実装に反映。

## 実装概要
### 1. DDL/Flyway
- 追加: `server-modernized/tools/flyway/sql/V0230__chart_event_history.sql`
  - `chart_event_seq` シーケンス
  - `chart_event_history` テーブル
  - インデックス: `(facility_id, event_id)` / `created_at`

### 2. 永続化 + 配信フロー
- 実装: `server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java`
  1. DB で採番（`chart_event_seq`）→履歴保存 → 保持ポリシーに基づく purge
  2. SSE `id` として採番 ID を使用して配信
  3. DB 障害時は SSE 配信を継続しつつ `chart-events.replay-gap` を送出（1 回だけ）
- 起動時に DB 最新 `event_id` を読み込み、in-memory 連番を補正
- 再接続時に `Last-Event-ID` を受領し、DB から `event_id > last` をリプレイ

### 3. リプレイ/ギャップ判定
- 実装: `ChartEventStreamResource` + `ChartEventSseSupport.register`
  - DB 最古 `event_id` より古い `Last-Event-ID` の場合は gap を返却
  - 取得件数上限: `chartEvent.history.replayLimit`（デフォルト 200）
### 4. UI 側 SSE / リプレイ復元
- SSE クライアント: `web-client/src/libs/sse/chartEventStream.ts`
  - fetch + ReadableStream で SSE を購読し、`Last-Event-ID` を sessionStorage に保存。
  - 保存キー: `chart-events:lastEventId:<facilityId>`。
  - 再接続時に `Last-Event-ID` と `clientUUID` をヘッダ送出（Basic 認証時は `X-Facility-Id` を補完）。
- 監視ブリッジ: `web-client/src/features/shared/ChartEventStreamBridge.tsx`
  - `chart-events.replay-gap` 受信時に監査ログ（reason=`replay-gap`）を記録。
  - UI トーストで再同期開始を通知。
  - `chartEventReplayRecovery.ts` 経由で再取得を起動。
- 再取得対象（既存経路に準拠）:
  - `/orca/appointments/list` + `/orca/visits/list`（`fetchAppointmentOutpatients` 経由）
  - `/api/orca/queue`
  - `/api01rv2/pusheventgetv2`

## 設定値（MicroProfile Config）
- `chartEvent.history.replayLimit`（default: 200）
- `chartEvent.history.retentionCount`（default: 10000）
- `chartEvent.history.retentionHours`（default: 24）

## テスト
- 追加: `server-modernized/src/test/java/open/dolphin/rest/ChartEventSseSupportTest.java`
  - 永続化呼び出し確認 / replay / gap 判定 / SSE reload 送信
- 実行ログ: `artifacts/orca-preprod/20260124T134514Z/chart-event-history/unit-test-ChartEventSseSupportTest.log`
- 追加: `web-client/src/libs/sse/__tests__/chartEventStream.test.ts`
  - SSE 受信時に `Last-Event-ID` が保存されること
  - `chart-events.replay-gap` 受信で復元ハンドラが起動すること
- 追加: `web-client/src/features/shared/__tests__/chartEventReplayRecovery.test.ts`
  - replay-gap で再取得対象クエリの refetch が呼ばれること
- 実行ログ: `artifacts/orca-preprod/20260124T143620Z/chart-event-history/unit-test-web-client-replay-gap.md`

## 検証（ローカル再起動 + リプレイ）
- 証跡: `artifacts/orca-preprod/20260124T134514Z/chart-event-history/sse-replay-check.md`
  - Basic 認証 + `X-Facility-Id` 送信で `/chartEvent/event` を投入
  - サーバー再起動後に `Last-Event-ID=2` で `/chart-events` を購読し、`id: 3` の SSE が再送されることを確認
## 検証（UI 側 replay-gap 復元）
- 証跡: `artifacts/orca-preprod/20260124T143620Z/chart-event-history/ui-replay-gap-recovery.md`
  - Web クライアント起動後に `/chart-events` へ接続し、`Last-Event-ID` 送出を確認
  - `chart-events.replay-gap` 受信で再取得（appointments/visits, orca/queue, pusheventgetv2）が起動することを確認
  - 監査ログに `reason=replay-gap` が記録され、トースト通知が表示されることを確認

## 補足（運用上の注意）
- Basic 認証時は `X-Facility-Id` が必須（`LogFilter` が facility を補完するため）。
- `Last-Event-ID` が DB 最古より古い場合は `chart-events.replay-gap` が送出されるため、UI 側はフルリロード導線を必須とする。

## 完了条件
- サーバー再起動後でも `Last-Event-ID` に基づく SSE 再送が機能し、イベント欠損が最小化されること（gap 受信時はフルリロードにより状態一致が担保される）。
