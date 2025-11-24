# ORCA Master Go-Live 証跡テンプレート（RUN_ID=20251124T184500Z 親=20251124T000000Z）

実サーバー接続前後の証跡を統一フォーマットで保存するためのテンプレート集。保存先は本ディレクトリ直下とし、ファイル名には **同一 RUN_ID を含める** こと。

## 命名規約
- 形式: `<RUN_ID>_<artifact>_<masterType>_<scenario>.<ext>`
  - `artifact`: `har` / `console` / `audit` / `coverage`
  - `masterType`: `orca05` | `orca06` | `orca08` | `mixed`（複数同時）
  - `scenario`: `canary`, `ramp25`, `ramp50`, `ramp100`, `rollback`, など自由入力（スネークケース）
  - 例: `20251124T184500Z_har_orca05_canary.har`, `20251124T184500Z_audit_orca06_ramp25.json`
- タイムスタンプは ISO8601（UTC）をメタデータ欄に記載し、ファイル名は RUN_ID のみとする。

## 必須メトリクス（全アーティファクト共通で記録）
- `runId`（親を含めて明示）
- `env`: `VITE_DEV_PROXY_TARGET` / `VITE_ORCA_MASTER_BRIDGE` / `VITE_DISABLE_MSW`
- 認証: Basic ユーザー名（パスワード非記載）、証明書有無（yes/no）
- リクエスト: `masterType` / エンドポイント / 入力条件（zip/code/date 等）
- パフォーマンス: `p99` / `p95` / `avg` / `max`（ms）
- エラー: `5xx_rate` (%), `4xx_rate` (%), `429_count`
- データ品質: `missingMaster_rate` (%), `fallbackUsed_rate` (%), `cacheHit_rate` (%)
- 監査: `dataSource` / `dataSourceTransition` / `cacheHit` / `missingMaster` / `fallbackUsed` / `snapshotVersion` / `traceId`
- アラート: 発火した Alertmanager ルール名と時刻（`alerts.yaml` 基準）、ダッシュボードスクリーンショットパス

## ファイル一覧
- `har-template.md`: ブラウザ Network HAR 採取用チェックリスト
- `console-template.md`: DevTools Console ログ採取テンプレート
- `audit-template.md`: 監査/HTTP ログ（runId/dataSource/traceId 含む）記録テンプレート
- `coverage-template.md`: P99/5xx/429 カバレッジ集計テンプレート

各テンプレートをコピーして RUN_ID ごとに記入し、完成した証跡へのパスを Run ログ（`docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` 該当節）へ相対パスでリンクしてください。
