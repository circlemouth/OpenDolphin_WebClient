# E2E / 統合テスト実施

## 目的
非カルテ領域の主要ユースケース（例外一覧/反映状態/配信/印刷など）が連携・監査含めて崩れていないことを検証する。

## 実行前提
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、ログイン情報は同スクリプトの記載に従う
- 監査イベントを確認できる状態（UI の監査表示/ログ保存先の準備）
- 実行対象のデータ（患者/受付/印刷対象）が事前に用意されていること

## 手順
- Reception 例外一覧/キュー状態/監査検索の主要シナリオを実行
- Patients の反映状態/未紐付警告/監査検索を確認
- Charts の送信/印刷/復旧導線と監査イベントを確認
- Administration の配信状態/ガード/監査イベントを確認

## 成果物
- テスト結果のログ/スクリーンショット
- 失敗ケースの再現手順

## 実行ログの保存先
- `artifacts/validation/e2e/logs/`
- `artifacts/validation/e2e/screenshots/`
- `artifacts/validation/e2e/README.md`（サマリとrunId一覧）

## 証跡最低要件
- シナリオ/結果/エラーが揃った実行ログ
- 主要フローのスクリーンショット
- 監査イベントの確認メモ（runId/endpoint）

---

## 実行記録

### RUN_ID
- `20260103T235314Z`

### 実行日時
- 2026-01-04 (UTC) / 2026-01-04 (JST)

### 環境
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 競合ポート回避:
  - MODERNIZED_APP_HTTP_PORT=28080
  - MODERNIZED_APP_ADMIN_PORT=29995
  - MODERNIZED_POSTGRES_PORT=55440
  - MINIO_API_PORT=29000
  - MINIO_CONSOLE_PORT=29001
- WebClient: http://localhost:5173 (MSW ON)

### 実行内容と結果
- Reception: 例外一覧 / キュー状態 / 監査検索 → OK
- Patients: 反映状態(未紐付警告) / 監査検索 → OK
- Charts: 送信/印刷ガード表示 / 復旧導線(再取得) → OK
- Administration: 配信状態 / ガード / 監査イベント → OK（admin セッションで確認）

### 監査イベント確認
- UI 監査ログを保存
  - `artifacts/validation/e2e/logs/20260103T235314Z-audit-ui-state.json`
  - `artifacts/validation/e2e/logs/20260103T235314Z-audit-events.json`

### スクリーンショット
- `artifacts/validation/e2e/screenshots/20260103T235314Z-*.png`

### 失敗/再実行メモ
- 初回実行時、Reception/Charts で初期化順エラーが発生（`Cannot access 'receptionCarryover' before initialization` / `Cannot access 'approvalLocked' before initialization` / `Cannot access 'tabLock' before initialization`）。
- 該当箇所を修正し再実行、E2E 証跡取得完了。

