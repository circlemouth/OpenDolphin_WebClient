# Nightly CPD 証跡（20240615 Sandbox 実行）

- 実行コマンド: `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis pmd:cpd -Dcpd.outputXML=true`
- ログ: `build-local-sandbox.log`
- レポート: `server-modernized/target/static-analysis/pmd/cpd.xml`, `server-modernized/target/site/cpd.html`
- メトリクス抽出: `ops/tools/cpd-metrics.sh`（コミット `eaf1643`、ローカル実行）
- Slack / PagerDuty / Grafana の本番証跡はネットワーク制限で取得不可。Ops チームが Jenkins 本番ジョブを起動後に以下を差し替えてください。
  - `slack_notify.txt`: #dev-quality の通知 Permalink とメッセージ本文
  - `pagerduty_event.json`: インシデント ID、routing key、エスカレーション結果
  - `grafana_panel_screenshot.png`: Grafana `Static Analysis` ダッシュボードの `CPD Duplicate Lines (Daily)` パネルスクリーンショット
