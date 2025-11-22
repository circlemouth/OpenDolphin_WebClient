# RUN_ID=20251122T071146Z 観測アーティファクト（実メトリクス突合結果）

本フォルダは観測スタックの識別子・通知経路を RUN_ID 単位で整理する証跡置き場。2025-11-22 14:05 JST に Ops/SRE から Stage/Prod の Grafana UID・recording rule 実装・Vault パスの実値回答を受領したため、以下へ反映した（RUN_ID=`20251122T071146Z`）。実値は Vault で管理しており、ダッシュボード/Alertmanager で参照する UID や routing key は Vault のパスを併記した。

## Grafana ダッシュボード UID 一覧（Stage/Prod 実値）
| 目的/利用者 | UID (Stage / Prod) | 主パネルのメトリクス/ラベル | 備考 |
| --- | --- | --- | --- |
| Ops 主要監視 | `stg-obs-ops-main` / `prd-obs-ops-main`（Vault: `kv/modernized-server/observability/grafana/{stage,prod}`） | `service:api_latency_p95_seconds` / `service:api_latency_p99_seconds` / `service:api_error_ratio` / `service:orca_error_ratio` / `service:db_pool_utilization` / `service:jms_queue_depth` / `service:sse_disconnect_ratio` （ラベル: `env,service,facility`） | p95/p99 レイテンシ、5xx・ORCA 失敗率、DB/Hikari、JMS、SSE を集約。メンテ時間帯に灰帯表示。**Sanitized JSON 追加（PII 無し）:** `dashboards/{stage,prod}_obs-ops-main.sanitized.json`。 |
| Dev 回帰確認 | `stg-obs-dev-release` / `prd-obs-dev-release`（同 Vault パス） | `service:api_error_ratio_by_version` / `service:api_latency_p95_seconds` / `trace_exception_topk`（Tempo 経由、ラベル: `env,service,version,facility`） | デプロイ後 24h 回帰とエラートップ。Canary/feature flag で version 切替。**Sanitized JSON 追加（PII 無し）:** `dashboards/{stage,prod}_obs-dev-release.sanitized.json`。 |
| Biz/CS KPI | `stg-obs-biz-kpi` / `prd-obs-biz-kpi`（同 Vault パス、sanitized JSON は `dashboards/{stage,prod}_obs-biz-kpi.sanitized.json`） | `http_server_requests_seconds_count` 集計から算出した受付/請求件数、`service:orca_error_ratio`（ラベル: `env,facility` で集計、PII 無し） | PII を含まない週次・月次 KPI。Slack `#biz-alerts` へ概要のみ。 |
| ジョブ遅延 | `stg-obs-job-latency` / `prd-obs-job-latency`（同 Vault パス） | `service:job_queue_wait_p95_seconds` / `job_run_duration_seconds` / `service:jms_queue_depth`（ラベル: `env,service,facility,job_type,queue`） | enqueue→start、start→end の p95/p99 をカード表示。**Sanitized JSON 追加（PII 無し）:** `dashboards/{stage,prod}_obs-job-latency.sanitized.json`。 |
| Trace 健全性 | `stg-obs-trace-health` / `prd-obs-trace-health`（同 Vault パス） | `service:trace_drop_ratio` / `correlation_missing_total` / `otel_sampler_decisions_total`（ラベル: `env,service,facility`） | サンプリング Drop 率と TraceContext 欠損を確認。**Sanitized JSON 追加（PII 無し）:** `dashboards/{stage,prod}_obs-trace-health.sanitized.json`。 |

## recording rule / Alertmanager 実装（Ops/SRE 提供）
### recording rule ラベルセット
- 共有ラベル: `env`, `service`, `facility`
- A4 ジョブ滞留系: `queue`, `job_type` を保持
- A10 デプロイ回帰: `version` を追加
- 原始メトリクスの `namespace`/`pod`/`instance` は recording rule で集約時に除去（stage/prod 共通）。
- ソース: Ops/SRE 提供の `prometheus-rules.{stage,prod}.yaml`（Vault: `kv/modernized-server/observability/prometheus/{stage,prod}/recording-rules`）。

### Alertmanager ルール名（実 PromQL ベース）
| ID | ルール名 | 主シグナル / ラベル |
| --- | --- | --- |
| A1 | `A1_ApiLatency_{Warning,Critical}` | `service:api_latency_p95_seconds` / `service:api_latency_p99_seconds`（`env,service,facility`） |
| A2 | `A2_ApiError_{Warning,Critical}` | `service:api_error_ratio`、`service:orca_error_ratio`（同上） |
| A3 | `A3_DbPool_{Warning,Critical}` | `service:db_pool_utilization`（同上） |
| A4 | `A4_JmsLag_{Warning,Critical}` | `service:jms_queue_depth`、`service:job_queue_wait_p95_seconds`（`env,service,facility,queue`） |
| A5 | `A5_TraceDrop_{Warning,Critical}` | `service:trace_drop_ratio`（`env,service,facility`） |
| A6 | `A6_LogLoss_{Warning,Critical}` | `service:log_processing_errors_per_minute`（同上） |
| A7 | `A7_AuditMissing_{Warning,Critical}` | `service:audit_insert_error_ratio`、`rate(audit_event_insert_total[10m])`（prod のみ） |
| A8 | `A8_ORCA_{Warning,Critical}` | `service:orca_error_ratio`、`probe_success{target="orca"}`（同上） |
| A9 | `A9_SSEDisconnect_{Warning,Critical}` | `service:sse_disconnect_ratio`（同上） |
| A10 | `A10_PostDeployRegression_{Warning,Critical}` | `service:api_error_ratio_by_version{version}` と `service:api_error_ratio` の差分（ラベル: `env,service,facility,version`） |

## Slack / PagerDuty ルーティングキー
| 経路 | 宛先/チャンネル | キー | 備考 |
| --- | --- | --- | --- |
| Slack Warning | `#modernized-ops` | `SLACK_WEBHOOK_WARNING`（Vault: `kv/modernized-server/observability/routing/stage` / `.../prod`） | Warning 通知。 |
| Slack Biz | `#biz-alerts` | `SLACK_WEBHOOK_BIZ`（同上） | PII なしの概要のみ。 |
| PagerDuty Primary | `pd_ops_primary` | `PD_ROUTING_KEY_PRIMARY`（同上） | Critical 既定ルート。 |
| PagerDuty Secondary | `pd_sre_secondary` | `PD_ROUTING_KEY_SECONDARY`（同上） | フェイルオーバー/夜間用。 |

## ラベルセット / 設計メモ
- 共通ラベル: `env`, `service`, `facility`（A10 のみ `version` 追加）。
- A4 ジョブ滞留系は `queue` / `job_type` を保持し、カードは `job_type` 集約で表示。
- Biz KPI は `env,facility` で集約し PII を含むラベルは破棄。
- Trace 健全性は `otel_sampler_{decisions,dropped}_total` から算出し、`correlation_missing_total` の欠損率は Tempo 由来のラベルセットに合わせる。
- Stage/Prod 実 UID・Webhook/PD キーは Vault で管理し、本 README では Vault パスを併記して参照起点とする。
- Biz KPI パネル（受付/請求件数）は `biz_kpi_*` recording rule を `env,facility` 集計で利用し、`pod/instance/job` は panel transformation で除外。Stage/Prod の JSON（sanitized export）は `dashboards/{stage,prod}_obs-biz-kpi.sanitized.json` を参照。

## Stage/Prod 実値待ち（テンプレ）
- 取得手順（実値反映後の確認用）
  - Grafana UID: `vault kv get kv/modernized-server/observability/grafana/{stage,prod}` で JSON を取得し、`uid` が上表と一致することを確認。
  - Prometheus recording rule: `vault kv get kv/modernized-server/observability/prometheus/{stage,prod}/recording-rules > prometheus-rules.{env}.yaml` でダンプし、ラベルセットが上記と一致することを確認。
  - Alert routing key: `vault kv get kv/modernized-server/observability/routing/{stage,prod}` で Slack/PagerDuty キーを取得。

## 参照
- 本 RUN_ID の設計ノート: `docs/server-modernization/phase2/operations/logs/20251122T071146Z-alerts.md` / `...-metrics.md` / `...-tracing.md` / `...-incident.md`。
- ハブドキュメント: `src/modernized_server/10_オブザーバビリティと運用運転.md`（証跡リンク済み）。
