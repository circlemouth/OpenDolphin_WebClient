# 02 本番運用 DoD と受け入れ基準

- RUN_ID: `20251227T065343Z`
- 期間: 2025-12-31 09:00 〜 2026-01-02 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: codex
- YAML ID: `src/webclient_productionization/02_本番運用DoDと受け入れ基準.md`

## 参照チェーン（整合確認の前提）
1. `docs/DEVELOPMENT_STATUS.md`
2. `docs/web-client/architecture/future-web-client-design.md`
3. `docs/web-client/architecture/web-client-api-mapping.md`
4. `docs/web-client/ux/*`
5. `src/webclient_productionization/01_現状実装棚卸しとギャップ整理.md`

## 目的
- 監査（auditEvent/logUiState）・A11y（role/aria-live/キーボード）・テレメトリ（funnel/traceId）の受け入れ基準を明文化する。
- “UI 表示/失敗時/運用導線/監査証跡” を満たすための DoD を画面別に定義する。
- 本番時に MSW を無効化する前提の動作保証範囲を決める。

## 運用手順リンク（本番運用の導線）
- 起動・ログイン手順: `setup-modernized-env.sh` / `docs/web-client/README.md`
- 障害時の切り分け: `docs/web-client/operations/debugging-outpatient-bugs.md`
- ORCA 実環境接続時の手順: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（Legacy 文書だが運用上必須）

## 前提
- 対象スコープ: 外来（Login / AppShell / Reception / Charts / Patients / Administration / Outpatient Mock）。
- 本番は MSW 無効（`Administration` で MSW OFF を強制）。
- 監査ログは server-modernized へ送信され、サーバ側で永続化される前提。
- RUN_ID は画面遷移・API 呼び出し・監査・テレメトリで一貫して引き回される。

## 受け入れ基準（共通）

### 1) 監査（auditEvent / logUiState）
- すべての主要操作（画面表示・検索・保存・送信・配信操作・ログアウト）で auditEvent を送信する。
- auditEvent 必須メタ: `runId`, `traceId`, `screenId`, `action`, `outcome`, `timestamp`, `operator{facilityId,userId,role}`。
- 患者関連操作は `patientId`（匿名化 ID を含む）を必須とし、欠落時は送信しない。
- 失敗時は `outcome=failed` と `errorCategory`（network/validation/authorization/timeout/unknown）を必須化。
- logUiState は「画面初期表示」「検索/フィルタ変更」「選択切替」「失敗表示」時に送信し、UI 状態を再現可能な粒度で保持する。
- auditEvent/logUiState は UI の成功/失敗に関係なく送信され、再送機構（retry/backoff）を備える。

### 2) A11y（role / aria-live / キーボード）
- 画面単位で live-region を必ず 1 つ以上持ち、成功/状態は `role=status` + `aria-live=polite`。
- ブロッキング失敗（保存失敗/権限不足/通信断）は `role=alert` + `aria-live=assertive`。
- 主要操作ボタンはキーボードで到達可能（Tab順）で、Enter/Space で発火する。
- ダイアログ/モーダルはフォーカストラップを備え、Escape で閉じる（閉じられない場合は理由を明示）。
- `aria-disabled` の要素はフォーカス不可（`tabIndex=-1`）、代替テキストと説明を付与する。

### 3) テレメトリ（funnel / traceId）
- すべての API 呼び出しに `traceId` を付与し、画面内の操作チェーンで一貫させる。
- funnel は主要導線（Login → Reception → Charts → Patients → Administration）を跨ぐ 5 点以上で計測する。
- テレメトリは UI 表示に影響を与えず、失敗時も送信される（送信失敗は UI に出さない）。
- `traceId` 欠落時は警告ログを出し、監査イベントにも `traceId_missing=true` を付与する。

## 画面別 DoD（UI 表示 / 失敗時 / 運用導線 / 監査証跡）

### Login
- UI 表示: 入力フォームと結果メッセージ（成功/失敗）が明確に分離される。
- 失敗時: `role=alert` で原因カテゴリ（認証/通信/タイムアウト）を表示、再試行導線を提示する。
- 運用導線: 連絡先/マニュアル導線（運用フロー参照）がある。
- 監査証跡: login_attempt / login_success / login_failure を送信し、runId と traceId を必須化する。

### AppShell
- UI 表示: 施設/ユーザー/role/RUN_ID がヘッダーで常時確認できる。
- 失敗時: グローバルエラーはトーストまたはアラート領域で通知される。
- 運用導線: RUN_ID クリックでコピー、ログアウト導線は常時到達可能。
- 監査証跡: screen_view(AppShell) と logout を送信する。

### Reception
- UI 表示: 検索/フィルタ/ソート結果、tone バナー、transition 状態が明確に表示される。
- 失敗時: 受付一覧の取得失敗は再試行ボタン付きの `role=alert` を表示する。
- 運用導線: 受付行の選択から Charts への遷移はキーボードでも可能。
- 監査証跡: search/update_filter/select_patient/open_chart を送信し、logUiState に検索条件を含める。

### Charts
- UI 表示: action bar / timeline / summary / tab 表示が欠損なくレンダリングされる。
- 失敗時: 送信・保存・印刷の失敗は即時の `role=alert` と再試行導線を表示。
- 運用導線: 送信/終了/印刷は明確な確認を挟み、監査 ID を画面上に出す。
- 監査証跡: chart_open / chart_edit / chart_submit / chart_print / chart_finish を送信し、traceId を継続。

### Patients
- UI 表示: 一覧/詳細/編集フォームが同時表示され、保存可否が明確に示される。
- 失敗時: バリデーション/通信/権限の区別を `role=alert` で提示。
- 運用導線: 保存成功時は次アクション（戻る/続行）を提示。
- 監査証跡: patient_create / patient_update / patient_delete を送信し、変更内容の要約を含める。

### Administration
- UI 表示: ORCA 接続状態、配信設定、MSW 状態が明確に示される。
- 失敗時: 保存失敗は `role=alert`、権限不足は `role=alert` + 操作不可理由を表示。
- 運用導線: 設定変更は保存前に差分確認、再送/破棄は確認ダイアログを必須化。
- 監査証跡: config_change / distribution_retry / distribution_discard を送信する。

### Outpatient Mock
- UI 表示: テストシナリオ切替は環境表示（DEV/STAGE）とセットでのみ表示する。
- 失敗時: 模擬障害が有効の場合でも UI 自体は利用不能にしない。
- 運用導線: 本番はナビ非表示（アクセス不可）を必須とする。
- 監査証跡: mock_scenario_change を送信する（本番では送信しない）。

## MSW 無効化（本番）の動作保証範囲

### 1) 保証する範囲（MSW OFF 前提で必達）
- Login: 認証成功/失敗/通信断の表示と監査送信が成立する。
- Reception: 一覧取得・検索・遷移が成立し、監査/telemetry が送信される。
- Charts: 送信/印刷/終了の操作が実 API で完結し、失敗時導線が機能する。
- Patients: 新規/更新/削除の API が機能し、監査証跡が残る。
- Administration: ORCA 設定保存と配信キュー操作が実 API で完結する。

### 2) 保証しない範囲（MSW OFF で対象外）
- Outpatient Mock 画面の利用（本番は非表示）。
- MSW 前提の fault injection（timeout/500/schema mismatch/queue stall）。
- モックデータのみで成立する UI（テストデータ依存のトレース表示など）。

### 3) 受け入れ判定
- 上記「保証する範囲」がすべて通過し、監査/A11y/テレメトリの共通基準を満たすこと。
- 1 つでも欠落があれば本番移行不可（MSW 無効化は保留）。
