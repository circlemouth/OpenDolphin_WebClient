# P99 / 5xx / 429 カバレッジ集計テンプレート

- RUN_ID: 20251124T184500Z
- 期間: (UTC, e.g. 2025-11-24T09:30:00Z〜09:45:00Z)
- env: VITE_DEV_PROXY_TARGET / VITE_ORCA_MASTER_BRIDGE / VITE_DISABLE_MSW
- 対象ダッシュボード: `docs/server-modernization/phase2/operations/assets/observability/orca-master-dashboard.json`
- アラートルール: `docs/server-modernization/phase2/operations/assets/observability/orca-master-alerts.yaml`

## メトリクス表（例）
| masterType | requests | p99(ms) | p95(ms) | avg(ms) | 5xx_rate(%) | 4xx_rate(%) | 429_count | missingMaster(%) | fallbackUsed(%) | cacheHit(%) | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| orca05 | 120 | 310 | 240 | 180 | 0.0 | 0.8 | 0 | 0.2 | 0.1 | 87 |  |
| orca06 | 95 | 280 | 230 | 170 | 0.0 | 1.1 | 1 | 0.5 | 0.4 | 82 | zip=100**** 429 一度発生 |
| orca08 | 60 | 340 | 260 | 190 | 0.5 | 0.0 | 0 | 0.0 | 0.0 | 79 | P99 警告発火 |

## アラート発火ログ
- 発火ルール: (例) `orca-master-p99-high`
- 発火時刻: 
- 対象 masterType: 
- 付随する traceId / runId: 
- 取ったアクション: (canary pause / rollback / observe)

## 保存
- ファイル名: `<RUN_ID>_coverage_<window>.md`（window は `20251124T0930Z-0945Z` など）
- 保存先: `artifacts/api-stability/20251124T184500Z/go-live/<date>/`
