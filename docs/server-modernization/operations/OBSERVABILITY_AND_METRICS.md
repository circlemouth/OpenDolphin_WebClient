# モダナイズ版サーバーのオブザーバビリティ設計

更新日: 2025-11-02（担当: Codex）

WildFly 33 では MicroProfile Metrics 拡張が廃止され、Micrometer サブシステムが標準の計測基盤となる。モダナイズ版サーバー（`server-modernized/`）は Micrometer + Prometheus を前提に計測・監査フローを整備した。

## 1. Micrometer ベースで収集するメトリクス

### 1.1 REST API メトリクス

`open.dolphin.metrics.RequestMetricsFilter` が `io.micrometer.core.instrument.MeterRegistry` を介して以下のメトリクスを発行する。JAX-RS リソースに付与された `@Path` をテンプレート化し、`X-Trace-Id`（`LogFilter` が MDC に保存）と組み合わせて監査ログと突合できる。

| メトリクス名 | 種別 | タグ | 説明 |
| --- | --- | --- | --- |
| `opendolphin_api_request_total` | Counter | `method`, `path` | REST 呼び出し総数。4xx/5xx も含む。 |
| `opendolphin_api_request_duration` | Timer | `method`, `path` | リクエストの処理時間（ナノ秒記録、Prometheus 側で秒換算）。 |
| `opendolphin_api_error_total` | Counter | `method`, `path`, `status` | 4xx／5xx 応答をカウント。ステータスをラベル化。 |

カウンタ／タイマーは Micrometer が自動的に `*_count`, `*_sum` を付与するため、Grafana 上では P95 などのレイテンシ統計を簡易に算出できる。

### 1.2 JDBC コネクションプール

`open.dolphin.metrics.DatasourceMetricsRegistrar` が WildFly の Agroal メトリクス API からプール状態を取得し、Micrometer Gauge として公開する。弱参照による解放を防ぐために Supplier を強参照で保持しつつ、再デプロイ時は既存メトリクスを削除して重複登録を避けている。

| メトリクス名 | 種別 | 説明 |
| --- | --- | --- |
| `opendolphin_db_active_connections` | Gauge | 現在アクティブな JDBC 接続数。 |
| `opendolphin_db_available_connections` | Gauge | プール内で即利用可能な接続数。 |
| `opendolphin_db_max_used_connections` | Gauge | 起動後に観測された同時接続数の最大値。 |

### 1.3 監査ログとの突合

`open.dolphin.rest.LogFilter` は `X-Trace-Id` をリクエストごとに生成し MDC（キー `traceId`）へ格納、`AuditTrailService` と `ExternalServiceAuditLogger` は同じトレース ID を監査イベントへ記録する。`opendolphin_api_error_total` の増加を検知した際は、以下のフローで監査データと照合する。

1. Grafana で該当期間のエラー件数と API パスを把握する。
2. Loki（または `open.dolphin` ログ）から同一 `traceId` のログを抽出し、ユーザー ID／IP／操作を確認する。
3. `AuditEvent` テーブルのチェーンハッシュと照合し、改ざんがないことを保証する。

## 2. WildFly Micrometer サブシステム設定

`ops/legacy-server/docker/configure-wildfly.cli` に Micrometer 用の設定ブロックを追加した。既存環境へ適用する場合は Management CLI で本スクリプトを再実行するか、Docker イメージを再ビルドする。サブシステム設定の要点は以下の通り。 citeturn1search0turn1search6

```bash
# Micrometer 設定抜粋
if (outcome != success) of /extension=org.wildfly.extension.micrometer:read-resource()
    /extension=org.wildfly.extension.micrometer:add
end-if

if (outcome == success) of /subsystem=micrometer:read-resource()
    /subsystem=micrometer:write-attribute(name=endpoint, value="${env.MICROMETER_OTLP_ENDPOINT:http://otel-collector:4318/v1/metrics}")
    /subsystem=micrometer:write-attribute(name=step, value=${env.MICROMETER_STEP_SECONDS:60})
else
    /subsystem=micrometer:add(endpoint="${env.MICROMETER_OTLP_ENDPOINT:http://otel-collector:4318/v1/metrics}", step=${env.MICROMETER_STEP_SECONDS:60}, exposed-subsystems=["*"])
end-if

if (outcome == success) of /subsystem=micrometer/registry=prometheus:read-resource()
    /subsystem=micrometer/registry=prometheus:write-attribute(name=context, value="${env.MICROMETER_PROMETHEUS_CONTEXT:/metrics/application}")
    /subsystem=micrometer/registry=prometheus:write-attribute(name=security-enabled, value=${env.MICROMETER_PROMETHEUS_AUTH:true})
else
    /subsystem=micrometer/registry=prometheus:add(context="${env.MICROMETER_PROMETHEUS_CONTEXT:/metrics/application}", security-enabled=${env.MICROMETER_PROMETHEUS_AUTH:true})
end-if

/subsystem=undertow:write-attribute(name=statistics-enabled, value=true)
/subsystem=undertow/server=default-server/http-listener=default:write-attribute(name=record-request-start-time, value=true)
```

- `MICROMETER_OTLP_ENDPOINT`: OTLP HTTP collector への送信先。ローカル検証では `http://otel-collector:4318/v1/metrics` を利用する。
- `MICROMETER_STEP_SECONDS`: バッチング間隔（秒）。Prometheus スクレイプ間隔と同程度（15〜60 秒）に合わせる。
- `MICROMETER_PROMETHEUS_CONTEXT`: 管理用 HTTP ポートに公開するパス。既定で `/metrics/application` とし、Micrometer が Prometheus 形式で応答する。 citeturn1search1
- `MICROMETER_PROMETHEUS_AUTH`: `true` の場合は WildFly 管理セキュリティ（ベーシック認証）を要求する。

Micrometer は Undertow / Datasource など各サブシステムの統計情報を利用するため、`statistics-enabled` と `record-request-start-time` を有効化しておく。 citeturn1search0

## 3. Prometheus / Grafana ダッシュボード整備

1. WildFly 管理ユーザーを作成し、Prometheus から Basic 認証でアクセスできるようにする。 (`add-user.sh` を使用)
2. Prometheus のスクレイプ設定例:
   ```yaml
   scrape_configs:
     - job_name: 'opendolphin-modernized'
       metrics_path: /metrics/application
       scheme: http
       basic_auth:
         username: ${WILDFLY_USER}
         password: ${WILDFLY_PASS}
       static_configs:
         - targets: ['server-modernized:9990']
   ```
3. Grafana では `opendolphin_api_request_duration_sum`／`_count` から P95/エラーレートを計算し、`opendolphin_db_*` でプール枯渇兆候を監視する。

## 4. 運用チェックリスト

- API ごとのレイテンシーしきい値を決め、`opendolphin_api_request_duration` の P95 を毎朝確認する。
- `opendolphin_api_error_total` の増加時は `LogFilter` の `traceId` と監査イベントを必ず照合する。
- 夜間メンテナンス後は Prometheus スクレイプの疎通確認 (`curl -u ... http://<host>:9990/metrics/application`) を行う。
- Micrometer の `step` と Prometheus の `scrape_interval` の不整合がないか四半期ごとに棚卸しする。

## 5. 注意事項

- MicroProfile Metrics と Micrometer を同時に有効化すると二重登録による不整合が生じるため、モダナイズ版では Micrometer のみに統一する。 citeturn1search0
- `security-enabled=true` のまま公開する場合は管理ポートを社内ネットワークで保護し、Basic 認証情報を Vault または Kubernetes Secret で管理する。 citeturn1search1
- OTLP Collector を利用しない環境では `MICROMETER_OTLP_ENDPOINT` を無効化し、Prometheus Pull のみで運用することも可能。

## 6. PDF署名ライブラリのライセンス告知

- **OpenPDF 1.3.41（LGPL 2.1 / MPL 1.1 デュアルライセンス）**: WAR 配布時は `docs/server-modernization/reporting/LICENSE_COMPATIBILITY.md` と GitHub 上のソース入手先を同梱・案内する。派生改変を行った場合は変更点を含むソース一式を 3 年間保管し、請求があれば提供できる体制を維持する。
- **BouncyCastle 1.82（Bouncy Castle License）**: `LICENSE` に加えて Bouncy Castle License 文面を同梱し、暗号ポリシーの変更や FIPS 対応の判断は `docs/server-modernization/security/CRYPTO_POLICY_NOTES.md` に記録する。
- 上記ライブラリの更新を行った際は `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md` と `docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md` を同期し、`PHASE2_PROGRESS.md` に反映日時を追記する。
