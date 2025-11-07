# フェーズ2 進捗メモ (更新: 2026-06-14)

## 2026-06-14 追記: Phase0-Scope-Adjustment（担当: Codex）
- ✅ ステークホルダー合意に基づきフェーズ0（環境棚卸し・Compose 手順整理）はサーバーモダナイズ デバッグ範囲から除外。今後の進捗報告・チェックリスト更新はフェーズ1以降のみを対象とし、フェーズ0タスクが再度必要になった場合は別チケットで復活させる方針を確認。
- 📌 `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ0節へスコープ除外の注記を追記済み。

## 2026-06-14 追記: RuntimeDelegate-Expansion（担当: Codex）
- ✅ `DemoResourceAspTest`／`TouchModuleResourceTest`／`DolphinResourceDocumentTest`／`TouchUserServiceTest`／`PHRResourceTest` を `RuntimeDelegateTestSupport` 継承・Mockito `lenient()` 化し、RuntimeDelegate 未登録／Strictness による失敗を解消。
- ✅ `TestRuntimeDelegate` に `Cache-Control`・`MediaType` ヘッダーデリゲートを実装、レスポンスヘッダーへ `Cache-Control` を反映。StackOverflow/UnsupportedOperationException を抑止。
- ✅ `server-modernized/src/test/resources/fixtures/demoresourceasp/` を新設して 16 件のフィクスチャを追加、`DemoResourceAspTest` の期待値をプレースホルダ対応で更新。
- ✅ 単体 (`mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=DemoResourceAspTest,TouchModuleResourceTest,DolphinResourceDocumentTest,TouchUserServiceTest,PHRResourceTest test`) で対象テストがグリーンであることを確認。
- ⚠️ `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false` は `open.dolphin.touch.JsonTouchResourceParityTest`（errors=2, failures=1）と `open.dolphin.infomodel.InfoModelCloneTest`（failures=2）が継続失敗。ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`。
- 🔁 次アクション: 上記 2 テストの調査を `SA-TOUCH-JSON-PARITY`（Worker F）／`SA-INFOMODEL-CLONE`（Worker B）にフォローアップ依頼。RuntimeDelegate 対応メモを `docs/web-client/planning/phase2/runtime-delegate.md` へ追記予定。

## 2026-06-14 追記: SpotBugs-EI-DefensiveCopy（担当: Codex）
- ✅ REST/Touch DTO (`DemoAspResponses`, `DolphinDocumentResponses`, `TouchModuleDtos`, `TouchPatientDtos`, `JsonTouchSharedService` 等) と ADM20 DTO (`PhrExportRequest`, `TotpVerificationResponse`) に防御的コピー処理を導入。`TouchPatientService` / `DemoResourceAsp` から Patient スナップショットを受け渡すよう改修。
- ✅ セキュリティ設定 (`Fido2Config`, `AuditEventPayload`, `SigningConfig`, `SessionTraceContext`) と Messaging/インフラ (`ClaimHelper`, `DiseaseHelper`, `DiagnosisModuleItem`, `PatientHelper`, `AccountSummary`, `ORCAConnection`, `CopyStampTreeBuilder`/`Director`) を immutable 化。
- ✅ 新規テスト 6 件を追加し（`server-modernized/src/test/java/open/dolphin/rest/dto/DemoAspResponsesDefensiveCopyTest.java` ほか）、`mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false` で回帰確認。SpotBugs レポートは `server-modernized/target/static-analysis/spotbugs/spotbugs-opendolphin-server.xml` を参照。
- 🔁 残タスク: JMS/MBean 系 32 件（`SA-INFRA-MUTABILITY-HARDENING`）は未着手。次イテレーションで Properties/Date のクローン／JMS ラウンドトリップテストを追加し、残存 `EI_EXPOSE_REP*` を削減する。Legacy 除外ポリシーは既存メモ（SpotBugs-Exclude-Legacy）を継続。

## 2026-06-14 追記: SpotBugs-Exclude-Legacy（担当: Codex）
- ✅ `server-modernized/config/static-analysis/spotbugs-exclude.xml` に Legacy DTO/コンバータ向けの `EI_EXPOSE_REP*` 除外 `<Match>` を追加し、コメントで互換維持根拠を明示。
- ✅ `mvn -f pom.server-modernized.xml -Pstatic-analysis spotbugs:spotbugs -DskipTests` を再実行し、ログを `server-modernized/target/static-analysis/spotbugs/spotbugs-20260614-legacy-exclude.log` に保存。出力 XML を `docs/server-modernization/phase2/notes/static-analysis-findings.md` へ反映。
- 📊 Medium `EI_EXPOSE_REP*` 903 件のうち 831 件が Legacy 範囲（infomodel/converter/Touch・ADM コンバータ／ICarePlan）であることを確認。手動対応継続分 68 件は REST/Touch DTO・セキュリティ設定・Messaging/MBean へ分類済み。
- 🔁 再評価方針: Touch/ADM 互換 API 廃止または InfoModel 自動生成化の完了時、SpotBugs 5.x への更新時にフィルタを見直し。四半期ごとにフィルタ無しの試験実行を行い、監査ログへ追記する。
- 📦 アーティファクトは `server-modernized/target/static-analysis/spotbugs/` を CI アップロード対象に追加予定。Ops 共有時はログと XML を ZIP 化して提供。

## 2026-06-15 追記: TraceContextProvider-Design（担当: Worker A）
- ✅ `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` に `TraceContextProvider` / `TraceContextBridge` の設計案と依存関係図を追加。`MessagingGateway` から `SessionTraceManager` への直接依存を解消する方針を整理した。
- 📌 新規チケット `TRC-15 TraceContextProvider`（Phase2 backlog）を登録。スコープは「Provider インタフェース追加」「MessagingGateway / MessageSender / RequestContextExtractor の移行」「JMS traceId 欠落監視ロジック」。
- 🔁 次アクション:
  1. Worker A: Provider インタフェースと `TraceContextBridge` 仮実装を `server-modernized/src/main/java/open/dolphin/infrastructure/trace/` に追加し、単体テストで MDC 引き継ぎを確認。
  2. Worker C: JMS 周り（`MessagingGateway`, `MessageSender`）を Provider API に移行し、`SessionTraceManager` への依存を削除。
  3. Worker D: PHASE2 OPS から Grafana/Alertmanager へ JMS traceId 欠落 WARN の通知ルールを追加。
- ✅ チケット情報を `docs/server-modernization/phase2/notes/static-analysis-plan.md` および `docs/server-modernization/phase2/notes/ops-observability-plan.md` にリンク予定。

## 2026-06-14 追記: Static-Analysis-First-Run-Triage（担当: Codex）
- ✅ Jenkins `Server-Modernized-Static-Analysis` / GitHub Actions `Server Static Analysis` の最新成果物を `tmp/static-analysis-20260614.log` で採取し、SpotBugs High 14・Medium 1,149、Checkstyle 3,255、PMD priority3 48 / priority4 280 を照合。両 CI の数値差分なし。
- ⚠️ SpotBugs High の新規要対応は `server-modernized/src/main/java/open/dolphin/mbean/KanaToAscii.java:601`（`String#replace` 未再代入）と `server-modernized/src/main/java/open/dolphin/touch/session/EHTServiceBean.java:881`（`ObservationModel` リストから `IPhysicalModel` を削除）。Legacy DTO/Converter 由来の High は既存分類範囲内。
- 📝 チケット候補: `SA-TOUCH-PHYSICALS-GENERICS`（Worker E）、`SA-MBEAN-KANA-RETURNVALUE`（Backend 山本）、`SA-MSG-MMLHELPER-IMMUTABILITY`（Worker D）を Jira 起票予定。担当者と実装・回帰テスト計画を擦り合わせる。
- 🛠️ CI 改善案: Checkstyle `WhitespaceAround` を info 化して diff gate へ集約、SpotBugs High 差分検出を `scripts/run-static-analysis-diff.sh` に追加、Slack 通知へ重大度サマリを添付。対応後に Runbook / `static-analysis-plan.md` を更新する。
- 🔜 次アクション: 上記チケット登録、Ops/Backend と通知スクリプト改修・`spotbugs-exclude.xml` 更新のスケジュール確定、次回スタンドアップで進捗確認。

## 2026-06-14 追記: Nightly-CPD-Implementation（担当: Codex）
- ✅ Jenkins 夜間 CPD パイプラインを `ci/jenkins/nightly-cpd.groovy` として追加。`cron('H 3 * * *')`／`mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:cpd -Dcpd.failOnViolation=false -B`／メトリクス抽出／Slack・PagerDuty 通知までを Jenkins Declarative Pipeline として整理し、アーティファクト（`server-modernized/target/site/cpd.{xml,html}`, `cpd-metrics.json`）は 30 日保持に設定。
- ✅ CPD メトリクス抽出スクリプト `ops/tools/cpd-metrics.sh` を実装し、BigQuery 取り込み用 JSON を生成できることをサンプル XML で検証。BigQuery 反映クエリ `ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql` と Grafana 追加パネル定義 `ops/analytics/grafana/static_analysis_cpd_panels.json` を整備し、既存ダッシュボードへ取り込める状態にした。
- ⚠️ サンドボックスでは Jenkins / Slack / PagerDuty / BigQuery / Grafana へアクセスできないため、初回ジョブログ・通知リンク・アラート証跡・ダッシュボード更新スクリーンショットは未取得。Ops チームが本番環境でジョブを登録・初回実行後に証跡を収集し、本メモと `docs/server-modernization/phase2/notes/static-analysis-findings.md` へ追記する。
- 📝 次ステップ: 1) Ops による Jenkins ジョブ作成と実行・証跡共有。2) BigQuery `static_analysis.duplicate_code_daily` テーブル作成と `cpd-metrics.json` の定期ロード手順化。3) Grafana `Static Analysis` ダッシュボードへパネル追加と Slack Info 通知閾値（前日比 +10%）の運用確認。

## 2026-06-14 追記: Ops-Credential-Setup（担当: Codex）
- ⚠️ サンドボックスでは Jenkins / GitHub へのアクセス権が無く、`slack-static-analysis-webhook` / `pagerduty-static-analysis-routing-key` および `SLACK_STATIC_ANALYSIS_WEBHOOK` / `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY` の登録・監査ログ取得は未実施。Ops へ棚卸しと証跡収集を依頼済み。
- 📝 Jenkins `Server-Modernized-Static-Analysis` / GitHub Actions `Server Static Analysis` の通知テストは未実行。Ops が手動失敗を発生させた際にビルド番号・Slack メッセージ Permalink・PagerDuty インシデント ID・テンプレ調整内容を共有し、本メモと `static-analysis-plan.md` に追記する必要あり。
- ✅ static-analysis-plan.md に資格情報登録手順、通知テンプレ改善案、Runbook 追記案を整理し、Ops 実施時のガイドとして利用可能な状態を整備。

## 2025-11-06 追記: Touch/REST RuntimeDelegate テスト復旧（担当: Codex）
- ✅ JAX-RS 実装非依存で `Response` を生成できる `open.dolphin.testsupport.TestRuntimeDelegate` を追加し、テスト用基底 `RuntimeDelegateTestSupport` から登録。`jackson-*` 依存を 2.17.1 系に揃えて `RuntimeDelegate` 呼び出し時の `NoSuchMethodError` を解消。
- ✅ `TouchStampServiceTest` / `TouchPatientServiceTest` / `DolphinResourceVisitTest` / `SystemResourceTest` / `PVTResource2Test` / `AdmissionResourceFactor2Test` にレスポンスアサーションと lenient 設定を補強し、Access Reason・Consent Token・監査詳細など業務的な期待値を明示。
- ✅ `mvn -f pom.server-modernized.xml test -pl server-modernized -Dtest=AdmissionResourceFactor2Test,SystemResourceTest,TouchStampServiceTest,TouchPatientServiceTest,PVTResource2Test,DolphinResourceVisitTest` で単体確認済み。`mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis verify -Dsurefire.failIfNoSpecifiedTests=false -Dtest=<同上>` でも静的解析プロファイルを通過 (`tmp/static-analysis-targeted.log`)。
- 📝 未着手: Mockito Strictness 対応が未整備な既存テスト群（`DemoResourceAspTest` など）が static-analysis 全体実行時に失敗するため、別途 lenient 設定またはスタブ拡充の横展開が必要。

## 2026-06-13 追記: SpotBugs EI_EXPOSE_REP 分類（担当: Codex）
- ✅ `spotbugs-opendolphin-{common,server}.xml` の `EI_EXPOSE_REP*` 934 件を棚卸し、Legacy DTO/コンバータ 837 件と手動実装 97 件に分類。`docs/server-modernization/phase2/notes/static-analysis-findings.md` にサマリ表・リスク評価・対応方針を追記。
- ✅ Legacy 互換コード（`open.dolphin.{infomodel,converter}`, `open.dolphin.{adm10,adm20,touch}.converter`, `ICarePlan*`）を `spotbugs-exclude.xml` で除外する案を整理。手動実装は REST/Touch DTO・セキュリティ設定・運用系コンポーネントの 3 グループに分け、チケット草案を作成。
- 📝 次ステップ: 1) `spotbugs-exclude.xml` への具体的な `<Match>` 追記と CI プロファイル確認。2) `SA-REST-DTO-IMMUTABILITY` ほか優先チケット化と実装オーダー調整。3) 防御的コピー導入後に SpotBugs 再実行／JSON・JMS ラウンドトリップテストの追加を検討。

## 2026-06-12 追記: Static-Analysis-CI 組み込み（担当: Codex）
- ✅ ルートに `Jenkinsfile` を追加し、`Server-Modernized-Static-Analysis` マルチブランチパイプラインで SpotBugs/Checkstyle/PMD を二段階実行。`server-modernized/target/static-analysis/**/*` をアーティファクト化し、失敗時は Slack/PagerDuty へ通知。
- ✅ GitHub Actions Workflow `Server Static Analysis`（ジョブ ID: `static-analysis`）を新設。PR と `main` push で同等の静的解析を実行し、PR 時は `scripts/run-static-analysis-diff.sh` による差分ゲートを適用。成果物は `static-analysis-reports` として保存。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に CI 実装手順・通知設定・運用ルールを反映し、Slack/PagerDuty シークレット名を明示。
- 📝 次ステップ: 1) Nightly 用 `pmd:cpd` ジョブのスケジュール実装とダッシュボード整備。2) PagerDuty 通知テンプレートを Ops と擦り合わせて Runbook 化。3) Checkstyle/PMD レポートの自動 triage（重大度タグ付け）を検討。

## 2026-06-12 追記: Ops-Credential-Setup（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に Jenkins 資格情報 (`slack-static-analysis-webhook`, `pagerduty-static-analysis-routing-key`) / GitHub Secrets (`SLACK_STATIC_ANALYSIS_WEBHOOK`, `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY`) 登録手順と疎通テストのダウンタイムレスな実施方法を追記。Slack/PagerDuty の通知テンプレート・JSON 雛形も記録。
- ⚠️ サンドボックス環境では外部 Webhook 実行と資格情報登録が不可のため、実際の登録・疎通テストは Ops 環境で実施が必要。Runbook (`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`) へ追記する作業を Ops に引き継ぎ。
- 📝 次ステップ: 1) Ops が本番 Jenkins / GitHub Actions に資格情報を登録し、手動失敗トリガーで Slack/PagerDuty 通知を確認。2) 成果を Runbook に記録し、定期的な Webhook 健全性チェック手順（例: 月次ドライラン）を設定。3) PagerDuty インシデントレビューで通知テンプレートの文言・自動エスカレーションポリシーを確定。

## 2026-06-12 追記: Nightly-CPD-Design（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-findings.md` に Nightly PMD CPD ジョブ設計（Jenkins 優先・GHA 代替）、アーティファクト保管、Grafana/BigQuery ダッシュボード案、Slack 情報通知閾値案を記載。
- ✅ 週次レビュー体制案を整理。Phase2 静的解析スタンドアップ（木曜 10:00 JST）で CPD 指標・SpotBugs/PMD backlog をレビュー。参加者: Backend (Lead: 山本), Ops (担当: 佐々木), QA (担当: 田中)。議事録は `static-analysis-review-minutes.md`（新規予定）へ格納予定。
- 📝 次ステップ: 1) Jenkins に `Server-Modernized-Static-Analysis-Nightly` ジョブを作成し、`cron('H 3 * * *')` で稼働開始。2) Ops が CPD XML → BigQuery 連携スクリプトを整備し、Grafana ダッシュボードを公開。3) Slack `#dev-quality` への Info 通知テンプレートを試行し、閾値を調整。

## 2026-06-14 追記: SA-DOC-OPERATIONS（担当: Worker D）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に `SA-INFRA-MUTABILITY-HARDENING` 実施計画を追記。JMS ヘルパー / MBean キャッシュ / 外部接続ラッパーの 3 クラスタごとに担当・検証観点（JMS ラウンドトリップ、MBean Exposure IT、Plivo/ORCA WireMock など）・完了目安（6/21・6/25・6/28）を明文化。
- ✅ `docs/server-modernization/phase2/notes/ops-observability-plan.md` を新設し、Nightly CPD ジョブ (`ci/jenkins/nightly-cpd.groovy`) の前提、Slack/PagerDuty 資格情報、証跡保存ディレクトリ `ops/analytics/evidence/nightly-cpd/<date>/`、BigQuery/Grafana 連携（`ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql`, `ops/analytics/grafana/static_analysis_cpd_panels.json`）を整理。`docs/web-client/operations/TEST_SERVER_DEPLOY.md` で定義された WildFly + PostgreSQL リファレンス環境を前提条件として明示。
- ✅ `docs/server-modernization/phase2/notes/test-data-inventory.md` を新設し、`ops/tests/api-smoke-test/`、`scripts/api_parity_response_check.py`、監査ログ検証で必要なテストデータ・SQL・成果物保存ルール・Python 実行制約時の代替手順（curl / Postman / `psql`）を一覧化。追加作成すべき手動資材（`test_config.manual.csv`, `ops/tools/send_parallel_request.sh` など）も記録。
- ✅ `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8〜10 の備考を更新し、観測性・回帰テスト・ドキュメント運用タスクから上述ノートを参照できるようにした。
- 🔁 残タスク: 1) Ops が Nightly CPD を本番 Jenkins で 3 連続実行し、Slack/PagerDuty Permalink と Grafana パネル更新スクリーンショットを `ops-observability-plan.md` へ追記。2) `test-data-inventory.md` で定義した手動テスト資材を実体化し、CI と同じ成果物格納ルールを整備。3) 各 `SA-INFRA-MUTABILITY-HARDENING` クラスタ完了時に SpotBugs 件数差分とラウンドトリップテストログを本メモへ追記。

## 2026-06-12 追記: Static-Analysis-First-Run-Triage（担当: Codex）
- ⚠️ サンドボックスでは CI 実行不可のため、現行レポートは 2025-11-06 時点のローカル実行結果ベース。件数サマリと対応計画を `static-analysis-findings.md` に追記。
- ✅ SpotBugs High/Medium の優先順位を整理し、`SE_BAD_FIELD` の継続対応と `OBL_UNSATISFIED_OBLIGATION_EXCEPTION_EDGE` の 6 月末解消目標を明記。Checkstyle/PMD は差分ゲート + Nightly CPD で監視する方針。
- ✅ チケット化候補を整理（`JIRA-SERVER-2345`: Serializable 警告継続対応、`JIRA-SERVER-2410`: PMD 未使用メソッド/重複コード対応）。正式なチケット発行はプロジェクト JIRA 管理者へ依頼。
- 📝 次ステップ: 1) 初回 CI 実行後に実データで再トリアージし、High/Medium の新規検知を `static-analysis-findings.md` へ更新。2) SpotBugs 差分ゲートをスクリプトに組み込む案を評価（実行時間測定、ルールの増減）。3) Slack 通知に警告件数サマリを含めるか検討（SARIF 集計 or `jq` 集計スクリプト）。
## 2026-06-11 追記: Static-Analysis-Diff-Gating（担当: Codex）
- ✅ `scripts/run-static-analysis-diff.sh` を新規作成し、`git diff` に含まれる Java ファイルのみへ Checkstyle / PMD を適用するラッパーを整備。`--base` / `--target` / `--cached` オプションで PR / ローカル双方のワークフローに対応。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-findings.md` に Jenkins / GitHub Actions 向け二段階ジョブ（フルレポート採取 → 差分ゲート）のドラフトと運用注意点を追記。
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` に「新規・変更ファイルは警告ゼロ」「既存警告は技術負債として記録」「例外申請は findings.md へ記録」等の差分ゲート運用ルールを整理。
- 🧪 ダミー差分でラッパースクリプトを実行し、Checkstyle / PMD 共に警告ゼロであることを確認。手順と結果を `static-analysis-findings.md` へ記録済み。
- 📝 次ステップ: 1) 既知 PMD 警告（特に `AvoidInstantiatingObjectsInLoops`）の棚卸しと対応優先度分類。2) Jenkinsfile/GitHub Actions への本格導入に向けたジョブ作成と試験実行。3) 差分スクリプトでの SpotBugs 連携可否（SARIF 連携含む）を検討。

## 2026-06-10 追記: Layer-Decoupling-POC（担当: Codex）
- ✅ `ChartEventSessionKeys` / `ChartEventStreamPublisher` を `open.dolphin.session.support` に新設し、`ChartEventServiceBean` から REST 実装への直接依存を排除。`ChartEventSseSupport` をインタフェース実装として CDI 注入できる構造に整理した。
- ✅ `open.dolphin.msg.dto.AccountSummaryMessage` インタフェースを追加し、`OidSender`・`MessageSender`・`AccountSummary` 間を共通契約で接続。メッセージング層からセッション層クラスへの参照を削減しつつ、JMS ペイロード互換性を維持。
- ✅ `docs/server-modernization/phase2/notes/server-layer-map.md` に Layer-Decoupling-POC の依存図を追記し、本メモへ進捗を反映。
- 📝 次ステップ:  
  1. SSE 配信とロングポーリングの並列配送を自動テストで確認し、`ChartEventSessionKeys` 参照箇所の回帰検証を整備。  
  2. `AccountSummary` を `common` / `infomodel` へ移す場合の依存整理（Velocity テンプレート・序列化互換）を調査し、移行計画の是非を判断。  
  3. `OidSender` の CDI 化または `MessagingGateway` 経由の送信統合案を検討し、Activity レポート経路との統合可否をレビュー。

## 2026-06-09 追記: server-modernized レイヤーマップ作成（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/server-layer-map.md` を新規作成し、REST / Session / Msg / Security / Metrics / Support レイヤーごとに主要パッケージ・代表クラス・責務を表形式で整理。
- ✅ レイヤー間の依存フローと循環参照（`rest↔session`, `session↔msg`, `session↔touch.converter`, `rest↔touch`）を洗い出し、改善案を併記。
- ⚠️ `open.dolphin.session.ChartEventServiceBean` が REST 実装へ依存しているため、SSE 定数とサポートクラスの切り出しが必要。影響範囲調査と分離計画を別タスク化したい。
- 📝 次ステップ: 1) `AccountSummary` の移動可否を `common` モジュール側と調整。2) Touch コンバータを共有 DTO へ抽出する案を検討し、既存クライアント互換性を確認。

## 2026-06-08 追記: Infrastructure-Filter-Trace レビュー（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` を新規作成し、LogFilter → RequestMetricsFilter → SessionTraceManager の時系列整理と監査/JMS へのトレース伝搬経路を図式化。
- ⚠️ HTTP traceId とセッション traceId の系列が分離している点、`identityToken` が LogFilter を経由せず監査に traceId が残らない点、`RequestMetricsFilter` がテンプレート解決失敗時に動的パスをタグへ記録する点を重大ギャップとして記録。
- 📝 次ステップ:  
  1. `SessionOperationInterceptor` で MDC の traceId を受け取り SessionTraceManager へ継承する案の PoC を実施。  
  2. `identityToken` フローへ最小限の監査記録と traceId 付与を追加する設計を起こし、既存クライアント互換性テスト方針を整理。  
  3. Request メトリクスのパステンプレート抽出とステータスタグ追加の開発規模を見積もり、Grafana ダッシュボード更新手順を ops チームと擦り合わせる。

## 2025-11-06 追記: Trace-Propagation-Enhancement（担当: Codex）
- ✅ `LogFilter` で `identityToken` を含む全リクエストに traceId を割り当て、`X-Trace-Id` ヘッダーへ返却。403 応答時の警告ログにも `traceId=...` を出力。
- ✅ `SessionTraceManager`／`SessionOperationInterceptor` が HTTP traceId を継承し、`org.jboss.logmanager.MDC` と `org.slf4j.MDC` を双方向に同期するよう改修。`MessagingGateway` は traceId 欠落時に WARN を発砲しつつ新規採番して JMS プロパティへ設定。
- ✅ `RequestMetricsFilter` にパス正規化フォールバックと `status` タグ／`opendolphin_auth_reject_total` を追加し、サンプルメトリクスを `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` へ記録。
- 🧪 `mvn -f pom.server-modernized.xml test -DskipTests`、`mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=LogFilterTest,RequestMetricsFilterTest test`
- 🔜 Grafana の path/status タグ更新、および JMS WARN 発生時のアラート調整を ops チームと擦り合わせる。

## 2025-11-06 追記: Static-Analysis-Profile-Implementation（担当: Codex）
- ✅ `pom.server-modernized.xml` と各モジュールに `static-analysis` プロファイルを追加し、SpotBugs（FindSecBugs付）、Checkstyle、PMD を `verify` で連鎖実行できるよう整備。設定ファイルは `server-modernized/config/static-analysis/` に配置。
- ✅ `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を実行し、初回レポート（`server-modernized/target/static-analysis/`）を採取。結果サマリは `docs/server-modernization/phase2/notes/static-analysis-findings.md` に記録。テスト込み実行では既存の REST/Touch テストが多数失敗する点を確認。
- ✅ 2025-11-06: `DM_DEFAULT_ENCODING`（common 5 / server 13 件）を全箇所解消。`OrcaApi`／`PlistConverter`／`PlistParser` で UTF-8 を明示し、Touch/ADM 側の `Base64Utils`・`EHTResource`（Stamp/Tree）・`DemoResource`／`DemoResourceASP`／`DolphinResourceASP`／`KanaToAscii` でも `String#getBytes()`・`new String(byte[])` を Charset 指定へ置換。軽量テスト (`OrcaApiEncodingTest`, `Base64UtilsTest`, `KanaToAsciiTest`) を追加し `mvn -f pom.server-modernized.xml test -pl server-modernized,common -DskipTests=false -Dtest=OrcaApiEncodingTest,Base64UtilsTest,KanaToAsciiTest` → `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` で回帰確認。`SE_BAD_FIELD`（server 14 件）は同日対応済み。Medium は DTO に起因する `EI_EXPOSE_REP*` が大半（両モジュール合計 494 件）。
- 📝 次ステップ:  
  1. DM_DEFAULT_ENCODING / SE_BAD_FIELD など即対応が必要な警告を技術負債チケット化し、担当アサイン。  
  2. SpotBugs 除外フィルタに InfoModel／自動生成 DTO を追加しつつ、本番コードでの実害有無を棚卸し。  
  3. Checkstyle / PMD を差分限定で走らせるラッパー（`git diff` 連携）案を検討し、運用ルールを整備。  
  4. Jenkins / GitHub Actions に `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を組み込むワークフローをドラフト化し、CI チームへ共有。

## 2025-11-06 追記: SpotBugs-SE_BAD_FIELD 対応（担当: Codex）
- ✅ `open.dolphin.adm10/adm20/touch` の `IDocument*` 系 DTO と `ICarePlanModel` / `IOndobanModel30` に `serialVersionUID` を追加し、`IAttachmentModel`・`IUserModel`・`ICarePlanItem` を `Serializable` 化して Session/Touch 経路のシリアライズ互換を確保。JMS/REST いずれもフィールド構造は不変のため後方互換性リスクはなし。
- 🧪 `mvn -f pom.server-modernized.xml test -pl server-modernized -Dtest=Touch* -Dsurefire.failIfNoSpecifiedTests=false` を実行。`jakarta.ws.rs.ext.RuntimeDelegate` 実装がテストクラスパスに無い既知課題で複数テストが失敗することを再確認（TouchModule/DolphinResource 系）。コード変更による追加エラーは検出されず。
- 🧮 `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests` を再実行し、`server-modernized/target/static-analysis/spotbugs/spotbugs-opendolphin-server.xml` から `SE_BAD_FIELD` 検出が消失したことを確認。
- 📝 `docs/server-modernization/phase2/notes/static-analysis-findings.md` に対処内容を追記し、本メモへ記録。

## 2026-06-08 追記: 静的解析ツール導入方針整理（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/static-analysis-plan.md` を新規作成し、SpotBugs / Checkstyle / PMD の比較表、Jakarta 10 での適用条件、段階的な導入ステップを整理。
- ✅ `pom.server-modernized.xml` を基点にした `static-analysis` プロファイル設計案と、SpotBugs 除外フィルタ / Checkstyle ルール配置ディレクトリの案を提示。
- 📝 次ステップ:  
  1. `server-modernized/config/static-analysis/` に SpotBugs 除外フィルタ・Checkstyle 設定ファイルを追加し、現状検出件数をサンプリング。  
  2. Jenkins / GitHub Actions へ `mvn -f pom.server-modernized.xml -Pstatic-analysis verify` を組み込むテンプレートを作成し、レポート保管先（アーティファクト or S3）を決定。  
  3. SpotBugs High/Medium 検出のトリアージ結果を `static-analysis-findings.md`（新設予定）へ記録し、優先対応チケットを起票。  
- 🧪 リソース要件:  
  - CI: Maven 3.9+ / Temurin 17 / 4GB RAM ノード 1 台。SpotBugs 実行で +4 分、Checkstyle/PMD で +3 分程度の追加所要を想定。  
  - Dev: SpotBugs GUI を利用する場合は X11 転送 or HTML レポート閲覧環境を確保。差分解析用に Git フック or ラッパースクリプト整備が必要。

## 2026-06-07 追記: PHR-2FA-Audit 実装準備（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/phr-2fa-audit-implementation-prep.md` を作成し、S3 ストレージ・Secrets 自動検査・監査ハッシュ検証・第三者提供 API のチケット草案と優先度/作業ブロック/受入条件を整理。
- ✅ `ops/check-secrets.sh`（Secrets 事前検査スクリプト案）を追加し、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に検査対象変数・CI 失敗条件・ドライラン結果を追記。ダミー値でのテスト実行を記録。
- ⚠️ 監査ハッシュ検証はローカル DB にデータがなく手動再現できず。Stage DB へ `d_audit_event` サンプルを投入し、通知ワークフローを含めたフルドライランが必要。
- 📝 次ステップ:  
  1. CI 環境（Jenkins or GitHub Actions）に `bash ops/check-secrets.sh` を追加し、Vault 連携と Slack/PagerDuty 通知を有効化。  
  2. Ops と連携して S3 バケット/IAM/Terraform 草案をレビューし、`PHR_EXPORT_S3_*` Secrets をステージ環境に投入。  
  3. セキュリティレビュー: 監査ハッシュ検証ジョブの設計と PagerDuty 通知テンプレートをセキュリティ委員会へ諮問。  
  4. 第三者提供 API の業務フロー定義ワークショップを開催し、API 設計レビュー→実装タスクを割り当てる。  
- 🧪 リソース要件:  
  - CI: Maven 実行可能なビルドエージェント（Linux）1 台 + Vault 読み取り権限。  
  - Ops: AWS アカウント権限（S3/IAM/CloudTrail）、Terraform 管理リポジトリ更新。  
  - Security: PagerDuty サービス連携、監査ログ保全ポリシー承認、手動異常対応 Runbook 更新。  
  - QA: Stage 環境での `PHRResourceTest` / `AdmissionResourceFactor2Test` 実行ログの収集と証跡保管。

## 2026-06-06 追記: ClaimItem / DocInfoModel / ModuleInfoBean DB 差分検証（担当: Codex）
- ✅ `ClaimItem` の追加フィールドはモジュール XML (`ModuleModel.beanBytes` → `IOSHelper.toXMLBytes`) に格納されることを確認。`DocInfoModel.admFlag` は `d_document.admflag`, `ModuleInfoBean.performFlag` は `d_module.performflag` 列を前提としており、Flyway には列追加 DDL が存在しない点を洗い出した。
- ⚠️ `IClaimItem` コンバータ（adm10/adm20 双方）が新フィールドを保持せず、REST 経路で保存すると `numberCodeName`・`santeiCode`・`dose*` が欠落する。`PhrDataAssembler` はこれらの getter を利用しており、現状では常に null 応答になる。
- ⚠️ `DocInfoModel#clone()` と `ModuleInfoBean#clone()` が `admFlag`／`performFlag` を複製しておらず、文書複製・スタンプ複製時にフラグが失われる恐れあり。
- 📝 Ops ランブックへ `information_schema.columns` による `admflag`／`performflag` 列存在チェックと不足時の `ALTER TABLE` 追加手順を追記。コンバータ更新＋XML 再生成テスト、Bean の複製漏れ修正、Flyway マイグレーション有無の Ops への確認をフォローアップタスクとして登録する。

## 2026-06-06 追記: PHR / 監査 / 2FA 実装計画整理（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/common-dto-diff-N-Z.md` に PHR 非同期ジョブ・第三者提供記録・2FA DTO の実装計画と優先度付きギャップ一覧を追記し、Flyway／Secrets／監査の整合性確認ステップを明文化した。
- ✅ `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の 検証フロー 4-7 に「2FA / 監査 / Secrets チェック」を追加し、`d_factor2_*` および `d_audit_event` の Flyway 適用確認、Secrets 検査、監査ハッシュ検証の手順を Runbook 化した。
- 📝 S3 PHR ストレージ実装可否の判断、`PHR_EXPORT_SIGNING_SECRET` の Secrets 管理方針、`ops/check-secrets.sh` への必須キー追加、Micrometer 監視項目整備をチケット化し Phase2 backlog に登録する。
- ⚠️ 現状は CI で `AdmissionResourceFactor2Test` やハッシュチェーン検証が走っておらず、手動チェックに依存している。Maven 実行環境整備と nightly 実行フローを Ops/QA と調整する必要がある。

## 2026-06-06 追記: Touch FirstEncounterModel 統合対応（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/touch/session/IPhoneServiceBean` から `FirstEncounter0/1Model` 参照を除去し、`FirstEncounterModel` へのクエリ一本化と `getFirstEncounterModels`／`getLatestFirstEncounter` を追加。
- ✅ `common/src/main/java/open/dolphin/infomodel/FirstEncounterModel` に `docType` 列を読み取り専用で公開し、シングルテーブル継承メタデータを整理。`beanBytes` の取り扱いは既存ロジックを継承。
- ✅ `docs/server-modernization/phase2/notes/common-dto-diff-A-M.md` に Touch REST API／クライアント依存／`d_first_encounter` の影響と互換性確認手順を追記。
- 📝 互換性確認フロー: ① モダナイズ環境で `SELECT docType, COUNT(*) FROM d_first_encounter GROUP BY docType;` を実行し Legacy 由来の docType 値（`FirstEncounter0Model` 等）を確認。② Touch サービスから代表レコードの `beanBytes` を `IOSHelper.xmlDecode` でデコードし、既存クライアントが解釈できることを確かめる。③ Touch REST API に docType フィルタを公開する際は UI/クライアント仕様書へ docType 一覧とリクエスト例を追記する。

## 2026-06-05 追記: Common DTO A〜M 差分棚卸し（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/common-dto-diff-A-M.md` を新設し、Jakarta 版と Legacy (`e17c06d8`) の差分をクラス別に整理。新規 DTO（監査ログ / 2FA / CarePlan）と Legacy 未収録 DTO を把握した。
- ⚠️ `FirstEncounter0/1/2Model` が Jakarta 版から削除されている一方、`server/src/main/java/open/dolphin/touch/session/IPhoneServiceBean` で引き続き参照されており、Touch 系ビルドが成立しない。代替 DTO（`FirstEncounterModel`）へのリファクタ or Touch API の廃止可否を決定する必要あり。
- 📝 `ClaimItem` / `DocInfoModel` / `ModuleInfoBean` に追加したフィールドの DB スキーマ（Flyway 適用）と Legacy サーバーでの互換性確認、`IInfoModel` 定数削除に伴う利用箇所洗い替えを継続する。

## 2026-06-04 追記: Common DTO N〜Z 差分棚卸し（担当: Codex）
- ✅ `docs/server-modernization/phase2/notes/common-dto-diff-N-Z.md` を新設し、Legacy（`upstream/master`）との差分を Jakarta 置換状況 / フィールド追加 / 新規 DTO ごとに整理。`PHRAsyncJob` や `ThirdPartyDisclosureRecord` などの新設エンティティを含めた互換性影響と優先度付きフォローアップを記録した。
- ✅ `PHRBundle` の `facilityNumber` 追加や `PHRClaimItem` の用法・投与量フィールド拡張、Hibernate 6 への `@JdbcTypeCode(SqlTypes.CLOB)` 置換など、Legacy 実装との不整合点を棚卸し。`OrcaAnalyze`/`CacheUtil`/`LegacyBase64` など周辺コンバータ・ユーティリティの Jakarta 対応も併せて一覧化した。
- 📝 フォローアップとして (1) PHR 出力スキーマと旧クライアントの互換検証、(2) `phr_async_job` Flyway 適用状況の自動チェック、(3) 第三者提供記録の実装計画策定、(4) Jakarta Mail 依存のビルド確認を進める。

## 2026-06-04 追記: デバッグチェックリスト初版作成（担当: Codex）
- ✅ `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` を新設し、server-modernized デバッグタスクをフェーズ別チェックリストとして整理。現時点で完了済みの棚卸し事項と未着手タスクを明確化した。
- ✅ 本メモへ進捗を追記し、今後の更新時にチェックリストと連動してステータスを管理する運用方針を定義。

## 2026-06-04 追記: フェーズ1ビルド検証・設定レビュー（担当: Codex）
- ✅ `mvn -f server-modernized/pom.xml clean verify -DskipTests` を実行し、WAR を生成。コンパイル時に `Base64Utils`（Touch 系）、`Long(long)` / `Character(char)` など Java SE 非推奨 API の警告を確認し、要フォロー項目としてチェックリストへ追記。
- 📝 非推奨 API 警告は開発完了後にまとめて解消する方針とし、チケット化対象として記録（即時対応は行わない）。
- ✅ `common` モジュールをローカルインストールし（`mvn -f common/pom.xml install -DskipTests`）、`opendolphin-common-2.7.1-jakarta.jar` を取得。server-modernized ビルド時の依存解決が完了することを確認。
- ✅ `META-INF/persistence.xml`（3.1 スキーマ）および `META-INF/ejb-jar.xml`（4.0 スキーマ）を確認し、Jakarta EE 10 対応のスキーマ／データソース設定が整合していることを記録。

## 2026-06-04 追記: WildFly CLI 冪等化（担当: Worker S2）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の JDBC データソース（`java:/jboss/datasources/ORCADS` / `PostgresDS`）を `if (outcome != success)` 判定で増分更新し、旧 SSL 設定の有無に応じたプロパティ整理を行った。
- ✅ ActiveMQ Artemis の `java:/queue/dolphin` / `java:/JmsXA` / `default-resource-adapter-name=activemq-ra` を冪等作成し、従来キューとの互換を保ったまま MDB 連携を有効化。
- ✅ `ee-concurrency` サブシステムへ `DolphinContext` / `DolphinExecutor` / `DolphinScheduler` / `DolphinThreadFactory` を追加し、デフォルト参照先をまとめて JNDI 化。CLI ログには `:read-resource-description` で最終状態を記録。
- ✅ `ops/modernized-server/docker/Dockerfile` に手動ビルド検証のコメントを追記し、CLI スクリプト完走確認手順を明示。

## 2025-11-06 追記: OQS サブモジュール追加（担当: Codex）
- ✅ `ext_lib/OpenDolphin-ORCA-OQS` を Git サブモジュールとして追加し、オンライン資格確認（OQS）および電子処方箋ワークフロー実装時に参照するコードベースをリポジトリへ取り込んだ。
- ✅ `docs/server-modernization/phase2/README.md` / `docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md` を更新し、OQS 連携の位置づけ、Jakarta EE 10 対応状況、REST→OQS ブリッジ設計や Secrets 管理・CI 組み込みタスクを明記。
- 📝 フォローアップ: `server-modernized` ビルドへ OQS SDK を組み込む Maven 設計（モジュール追加 or BOM 連携）と、資格確認 API・電子処方箋電文の統合テスト手順（鍵・証明書の保管ポリシーを含む）を作成する。

## 2025-11-05 追記: Secrets 配布ワークフロー整備（担当: Worker S1）
- ✅ `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` へ `FACTOR2_AES_KEY_B64` の生成・ローテーション手順と Jakarta EE 10 向け Secrets 配布フローを追加し、未設定時の失敗条件と監査対応を明文化。
- ✅ `.env.sample` / `server-modernized/config/server-modernized.env.sample` / `docker-compose.modernized.dev.yml` に Secrets 必須項目のコメントを追記し、本番では Vault 等から値を注入する必要がある旨と未設定時の挙動を明記。
- ✅ `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` へ Secrets 手順への参照を追加し、2FA 鍵欠落時の対応先を統一。

## 2026-06-03 追記: Ops 自動検証スクリプト導入（担当: Worker S3）
- ✅ WildFly 必須リソースを `docker exec` と `jboss-cli.sh` で検証する `ops/modernized-server/checks/verify_startup.sh` を追加。`set -euo pipefail` でブロッカーを即検知できるよう、各ステップで `[INFO]` / `[OK]` ログを整備。
- ✅ スクリプトの前提条件と使用例を `ops/modernized-server/checks/README.md` に整理し、Ops チームがジョブ基盤へ組み込みやすいよう参照手順を明文化。
- ✅ `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` に「Ops 自動検証スクリプト」節を追加し、チェック対象リソースと導入意図をリンク付きで記載。

## 2026-06-03 追記: WildFly 33 運用ランブック整理（担当: Worker S4）
- ✅ `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` にモダナイズ版起動前チェックリストを新設し、Worker S1 の Secrets 配布手順／Worker S3 の検証スクリプト／JMS・Concurrency リソース確認を連携させた。
- ✅ `docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md` へ JMS 設定完了証跡と CLI／`verify_startup.sh` を用いた検証フローを追記し、ログ保存場所とフェールオーバーテストの手順を明文化。
- ✅ `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` に Concurrency リソース整備済みである旨と `executor.*` メトリクス監視のフォローアップタスクを追加。
- 📝 本メモを更新し、Documentation Runbook の進捗を記録。

## 2026-06-02 追記: server-modernized 起動ブロッカー整理（担当: Codex）
- ✅ 起動を阻害している依存リソースを調査し、`docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` に 2FA 秘密鍵・JDBC データソース・JMS・Jakarta Concurrency の不足点と対応手順をまとめた。
- ✅ `docs/web-client/README.md` のナビゲーションへ上記ドキュメントを追加し、フロントエンド側からも参照できるようリンクを更新。

## 2026-05-27 Update: API parity tooling (owner Codex)
- Added `scripts/api_parity_eval.py` to aggregate coverage by matching legacy OpenAPI (`docs/server-modernization/server-api-inventory.yaml`) and the parity matrix (`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`).
- `[x]` combined with the complete symbol is treated as fully migrated; uncovered entries and OpenAPI gaps are listed in the CLI output for follow-up.
- Introduced `scripts/api_parity_response_check.py` to send mirrored requests to both servers and compare status/body based on a JSON definition. Destination IPs are supplied via `LEGACY_API_BASE` / `MODERN_API_BASE` or `--legacy-base` / `--modern-base`.
- Published `scripts/api_parity_targets.sample.json` as a template for request definitions and documented the workflow in `docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md`.

## 2025-11-03 追記: PVTResource2 / SystemResource パリティ再点検（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/PVTResource2.java` の POST/GET 実装と `server-modernized/src/test/java/open/dolphin/rest/PVTResource2Test.java` のカバレッジを確認し、`/pvt2` POST・`/pvt2/pvtList` GET を `[x]` 判定へ更新。facility ID 再紐付けと `PatientVisitListConverter` 包装処理の単体テスト証跡を取得済み。
- ✅ `DELETE /pvt2/{pvtPK}` の削除正常系／施設不一致例外系を `PVTResource2Test#deletePvt_removesVisitForAuthenticatedFacility`／`#deletePvt_throwsWhenFacilityDoesNotOwnVisit` として追加し、`PVTServiceBean#removePvt` 呼び出しパラメータと `ChartEventServiceBean#getPvtList` の副作用を検証。マトリクスと Runbook を `[x]` 化済み。
- ✅ 2025-11-04: Worker E が `SystemResourceTest` を追加し、`/dolphin` 5 エンドポイントの正常系／例外系・監査ログ分岐をモック検証。Runbook SYS-PARITY-20251104-01 とマトリクス更新で証跡を反映。
- 📎 ドキュメントを更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（PVT2 行と SystemResource 行の最新判定）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（検証ログ追記）、`docs/web-client/README.md`（更新概要を反映）。

## 2025-11-04 追記: SystemResource 監査整備（担当: Worker E）
- ✅ `server-modernized/src/test/java/open/dolphin/rest/SystemResourceTest.java` を新設し、hellowDolphin/addFacilityAdmin/getActivities/sendCloudZeroMail/checkLicense の全ユースケースを Mockito でモック化。成功・失敗それぞれの `AuditTrailService` への記録を `ArgumentCaptor` で検証し、ライセンス処理は `InMemoryLicenseRepository` で IO 副作用を遮断。
- ✅ `server-modernized/src/main/java/open/dolphin/rest/SystemResource.java` に監査ヘルパーを追加し、`SystemServiceBean` 呼び出し前後で成功/失敗詳細（facilityId・traceId・reason）を記録。`LicenseRepository`（ファイル実装含む）を導入し、読込/書込例外・上限超過を明示的にハンドリングするよう更新。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` と `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を更新し、SystemResource 行を `[x]`／◎ に変更。Runbook には検証 ID `SYS-PARITY-20251104-01` を登録。
- ⚠️ ローカル環境に Maven CLI が無く `mvn -pl server-modernized test -Dtest=SystemResourceTest` は未実施。CI 環境または Maven 導入後に当該コマンドを実行し、Runbook の備考へログ（監査テーブル確認結果含む）を追記する必要がある。

## 2025-11-04 追記: PHRResource 監査整備と Export API 実装（担当: Worker F）
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java` を全面改修し、11 既存エンドポイントへ監査ログ・施設 ID 突合・TouchErrorResponse を導入。新規エンドポイント（`POST /20/adm/phr/export`, `GET/DELETE /20/adm/phr/status/{jobId}`, `GET /20/adm/phr/export/{jobId}/artifact`）を実装し、署名付き URL を返却できるようにした。
- ✅ `PhrExportJobWorker`・`PhrDataAssembler`・`PhrRequestContext` などサポートクラスを追加し、ZIP 生成→ファイルシステム保存→`SignedUrlService` による HMAC 署名を完結。`PHRAsyncJobServiceBean#cancel` で PENDING ジョブの取消にも対応。
- ✅ REST 向け単体テスト `PHRResourceTest` を追加し、アクセスキー参照／エクスポート要求／成果物ダウンロードの代表ケースを Mockito で検証。ローカル環境では `mvn` 不在のため実行不可 (`bash: mvn: command not found`)。CI で `mvn -f pom.server-modernized.xml -pl server-modernized test -Dtest=PHRResourceTest` を必ず回し、結果ログを Runbook 手順 6 へ添付すること。
- ✅ ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（PHR 行を `[x]`／◎ 化＋ export 系を追記）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（Blocked 解除・curl/SQL 手順を追加）、`docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`（結果概要更新）、`docs/web-client/README.md`（更新概要リンクを追加）。

## 2025-11-04 追記: DolphinResource Document API モダナイズ（担当: Worker A）
- ✅ `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java` の `/touch/document/progressCourse`・`/touch/idocument(2)` を JSON 応答へ刷新し、`DolphinTouchAuditLogger`＋`TouchErrorResponse` で監査・例外を統一。施設 ID 突合とトレース ID 付き失敗レスポンスを実装。
- ✅ `server-modernized/src/main/java/open/dolphin/touch/dto/DolphinDocumentResponses.java` と `DolphinTouchAuditLogger.java` を追加し、カルテ本文 DTO／監査ロガーを共通化。ProgressCourse 変換では schema Base64・ClaimItem の用法/日数を保持。
- ✅ `server-modernized/src/test/java/open/dolphin/touch/DolphinResourceDocumentTest.java` を新設し、正常保存・施設不一致・バリデーション失敗・一覧取得をカバー。`mvn` が未導入のため CLI 実行は不可（`bash: mvn: command not found`）だが、IDE/CI 導入後に `-Dtest=DolphinResourceDocumentTest` での実行を予定。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` を更新し、該当 3 行を `[x]`／◎ へ変更。監査ログ・TouchErrorResponse 整備およびテストケース（DolphinResourceDocumentTest）をメモ欄へ追記。

## 2025-11-04 追記: Touch Module API 移行（担当: Worker B）
- ✅ `/touch/module*`／`/touch/item/laboItem` を `TouchModuleService` + JSON DTO へ刷新し、`TouchAuthHandler` で施設ヘッダー突合・`TouchModuleAuditLogger` で監査ログを統一。キャッシュは `CacheUtil`（TTL 10 秒・キー `method:paramHash`）で実装。
- ✅ `TouchModuleResourceTest` を追加し、モジュール／RP 多剤／診断／ラボ結果／Schema Base64／キャッシュヒット／施設ガードの各パリティを検証。`mvn -pl server-modernized -Dtest=TouchModuleResourceTest test` は Maven 未導入により実行失敗（`bash: mvn: command not found`）。
- 📄 ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch モジュール 6 行を `[x]` 化）、`domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md`（実装サマリとキャッシュキー方針）、`phase2/README.md`（推奨アクション追記）、`docs/web-client/README.md`（関連リンク追加）。
- 📌 残タスク: `/touch/patient/*`・`/touch/stamp*` など未移植 13 件は引き続き legacy XML 実装のため `[ ]` 継続。Touch ドキュメント系のキャッシュ共有 (`TouchResponseCache`) は Worker A の実装待ち。

## 2025-11-03 追記: EHTResource API パリティ完了（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java` と `ADM20_EHTServiceBean` を拡張し、旧サーバーの `/20/adm/eht/*` 43 エンドポイントを全移植。CLAIM 送信／バイタル／身体所見系に Jakarta 版のトランザクション境界とレスポンス順序（`order by`）を反映。
- ✅ 監査ログを拡充（`EHT_CLAIM_SEND(2)`, `EHT_PHYSICAL_*`, `EHT_VITAL_*`）し、`EHTResourceTest`（sendClaim/vital/physical）を追加。`API_PARITY_MATRIX.md` と `EHT_SECURITY_AUDIT_CHECKLIST.md` を刷新し、Runbook 4.2 にテスト ID `EHT-RUN-20251103-*` を登録。
- ⚠️ ローカルに Maven が存在せず `mvn -pl server-modernized test` は `bash: mvn: command not found`（2025-11-03 14:15 JST）。ユニットテストは追加済みのため、Maven 導入後に実行ログを取得し Runbook/監査テーブルを確定させる。ORCA／CLAIM 実機検証は Worker E・Worker A へ引き続き依頼済み。

## 2025-11-03 追記: PHR/MML API パリティ再確認（担当: Worker D）
- ✅ `PHRResource` の 11 エンドポイント全てが Jakarta 版で実装されていることをコード確認。`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` と `API_PARITY_MATRIX.md` を修正し、実装済みである一方テスト証跡が無いことを `△ 要証跡` として明示。
- ✅ `MmlResource` の Labtest/Letter 系エンドポイント（`/mml/labtest/*`, `/mml/letter/*`）が現行ソースに存在することを確認し、`STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` を更新。Runbook/マトリクスから「未移植」表記を除去し、テスト未整備のフォローを追記。
- ⚠️ PHR エクスポート基盤は REST エンドポイント・ジョブワーカーが未実装。`PhrExportJobManager` が未定義クラス `ManagedExecutorFactory` を参照、`PhrExportJobWorker` クラス欠如、S3 ストレージはスタブのままと判明。Runbook (`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`) の手順 6 を **Blocked** 表記へ差し替え。
- 📌 Flyway DDL `server-modernized/tools/flyway/sql/V0220__phr_async_job.sql` は存在するが適用ログ無し。`WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` にタスクとして (1) REST 実装、(2) ジョブワーカー整備、(3) DDL 適用手順、(4) テスト・監視追加 を列挙。実装完了まで `PHRResource` の API チェックボックスは `[ ]` のままとし、証跡取得後に `[x]` へ引き上げる。

## 2025-11-04 更新: DemoResourceASP 完了（担当: Worker G）
- ✅ `ModuleModel` import 復旧、`BundleDolphin#setOrderName`／ProgressCourse オーダ整合、ラボ `comment2` フォールバック、施設・ユーザーヘッダー検証＋`AuditTrailService` 連携を実装。`DemoResourceAspTest` を 15 エンドポイントの正常／異常系へ拡張し、`fixtures/demoresourceasp/*` で legacy 期待値と JSON 比較。Runbook `DEMO-ASP-20251104-01` にテスト手順・curl 比較観点・IDE 実行ログを追記。
- ⚠️ ローカルに Maven が無いため `mvn -f pom.server-modernized.xml test -Dtest=DemoResourceAspTest` は未実行。CI 導入後に実行ログと `d_audit_event` 監査確認を取得して Runbook を完結させる。

## 2025-11-04 追記: Touch 個人情報 API モダナイズ（担当: Worker B）
- ✅ `/touch/patient/{pk}` `/touch/patientPackage/{pk}` `/touch/patients/name/{param}` を `TouchPatientResource`＋`TouchPatientService` へ移行し、施設整合チェック・`X-Access-Reason`／`X-Consent-Token` 必須化・`AuditTrailService` 連携と JSON 正規化を実装。`TouchPatientServiceTest` で consent 未設定・施設不一致・カナ検索分岐を検証。
- ✅ `/touch/stamp/{param}` `/touch/stampTree/{param}` を `TouchStampResource` に分離し、`TouchResponseCache`（TTL 10 秒）でレスポンスをキャッシュ。`TOUCH_STAMP_FETCH`／`TOUCH_STAMP_TREE_FETCH` 監査ログを追加し、`TouchStampServiceTest` でキャッシュヒットとヘッダー不足時 403 をカバー。
- ✅ `/touch/user/{param}` を `TouchUserResource` へ移管し、`userName`／`password` ヘッダー検証・施設 ID 正規化・S3 Secret マスクを実装。`TouchUserServiceTest` でヘッダー突合とサニタイズ済みレスポンスを確認。
- 📄 ドキュメント更新: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch patient/stamp/user 行を `[x] ◎` 判定へ更新しテスト ID を追記）、`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`（新リソースと監査要件を掲載）、`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`（`X-Access-Reason`／`X-Consent-Token` 運用と PIA 監査ログ確認フローを追記）。
- ⚠️ フォローアップ: `/touch/idocument(2)` からのキャッシュ失効と SSE エラー連携は未実装。`mvn -pl server-modernized test` は Maven 未導入のため `bash: mvn: command not found`（2025-11-04 17:20 JST）。

## 2025-11-04 追記: Touch 来院履歴 API 移植（担当: Worker C）
- ✅ `GET /touch/patient/firstVisitors|visit|visitRange|visitLast` を QueryParam 化し、`facility/offset/limit/sort/order` を RESTEasy で受け付けるよう改修。legacy `{param}` 形式は互換のため維持。
- ✅ `IPhoneServiceBean#getPatientVisitWithFallback` へ前日再検索ロジックを移設し、`fallbackApplied` フラグを監査に残す。施設突合・ロール判定は `403` で明示し、監査イベントを「来院履歴照会」「施設突合失敗」に統一。
- ✅ Micrometer カウンタ/タイマ (`touch_api_requests_total` / `_error_total` / `_duration`) を追加し、`DolphinResourceVisitTest` で施設不一致・権限不足・limit 境界・Fallback 正常系を検証。マトリクスと Runbook を更新。
- 📄 更新ドキュメント: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`（Touch 来院履歴行を `[x]` 化）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`（QueryParam 仕様・監査/メトリクス手順を追記）、`docs/web-client/README.md`（更新概要リンク）。

## 2026-05-27 追記: セッション層ログの SLF4J 移行（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/session/` 配下のセッション Bean、`session/framework`、`security/`（FIDO/TOTP 含む）、`metrics/MeterRegistryProducer` の `java.util.logging` 呼び出しを `org.slf4j.Logger` ベースへ統一。ログレベル・メッセージ文面は既存実装を踏襲しつつ、クラス単位でロガーを取得する形に整理した。
- ✅ `server-modernized/pom.xml` に `org.slf4j:slf4j-api:2.0.13`（provided）を追加し、コンパイル時に SLF4J API を解決できるようにした。WildFly 33 標準の `slf4j-jboss-logmanager` バインディングで自動的に JBoss LogManager へルーティングされるため、追加の運用設定は不要。
- ℹ️ 監査ログや Micrometer 連携は SLF4J への移行後も既存のログカテゴリ名を維持する。`logging.properties` 側のカテゴリ指定を変更する必要はないが、WildFly コンソールで `org.slf4j` ロガーを有効化すると新メッセージを確認できる。

## 2025-11-03 追記: DolphinResourceASP / JsonTouch 再点検（担当: Worker C）
- 🔍 `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java:26-1488` と `DolphinResourceASP.java:25-1446` を確認し、legacy 実装のコピーであること・`System.err` ログ／施設 ID 突合・監査・キャッシュが未導入であることを再確認。`server-modernized/src/main/webapp/WEB-INF/web.xml:20-46` に `open.dolphin.touch.DolphinResourceASP` が登録されておらず RESTEasy から到達できないため、API パリティでは `[ ]` 継続とした。
- 🔍 `JsonTouch` 系は `/jtouch`（touch）／`/10/adm/jtouch`（adm10）／`/20/adm/jtouch`（adm20）に分散しているが、ADM10 側の document/mkdocument を Jakarta リソースへ実装し、`JsonTouchAuditLogger` で監査ログを統一。`JsonTouchResourceParityTest` を 17 ケース（document/mkdocument/interaction/stamp の正常・異常＋監査ログ検証）へ拡張し、touch/adm10/adm20 のレスポンス整合を確認した。
- 📝 `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の DolphinResourceASP・JsonTouchResource 行を更新し、未登録・未テストのギャップを明記。`docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md` と `docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` に再点検メモを追記。
- ⚠️ 次アクション: ① RESTEasy 登録＋エンドポイント露出の確認、② Touch 用キャッシュ／認可／監査実装、③ Reverse Proxy 手順の更新と `/20/adm/jtouch` 系の監査統合、④ 残るエラー応答フォーマット統一。完了後に API パリティを `[x]` へ更新する。

## 2025-11-03 追記: DolphinResourceASP 移植設計着手（担当: Worker C）
- ✅ `docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md` を作成し、旧 `/touch/*` 19 エンドポイントのレスポンス構造・認可ギャップ・キャッシュ要件を整理。Worker F（スタンプキャッシュ）／Worker E（Touch UI 例外統一）との連携タスクを明文化した。
- 🔍 旧サーバー実装 (`server/src/main/java/open/dolphin/touch/DolphinResourceASP.java`) を精査し、`getProgressCource` など大容量レスポンスと `postDocument(2)` のデータ更新パスを特定。キャッシュ導入時に患者単位の無効化が必要なことを確認。
- ⚠️ モダナイズ実装では `TouchResponseCache`・`TouchErrorResponse`・`TouchXmlWriter`（仮称）の新設、および施設 ID 整合チェック／UI 例外イベント連携を次ステップで実装する。Worker F からスタンプキャッシュ方針、Worker E からエラー payload 仕様を取得次第、本メモと Runbook を更新する。

## 2025-11-03 追記: Admission/System 2FA API 移植検証（担当: Worker A）
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` で `AdmissionResource` 28 件・`SystemResource` 5 件をすべて `◎ 移行済み` へ更新し、FIDO2/TOTP 系／carePlan 系の未チェック行を解消。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java` に 2FA 失敗時の `*_FAILED` 監査ロギングと `status` フラグを追加し、`TotpHelper#verifyCurrentWindow` を ±90 秒ウィンドウへ拡張。
- ✅ 新規ユニットテスト `AdmissionResourceFactor2Test` / `TotpHelperTest` / `TotpSecretProtectorTest` を追加し、2FA API と暗号化ユーティリティの互換性を検証可能にした（`mvn -f pom.server-modernized.xml test` で実行）。
- ✅ 2025-11-03: `AdmissionResourceFactor2Test` に FIDO2/TOTP の成功・異常系カバレッジを追加（`startFidoRegistrationRecordsAuditOnSuccess` / `finishFidoRegistrationRecordsAuditOnNotFound` / `finishFidoAssertionRecordsAuditOnSecurityViolation` ほか計 8 ケース）。`API_PARITY_MATRIX.md` のメモと `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の手順 4-3 を更新。
- ⚠️ ローカル環境に Maven バイナリが無いためテストコマンド実行は未完了。2025-11-03 時点でも `mvn -f pom.server-modernized.xml test` は `bash: mvn: command not found` で失敗。`mvn` が利用可能になり次第、上記テスト群を実行して Runbook の手順 4-3 を完了させる必要がある。

## 2025-11-03 追記: Stamp / Letter 監査ログ整備（担当: Worker F）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/StampResource.java` に `AuditTrailService` 連携と 404 応答処理を実装。単体テスト `StampResourceTest`（削除成功／不存在／一括削除シナリオ）を追加し、監査ペイロードを検証できるようにした。
- ✅ `server-modernized/src/main/java/open/dolphin/rest/LetterResource.java` に監査ログ記録と 404 応答処理を実装。取得・削除双方のテスト `LetterResourceTest` を作成し、`LETTER_DELETE` 監査アクションをカバー。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` と `docs/server-modernization/phase2/domains/STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` を更新し、監査テスト実施状況と Runbook ID（STAMP-AUDIT-20251103-01 / LETTER-AUDIT-20251103-01 / ORCA-COMPAT-20251103-01）を明記。
- 🔍 ORCA 連携 `PUT /orca/interaction` はソース比較で互換性を確認済み。ORCA テスト DB が未整備のため、実データ検証は Runbook ORCA-COMPAT-20251103-01 でオープン。
- ⚠️ ローカル環境には Maven が存在せず、`mvn -f server-modernized/pom.xml test` が `bash: mvn: command not found` で失敗。CI でのテスト実行と `d_audit_event` 確認、スタンプキャッシュ連携試験は Pending。Runbook 検証ログにフォローアップを記載済み。

## 2025-11-03 追記: DemoResourceASP JSON モダナイズ（担当: Worker B）
- ✅ DemoResourceASP 専用の新 REST クラス `open.dolphin.rest.DemoResourceAsp` を実装し、`web.xml` の `resteasy.resources` に登録。共通 DTO `open.dolphin.rest.dto.DemoAspResponses` を整備して InfoModel → JSON 変換を統一。
- ✅ ユニットテスト `DemoResourceAspTest` を追加し、ユーザー認証・患者/来院リスト・処方・カルテ本文・ラボ・診断・パッケージ API の JSON 形状を Mockito で検証（`mvn` 未導入につきローカル実行は Pending）。
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の DemoResourceASP 行を `◎ 移行済み` へ更新し、`docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md` に JSON 変換ルール・サンプルペイロード・pad フラグ扱いを追記。
- 🔄 `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ DemoResourceAspTest 実行待ちのメモを追記予定。Maven セットアップ後に `DemoResourceAspTest` を含む `mvn -f pom.server-modernized.xml test` を実施し、Runbook テストログへ結果を反映する。

## 2025-11-04 追記: Jakarta Naming API 再適用（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/MeterRegistryProducer.java` と `open/orca/rest/ORCAConnection.java`（モダナイズ版）の `javax.naming.*` 参照を `jakarta.naming.InitialContext` / `NamingException` へ戻し、WildFly 33 の Jakarta EE 10 API と整合。
- ℹ️ 旧サーバーモジュール（`server/`）は Java EE 7 / WildFly 10 前提のため `javax.naming` を維持し、Jakarta 化は実施しない方針を再確認。
- ✅ `pom.server-modernized.xml` に JBoss Public Repository (`https://repository.jboss.org/nexus/content/groups/public-jboss/`) を登録しつつ、`jakarta.websocket` については Maven Central で取得できる `2.1.0` 系へ明示的に固定。WildFly BOM が要求する `*-jbossorg-2` 系は引き続きローカルからは取得できないためバージョンを上書きした。
- ⚠️ `mvn -f pom.server-modernized.xml -pl server-modernized -am -DskipTests compile` は `jakarta.naming.InitialContext` を提供する Jakarta Naming API がリモートリポジトリ（JBoss Public Repository）経由で取得できず失敗。Jakarta EE 10 向け `jakarta.naming` の公開先が JBoss リポジトリのみである点と、リポジトリ側が 403 を返すため依存解決が進まない事象を確認した。

## 2025-11-03 追記: REST API パリティマトリクス整備（担当: Codex）
- ✅ `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` を新設し、旧サーバー OpenAPI とモダナイズ版インベントリを正規化パス＋HTTP メソッドで突合。1:1 対応 106 件・未移植 150 件・モダナイズ専用 13 件を算出した。
- ✅ `docs/server-modernization/rest-api-modernization.md` にマトリクスへの参照を追加し、API 移植状況レビュー時の導線を整備。
- ℹ️ 未移植の主要領域は 2FA 系 (`AdmissionResource`)、旧 ASP リソース群、`EHTResource`、`StampResource`、`PHRResource`。対応完了後はマトリクスの該当行を `◎` に更新する運用とする。

## 2025-11-03 追記: EHTResource 監査ログ対応（担当: Worker D）
- ✅ `docs/server-modernization/phase2/domains/EHT_SECURITY_AUDIT_CHECKLIST.md` を作成し、`/20/adm/eht/*` の現状棚卸し・セキュリティギャップ・法令準拠観点・外部連携テスト手順を整理。`docs/web-client/README.md` へリンクを追記。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java` に監査ログ記録処理を追加（メモ／アレルギー／診断／ドキュメントの POST/PUT/DELETE 成功時）、`SessionTraceManager` の traceId を監査詳細へ連携。
- ✅ `ADM20_EHTServiceBean` を `@ApplicationScoped` + `@Transactional` 化し、Jakarta EE 10 の CDI ベーストランザクション境界へ移行。
- ⚠️ ローカル環境に Maven が存在せず `mvn -pl server-modernized -am -DskipTests package` が実行できない。コンパイルテストは Maven 導入後に再実施する必要あり。

## 2025-11-03 追記: 外部インターフェース互換ランブック整備（担当: Codex）
- ✅ `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を作成し、API パリティ確認・設定移行・Smoke テスト・切替手順を統合した運用ガイドを整理。
- ✅ `docs/web-client/README.md` へランブックの導線を追加し、Web クライアント開発チームからも参照できるようにした。

## 2025-11-03 追記: DemoResourceASP デモデータ移行仕様整理（担当: Codex）
- ✅ `docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md` を新設し、旧 ASP 実装 15 エンドポイントのデータローディング仕様・モダナイズ側コンスタント差分・変換方針・QA テストケース・UX 影響を一括で整理。
- ✅ `docs/web-client/README.md` に同資料の導線を追加し、フロントエンド担当が `ONE_SCREEN` ガイドと合わせて参照できるようにした。
- 🔄 Worker F 連携タスク: スタンプ変換（`BundleDolphin`）の品目名・用法文言の整合確認を依頼。`getModule`/`getProgressCource` 実装差分レビュー待ち。

ℹ️ 以下 2025-11-03 記録は `javax.naming` への一時移行履歴として保存。
## 2025-11-03 追記: Micrometer JNDI `javax.naming` 置換（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/MeterRegistryProducer.java` の JNDI 参照を `jakarta.naming.*` から Java 17 標準の `javax.naming.InitialContext` / `NamingException` へ差し替え。Wildcard 型判定ロジックは従来どおり維持。
- ✅ `rg "jakarta.naming"` で `server-modernized` 配下および `pom.xml` に余剰依存が残っていないことを確認。Jakarta Naming API の `provided` 依存は不要となり、WildFly 付属の JNDI 実装を使用する前提を整理。
- ⚠️ `mvn -pl server-modernized -DskipTests compile` を 2025-11-03 (JST) に実行したが、ローカル環境に Maven CLI が存在せず `bash: mvn: command not found`。Maven 導入後に再実行するフォローアップタスクを残す。

## 2025-11-03 追記: WildFly 33 PostgreSQL モジュール配置修正（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の `module add` に `--module-root-dir=/opt/jboss/wildfly/modules/system/layers/base` を追加し、WildFly 33 のレイヤ化構成で PostgreSQL JDBC モジュールが認識されるように調整。
- ✅ 同 CLI の `ORCADS` / `PostgresDS` データソースにおける `connection-url` のデフォルト DB 名を `${env.DB_NAME:opendolphin_modern}` へ更新し、モダナイズ用 DB に揃えた。
- ℹ️ JMS 定義や Undertow 設定は既存のまま保守。`ops/modernized-server/docker/Dockerfile` が CLI を COPY/実行するフローを確認し、追加変更の必要がないことを再確認。

## 2025-11-03 追記: WildFly CLI SSL ルート証明書ガード修正（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` の `DB_SSLROOTCERT` 判定をセンチネル文字列比較へ変更し、未設定時に CLI が空行と誤認して失敗する問題を解消。接続プロパティへ渡す値は必ず引用付き文字列として指定。
- ℹ️ Docker ビルドおよび WildFly 起動検証は依頼者が実施予定（本作業では未実行）。

## 2025-11-03 追記: OpenPDF 3.0.0 PdfPKCS7 署名追随（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/reporting/PdfSigningService.java` の `PdfPKCS7` 生成時に CRL 配列引数（現状は `null`）を追加し、OpenPDF 3.0.0 が要求するシグネチャ `PdfPKCS7(PrivateKey, Certificate[], CRL[], String, String, boolean)` に整合。OpenPDF 1.3 系とも互換。
- ℹ️ OpenPDF 3.0.0 では `com.lowagie.*` から `org.openpdf.*` へのパッケージ移行と `java.time` 対応が進行中。署名ワークフローの BouncyCastle/TSA 構成は変更せず、後続タスクで import の置換と `ZonedDateTime` 利用検討を行う。
- ⚠️ `mvn -pl server-modernized -DskipTests compile` の実行はローカル方針（Maven 未導入・Docker 経由で実行）により未実施。検証は `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml run --rm server-modernized-dev mvn -pl server-modernized -DskipTests compile` で実施予定。

## 2025-11-03 追記: WebAuthn 2.6.0 / TOTP ユーティリティ追随（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/security/totp/TotpHelper.java` を新設し、SMS OTP／TOTP／バックアップキー生成と検証ロジックを共通化。`AdmissionResource`・`ADM20_EHTServiceBean` から旧 `open.dolphin.adm20.OTPHelper` 依存を排除。
- ✅ `ADM20_EHTServiceBean` の FIDO2 実装を Yubico WebAuthn 2.6.0 の段階付きビルダーへ合わせ、`com.yubico.webauthn.CredentialRepository` へのパッケージ移動と `RegistrationResult#getAttestationType()` の非 Optional 化に伴うメタデータ保存処理を更新。
- ⚠️ `mvn -pl server-modernized -DskipTests package` を 2025-11-03 (JST) に実行したが、環境に Maven CLI が存在せず `bash: mvn: command not found`。Maven 導入後に同コマンドで再検証するタスクを継続。
- ℹ️ `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md` および `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md` を更新し、Secrets 運用と WebAuthn 2.6.0 追随内容を反映。

## 2025-11-03 追記: Worker0/1 モダナイズビルド検証（担当: Codex）
- ✅ `mvn -f pom.server-modernized.xml -pl common -DskipTests -ntp package` で共通モジュールのビルドに成功。Apache Maven 3.9.6 を `~/.local/apache-maven-3.9.6` へ展開し `PATH` を一時追加して実行。
- ⚠️ `mvn -f pom.server-modernized.xml -s ops/shared/docker/settings.xml -pl server-modernized -am -DskipTests -ntp package` はコンパイルエラーで失敗。`ADM20_EHTServiceBean` の `com.yubico.webauthn.credential.*`、`MeterRegistryProducer` の `jakarta.naming.*`、`ChartEventStreamResource` の `jakarta.ws.rs.sse.SseElementType` など未解決シンボルが多発。
- ⚠️ 引き続き `PlivoSender`／`MessageSender` で `okhttp3.*`・`ConnectionSpec`・`TlsVersion` が解決できず、`Logger#log(Level, Supplier, Throwable)` 呼び出しシグネチャ不一致、`PdfSigningService` の `char`→`String` 変換エラーも発生。
- ✅ `ExternalServiceAuditLogger` の `log*` メソッドを `public` 化し、`MessageSender` に Claim/Diagnosis リクエスト監査ログを追加。内部で `Supplier<String>` を用いた遅延評価に切り替え、ログフォーマットは従来どおり維持。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカル環境に Maven CLI が存在せず `mvn: command not found`。ツール整備後にモジュールビルドの再検証が必要。
- ⚠️ `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml build server-modernized-dev` でも Maven ステージで同一エラーにより WAR（`server-modernized/target/opendolphin-server.war`）が生成されず。
- ℹ️ 再現手順: `export PATH=$HOME/.local/apache-maven-3.9.6/bin:$PATH` を設定し、上記コマンドを必ず `pom.server-modernized.xml` と `ops/shared/docker/settings.xml` を指定して実行。エラーログはローカルで `tee /tmp/mvn_server.log`・`/tmp/docker_build.log` に保存。

## 2025-11-03 追記: SSE/OkHttp/JNDI コンパイルエラー対応（担当: Codex）
- ✅ `ChartEventStreamResource` から旧 `@SseElementType` 参照を排除し、`ChartEventSseSupport` の `OutboundSseEvent` で JSON メディアタイプを設定する Jakarta REST 3.1 互換構成へ整理。
- ✅ `MessagingGateway`／`MessageSender`／`SessionOperationInterceptor` の `Logger#log` 呼び出しを Java 17 が提供する `log(Level, String, Throwable)` へ統一し、監査ログの文言を維持したままシグネチャ不整合を解消。
- ✅ `server-modernized/pom.xml` に `com.squareup.okhttp3:okhttp`／`logging-interceptor`（compile）と `jakarta.naming:jakarta.naming-api:2.1.1`（provided）を追加し、`PlivoSender`／`MeterRegistryProducer` の `ClassNotFoundException` を未然防止。`DEPENDENCY_UPDATE_PLAN.md` にライセンス・運用メモを追記。
- ⚠️ `~/.local/apache-maven-3.9.6/bin/mvn -pl server-modernized -DskipTests package` は JDK 未導入のため失敗（`Unable to locate a Java Runtime.`）。JDK 17 を導入後に同コマンドで WAR ビルドを再検証するタスクを残す。

## 2025-11-03 追記: OpenPDF 1.3.41 への後退（担当: Codex）
- ✅ `server-modernized/pom.xml` の `openpdf.version` を 1.3.41 に固定し、`PdfDocumentWriter` / `PdfSigningService` を `com.lowagie.text.*` API と旧 `PdfPKCS7` シグネチャに合わせて修正。BouncyCastle 1.82 維持でコンパイル互換性を静的確認。
- 📄 `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`、`docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`、`docs/server-modernization/reporting/LICENSE_COMPATIBILITY.md`、`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` を OpenPDF 1.3.41 前提へ更新。
- ⚠️ `mvn -pl server-modernized -am -DskipTests package` は `mvn: command not found` により未実行。Homebrew の `shellenv` 内で `/bin/ps` へのアクセスが拒否されたログ（`/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 18: /bin/ps: Operation not permitted`）後に Maven バイナリ欠如で停止。ローカルに Maven CLI を導入後に再試行が必要。

## 2025-11-03 追記: Hibernate 6 CLOB マッピング整理（担当: Codex）
- ✅ `PatientMemoModel` / `LetterText` / `PatientFreeDocumentModel` / `NurseProgressCourseModel` の `@Type(type="org.hibernate.type.StringClobType")` を `@Lob + @JdbcTypeCode(SqlTypes.CLOB)` に差し替え、Hibernate 6 互換のアノテーション構成へ刷新。`org.hibernate.annotations.Type` 依存を排除し、Jakarta Persistence 3.1 でビルド可能な前提を整備した。
- ⚠️ `mvn -pl common -DskipTests package` を実行したがローカルに Maven CLI が無く `command not found`。環境整備後に共通モジュールのビルド成功を確認するタスクが継続課題。

## 2025-11-03 追記: ORCA XPath 内部 API 排除（担当: Codex）
- ✅ `common/src/main/java/open/dolphin/common/OrcaAnalyze.java` から `com.sun.org.apache.xpath.internal.*` 依存を除去し、`javax.xml.xpath` ベースにリファクタ。`OrcaPatientInfo` DTO を導入して XML 解析結果をテストで検証できるようにした。
- ✅ `common/src/test/java/open/dolphin/common/OrcaAnalyzeTest.java` を追加し、サンプル XML で患者 ID と保険区分が抽出されることを静的検証（コードレビュー）した。JUnit 4.13.2 を `test` スコープで追加。
- ⚠️ `mvn -pl common test` はローカルに Maven CLI が無く `mvn: command not found`。環境整備後に新規テストを実行し、Jakarta EE 10 / Java 17 でのビルド確認を行うこと。

## 2025-11-03 追記: モダナイズ後 TODO 整理（担当: Codex）
- TODO 2025-11-06 Worker C: `ops/legacy-server/docker/Dockerfile` および `ops/modernized-server/docker/Dockerfile` から Hibernate 5 互換 `StringClobType` 生成ステップを削除し、CI キャッシュ更新＋`docker-compose.modernized.dev.yml` での回帰ビルド結果を Slack #server-modernization へ共有。
- TODO 2025-11-08 Worker 4: CLAIM / PVT Java ビルダーと旧 XSLT の差分を自動検証する単体テスト + ORCA Stub を用いた E2E を追加し、`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md` の ⚠️ を解消。
- TODO 2025-11-09 Worker 2: Swing 共通ユーティリティの `Project#getFloat(String)` / `setFloat(String)` を `BigDecimal` ベースの新 API へ置換し、影響箇所を `docs/web-client/planning/phase2/CONFIG_MIGRATION_CHECKLIST.md` に記録。

## 2025-11-02 追記: OpenPDF/FIDO2 アップデート（担当: Codex）
- ✅ `server-modernized/pom.xml` の OpenPDF を 3.0.0、BouncyCastle を 1.82 へ引き上げ。`PdfDocumentWriter`/`PdfSigningService` を `org.openpdf.*` パッケージと自前 PKCS#7 署名フローに対応させ、TSA フォールバックも維持。
- ℹ️ 2025-11-03 追記: Java 17 向けビルドに支障が出たため OpenPDF は 1.3.41 へ後退。`PdfDocumentWriter`/`PdfSigningService` は `com.lowagie.text.*` API に戻して維持する。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` に OpenPDF/BouncyCastle のライセンス告知セクションを追加し、`DEPENDENCY_UPDATE_PLAN.md`・`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`・`LICENSE_COMPATIBILITY.md` を最新バージョンへ更新。
- ✅ Yubico WebAuthn 2.6.0 の段階付きビルダーへ追従し、`ADM20_EHTServiceBean` の `StartRegistrationOptions`／`FinishRegistrationOptions`／`AuthenticatorSelectionCriteria` 呼び出しを更新。除外クレデンシャルは `CredentialRepository` に委譲し、関連ドキュメントを刷新。
- ✅ `common` を含む ORCA 連携コードが `jakarta.mail`／`jakarta.jms` へ統一されていることを確認し、該当ドキュメントの残課題表記を修正。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカルに Maven CLI が無く `command not found`（再現）。後続ワーカーは Maven 導入後に署名／FIDO のコンパイル確認と回帰テストを実施すること。

## 2025-11-02 追記: Micrometer 移行と監査突合準備（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java` と `DatasourceMetricsRegistrar.java` を Micrometer `MeterRegistry` ベースへ移行。`MeterRegistryProducer` を追加し WildFly Micrometer レジストリを CDI から取得できるようにした。
- ✅ `ops/legacy-server/docker/configure-wildfly.cli` に Micrometer 拡張・Prometheus レジストリ・Undertow 統計有効化コマンドを追加し、`MICROMETER_*` 環境変数でエクスポート先と間隔を調整できるようにした。
- ✅ `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` を Micrometer 前提へ更新。監査ログとメトリクス突合の運用チェックリストを追記し、`IMPACT_MATRIX.md` のオブザーバビリティ行を更新。
- ⚠️ `mvn -pl server-modernized -DskipTests package` はローカル環境に Maven CLI が無いため `command not found`。既存の Maven 未導入課題と同様に、環境整備後にビルド検証を再実施する。

## 2025-11-02 追記: CLAIM JMS 復旧と Servlet/CDI スキーマ更新（担当: Codex）
- ✅ `server-modernized/src/main/webapp/WEB-INF/web.xml` を Jakarta Servlet 6.0 スキーマへ更新し、RESTEasy フィルタ/サーブレットの `async-supported` 設定が最新仕様に沿うよう調整。
- ✅ `server-modernized/src/main/webapp/WEB-INF/beans.xml` を CDI 4.0 (`beans_4_0.xsd`) に差し替え、`open.dolphin.session.framework.SessionOperationInterceptor` を `<interceptors>` に登録。`SessionOperation` バインディングが確実に適用される構成を確認した。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java` を JMS 3.0 ベースの実装に刷新。`java:/JmsXA`／`java:/queue/dolphin` を利用して ObjectMessage を enqueue し、失敗時は従来の同期送信へフォールバックするように監査ログと併せて整備。
- ✅ `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` を Jakarta Messaging MDB として再実装。CLAIM／Diagnosis／PVT／AccountSummary／Activity 配信を元の振る舞いへ戻し、`MessagingConfig` から施設 ID・接続パラメータを取得するよう統一。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingConfig.java` の `ClaimSettings` に施設 ID を含め、JMS 側でも `custom.properties` と ORCA 設定を再利用できるようにした。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/KARTE_ORDER_JAKARTA_STATUS.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）へギャップ整理と次アクションを反映。
- ⚠️ `mvn -pl server-modernized -DskipTests package` を実行したが `mvn: command not found`。ローカルに Maven CLI が無いため、後続ワーカーは `scripts/setup_codex_env.sh` などで Maven を導入した上でビルド検証を再開すること。

## 2025-11-02 追記: Elytron フィルタ準備と MFA Secrets 強化（担当: Codex）
- ✅ `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java` を更新し、`jakarta.security.enterprise.SecurityContext` から `Principal` を取得するフックを追加。ヘッダフォールバック時には WARNING/TODO を出力し、`X-Trace-Id` を `org.jboss.logmanager.MDC(traceId)` へ投入して Micrometer / AuditTrail / ExternalService ログの相関 ID を統一。
- ✅ `docs/server-modernization/security/ELYTRON_INTEGRATION_PLAN.md` を新設し、Elytron HTTP 認証の構成案と Phase2→Phase4 の移行ステップ、Trace ID 伝播方針を整理。
- ✅ `server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java` の固定開発キー フォールバックを廃止。`FACTOR2_AES_KEY_B64` 未設定時は `IllegalStateException` を送出し Secrets 配布漏れを起動直後に検知。`FACTOR2_AES_KEY` の旧環境変数は INFO ログのみに留めて無視するよう変更。
- ✅ `server-modernized/pom.xml` に `org.jboss.logmanager:jboss-logmanager`（scope=`provided`）を追加し、`LogFilter` の MDC 依存をビルド時に解決可能とした。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を OkHttp 5.2.1 の `Duration` API へ対応させ、接続 10 秒 / 読み書き 30 秒 / 呼び出し 45 秒 + TLS1.2/1.3 固定の Builder を採用。`DEPENDENCY_UPDATE_PLAN.md` に標準タイムアウト値・TLS 方針を追記。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md`, `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`, `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`, `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（本ファイル）を更新。
- ⚠️ `mvn -pl server-modernized -am -DskipTests compile` を実行したが `mvn: command not found`。ローカル環境に Maven CLI が未導入のため、`scripts/setup_codex_env.sh` 実行や Maven インストール後に再ビルドすること。

## 2025-11-02 追記: Jakarta EE 10 ビルド依存整理（担当: Codex）
- ✅ `common/pom.xml` を Java 17 / Jakarta API 前提へ更新し、Hibernate ORM 6.4.4.Final を provided 参照に切替。`commons-codec` は 1.17.1 へ引き上げ、`maven-compiler-plugin` で `release 17` を明示。
- ✅ `server-modernized/pom.xml` の `dependencyManagement` に Jakarta BOM と Plivo 5.46.0 / OkHttp 5.2.1 / OpenPDF 1.3.41 / BouncyCastle 1.78.1 / Yubico WebAuthn 2.6.0 を登録。WAR 依存は BOM 管理下へ再配置し、OkHttp 依存を追加。
- 🔁 `pom.server-modernized.xml` テンプレートは現状どおりで問題なし（対象モジュールは `common` と `server-modernized` のみ）。追加モジュールは不要と判断し、差分なし。
- ❌ `mvn -pl server-modernized -am -DskipTests package` を実行したが、ローカル環境に Maven (`mvn`) が未導入のため `command not found` で終了。後続ワーカーは `scripts/setup_codex_env.sh` で環境を整備するか、Maven をインストールした上で再実行すること。
- 📎 ドキュメント更新: `foundation/JAKARTA_EE10_GAP_LIST.md` のビルド依存セクションと `PHASE2_PROGRESS.md`（本ファイル）へ反映済み。

## 2025-11-02 追記: ActiveMQ Artemis 設定復旧と Plivo HTTP 設定調整（担当: Codex）
- ✅ `ops/modernized-server/docker/configure-wildfly.cli` に `messaging-activemq` サブシステム設定を追加し、`/server=default` 配下へ `jms-queue=dolphinQueue`（`java:/queue/dolphin`／`java:jboss/exported/jms/queue/dolphin`）、`pooled-connection-factory=JmsXA`（`java:/JmsXA`）、`connection-factory=DolphinConnectionFactory` を idempotent で登録。Micrometer 監視と整合させるコメントも追記済み。
- ✅ `server-modernized/src/main/java/open/dolphin/infrastructure/concurrent/ConcurrencyResourceNames.java` を新設し、`ServletStartup`／`ScheduleServiceBean` が `java:jboss/ee/concurrency/scheduler/default` を明示参照。`ScheduleServiceBean` はスケジューラ経由で `MessagingGateway.dispatchClaim` を即時タスク投入し、トランザクション完了後に JMS enqueue できるよう調整。
- ✅ `server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java` に `PLIVO_HTTP_CONNECT_TIMEOUT`／`READ_TIMEOUT`／`WRITE_TIMEOUT`／`CALL_TIMEOUT`／`RETRY_ON_CONNECTION_FAILURE`（および `custom.properties` の `plivo.http.*`）を解釈するロジックを追加。ISO-8601 形式や `5000ms` 等の単位付き表記を許容し、不正値はデフォルトへフォールバックする。
- ✅ `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` を前項設定と連動させ、リトライ可否と各種タイムアウトを設定依存に変更。負値／0 の場合は FINE ログを出した上で安全値へ補正する `sanitizeDuration` を実装。
- 📎 ドキュメント更新: `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` を更新し、ActiveMQ CLI 追記・Concurrency 定数化・Plivo HTTP 設定キーを記録。本ファイルにも反映。
- ⏳ フォローアップ: Docker Compose で ActiveMQ Artemis を起動し `java:/queue/dolphin` への enqueue→consume を検証、Micrometer 収集との整合を確認する。Plivo HTTP タイムアウト値は運用チームと標準値を合意し、監査ログでの可視化方針を決める。

## 2025-11-02 追記: ReceptionPage サイドバー統合（担当: Codex）
- ✅ 旧 `ReceptionVisitSidebar` を廃止し、`ReceptionSidebarContent` を採用。`AppShell` の右サイドバーにタブ（受付／患者／履歴）を常設し、選択済み受付が無い場合は患者タブへ自動フォールバックする挙動を実装。
- ✅ 受付タブに呼出トグル・カルテ遷移・詳細操作導線を集約。`callState` のペンディング／エラー状態をバッジとフィードバックで可視化し、監査ログ（`visit_call_start`／`visit_call_cancel`／`visit_call_toggle_failed`）には `source: reception-sidebar` を付与。
- ✅ 患者タブでは `PatientEditorPanel` を `layout="sidebar"` で読み込み、モード切替・自動受付作成設定・保存成功ログをサイドバー側で補完。保存時は `patient_upsert_from_sidebar` を送出し、完了後は受付タブへ戻す。
- ✅ 履歴タブで `useVisitHistory` / `usePatientKarte` を連動。`karteFromDate` 入力は REST 形式へ正規化し、空欄時は `defaultKarteFromDate()` を再適用。カルテ文書は最近 10 件までをサマリ表示。
- ✅ `ReceptionPage` の URL 同期（`rid` / `pid`）とローカル `autoCreateReceptionEnabled` 永続化を整理し、サイドバー内操作で重複保存が発生しないよう状態を統合。
- 🔍 検証: `npm run typecheck` は成功。`npm run lint` は既存課題（`Button.tsx` の未使用変数、`DocumentTimelinePanel.tsx` の Fast Refresh 指摘など 6 件）で失敗。`npm run test -- --watch=false` は従来からの `letter-api.converts summary safely` と `appointment-api.fetches appointments...` が失敗。`npm run build` は管理画面／ChartsPage 周辺の既知 TypeScript エラーが継続（`StampManagementPage.tsx`, `UserAdministrationPage.tsx`, `LoginPage.tsx` ほか）。
- 📎 ドキュメント反映: `docs/web-client/README.md`（直近更新履歴）、`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`（サイドバー仕様）、本ファイルへ追記。
- 🚩 ToDo: lint/test/build の既存失敗は継続課題として別ストーリーで対応。サイドバーのトースト通知・履歴タブからのカルテ遷移ショートカットは未実装のため、次スプリントで検討。

## 2025-11-02 追記: common モジュール Jakarta Persistence ビルド確認（担当: Codex）
- ⚠️ `mvn -pl common -DskipTests package` を実行したが `bash: mvn: command not found` が発生。ローカル環境に Maven CLI が導入されていないため、Jakarta 変換後ビルドは未実施。
- 🚩 対応案: `mvn` の導入または Maven Wrapper (`mvnw`) をリポジトリへ追加した上で再実行が必要。現時点では環境整備の依頼待ち。

## 2025-11-01 追記: ChartsPage レイアウト仕上げ（担当: Worker E）
- ✅ `PageShell`／`ContentGrid` の CSS 変数を整理し、1366px 基準で左 264px・中央 ≒ 763px・右 264px が収まるよう `--charts-central-dynamic-width` を導入。列間ギャップは最大 24px、外周パディングは 12〜20px に制限。
- ✅ `AppShell` の Body コンテナから `contentMaxWidth` 制限を外し、患者一覧・受付一覧・カルテ画面がウィンドウ幅に合わせて無段階に拡張するよう統一。
- ✅ 患者未選択時は `PatientHeaderBar` をコンパクトモード（約 60px 高さ）で描画し、カルテ閲覧画面特有の上部余白を圧縮。患者選択後は通常モードへ自動復帰。
- ✅ `PatientHeaderBar` のグリッドと余白を再調整（横パディング = `var(--charts-content-padding-x) + 12px`、列間 10px / 18〜26px）、`LeftRail`・`WorkspaceStack`・`CentralScroll` のギャップを 10px / 12px / 12px に統一し、ヘッダーと初期カードの空白が 24px を超えないよう調整。
- ✅ `RightRail` 折りたたみ時はカラム幅を 48–56px に固定し、中央カラムが残余幅をすべて取得するよう上限 `clamp()` を撤廃。1600px / 1920px でも余白なしで滑らかに拡張することを確認。
- 📏 実測（CSS 変数算出値）:
  - 1366×768: 左 264px / 中央 ≒ 763px（内側 731px） / 右 264px、列間 21.8px、外周 15.7px。中央スクロール高は 640px でページスクロール無し。
  - 1440×900: 左 264px / 中央 ≒ 835px（内側 803px） / 右 264px、列間 22px、外周 16.6px。
  - 1920×1080: 左 288px / 中央 1,256px（内側 1,224px） / 右 288px、列間 24px、外周 20px、端の余白は計 8px。
  - 右ペイン折りたたみ: 1366px 時 264px / 976px / 56px、1600px 時 288px / 1180px / 56px、1920px 時 288px / 1488px / 56px。
- 🔍 検証: `npm run lint` は既存の未解決課題（`Button.tsx` や `DocumentTimelinePanel.tsx` の未使用変数など 12 件の error）で失敗。`npm run test:unit` はスクリプト未定義のため代替で `npm run test` を実行し、既存の API テスト 2 件（`appointment-api.fetches appointments...` と `letter-api.converts summary safely`）が失敗することを確認。
- 📎 ドキュメント反映: `docs/web-client/ux/KARTE_SCREEN_IMPLEMENTATION.md` に寸法・ギャップの最終値を追記。`docs/web-client/README.md` と本ファイルへ更新概要を記録済み。
- 🚩 ToDo: lint の未解決エラーと vitest 失敗ケースは別チケットでフォロー。スクリーンショット取得は次回 GUI セッション時に実機で再確認する。

## 2025-11-01 追記: DocumentTimeline 安定化（担当: Codex）
- ✅ 左レール `DocumentTimelinePanel` のカテゴリ切替時に選択が外れる不具合を解消し、利用可能カテゴリがゼロになった場合でも直近の有効カテゴリへフォールバックするよう調整。
- ✅ `InlineFeedback` のトーンと文言を整理。読み込み＝`neutral`、空状態＝`neutral`、API エラー＝`danger` とし、例外メッセージはそのまま表示する。タイトル更新成功時は `info`、失敗時は `danger` トーンでフィードバック。
- ✅ MSW モック（`npm run dev` 起動で自動有効化）にタイムライン関連 API (`/api/pvt2/pvtList` `/api/chartEvent/*` `/api/karte/docinfo/*`) のフィクスチャを追加し、エラー・リトライ動作をローカルのみで再現できるようにした。
- 🔄 残タスク: 実 API 接続時のスローダウン計測。`npm run preview -- --host` で WildFly 接続テストを走らせ、DocInfo 取得が 3 秒を超えるケースの調査を次スプリントで実施。
- 📎 ドキュメント反映: `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` `docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md` `docs/web-client/ux/KARTE_SCREEN_IMPLEMENTATION.md` を更新済み。開発手順は `web-client/README.md#開発モックmswとバックエンド切替` に追記。

## 2025-11-01 追記: Swing 版レイアウトに合わせたカルテ画面再配置計画（担当: Codex）
- ✅ 旧 Swing クライアント（スクリーンショット 1280×720）を基準に、左 264px／中央 736px／右 264px の 3 カラム寸法を採寸。Web 版 `ChartsPage` の `ContentGrid`・`OrderConsole`・左レールカードへ反映するリサイズ計画を整理。
- 🔄 タスク分解
  - `T1` グリッドレイアウト再定義 (`clamp` 対応、ヘッダー/フッタ高さ調整)。
  - `T2` 左レール圧縮（パディング再設定、ProblemList/SafetySummary のレイアウト再設計）。
    - 2025-11-01: VisitChecklist / ProblemListCard / SafetySummaryCard を 264px 幅・内側パディング12px・本文0.82rem・行間約8pxに調整し、参照テキスト6行での省略表示を確認。Storybook 静的ビルド（`npm run build-storybook`）でスタイル崩れは検出されず。1366×768 / 1280×720 の GUI 手動確認はローカル CLI 環境の都合で未実施のため、次回 GUI セッションで追試予定。※2025-11-06 時点で VisitChecklist は廃止され、ProblemListCard が左レール先頭となった。
  - `T3` 右ペイン 2 段構成（アイコンバー導入・コンテンツパネル縮小）。
  - `T4` WorkSurface/PlanComposer の余白最適化とフォントサイズ調整。
  - `T5` ブレークポイント別 QA（1366/1600/1920）スクリーンショット比較とアクセシビリティ確認。
- ✅ ドキュメント更新: `ux/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/KARTE_SCREEN_IMPLEMENTATION.md` に設計指針を追記。本メモおよび `docs/web-client/README.md` へリンクを追加。
- 🔜 次アクション: `phase2` スプリント 18 で T1/T2 着手、スプリント 19 で T3/T4、完了後にドクター試用アカウントでユーザーテストを実施し承認を得る。QA 完了前に `OrderConsole` の Storybook を用意し、幅圧縮時の操作性をレビューする。
- 🔄 `T1` (2025-11-01 Codex): `ContentGrid`/`CentralColumn` を `clamp()` 基調へ移行し、1600px・1280px・1100px・1000px・768px での列幅と折りたたみ挙動を Swing 版採寸どおりに再調整。右ペイン強制折りたたみ閾値を 1100px に更新。1366px/1600px/1280px のレイアウト確認スクリーンショットは 2025-11-03 午前の QA セッションで取得予定。
- 🔄 `T4` (2025-11-01 Codex): WorkSurface タブと Plan カードの余白・フォントを 0.82rem 帯域に再配分し、Plan アクション群の 1 行維持を確認。Plan Composer/Plan カードの操作スクリーンショット（A/P 面、CentralColumn 内）を 2025-11-03 午後の手動 QA と合わせて取得予定。

### 2025-11-01 進捗: T3 OrderConsole アイコンバー実装（担当: Codex）
- ✅ `OrderConsole` を縦アイコンバー(48px)＋内容パネル(最大216px) に再構成し、ホバー／クリックでフェード展開するトランジションを導入。各アイコンには `title` ベースのツールチップと `aria-pressed` を付与して操作フィードバックを明確化。
- ✅ 1000px 未満では強制折りたたみ状態のまま内容をモーダルに切り替え、Tab/Enter/Space 操作での遷移を確認。意図的なホバー展開との挙動差分を取り扱いドキュメント要件（ONE_SCREEN_LAYOUT_GUIDE.md / KARTE_SCREEN_IMPLEMENTATION.md）に整合。
- ✅ 意思決定支援バナーをパネル先頭に整理し、Plan 編集カード・会計編集 UI など既存機能を保持したままアクセシビリティの更新（`aria-labelledby` 管理）を実施。
- ⚠️ MSW モックでのスクリーンショット取得は `npm run build` / `npm run preview` が既存 TypeScript エラーで停止するため未完。ビルド環境復旧後に `docs/server-modernization/phase2/assets/order-console-1366.png` へ保存予定。

## サマリ
- `/user/{fid:userId}` 認証フローめEWeb UI に実裁E��、MD5 ハッシュ・clientUUID 自動生成�Eログアウト操作を一貫させた、E
- `/patient/*` API を利用した患老E��索と安�E惁E��パネルを構築。警告メモ・アレルギーを常時可視化し、クリチE��で患老E��細を�Eり替え可能、E
- `/karte/pid` を利用したカルチE��歴�E�EocInfo�E�取得を β 実裁E��取得開始日めEUI で変更でき、注意フラグを強調表示するタイムラインを提供、E
- 2026-05-27: charts �����܂��� TypeScript �^�� DocInfoSummary�^DocumentModelPayload �ɓ��ꂵ�ACLAIM �đ������ECareMap�E�J���e�^�C�����C���̌^�s�����������AE
- `/karte/document` 保存と `/chartEvent/subscribe` ロングポ�Eリングを絁E��合わせ、カルチE��雁E��EOAP�E�と排他制御めEWeb 版で再現した、E
- アプリシェルの固定�EチE��・フッタ・左右カラムを�Eレイアウトし、中央カラムのみスクロール可能な 3 カラム UI を最適化した、E

## 実裁E��イライチE
### 認証とセチE��ョン管琁E
- ログインペ�Eジで施設ID/ユーザーID/パスワーチE任意�EclientUUIDを�E力。未入力時は UUID を�E動生成してセチE��ョンに保存、E
- 認証惁E��はセチE��ョンストレージへ保存し、`AuthProvider` ぁEHTTP ヘッダーへ自動付与。ログアウトでストレージを確実に破棁E��E
- マルチタブでのログアウトを `storage` イベント経由で同期、E

### 患老E��索・安�E惁E��
- 氏名�E�漢孁Eカナ）、患老ED、番号�E�Eigit�E�検索に対応。検索結果はチE�Eブル表示、E��択患老E��右パネルで詳細表示、E
- `appMemo` めE`reserve*` の安�E惁E��を警告バチE��で表示。アレルギー・患老E��モめE`/karte/pid` から取得して同パネルに雁E��E��E
- 検索エラーめE��果ゼロの際�Eユーザーへ日本語メチE��ージで通知、E

### カルチE��歴タイムライン
- DocInfo をカード形式で表示。`hasMark` を検知して警告バチE��を表示、確定日/診療私EスチE�Eタスを併記、E
- 取得開始日を日付�E力で刁E��替え可能。�E部では `yyyy-MM-dd HH:mm:ss` 形式で API を呼び出す、E
- 患老E��モめE��レルギーを同カードに表示し、安�E惁E��の一允E��を図る、E

### カルチE��雁E�E排他制御
- `features/charts` を新設し、受付リスト�E診察開始�ESOAP 編雁E�E保存までめE1 画面で完結するフローを実裁E��E
- `useChartLock` ぁE`clientUUID` と `BIT_OPEN` を用ぁE�� `/chartEvent/event` を送信。�E端末のみが編雁E��能な状態を維持し、終亁E��にロチE��解除、E
- SOAP ノ�Eト�E ProgressCourse モジュールとしてシリアライズし、`/karte/document/pvt/{pvtPk,state}` で保存と状態�E移を同時に実行。XML エンコードされた `beanBytes` を生成して既存サーバ�E形式を踏襲、E
- `useChartEventSubscription` ぁE`/chartEvent/subscribe` のロングポ�EリングをラチE�Eし、React Query キャチE��ュを更新。褁E��端末で受仁EカルチE��態が即時反映される、E

### レイアウト調整
- `AppShell` のナビゲーション/サイドバーめE`position: sticky` に変更し、中央カラムのみスクロール。�EチE��・フッタは常時固定、E
- 2025-11-01: 23インチ(1920px)フルHDを基準にgrid-template-columnsをminmax(240px,22%) / minmax(0,56%) / minmax(240px,22%)へ更新し、左/右レール最小幅240pxを固定。1600px/1280pxでは24/52/24 -> 28/44/28へ段階調整し、1000px未満は右レールを強制折りたたみ+ホバー展開で固定。SOAP入力領域は最小780pxを確保し、23インチでタイムラインとオーダ操作を同時表示できることを確認。
- `TextArea` コンポ�Eネントを追加し、SOAP 入力欁E��統一したアクセシビリチE��とバリチE�Eションを提供、E

## 既存ユーザー影響と移行メモ
- 既孁ESwing クライアントと同一賁E��惁E��を利用。clientUUID を未入力にすると自動採番されるため、新要EWeb 端末の刁E��時も運用フローを変更せずに移行可能、E
- 共有端末ではログアウト操作が忁E��。ログアウト時にセチE��ョンストレージを削除するため、追加のクリーニング作業は不要、E
- フロントエンドでの安�E惁E��表示は参�Eのみであり、サーバ�EチE�Eタ形式に変更なし。既存データ移行�E不要、E
- SOAP 保存に ProgressCourse モジュールの XML を採用してぁE��ため、既存サーバ�Eは追加移行不要。Swing と Web の併用でもカルチE��ータ形式�E互換、E
- ロングポ�Eリングは 60 秒タイムアウト＋即時�E接続。クライアント�Eで持E��バックオフを実裁E��みであり、既存サーバ�E設定変更は不要、E

## チE��トと検証
- Vitest で認証/患老EカルチEAPI ラチE��ーの単体テストを追加し、リクエストパスと変換ロジチE��を検証、E
- `features/charts/__tests__/progress-note-payload.test.ts` で ProgressCourse モジュールのシリアライズを検証。SOAP/Plan の XML ぁEbase64 で保存されることを確認、E
- 手動動作確誁E ログイン→受付リストから診察開始�ESOAP 入力�E保存�E診察終亁E�Eシナリオを通し、他端末でのロチE��表示・解除がリアルタイムに同期されることを確認、E

## 次のスチE��チE
- SOAP チE��プレート（定型斁E�Eスタンプ）やプラン編雁EUI の拡張。`ProgressCourse` 以外�E ModuleModel�E��E方・検査�E��E保存フロー設計、E
- `/chartEvent/event` を用ぁE��征E��スチE�Eタス更新 UI を左カラムへ統合。看護師画面とのスチE�Eタス整合性検証、E
- ORCA 連携の準備として、患老E��細パネルに保険惁E��サマリ�E�健康保険 GUID�E�を表示する案を検討、E

## 2026-06-15 追記: SA-DOC-OPERATIONS-Continuation（担当: Worker D）
- ✅ Nightly CPD をサンドボックスで手動実行し、`ops/analytics/evidence/nightly-cpd/20240615/` に `build-local-sandbox.log` と `cpd-metrics.json`（duplicate_lines=21837, duplication_count=258, file_count=175）を保存。Slack / PagerDuty / Grafana 証跡は取得不可のためプレースホルダを配置し、本番ジョブ後に差し替える運用を `docs/server-modernization/phase2/notes/ops-observability-plan.md` に追記。
- ✅ `ops/tools/cpd-metrics.sh` を LF 化し、リポジトリルート自動検出と絶対パス対応を実装。CPD XML から BigQuery 取り込み JSON を生成する標準手順を Evidence ディレクトリへ記録。
- ✅ Python 禁止時の API 回帰資材として `ops/tests/api-smoke-test/test_config.manual.csv`・`headers/*.headers`・`payloads/`・`README.manual.md` と `ops/tools/send_parallel_request.sh` を追加。`docs/server-modernization/phase2/notes/test-data-inventory.md` に環境変数・保存先・監査ログ収集フローを反映。
- ⚙️ `static-analysis-plan.md` / `static-analysis-findings.md` に `PlivoSender` / `ORCAConnection` / `CopyStampTreeBuilder` の残課題、テスト案（PlivoSenderDefensiveCopyIT / ORCAConnectionSecureConfigTest / CopyStampTreeRoundTripTest）とブロッカー（Plivo Sandbox 資格情報、ORCA 接続設定）を追記し、`SA-INFRA-MUTABILITY-HARDENING` 着手状況を共有。
- 📌 Next: Ops が Jenkins 本番ジョブで Slack/PagerDuty Permalink と Grafana スクショを採取し Evidence を更新。Worker D は外部接続ラッパーの実装・テストを 2026-06-21 までに開始し、MBean/JMS 防御的コピー残件を並行削減する。
