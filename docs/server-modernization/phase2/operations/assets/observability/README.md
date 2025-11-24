# ORCA-05/06/08 監視テンプレート (RUN_ID=`20251124T142000Z`)

このディレクトリは ORCA マスタ API（ORCA-05/06/08）の監視ダッシュボードと Alertmanager テンプレートをまとめる。`orca-master-dashboard.json` は Grafana へのインポート用、`orca-master-alerts.yaml` は Prometheus/Alertmanager 用のドラフトである。

## Grafana インポート手順
1. Grafana の `Connections > Data sources` で Prometheus（メトリクス）と Loki（監査ログ）が登録済みであることを確認し、名前を控える（デフォルト前提: Prometheus=`Prometheus`, Loki=`Loki`).
2. 「Dashboards > New > Import」で `orca-master-dashboard.json` を選択し、Prometheus/Loki データソースを上記にマッピングして保存する。
3. 変数（トップバー）
   - `prom`/`loki`: データソース名
   - `env`: environment ラベル（dev/stage/prod など、デフォルト dev）
   - `service`: `orca-master-bridge` を既定（Micrometer `job` / `service` ラベル）
   - `api`: ORCA-05/06/08 の複数選択
   - `facility`, `user`, `runId`: 監査ラベルでフィルタ（空=All）
4. 想定ラベル/タグ: `environment`, `service=orca-master-bridge`, `api=ORCA-05|ORCA-06|ORCA-08`, `facility`, `user`, `run_id`, `data_source`, `cache_hit`, `missing_master`。Loki 側も同じキーで取り込む。
5. カラーしきい値（§7 / release-plan 準拠）
   - P99: warn>2s, crit>3s（ORCA-08 想定 3.5s 超で致命）
   - エラー率: warn>1%, crit>3%
   - cacheHit: warn<80% (05/06) / <70% (08 を想定), crit<70%
   - missingMaster: warn>0.5%, crit>1%
   - audit_missing: warn>0.1%, crit>0.5%

## ダッシュボード収録パネル（概要）
- P99 latency / RPS / エラー率（5分 rate）
- cacheHit%、missingMaster%、audit_missing%
- dataSource breakdown（server/snapshot/mock/fallback）
- Loki ログ検索（runId / traceId 用フィルタ付き）

## 必要データソース
- Prometheus: `http_requests_total`, `http_request_duration_seconds_bucket`、`opendolphin_api_audit_missing_total` が `environment` / `service` / `api` / `facility` / `user` / `run_id` / `data_source` / `cache_hit` / `missing_master` ラベル付きで収集されていること。
- Loki（任意）: `service` / `environment` / `runId` / `traceId` などをラベルとして取り込む。

### 推奨データソース名と環境変数マッピング
- ダッシュボード変数 `prom`/`loki` のデフォルトは `Prometheus` / `Loki`。Grafana のデータソース名も同じ値に揃えると、インポート時に手動選択を省ける。
- 環境で名前が異なる場合は import 前に envsubst で置換する想定:
  ```bash
  PROM_DS_NAME=prometheus-main LOKI_DS_NAME=loki-traces \
    envsubst < orca-master-dashboard.json > /tmp/orca-master-dashboard.resolved.json
  ```
- 置換対象は dashboard JSON 内の `templating.list[].datasource` と各パネルの datasource フィールド。`prom`/`loki` 変数と同じ値をセットする。

## 使い方（適用手順）
1. 変数を設定する（例）
   ```bash
   export RUN_ID=20251124T133000Z
   export PAGERDUTY_ORCA_MASTER_KEY="<PagerDuty routing key>"
   export ORCA_ALERT_EMAILS="oncall@example.com,backend@example.com"
   export ORCA_ERR_THRESHOLD=0.02
   export ORCA_P99_THRESHOLD=3
   export ORCA_MISSING_THRESHOLD=0.005
   export ORCA_CACHE_HIT_MIN=0.8
   export ORCA_AUDIT_MISSING_THRESHOLD=0.001
   ```
2. ルール適用（Prometheus）
   ```bash
   envsubst < orca-master-alerts.yaml \
     | yq 'select(.groups)' > /etc/prometheus/rules.d/orca-master-alerts.yaml
   promtool check rules /etc/prometheus/rules.d/orca-master-alerts.yaml
   systemctl reload prometheus
   ```
3. Alertmanager 反映
   ```bash
   envsubst < orca-master-alerts.yaml \
     | yq 'select(.route)' > /etc/alertmanager/config.d/orca-master-alerts.yaml
   promtool check config /etc/alertmanager/config.d/orca-master-alerts.yaml
   systemctl reload alertmanager
   ```
4. 動作確認
   - `promtool test rules` で式の syntactic check。
   - Grafana で `opendolphin_api_request_total{path=~"/(orca|api)/orca/(master|tensu).*"}` を 5 分確認し、Alert が期待通り発火することをステージングで検証。
   - 発報後は Runbook に従い Slack/PagerDuty 通知とロールバック手順を実施。

## 変数一覧（envsubst 前提）
- `RUN_ID`: 本タスクの RUN_ID。通知 Subject/detail に挿入。
- `PAGERDUTY_ORCA_MASTER_KEY`: PagerDuty routing key。Critical/Warning を送信。
- `ORCA_ALERT_EMAILS`: カンマ区切りメールアドレス。Warning 用。
- 閾値: `ORCA_ERR_THRESHOLD`(5xx rate), `ORCA_P99_THRESHOLD`(秒), `ORCA_MISSING_THRESHOLD`(ratio), `ORCA_CACHE_HIT_MIN`(ratio), `ORCA_AUDIT_MISSING_THRESHOLD`(ratio)。

## 依存メトリクスとラベル前提
- `opendolphin_api_request_total`, `opendolphin_api_error_total`, `opendolphin_api_request_duration_seconds_bucket`（`path` ラベルに `/orca/...` が入る Micrometer/Prometheus 露出）
- `opendolphin_api_request_total{missing_master="true"}` / `{cache_hit="true"}`: ORCA REST が監査メタをレスポンスヘッダからラベル化することを前提。
- `opendolphin_api_audit_missing_total`: 監査フィールド欠落（runId/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt）をカウントするログ→メトリクス変換。
- これらが未提供の場合は、Loki/Elastic から promtail/recording ルールで派生させる（例: `audit_missing` は LogQL → `prometheus_remote_write` で変換）。

### 不足しがちなメトリクスの補完メモ
- 命名例: `opendolphin_api_missing_master_total{api="ORCA-05"}`, `opendolphin_api_audit_missing_total{field="runId"}`。ダッシュボードの `missingMaster` / `audit_missing` パネルと一致する。
- Promtail → Prometheus Remote Write で補完する場合の LogQL サンプル:
  ```bash
  # missing_master をレスポンスログから抽出
  {service="orca-master-bridge"} | json | missing_master="true" | unwrap response_time as rt
  ```
  を `prometheus_remote_write` で `opendolphin_api_missing_master_total` に集計する。
- Recording rule 例（Prometheus 側）:
  ```yaml
  - record: opendolphin_api_missing_master_total
    expr: sum by (service, api, environment, run_id, data_source) (
      rate(http_requests_total{missing_master="true", path=~"/orca/(master|tensu).*"}[5m])
    )
  - record: opendolphin_api_audit_missing_total
    expr: sum by (service, api, environment, run_id, field) (
      rate(opendolphin_api_log_missing_field_total[5m])
    )
  ```
  `opendolphin_api_log_missing_field_total` は Loki/Fluentd 側で `audit_missing` ログをカウントする exporter で生成しておく。

## Runbook / 関連ドキュメント
- 監査・SLA・閾値の出典: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §7。
- リリース/ロールバック手順と通知経路: `docs/server-modernization/phase2/operations/orca-master-release-plan.md` §3–5。
- チェックリスト: 本テンプレは `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` の RUN セクションで運用結果を報告する。

## 運用メモ
- 本ファイル群は「ドラフト」。本番反映前にステージ環境で 24 時間 burn-in を行う。
- PagerDuty service 名は `orca-master` とし、Slack `#server-modernized-alerts` に PD → Slack 連携済みであることを確認する。
- ロールバック時は `VITE_ORCA_MASTER_BRIDGE=mock` / `ORCA_MASTER_BRIDGE_ENABLED=false` 切替を release-plan.md の所要時間目標（5–10 分以内）に沿って実施する。
