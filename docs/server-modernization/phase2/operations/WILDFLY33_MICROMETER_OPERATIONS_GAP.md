# WildFly 33 / Micrometer 移行影響分析（更新日: 2025-11-02）

モダナイズ版サーバー（`server-modernized/`）を WildFly 33 + Jakarta EE 10 へ移行する際に、ログ／監査／メトリクス／ジョブ管理の差分と、Micrometer 連携後に残る運用ギャップを整理する。参照箇所は可能な限りソースコードや設定ファイルを併記した。

## 1. ログ・監査・メトリクス・ジョブ管理の比較

| 項目 | 旧サーバー (`server/`) | モダナイズ版 (`server-modernized/`) | ギャップ / Micrometer 対応要件 |
| --- | --- | --- | --- |
| HTTP リクエストログ | `LogFilter` が `javax.servlet.Filter` として REST 呼び出しを監査ログ（`open.dolphin` / `visit.touch`）へ出力。`web.xml` は Java EE 6 スキーマ。<br>参照: `server/src/main/webapp/WEB-INF/web.xml:2`, `server/src/main/java/open/dolphin/rest/LogFilter.java:1` | `LogFilter` は `jakarta.servlet.Filter` へ移行し、`jakarta.security.enterprise.SecurityContext` から取得した `Principal` と `X-Trace-Id`（MDC キー `traceId`）を Micrometer メトリクスと共有する。`web.xml` は旧スキーマのまま。<br>参照: `server-modernized/src/main/webapp/WEB-INF/web.xml:2`, `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:1` | `web.xml` を `https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd` へ更新し、`deny-uncovered-http-methods` 等の Jakarta EE 10 セキュリティ設定を適用する。レスポンスヘッダへ `X-Trace-Id` を標準化し、監査イベントと Micrometer の突合手順を `operations` ドキュメントへ明記。 |
| 監査イベント永続化 | 監査テーブルへの記録機能は未整備。アクションログは `java.util.logging` のみ。 | `AuditTrailService` が SHA-256 チェーンハッシュ付きで `AuditEvent` を永続化し、Admission ワークフローに組み込み済み。<br>参照: `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java:1` | Audit テーブルのマイグレーション定義と保持期間ポリシーが未整理。Micrometer のエラー件数と監査イベントを定期照合するレビュー手順を設ける。 |
| 外部サービス監査 | ORCA／Plivo 連携の監査ログは手動ログ (`Logger`) のみ。 | `ExternalServiceAuditLogger` がトレース ID 付きで ORCA・Plivo 送受信を専用ロガーへ出力。<br>参照: `server-modernized/src/main/java/open/dolphin/msg/gateway/ExternalServiceAuditLogger.java:1` | `logging.properties` 推奨設定を Micrometer 連携版へ更新し、外部連携成功/失敗カウンタを `MeterRegistry` から集計できるようにする。 |
| REST メトリクス | 計測なし。 | `RequestMetricsFilter` が Micrometer (`MeterRegistry`) を介して `opendolphin_api_*` シリーズをカウント／タイム計測し、`X-Trace-Id` と連携。<br>参照: `server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java:1` | Micrometer への移行完了。残タスク: Prometheus 管理ポートのアクセス制御を `operations` 配下へ追記、Grafana の P95/エラーレートダッシュボード更新、`step` と `scrape_interval` の整合検証を定期運用に組み込む。 |
| JDBC プールメトリクス | 計測なし。 | `DatasourceMetricsRegistrar` が Micrometer Gauge を登録し、Agroal メトリクス API から接続数を供給。再デプロイ時に重複しないよう既存 Gauge を削除後に再登録する。<br>参照: `server-modernized/src/main/java/open/dolphin/metrics/DatasourceMetricsRegistrar.java:1` | Micrometer 用 Gauge 実装へ置き換え済み。Grafana で接続枯渇アラート（`active_connections` と `available_connections` の閾値監視）を追加し、夜間バッチ時のピーク値を `max_used_connections` で確認する運用手順を整備。 |
| 定期ジョブ / バックグラウンド処理 | `ServletStartup` の `@Schedule`（EJB Timer）が日次更新／月次集計を実行。<br>参照: `server/src/main/java/open/dolphin/mbean/ServletStartup.java:1` | `ManagedScheduledExecutorService` を注入し、アプリケーションスコープで日次・月次処理をスケジュール。<br>参照: `server-modernized/src/main/java/open/dolphin/mbean/ServletStartup.java:1` | 2026-06-03 時点で `ops/modernized-server/docker/configure-wildfly.cli` の適用と Worker S3 の `verify_startup.sh` により `managed-executor-service`／`managed-scheduled-executor-service`／`managed-thread-factory` の存在確認を自動化済み。今後は Failover 時の再スケジュール検証と Micrometer `executor.*` メトリクス監視を運用チェックリストへ組み込む。 |
| JMS / 非同期ジョブ | `MessageSender` / `ScheduleServiceBean` に JMS キュー定義（HornetQ）を想定するコードが存在するが、現在はコメントアウト済み。`ops/legacy-server/docker/configure-wildfly.cli` もキュー未定義。 | `MessagingGateway` が `ManagedExecutorService` で非同期送信を代替。JMS リソース注入は依然コメントアウトされ、`configure-wildfly.cli` も ActiveMQ 設定なし。<br>参照: `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` | JMS 再有効化時は Micrometer の Executor メトリクス（`executor.*`）を合わせて収集できるようにする。並行度・失敗回数を Prometheus へ送出し、CLAIM 送信トレースと整合させる必要がある。 |

## 2. 完了した Micrometer 対応とフォローアップ

- `RequestMetricsFilter` / `DatasourceMetricsRegistrar` を Micrometer API ベースへ書き換え、`MeterRegistryProducer` で WildFly の Micrometer レジストリを CDI 経由で供給する実装を追加した。<sup>1</sup>
- `ops/legacy-server/docker/configure-wildfly.cli` に Micrometer 拡張・Prometheus レジストリ・Undertow 統計有効化のコマンドを追記し、OTLP 送信先とスクレイプ間隔を環境変数化した。<sup>2</sup>
- 運用手順書は `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` を Micrometer 前提で更新済み。SRE チームは Prometheus 管理ポートの認証方式とアラート条件を 2025-11-06 までにレビューする。

## 3. 監査ログ × Micrometer 突合要件

- `LogFilter` で生成する `X-Trace-Id` を HTTP レスポンスヘッダへエコーする改修を別チケットで計画中。完了までは `AuditTrailService` のチェーンハッシュを一次ソースとして扱い、Grafana 上の `traceId` ラベルと突合する。
- Grafana ダッシュボードでは以下の可視化を標準化する: (1) `opendolphin_api_request_duration` の P95, (2) `opendolphin_api_error_total` のデルタ, (3) `opendolphin_db_active_connections` のピーク。閾値逸脱時は `PHASE2_PROGRESS.md` に事象・対応を記録。
- 外部連携ログ（ORCA/Plivo）の `traceId` を Promtail で拾えるようログフォーマットに JSON 属性を追加し、監査と Micrometer の両面で整合性を確認する。

## 4. Jakarta スキーマ更新が監査 / セキュリティへ与える影響

- `server-modernized/src/main/webapp/WEB-INF/web.xml` と `beans.xml` は依然 `http://java.sun.com/xml/ns/javaee` を参照しており、WildFly 33 では互換モード（`jakarta.transformer`）に依存する。これは Jakarta EE 10 のサーブレット/セキュリティ機能（`deny-uncovered-http-methods`、`dispatcher` 属性 6.0 拡張 等）を有効にできず、`LogFilter`・`RequestMetricsFilter` の認証/監査連携を最新仕様で保護できない。<sup>3</sup>
- `beans.xml` を `beans_4_0.xsd` へ更新し、`bean-discovery-mode="annotated"` を明示することで不要な CDI Bean の自動登録を抑制しつつ、監査系 `@ApplicationScoped` Bean（例: `SecondFactorSecurityConfig`）を確実に有効化する。
- スキーマ更新後は `web.xml` 側で `<security-constraint>` と `<login-config>` を精査し、Micrometer で公開する `/metrics` エンドポイントの保護方式（ベーシック認証 / IP 制限）を併記する。

## 5. パフォーマンス / JMS ギャップの列挙

- `ops/modernized-server/docker/configure-wildfly.cli` のデータソース設定は従来と同じ `min/max-pool-size`・`background-validation` に留まり、Agroal 固有のプール最適化（`initial-size`, `pool-prefill`, `leak-detection` 等）を未設定。Micrometer で可視化する前にチューニング指標を整理する。
- `ManagedScheduledExecutorService` / `ManagedExecutorService` を利用するクラス（`ServletStartup`, `MessagingGateway`）は、リソースが取得できなかった場合に同期実行へフォールバックしている。再デプロイ時の二重スケジュールや停止処理の例外を監査ログへ記録する仕組みが必要。
- JMS 関連クラス（`MessageSender`, `ScheduleServiceBean`）では `@Resource` がコメントアウトされたまま残存しており、Jakarta JMS へ移行するか非同期実装で置き換えるかが未決定。JMS を継続する場合は ActiveMQ 設定と永続化ポリシー（ジャーナル／アドレス設定）を CLI に追加する。
- `PlivoSender` が `okhttp`／`plivo-java` へ直接依存する一方で BOM 管理は未整理。Micrometer 設定追加とあわせて依存更新計画（`DEPENDENCY_UPDATE_PLAN.md`）のバージョン確定が必要。

## 6. 運用リスクと改善提案

1. **ドキュメント更新**: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`、`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`、`docs/web-client/operations/TEST_SERVER_DEPLOY.md` に Micrometer CLI 例・管理ポート URL・アラート設計を反映する。
2. **障害復旧手順**: 監査ログと Micrometer を連携させることで、障害時に `AuditTrailService` のチェーン整合性を確認する検証手順（DB ロールバック時のハッシュ再計算など）を `operations` 系ドキュメントへ追記する。
3. **アラート設計**: Micrometer への移行後、既存 Grafana / Prometheus ルールを `opendolphin_api_error_total`・`opendolphin_db_active_connections` に合わせて再設計する。WildFly 33 のヘルスチェックエンドポイント（`/health/ready` 等）も監視対象へ加える。
4. **設定管理**: `configure-wildfly.cli` と `.env` で重複管理している設定値（Plivo、2FA、DB SSL）が散在しているため、Micrometer 追加分も含めて命名を統一し IaC（Terraform 等）へ移管する準備を進める。
5. **Concurrency 監視**: `verify_startup.sh` が `managed-*` リソース確認を網羅するため、定期実行結果と `executor.*` メトリクス（キュー長・失敗件数）を `PHASE2_PROGRESS.md` へ記録し、再スケジュール失敗時のエスカレーションルートを決める。

---

<sup>1</sup> WildFly 33 Final リリースノート（2024-10-15）。

<sup>2</sup> WildFly Observability ガイド（Micrometer サブシステム構成例）。

<sup>3</sup> Jakarta EE 10 Platform Specification（`web.xml` / `beans.xml` スキーマ定義）。
