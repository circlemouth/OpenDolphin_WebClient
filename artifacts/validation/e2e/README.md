# E2E 統合テスト 実行サマリ

- RUN_ID: 20260103T235314Z
- 実行日時: 2026-01-04 (UTC) / 2026-01-04 (JST)
- 実行者: codex
- 実行方法: `tmp/e2e-integrated-manual.mjs` (Playwright headless)

## 環境メモ
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 競合ポート回避:
  - MODERNIZED_APP_HTTP_PORT=28080
  - MODERNIZED_APP_ADMIN_PORT=29995
  - MODERNIZED_POSTGRES_PORT=55440
  - MINIO_API_PORT=29000
  - MINIO_CONSOLE_PORT=29001
- WebClient: http://localhost:5173 (MSW ON)
- ORCA 実環境: 未接続（MSW）

## 成果物
- ログ: `artifacts/validation/e2e/logs/`
- スクリーンショット: `artifacts/validation/e2e/screenshots/`
- 監査メモ:
  - `artifacts/validation/e2e/logs/20260103T235314Z-audit-ui-state.json`
  - `artifacts/validation/e2e/logs/20260103T235314Z-audit-events.json`

## 実行シナリオと結果
- Reception: 例外一覧 / キュー状態 / 監査検索 → OK
- Charts: 送信/印刷ガード表示 / 復旧導線(再取得) → OK（送信/印刷はガード状態の証跡）
- Patients: 反映状態(未紐付警告) / 監査検索 → OK
- Administration: 配信状態 / ガード / 監査イベント → OK（admin セッションで確認）

## 備考
- 途中の試行で JS エラー（Reception/Charts の初期化順）を検知し、修正後に再実行して成功。
- 監査イベントは UI ログ (`__AUDIT_UI_STATE__`, `__AUDIT_EVENTS__`) を保存。
