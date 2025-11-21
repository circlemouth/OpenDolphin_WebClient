# RUN_ID=20251121T131725Z オブザーバビリティ運用ノート

- 目的: モダナイズ版サーバーのメトリクス / ログ / トレースの出力先と保持期間、アラート閾値、障害対応 runbook をまとめ、運用ハンドオフできる状態にする。
- 対象期間: 2025-12-09 09:00 〜 2025-12-13 09:00 (JST)
- 参照: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`, `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`
- 証跡格納予定: `artifacts/observability/20251121T131725Z/{dashboards,alerts,evidence}/`（作成時に追記）

## 1. 出力先・保持期間まとめ

| 種別 | 出力先 / エンドポイント | 保持期間 (Stage / Prod) | 備考 |
| --- | --- | --- | --- |
| メトリクス (Micrometer / Prometheus) | `https://<host>:9995/metrics`（管理ポート, Basic/Auth/IP 制限）<br>`https://<host>/actuator/{metrics,prometheus}`（Undertow 逆プロキシ） | 30 日 / 45 日 | `opendolphin_api_request_*`, `opendolphin_db_*`, `chartEvent_history_*`, `wildfly_*` をスクレイプ。`step=60s` / `scrape_interval=60s` 前提。 |
| ログ (アプリ / 監査) | Filebeat → Loki（`job=modernized-app`）/ Elastic (`index=opendolphin-*`) | 90 日 / 180 日 | JSON 1 行ログ。`traceId`,`requestId`,`facilityId`,`userId`,`status`,`latencyMs` を必須フィールド。`d_audit_event` は DB 永続＋チェーンハッシュ。 |
| トレース (OTLP) | OTLP→Tempo/Jaeger `otel-collector:4318` | 14 日 / 30 日 | `service.name=modernized-wildfly`。OTLP 未接続時は Micrometer/Loki ベース運用にフォールバック（§3.4）。 |
| DB 監査テーブル | PostgreSQL `d_audit_event` | 90 日 / 365 日 | 31 日以上の SQL 抽出は Evidence へコピー後に削除可。チェーンハッシュ再計算手順は runbook §3.3。 |
| 一時証跡 (java-time / curl / httpdump) | `tmp/java-time/`, `artifacts/observability/20251121T131725Z/evidence/` | 30 日ローカル保持→Evidenceへ移送 | Cron/CI 生成物は 30 日で自動削除。残す場合は Evidence バケットへ転送して備考に記録。 |

## 2. 主要メトリクスと監視ポイント

- HTTP: `rate(opendolphin_api_error_total[5m]) / rate(opendolphin_api_request_total[5m])`
- レイテンシ: `histogram_quantile(0.95, sum(rate(opendolphin_api_request_duration_bucket[5m])) by (le,path,method))`
- DB: `opendolphin_db_available_connections`, `opendolphin_db_active_connections`, `wildfly_datasources_pool_wait_count`
- SSE: `chartEvent_history_gapDetected`, `chartEvent_history_retained`
- システム: `up{job="modernized-actuator"}`, `wildfly_request_controller_active_requests`
- 監査フォーマット: Loki/Elastic で `payload.issuedAt !~ "^\\d{4}-\\d{2}-\\d{2}T.*[+-]\\d{2}:\\d{2}$"` をフィルタし件数を確認
- OTLP: `otlp_exporter_success_total`, `otlp_exporter_failure_total`（collector 側）

## 3. アラート閾値（Alertmanager/PagerDuty 連携）

| 種別 | Warning | Critical | 通知先 |
| --- | --- | --- | --- |
| API エラーレート | `error_rate > 0.05` を 5 分継続 | `error_rate > 0.10` を 5 分継続 | PagerDuty `Modernized-WildFly` (Ops L2 → Apps L3) |
| レイテンシ (P95) | Charts/Reception/Administration: `p95 > 1.5s` を 10 分 | `p95 > 3s` を 10 分 | Slack `#server-modernized-alerts` ＋ PagerDuty |
| DB コネクション枯渇 | `available_connections < 8` を 2 分 | `< 4` を 2 分 | PagerDuty `Modernized-DB` |
| SSE ギャップ | `increase(chartEvent_history_gapDetected[5m]) > 0` | `chartEvent_history_retained >= 90` を 5 分 | Slack `#server-modernized-alerts`（UX シフトへメンション） |
| 監査フォーマット崩れ | Loki 検索で ISO8601 非一致が 1 件でも出現 | 10 件/5 分 | PagerDuty `Security-Integrations` |
| OTLP 断 | `up{job="modernized-actuator"}==0` を 1 分 または `otlp_exporter_failure_total` が 5 分で +10 | 15 分継続 | Slack `#server-modernized-alerts` （フォールバック手順へ） |

## 4. 障害対応 runbook

1. **検知**: 上記アラート発火を確認し、Alertmanager からトラッキング ID を取得。  
2. **一次切り分け**  
   - エラーレート/レイテンシ: `kubectl logs` / `docker compose logs` で該当時間帯の `traceId` を抽出し、Loki/Elastic で同一 `traceId` を検索。  
   - DB 枯渇: `opendolphin_db_*` と `wildfly_datasources_pool_wait_count` を確認。`datasource` 設定変更は行わず、長時間セッションの SQL を `pg_stat_activity` で確認して切断可否を判断。  
   - SSE ギャップ: `chartEvent_history_*` と `audit` に `chart-events.replay-gap` 送信ログがあるか確認し、必要なら Touch/Web クライアントへリロード通知。  
   - 監査フォーマット: `d_audit_event` から最新 20 件を抽出し、ISO8601 崩れを再確認（SQL は OBSERVABILITY_AND_METRICS §1.5 を使用）。  
   - OTLP 断: collector の `otel-collector` Pod/サービス状態を確認。復旧まで Prometheus/Loki のグラフを運用基準とする。  
3. **復旧手順（例）**  
   - 500/Timeout 連発: 該当 API を一時的に rate-limit（Ingress または API Gateway 側）。DB 待ちの場合は `max-pool-size` を超えない範囲で `background-validation` を実行し、ロングトランザクションをキャンセル。  
   - 監査フォーマット崩れ: `LogFilter` / `AuditTrailService` のフォーマット揺れが疑われる場合はアプリ再起動を行わず、まず差分ログを Evidence へコピーし、`ops/monitoring/scripts/java-time-sample.sh --dry-run` で再現可否を確認。  
   - OTLP 断: collector 再起動後も `up==0` が続く場合は `MICROMETER_OTLP_ENDPOINT` 設定を確認。復旧まで Alertmanager ルールを一時 Muting（15 分単位）し、Slack へ周知。  
4. **エスカレーション**  
   - 15 分以内に収束しない場合、PagerDuty コメントに `traceId` と `evidence path (artifacts/observability/20251121T131725Z/...)` を記載して L3 へ引き継ぐ。  
   - 監査データ破損が疑われる場合は Security チームへ同時通知し、`AuditEvent` チェーンハッシュ検証の実施可否を判断する。  
5. **証跡・クローズ**  
   - 再発防止策とログ抜粋を `artifacts/observability/20251121T131725Z/evidence/` に保存し、本ファイルへ追記。  
   - Alertmanager/PagerDuty の Incident をクローズし、Runbook の対応時間と原因を記録。  

## 5. 運用ハンドオフチェックリスト

- [ ] Prometheus/Scrape 設定が `step=60s`、保持 30/45 日に設定済み（環境差は備考へ記載）。
- [ ] Loki/Elastic の保持期間とインデックス（`opendolphin-*`）が表 §1 と一致する。
- [ ] OTLP collector の `service.name=modernized-wildfly` が Tempo/Jaeger で検索可能。
- [ ] Alertmanager ルール名・通知先が表 §3 と一致し、Mute ルールの期限が未超過。
- [ ] `d_audit_event` の 90 日超データを Evidence へ移送または削除計画に反映。
- [ ] `artifacts/observability/20251121T131725Z/` に最新のダッシュボード JSON / ルール YAML / 取得ログを格納。
- [ ] DOC_STATUS とハブ（README/INDEX）の備考欄へ RUN_ID と本ログのパスを記載。

## 6. データ保持ポリシー（監査ログ連携）

- **監査テーブル**: `d_audit_event` は Stage 90 日 / Prod 365 日保持。削除前に `COPY (SELECT ...) TO` で Evidence へ保存し、チェーンハッシュの最終値を記録する。  
- **メトリクス**: Prometheus TSDB は Stage 30 日 / Prod 45 日。長期比較が必要な場合は `artifacts/observability/20251121T131725Z/dashboards/` にクエリ結果をエクスポート。  
- **ログ**: Loki 90 日 / Elastic 180 日。個人情報を含むログを二次利用する場合はマスキング済みであることを確認し、再保管先を備考へ追記。  
- **トレース**: Tempo/Jaeger 14 日 / 30 日。PII を含むスパンはマスキング済みか確認し、再保管時は `traceId` と取得日時のみ残す。  
- **一時証跡**: `tmp/java-time/*` は 30 日で削除。残す場合は Evidence へ移送し本ログへリンクする。  
- **削除ログ**: データ削除を実施した場合、実行日時・担当者・対象パスを本節に追記すること。

## 7. 次ステップ / TODO

- [ ] OTLP collector 接続確認と `up{job="modernized-actuator"}` ダッシュボード追加（Tempo 確認キャプチャを evidence に保存）。
- [ ] PagerDuty ルール ID を表 §3 に記入（現行環境で確認後）。
- [ ] `artifacts/observability/20251121T131725Z/` にダッシュボード JSON / Alertmanager ルール YAML / 代表ログを配置。
