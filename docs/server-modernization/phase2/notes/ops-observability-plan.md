# Ops 観測性・Nightly CPD 実行計画（2026-06-15 更新、担当: Worker D）

## 2026-06-15 追記: Nightly CPD サンドボックス実行証跡
- Codex サンドボックスから Jenkins へアクセスできないため、本番ジョブの代替として `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis pmd:cpd -Dcpd.outputXML=true` をローカルで実行し、生成物を `ops/analytics/evidence/nightly-cpd/20240615/` へ集約した。`build-local-sandbox.log` に Maven ログを保存済み。
- `server-modernized/target/static-analysis/pmd/cpd.xml` → `ops/tools/cpd-metrics.sh`（CRLF 除去と絶対パス対応を追加）でメトリクスを抽出。`cpd-metrics.json` には `duplicate_lines=21837 / duplication_count=258 / file_count=175` を記録。
- Slack / PagerDuty / Grafana はネットワーク制限で実測不可のため、同ディレクトリにプレースホルダ (`slack_notify.txt`, `pagerduty_event.json`, `grafana_panel_screenshot.png`) と README を配置。Ops は Jenkins 本番ジョブ `Server-Modernized-Static-Analysis-Nightly` を起動し、取得した Permalink / Incident ID / ダッシュボードスクリーンショットで置き換えること。
- Grafana パネルは `ops/analytics/grafana/static_analysis_cpd_panels.json` を `Static Analysis` ダッシュボードへ適用後、BigQuery 側に 3 日分のダミーデータを投入してスクリーンショットを採取する。撮影ファイルは `ops/analytics/evidence/nightly-cpd/<yyyymmdd>/grafana_panel_screenshot.png` を差し替え。
- Jenkins 実行時は `server-modernized/target/static-analysis/pmd/cpd.xml`（`reporting` の outputDirectory 指定で配置）をアーティファクトへ保存し、`ops/tools/cpd-metrics.sh` に `REPO_ROOT` を指定して相対パス化すると BigQuery 取り込みでモジュール列が `server-modernized/...` になる。

## 1. Nightly CPD ジョブ運用
- Jenkins パイプライン `ci/jenkins/nightly-cpd.groovy` を `Server-Modernized-Static-Analysis-Nightly` として登録し、`cron('H 3 * * *')` で毎日 03:00 JST に起動する。
- 実行前提:
  - Jenkins ノード `maven-jdk17` に JDK 17 / Maven 3.9 / `spotbugs:spotbugs` 用キャッシュを準備。
  - Secrets: `slack-static-analysis-webhook`, `pagerduty-static-analysis-routing-key`（いずれも Global credentials / Secret text）。登録状況は毎月 `Manage Jenkins > Credentials` で棚卸しし、監査ログへ記録。
  - `docs/web-client/operations/TEST_SERVER_DEPLOY.md` の手順で用意した WildFly + PostgreSQL リファレンス環境で `server-modernized` WAR のビルドが緑であることを事前確認（`mvn -f pom.server-modernized.xml clean package -DskipTests`）。
- 実行手順（初回セットアップ時）:
  1. ジョブタイプ: Pipeline → 「Pipeline script from SCM」→ SCM: Git（本リポジトリ）。Script Path: `ci/jenkins/nightly-cpd.groovy`。
  2. 「Build Triggers」で `H 3 * * *` を設定。`Build Discarder` は 30 日保持。
  3. 「Bindings」で Slack/PagerDuty 資格情報を紐付け、`withCredentials` で参照できることを確認。
  4. `Build with Parameters` で手動実行し、`Console Output` と `server-modernized/target/site/cpd.{xml,html}`、`cpd-metrics.json` が生成されることを確認。
- 証跡保存:
  - `ops/analytics/evidence/nightly-cpd/<YYYYMMDD>/` を作成し、`build-<number>.log`, `cpd-metrics.json`, `slack_notify.txt`, `pagerduty_event.json`, `grafana_panel_screenshot.png` を格納。
  - Slack / PagerDuty の Permalink / インシデント ID は `PHASE2_PROGRESS.md` にも記録。

## 2. Slack / PagerDuty 連携
- Slack:
  - チャンネル: `#dev-quality`。Webhook ID: `slack-static-analysis-webhook`。
  - テンプレートはパイプライン `Notify` ステージのフォーマットを利用し、成功時は `duplicate_lines`/`file_count` サマリ、失敗時は `直前に取得できたメトリクス` を含める。
  - 疎通確認は Jenkins `Replay` → `error 'notification verification'` で失敗を発生させ、Slack Permalink を `ops/analytics/evidence/nightly-cpd/<YYYYMMDD>/slack_notify.txt` に保存。
- PagerDuty:
  - サービス: `server-modernized-static-analysis`。Routing key は `pagerduty-static-analysis-routing-key`。
  - イベント: 失敗時のみ `trigger`。`custom_details` に `duplicate_lines` / `duplicated_file_count` / `git_branch` / `git_commit` を含め、`links` へ Jenkins Build URL を付与。
  - 疎通確認は Slack と同じ失敗ビルドで実施し、PagerDuty インシデント ID・エスカレーション結果を `PHASE2_PROGRESS.md` に記載。

## 3. BigQuery / Grafana 取り込み
- CPD メトリクス抽出: `ops/tools/cpd-metrics.sh --cpd-xml server-modernized/target/site/cpd.xml --output cpd-metrics.json --job-name Server-Modernized-Static-Analysis-Nightly ...`。
- BigQuery:
  - 取り込みテーブル: `static_analysis.duplicate_code_staging`（JSON ロード）。
  - 本番テーブル反映: `ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql` を `bq query --use_legacy_sql=false` で実行。
- Grafana:
  - データソース: `grafana-bigquery-datasource`（UID: `${DS_BIGQUERY_STATIC_ANALYSIS}`）。
  - パネル JSON: `ops/analytics/grafana/static_analysis_cpd_panels.json`。`CPD Duplicate Lines (Daily)` / `CPD Top Modules` を `Static Analysis` ダッシュボードに追加し、`job_name` 変数は `Server-Modernized-Static-Analysis-Nightly` 固定。
  - 初回は BigQuery に 3 日分のダミーデータを投入してレンダリングを確認し、スクリーンショットを証跡として保存。

## 4. 監視・Micrometer との連携
- CPD アラート後の調査で参照するログ / メトリクス:
  - `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` に従い、Micrometer → Prometheus → Grafana の経路を確認。
  - `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のネットワーク・Secrets セクションで JMS/ORCA 等の接続値を照合。
- Trace ID の取り扱い:
  - `RequestMetricsFilter` が `traceId` を MDC に設定、`SessionTraceManager` が監査ログへ自動反映する。CPD 関連の Slack/PagerDuty 通知には `traceId` は含まれないため、`ops/tests/api-smoke-test` の `/serverinfo/*` ケースを再実行し、`server-modernized` ログと `d_audit_event` を突合する。

## 5. フォローアップと残課題
- Ops チームは Nightly CPD を 3 連続成功させ、Slack/PagerDuty Permalink と Grafana パネル更新を本ノートへ追記する（完了後に更新日を差し替える）。
- Jenkins / GitHub Actions でネットワーク制約により CPD 実行が失敗する場合は、`docs/web-client/operations/TEST_SERVER_DEPLOY.md` のローカル Docker 手順で代替環境を立ち上げ、`mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:cpd` をローカル保存して Evidence に添付する。
