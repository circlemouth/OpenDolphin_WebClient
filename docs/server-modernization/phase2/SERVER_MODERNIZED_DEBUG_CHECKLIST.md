# server-modernized デバッグチェックリスト（2026-06-15）

server-modernized モジュールのデバッグ状況を把握するためのチェックリスト。  
各項目はレガシーサーバーとの機能同等性確認に向けた実施タスクを網羅しており、進捗更新時は本ファイルと `PHASE2_PROGRESS.md` の両方を更新すること。

## ステータス凡例

- `[x]` … 完了
- `[ ]` … 未完了（未着手または進行中。備考欄で詳細を記載）

---

## フェーズ0: 事前準備・資料棚卸し

> **2026-06-14 更新:** ステークホルダー合意によりフェーズ0タスクは現行デバッグスコープから除外する。今後の進捗管理ではフェーズ1以降のみ追跡対象とする。

- [x] モダナイズ関連ドキュメント（`docs/server-modernization/` 配下）を精読し、既存ツールとスクリプトの利用可否を整理する（備考: `api-smoke-test.md`, `operations/API_PARITY_RESPONSE_CHECK.md` を確認済み）
- [ ] Codex 向け環境構築スクリプト `scripts/setup_codex_env.sh` の実行可否と必要な権限を確認する（備考: 実行検証未実施）
- [ ] Docker Compose (`docker-compose.modernized.dev.yml`) のサービス構成を確認し、デバッグ時の起動順序・依存関係を明文化する（備考: ドキュメント化未完了）

## フェーズ1: ビルド・依存性確認

- [x] `mvn -pl server-modernized -am clean verify -DskipTests` を実行し、ビルド警告および Jakarta 依存差分を記録する（備考: 2025-11-06 `mvn -f server-modernized/pom.xml clean verify -DskipTests` 実行。`Base64Utils` / `Long(long)` / `Character(char)` などの非推奨 API 警告を確認済み。**指針: 非推奨 API 対応は開発完了後の課題として別途チケット化する**）
- [x] `META-INF/persistence.xml` など Jakarta EE 10 対応設定をレビューし、スキーマ不一致を洗い出す（備考: `persistence.xml` は 3.1、`ejb-jar.xml` は 4.0 スキーマで整合。データソース/hibernate プロパティに不一致なし）
- [x] 共通モジュール（`common/`）との互換性確認を実施し、DTO/エンティティの差分一覧を作成する（備考: `notes/common-dto-diff-A-M.md` と `notes/common-dto-diff-N-Z.md` で Legacy との差分・新規 DTO・リスク評価を整理。PHR 系フィールド追加、FirstEncounter 系削除、監査/2FA/ケアプラン新規 DTO、Hibernate 6 の CLOB 対応などフォローアップ課題を抽出済み）

## フェーズ2: 静的解析・コードマッピング

- [x] `server-modernized/src/main/java` をレイヤー別に整理し、循環依存や未使用コンポーネントを棚卸しする（備考: `docs/server-modernization/phase2/notes/server-layer-map.md` を 2026-06-14 版へ更新済み。`VitalServiceBean` 未使用・`UserCache` 再設計などを `notes/static-analysis-findings.md` に記録）
- [x] フィルター/インフラ層（例: `LogFilter`, `RequestMetricsFilter`）の挙動をレビューし、ログ・トレース ID の伝搬状況を可視化する（備考: `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` へテキストシーケンスとログ採取手順を追記。`tmp/trace-review/sa-static-map-20260614.log` に調査ログを保存）
- [x] 静的解析ツール導入可否を調査し、CI 反映方針をまとめる（備考: `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に SpotBugs/Checkstyle/PMD の導入方針と Jenkins/GitHub Actions 実装、Nightly CPD 設計、差分ゲート手順、Ops への資格情報・通知運用フローを記録。`PHASE2_PROGRESS.md` にも 2026-06-14 時点の進捗・残タスクを反映済み）

## フェーズ3: REST/API レイヤー

- [x] 代表エンドポイント（`open.dolphin.rest`）のシグネチャとレスポンス DTO を Legacy 実装と diff し、差分レポートを作成する（備考: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に `/jtouch` vs `/10/adm/jtouch` の機能表・公開方針を整理済み。Legacy 限定 API の切り分けと Impact 記載を完了）
- [x] SSE / ポーリング併用エンドポイント（`ChartEvent*`）の挙動をデバッグし、再接続および認証フローの検証ステップを定義する（備考: `rest-touch-diff-report.md` に再送仕様/履歴100件の評価とギャップ検知フローを追記。`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順8へ Last-Event-ID ギャップ再接続手順および `chart-events.replay-gap` の受信時対応を記載。`ChartEventSseSupport` は Micrometer メトリクス、WARN ログ、SSE reload イベント、Alert ルール案（`ops/monitoring/chart-event-alerts.yml`）およびシミュレーター (`ops/monitoring/scripts/chart-event-metrics-sim.mjs`) で運用フローと閾値調整まで整備済み。Stage 実測メトリクスの取得は VPN 情報待ちのため保留、代替案を `worker-directives-20260614.md` へ記録済み。Reception/Charts/Touch UI のリプレイギャップ仕様と React 実装は `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` / `web-client/src/features/replay-gap/*` に反映、`/rest/charts/patientList` & `sendReplayGapAudit` の正式実装・テストも完了し、Touch reload 監査・実機テストは後続タスク）
- [x] DTO コンバータ群の Jackson 設定差異を洗い出し、互換性リスクを整理する（備考: `LegacyObjectMapperProducer` に JavaTimeModule/WRITE_DATES_AS_TIMESTAMPS=false を追加し、ADM10/20/Touch/EHT リソースすべてが CDI `ObjectMapper` を利用。`JsonTouchResourceParityTest` に JavaTime ペイロード検証を追加し、`rest-touch-diff-report.md` / `touch-api-parity.md` にロールアウト記録と JavaTime 監視手順（`OBSERVABILITY_AND_METRICS.md`、Runbook 186 行付近）を追記。Stage/Prod 監視とエスカレーションフローも同ドキュメントに記録済み）

## フェーズ4: セッション層・ドメインロジック

- [ ] 主要サービス (`KarteServiceBean`, `PatientServiceBean` など) のトランザクション境界と JPQL をレビューし、Legacy との差異を網羅表にまとめる（備考: 未着手）
- [ ] `@SessionOperation` / `SessionTraceManager` の適用範囲を確認し、例外発生時のトレース出力を実機で検証する（備考: 未着手）
- [ ] `adm10` / `adm20` 系コンバータのマッピング漏れを洗い出し、再現用テストデータを選定する（備考: 未着手）

## フェーズ5: 外部連携・メッセージング

- [ ] `MessagingGateway` の JMS エンキュー処理とフォールバックルートを検証し、ログ出力を比較する（備考: 未着手）
- [ ] `ClaimSender` / `DiagnosisSender` / `MMLSender` の設定値差分とエラーハンドリングを確認する（備考: 未着手）
- [ ] Secrets / 環境変数依存の不足時挙動を一覧化し、監視アラート要件を整理する（備考: 未着手）

## フェーズ6: 認証・セキュリティ

- [ ] 2FA 設定 (`FACTOR2_AES_KEY_B64`, FIDO2 設定値) 未設定時の WildFly 起動失敗ログを採取し、手順書に反映する（備考: 未着手）
- [ ] `totp` / `fido` パッケージの監査ログ出力を検証し、成功/失敗両ケースの記録内容を確認する（備考: 未着手）
- [ ] Elytron 移行計画とヘッダ認証後方互換 (`LogFilter`) の廃止手順を明確化する（備考: 未着手）

## フェーズ7: ストレージ・帳票

- [ ] 添付ファイル保存モード（DB / S3）別の動作確認を行い、`attachment-storage.yaml` の必要パラメータを整理する（備考: 未着手）
- [ ] 帳票生成 (`open.dolphin.reporting`) のフォント/ロケール設定を検証し、Legacy との出力差異を確認する（備考: 未着手）
- [ ] ライセンス管理 (`system/license`) の権限チェックおよび設定ファイルの配置確認を実施する（備考: 未着手）

## フェーズ8: 観測性・ロギング

- [ ] Micrometer メトリクス出力（`DatasourceMetricsRegistrar`, `RequestMetricsFilter`）の計測内容を収集し、Prometheus 連携可否を確認する（備考: `docs/server-modernization/phase2/notes/ops-observability-plan.md` を 2026-06-15 に更新し、`ops/analytics/evidence/nightly-cpd/20240615/` へ手動取得した `cpd-metrics.json`/`build-local-sandbox.log` を保存済み。Slack/PagerDuty/Grafana はプレースホルダで、Ops 本番実行後に差し替え必須）
- [ ] Trace ID が JMS / セッション層ログへ伝搬するか end-to-end で確認する（備考: 同プランで `ops/tests/api-smoke-test` + `artifacts/parity-manual/<ID>/meta.json` を使った追跡手順を記載。`traceId` サンプル収集は未着手）
- [ ] REST 例外処理共通化（`AbstractResource`）をレビューし、レスポンスフォーマットとログ整合性を検証する（備考: アラート発報時ログ採取テンプレを `ops-observability-plan.md` に反映済み。動作検証は未実施）

## フェーズ9: 回帰・API 同等性検証

- [ ] スモークテストスクリプト (`ops/tests/api-smoke-test/`) を用いて Legacy・Modernized のレスポンス比較を実施し、成果物ディレクトリを保存する（備考: `test_config.manual.csv`・`headers/*.headers`・`payloads/`・`README.manual.md`・`ops/tools/send_parallel_request.sh` を 2026-06-15 に追加。`artifacts/parity-manual/<ID>/...` へ手動検証結果を集約する運用を `docs/server-modernization/phase2/notes/test-data-inventory.md` に追記済み。CI 実行は未完）
- [ ] API パリティチェッカー (`scripts/api_parity_response_check.py`) で代表 API の差分を測定し、結果を共有する（備考: `send_parallel_request.sh` で `scripts/api_parity_targets.sample.json` を展開し Python 非依存で比較可。CI ログは未取得）
- [ ] 監査ログ・外部副作用の検証（例: `/20/adm/factor2/*` 実行後の `d_audit_event`）を含む総合回帰テストを設計する（備考: `README.manual.md` の手順で `psql` 出力を `artifacts/manual/audit_log.txt` へ追記する運用を整理。実測データの取得待ち）

## フェーズ10: ドキュメント・フォローアップ

- [x] 本チェックリストを作成し、進捗確認の起点を整備する
- [ ] 実施結果・既知課題を `PHASE2_PROGRESS.md` および関連ドキュメントへ反映する運用フローを確立する（備考: `docs/server-modernization/phase2/notes/ops-observability-plan.md` / `.../test-data-inventory.md` に反映ルールを追記済み。定期レビュー設定待ち）
- [ ] テストデータ・モック資材を `ops/tests/` 配下に整理し、デバッグ再現性を確保する（備考: `test_config.manual.csv`、`headers/*.headers`、`payloads/`、`README.manual.md` を追加済み。残りは ADM20/FIDO2 以外のケース拡充と CI 連携）

---

### 現時点の総括（2026-06-15）

- フェーズ1は完了。フェーズ2ではサーバーレイヤーマップ/トレースフロー整理、SpotBugs/Checkstyle/PMD および Nightly CPD のワークフロー定義、`ops/analytics/evidence/nightly-cpd/20240615/` での手動証跡取得、`ops/tools/cpd-metrics.sh` のメトリクス抽出改善まで進捗。Slack/PagerDuty/Grafana の本番証跡は未取得で Ops 対応待ち。
- フェーズ3〜7は未着手。RuntimeDelegate 整備後も `JsonTouchResourceParityTest` / `InfoModelCloneTest` の失敗が続いており、Touch/API パリティ調査が必要。外部接続ラッパー (`PlivoSender`, `ORCAConnection`, `CopyStampTreeBuilder/Director`) の防御的コピー実装と JMS/MBean 32 件の残課題解消が最優先。
- 直近のアクション: 1) Ops 本番 Jenkins で Nightly CPD を実行し Slack/PagerDuty Permalink と Grafana スクリーンショットを Evidence に反映、2) 外部ラッパー向けテスト (`PlivoSenderDefensiveCopyIT`, `ORCAConnectionSecureConfigTest`, `CopyStampTreeRoundTripTest`) を追加して SpotBugs `EI_EXPOSE_REP*` を削減、3) `ops/tools/send_parallel_request.sh` + `test_config.manual.csv` で代表 API の手動パリティベースラインと監査ログ採取を進める。
