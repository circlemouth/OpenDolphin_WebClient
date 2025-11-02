# モダナイズ版サーバーのオブザーバビリティ設計

更新日: 2026-06-04（担当: Codex）

Jakarta EE/WildFly ベースのモダナイズ版サーバーに対し、最小限の観測性 (Metrics + Logging) を整備した。API レベルの応答時間・リクエスト件数・エラー発生状況、および JDBC コネクションプールの利用状況を MicroProfile Metrics 経由で収集できる。

## 1. 収集対象メトリクス

### 1.1 REST API メトリクス

`open.dolphin.metrics.RequestMetricsFilter` を JAX-RS プロバイダとして登録し、全 REST エンドポイントのリクエストを横断的に計測する。

| メトリクス名 | 種別 | タグ | 説明 |
| --- | --- | --- | --- |
| `opendolphin_api_request_total` | Counter | `method`, `path` | リクエスト総数。401/403/500 などエラー応答も含む。 |
| `opendolphin_api_request_duration` | Timer | `method`, `path` | API 呼び出し時間（ナノ秒）。Prometheus では `*_seconds` 系に変換される。 |
| `opendolphin_api_error_total` | Counter | `method`, `path`, `status` | ステータスコードが 4xx/5xx の場合に 1 カウント。ステータスは実数値をタグ化する。 |

- `path` タグはリソースクラス／メソッドの `@Path` 値を結合したテンプレート（例: `/dolphin`, `/serverinfo/claim/conn`）。動的パラメータは展開されないため、Prometheus 側でのラベル爆発を防げる。
- メトリクス登録はアプリケーション起動時に自動で行われ、既存の `LogFilter` とは独立に動作する。

### 1.2 JDBC コネクションプール

`open.dolphin.metrics.DatasourceMetricsRegistrar` が WildFly/Agroal の `java:jboss/datasources/PostgresDS` を参照し、以下のゲージを登録する。

| メトリクス名 | 種別 | 説明 |
| --- | --- | --- |
| `opendolphin_db_active_connections` | Gauge | 現在アクティブな JDBC 接続数。 |
| `opendolphin_db_available_connections` | Gauge | プール内で即利用可能な接続数。 |
| `opendolphin_db_max_used_connections` | Gauge | 起動後に観測された同時接続数の最大値。 |

Agroal のメトリクス API が無効化されている場合は `0` を返す。WildFly 26.x ではデフォルトで有効になっているため追加設定は不要。

## 2. メトリクス公開エンドポイント

WildFly の MicroProfile Metrics 拡張により、以下の URL でアプリケーションメトリクスを参照できる。

- `https://<host>:<port>/metrics` — 全カテゴリを JSON/Prometheus 形式で返す。
- `https://<host>:<port>/metrics/application` — 本プロジェクトで登録したアプリケーションメトリクスのみ。

Docker 開発環境では `http://localhost:8080/metrics/application` にアクセスすると JSON 応答が確認できる。Prometheus 形式を取得したい場合は `Accept: text/plain` を指定する。

## 3. Prometheus 取り込み設定例

`prometheus.yml` の scrape 設定例。

```yaml
scrape_configs:
  - job_name: 'opendolphin-modernized'
    metrics_path: /metrics/application
    scheme: http
    static_configs:
      - targets: ['server-modernized:8080']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: modernized
```

> CI 実行時に生成される `api-smoke-test` 成果物を確認し、Prometheus が参照する環境にも同一エンドポイントがデプロイされていることを保証すること。

## 4. Grafana / Loki 連携メモ

- Grafana: `opendolphin_api_request_duration_count`（Prometheus 側で自動生成）と `*_sum` を組み合わせて P95 を算出。`status` タグで 4xx/5xx のヒートマップを作成する。
- Loki: 既存の `open.dolphin` ロガーを promtail で収集し、メトリクスとの相関分析を行う。ログ側に `remoteUser` が出力されるため、`method`, `path` と突き合わせて診療行為の監査を補助できる。

## 5. 運用上の注意

- メトリクスはアプリケーション起動直後に登録される。WildFly の再デプロイ時に重複登録が発生しないよう、`MetricRegistry.remove(...)` を行ったうえで再登録する実装としている。
- `/metrics` は認証なしでも参照できるため、インターネット公開環境ではリバースプロキシや Service Mesh で IP 制限／Basic 認証を併用すること。
- Prometheus のスクレイプ間隔は 15 秒を目安とし、Grafana アラートは `opendolphin_api_error_total` のデルタが閾値を超えた場合に通知する。

---

関連ドキュメント:
- [`docs/server-modernization/api-smoke-test.md`](../api-smoke-test.md)
- [`docs/server-modernization/legacy-server-modernization-checklist.md`](../legacy-server-modernization-checklist.md)
