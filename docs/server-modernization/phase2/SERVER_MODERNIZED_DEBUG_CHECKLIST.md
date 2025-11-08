# server-modernized デバッグチェックリスト（2026-06-15）

server-modernized モジュールのデバッグ状況を把握するためのチェックリスト。  
各項目はレガシーサーバーとの機能同等性確認に向けた実施タスクを網羅しており、進捗更新時は本ファイルと `PHASE2_PROGRESS.md` の両方を更新すること。

## ステータス凡例

- `[x]` … 完了
- `[ ]` … 未完了（未着手または進行中。備考欄で詳細を記載）

---

### 2025-11-07 追記: Webクライアント非依存デバッグ基本方針

- Web クライアントが未完成な期間は Legacy サーバーからの実測リクエスト/レスポンス → Modernized へのリプレイ → サーバー内部メトリクス採取の 3 レイヤーで同等性を証跡化する。
- すべての検証は CLI／スクリプト（`ops/tools/send_parallel_request.sh`, `ops/tests/api-smoke-test/`, curl/httpie, WildFly control スクリプトなど）で完結させ、Web UI 操作を前提にしない。
- Legacy/Modernized 並列キャプチャ環境の構築 Runbook を `docs/server-modernization/phase2/operations/` に整備し、`PHASE2_PROGRESS.md` へリンクと更新日時を記録するまで他フェーズのステータスを「完了」にしない。
- 新規や更新した Runbook／スクリプトの保存先を本ファイルの備考欄に必ず記載し、証跡（ログ・diff・ハッシュなど）は `artifacts/parity-manual/` 配下に時刻付きフォルダで保管する。

## フェーズ0: 事前準備・資料棚卸し

> **2026-06-14 更新:** ステークホルダー合意によりフェーズ0タスクは現行デバッグスコープから除外する。今後の進捗管理ではフェーズ1以降のみ追跡対象とする。

- [x] モダナイズ関連ドキュメント（`docs/server-modernization/` 配下）を精読し、既存ツールとスクリプトの利用可否を整理する（備考: `api-smoke-test.md`, `operations/API_PARITY_RESPONSE_CHECK.md` を確認済み）
- [x] Codex 向け環境構築スクリプト `scripts/setup_codex_env.sh` の実行可否と必要な権限を確認する（備考: 2025-11-07 `artifacts/parity-manual/setup/20251107T234615Z/` のログで CRLF 行末による失敗と root 権限必須を証跡化。`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` に CLI 前提の実行手順・注意事項を追記し、`PHASE2_PROGRESS.md` とリンクを同期済み）
- [x] Docker Compose (`docker-compose.modernized.dev.yml`) のサービス構成を確認し、デバッグ時の起動順序・依存関係を明文化する（備考: 上記 Runbook にサービス表・起動順序・フォールバック手順・証跡保存ポリシーを追加し、`ops/tools/send_parallel_request.profile.env.sample` で `MODERNIZED_TARGET_PROFILE` を `compose`/`remote-dev`/`custom` へ切り替えるテンプレートを提供済み）
- [x] `scripts/**` および `ops/tools/**` の行末を LF に統一し、CRLF 由来の実行失敗を防止する（備考: `.gitattributes` で対象拡張子を `text eol=lf` に固定し、`git add --renormalize .` + `perl -pi -e 's/\\r$//'` で `scripts/setup_codex_env.sh` / `scripts/run-static-analysis-diff.sh` を LF 化。詳細は `docs/server-modernization/phase2/operations/DEV_ENV_COMPATIBILITY_NOTES.md`、証跡は `artifacts/parity-manual/setup/20251108-renormalize/` を参照）

## フェーズ1: ビルド・依存性確認

- [x] `mvn -pl server-modernized -am clean verify -DskipTests` を実行し、ビルド警告および Jakarta 依存差分を記録する（備考: 2025-11-06 `mvn -f server-modernized/pom.xml clean verify -DskipTests` 実行。`Base64Utils` / `Long(long)` / `Character(char)` などの非推奨 API 警告を確認済み。**指針: 非推奨 API 対応は開発完了後の課題として別途チケット化する**）
- [x] `META-INF/persistence.xml` など Jakarta EE 10 対応設定をレビューし、スキーマ不一致を洗い出す（備考: `persistence.xml` は 3.1、`ejb-jar.xml` は 4.0 スキーマで整合。データソース/hibernate プロパティに不一致なし）
- [x] 共通モジュール（`common/`）との互換性確認を実施し、DTO/エンティティの差分一覧を作成する（備考: `notes/common-dto-diff-A-M.md` と `notes/common-dto-diff-N-Z.md` で Legacy との差分・新規 DTO・リスク評価を整理。PHR 系フィールド追加、FirstEncounter 系削除、監査/2FA/ケアプラン新規 DTO、Hibernate 6 の CLOB 対応などフォローアップ課題を抽出済み）

## フェーズ2: 静的解析・コードマッピング

- [x] `server-modernized/src/main/java` をレイヤー別に整理し、循環依存や未使用コンポーネントを棚卸しする（備考: `docs/server-modernization/phase2/notes/server-layer-map.md` を 2026-06-14 版へ更新済み。`VitalServiceBean` 未使用・`UserCache` 再設計などを `notes/static-analysis-findings.md` に記録）
- [x] フィルター/インフラ層（例: `LogFilter`, `RequestMetricsFilter`）の挙動をレビューし、ログ・トレース ID の伝搬状況を可視化する（備考: `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` へテキストシーケンスとログ採取手順を追記。`tmp/trace-review/sa-static-map-20260614.log` に調査ログを保存）
- [x] 静的解析ツール導入可否を調査し、CI 反映方針をまとめる（備考: `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に SpotBugs/Checkstyle/PMD の導入方針と Jenkins/GitHub Actions 実装、Nightly CPD 設計、差分ゲート手順、Ops への資格情報・通知運用フローを記録。`PHASE2_PROGRESS.md` にも 2026-06-14 時点の進捗・残タスクを反映済み）
- [ ] Legacy/Modernized Postgres ベースライン復旧計画を Runbook 化し、DB 欠損が発生した際の Gate と証跡フローを整備する（備考: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` を新規作成し、`artifacts/parity-manual/db-restore/20251108/` に DDL 所在・欠損オブジェクト一覧・調査ログを保存。Secrets Storage からの dump 提供待ちにつき、実 DB への適用と `flyway migrate` のログは未取得）

## フェーズ3: REST/API レイヤー

- [x] 代表エンドポイント（`open.dolphin.rest`）のシグネチャとレスポンス DTO を Legacy 実装と diff し、差分レポートを作成する（備考: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に `/jtouch` vs `/10/adm/jtouch` の機能表・公開方針を整理済み。Legacy 限定 API の切り分けと Impact 記載を完了）
- [x] SSE / ポーリング併用エンドポイント（`ChartEvent*`）の挙動をデバッグし、再接続および認証フローの検証ステップを定義する（備考: `rest-touch-diff-report.md` に再送仕様/履歴100件の評価とギャップ検知フローを追記。`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順8へ Last-Event-ID ギャップ再接続手順および `chart-events.replay-gap` の受信時対応を記載。`ChartEventSseSupport` は Micrometer メトリクス、WARN ログ、SSE reload イベント、Alert ルール案（`ops/monitoring/chart-event-alerts.yml`）およびシミュレーター (`ops/monitoring/scripts/chart-event-metrics-sim.mjs`) で運用フローと閾値調整まで整備済み。Stage 実測メトリクスの取得は VPN 情報待ちのため保留、代替案を `worker-directives-20260614.md` へ記録済み。Reception/Charts/Touch UI のリプレイギャップ仕様と React 実装は `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` / `web-client/src/features/replay-gap/*` に反映、`/rest/charts/patientList` & `sendReplayGapAudit` の正式実装・テストも完了し、Touch reload 監査・実機テストは後続タスク）
- [x] DTO コンバータ群の Jackson 設定差異を洗い出し、互換性リスクを整理する（備考: `LegacyObjectMapperProducer` に JavaTimeModule/WRITE_DATES_AS_TIMESTAMPS=false を追加し、ADM10/20/Touch/EHT リソースすべてが CDI `ObjectMapper` を利用。`JsonTouchResourceParityTest` に JavaTime ペイロード検証を追加し、`rest-touch-diff-report.md` / `touch-api-parity.md` にロールアウト記録と JavaTime 監視手順（`OBSERVABILITY_AND_METRICS.md`、Runbook 186 行付近）を追記。Stage/Prod 監視とエスカレーションフローも同ドキュメントに記録済み）

## フェーズ4: セッション層・ドメインロジック

- [ ] 主要サービス (`KarteServiceBean`, `PatientServiceBean` など) のトランザクション境界と JPQL をレビューし、Legacy との差異を網羅表にまとめる（備考: `/user/doctor1` を対象に `scripts/jpql_trace_compare.sh` と `artifacts/parity-manual/JPQL/*` を整備済み。`domain-transaction-parity.md` に結果を記載。`/chart/WEB1001/summary` などカルテ/PVT 系はデータ投入後に採取する）
- [ ] `@SessionOperation` / `SessionTraceManager` の適用範囲を確認し、例外発生時のトレース出力を実機で検証する（備考: `ops/tests/api-smoke-test/test_config.manual.csv` と `rest_error_scenarios.manual.csv` に `trace_http_200/400/401/500` を追加し、`ops/tools/send_parallel_request.sh --profile` で CLI を統一。200 ケースは `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/` に保存済み。Legacy build (`org.wildfly.extension.micrometer`) と Modernized DB 未シード(`d_users`) が残るため 4xx/5xx は保留、ブロッカーを `TRACE_PROPAGATION_CHECK.md` に記録。）
- [ ] `adm10` / `adm20` 系コンバータのマッピング漏れを洗い出し、再現用テストデータを選定する（備考: Legacy API 応答 JSON を `tmp/legacy-fixtures/admxx/*.json` に収集し、`JsonTouchResourceParityTest` と別途追加する `AdmConverterSnapshotTest` で Modernized 出力との差分を検出、結果を `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に追記する）

## フェーズ5: 外部連携・メッセージング

- [ ] `MessagingGateway` の JMS エンキュー処理とフォールバックルートを検証し、ログ出力を比較する（備考: `ops/tools/jms-probe.sh`（新規）で Legacy の実メッセージを `artifacts/parity-manual/JMS/legacy.log` に採取し、同シナリオを Modernized へ送出して `artifacts/parity-manual/JMS/modernized.log` を取得。`docs/server-modernization/phase2/notes/messaging-parity-check.md` にログ差分とフォールバック発火条件を整理する）
- [ ] `ClaimSender` / `DiagnosisSender` / `MMLSender` の設定値差分とエラーハンドリングを確認する（備考: CLI 経由で送信 API を直接叩き、成功/失敗レスポンスと `server.log` を `artifacts/parity-manual/CLAIM_*` へ保存。`docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` と連携し、エラーコード表と設定ファイル比較を追記する）
- [ ] Secrets / 環境変数依存の不足時挙動を一覧化し、監視アラート要件を整理する（備考: `.env`→compose→WildFly CLI→Jakarta EE の読み込み順を `docs/server-modernization/phase2/notes/ops-observability-plan.md:16-23` にテーブル化し、`scripts/start_wildfly_headless.sh` で変数を間引いた状態の再起動ログを採取。`artifacts/parity-manual/secrets/env-loading-notes.md`, `artifacts/parity-manual/secrets/wildfly-missing-secrets.log`, `artifacts/parity-manual/secrets/wildfly-normal.log` へ証跡を保存済み。Prometheus/Grafana 連携と正常系アラート検証が未完のため継続）

## フェーズ6: 認証・セキュリティ

- [ ] 2FA 設定 (`FACTOR2_AES_KEY_B64`, FIDO2 設定値) 未設定時の WildFly 起動失敗ログを採取し、手順書に反映する（備考: `scripts/start_wildfly_headless.sh` を新設し、`docs/server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md:10-60` にヘッドレス起動・Secrets 復旧手順と `ops/tests/security/factor2/*.http` の流れを追記。Secrets を外した状態での WildFly 起動失敗ログと `/20/adm/factor2/totp/*` 500 応答を `artifacts/parity-manual/secrets/{wildfly-missing-secrets.log,totp-registration-missing.log}` に保存済み。ただし `db-modernized` に `d_user` / `d_factor2_*` / `d_audit_event` が存在せず成功ケースは未採取。Postgres ベースライン (#40) 復旧後に Gate を閉じる）
- [ ] `totp` / `fido` パッケージの監査ログ出力を検証し、成功/失敗両ケースの記録内容を確認する（備考: `ops/tests/security/factor2/` 配下に HTTP テンプレートと README を整備し、`docs/server-modernization/phase2/notes/test-data-inventory.md:181-218` に SQL 雛形と証跡先（`artifacts/parity-manual/factor2_*/*.log`）を記録。現状 DB に `d_user` / `d_factor2_*` / `d_audit_event` が無いため TOTP/FIDO とも 500 応答止まりで、ベースライン投入後に成功/失敗両ケースを再取得する）
- [x] Elytron 移行計画とヘッダ認証後方互換 (`LogFilter`) の廃止手順を明確化する（備考: `ops/tools/logfilter_toggle.sh` を追加し `.env` で `LOGFILTER_HEADER_AUTH_ENABLED` を切り替え可能にした。`docker-compose*.yml` と `LogFilter` 側も連動済み。段階的なリリース基準は `docs/server-modernization/phase2/notes/security-elytron-migration.md` に整理済み。実機ログ採取はサーバー起動後に追加で実施する）

## フェーズ7: ストレージ・帳票

- [ ] 添付ファイル保存モード（DB / S3）別の動作確認を行い、`attachment-storage.yaml` の必要パラメータを整理する（備考: `ops/tests/storage/attachment-mode/*.sh` で REST 経由のアップロード/ダウンロードを自動化し、DB モードと S3 モック（`minio`）の双方でバイナリハッシュとレスポンス差分を `artifacts/parity-manual/attachments/` に保存。設定表を `docs/server-modernization/phase2/notes/storage-mode-checklist.md` に追記）
- [ ] 帳票生成 (`open.dolphin.reporting`) のフォント/ロケール設定を検証し、Legacy との出力差異を確認する（備考: 帳票 API を CLI で叩き PDF を `artifacts/parity-manual/reporting/{legacy,modernized}/` に収集し、ハッシュおよびテキスト抽出 diff を記録。結果を `docs/server-modernization/phase2/notes/reporting-parity.md` にまとめる）
- [ ] ライセンス管理 (`system/license`) の権限チェックおよび設定ファイルの配置確認を実施する（備考: `system/license` REST を curl で呼び出し、設定ファイルの検索順序とアクセス権を `docs/server-modernization/phase2/notes/license-config-check.md` に整理。Legacy/Modernized 双方のレスポンスを `artifacts/parity-manual/license/` に保存）

## フェーズ8: 観測性・ロギング

- [ ] Micrometer メトリクス出力（`DatasourceMetricsRegistrar`, `RequestMetricsFilter`）の計測内容を収集し、Prometheus 連携可否を確認する（備考: `scripts/start_wildfly_headless.sh` と `ops/tools/send_parallel_request.sh --loop` で Modernized 単体の負荷シナリオを回し、`curl http://localhost:9080/actuator/{health,metrics,prometheus}` の結果を `artifacts/parity-manual/observability/{health.log,metrics.log,prometheus.log}` に保存。`.env`→compose→WildFly CLI→Jakarta EE の読み込み順および CLI 採取手順を `docs/server-modernization/phase2/notes/ops-observability-plan.md:16-23` に追記済み。Micrometer サブシステム/Prometheus エンドポイントが WildFly で無効化され `/actuator/*` が 404 のため、`configure-wildfly.cli` の修正後に再取得する）
- [ ] Trace ID が JMS / セッション層ログへ伝搬するか end-to-end で確認する（備考: `ops/tests/api-smoke-test/test_config.manual.csv` に trace-id 列を追加し、`rest_error_scenarios.manual.csv` や `ops/tests/api-smoke-test/headers/trace-{anonymous,session}.headers`、`README.manual.md` で 200/400/401/500 ケースと X-Trace-Id 手順を明文化。`ops/tools/send_parallel_request.sh` に `--profile/--profile-file` を実装して `send_parallel_request.profile.env.sample` から接続先を切替え、200 ケースの HTTP/JMS/Session ログを `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/` に保存済み。Legacy コンテナは `org.wildfly.extension.micrometer` 依存で build 失敗、Modernized は `d_users` 未投入のため 4xx/5xx ケースは保留。Runbook `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` に手順とブロッカーを記載し、DB 復旧後に残りを採取する）
- [ ] REST 例外処理共通化（`AbstractResource`）をレビューし、レスポンスフォーマットとログ整合性を検証する（備考: `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` を追加し、`README.manual.md` へ ApiProblem 期待値と X-Trace-Id 付与方法を追記済み。`ops/tools/send_parallel_request.sh --profile compose` で CLI 送信できるが、Legacy build 失敗および Modernized DB 未投入により 400/401/500 のレスポンスと `artifacts/parity-manual/rest-errors/` への記録は未完。Postgres ベースライン投入後にログ採取を再開する）

## フェーズ9: 回帰・API 同等性検証

- [ ] スモークテストスクリプト (`ops/tests/api-smoke-test/`) を用いて Legacy・Modernized のレスポンス比較を実施し、成果物ディレクトリを保存する（備考: Legacy の HTTP トレース（`tmp/legacy-capture/*.har`）から `scripts/api_parity_targets.touch.json` を自動生成する `ops/tools/har-to-config.sh` を整備し、`ops/tests/api-smoke-test/run.sh --dual` で両系統に同一シナリオを送出して `artifacts/parity-manual/smoke/{legacy,modernized}/` を取得する）
- [ ] API パリティチェッカー (`scripts/api_parity_response_check.py`) で代表 API の差分を測定し、結果を共有する（備考: CLI ベースのテスト環境が整ったら `tmp/parity-touch/<timestamp>/diff.txt` を再取得し、`docs/server-modernization/phase2/notes/touch-api-parity.md` に差分サマリとリスク評価を追記する。Web クライアント不要）
- [ ] 監査ログ・外部副作用の検証（例: `/20/adm/factor2/*` 実行後の `d_audit_event`）を含む総合回帰テストを設計する（備考: `/20/adm/factor2/*` 後の監査計画を `docs/server-modernization/phase2/notes/test-data-inventory.md:181-218` に整理し、`ops/tests/security/factor2/*.http` で CLI 実行する前提と証跡先 `artifacts/parity-manual/audit/d_audit_event_missing.log` を記録。`d_audit_event` テーブルが未作成のため実測ログは欠落したまま。Postgres ベースライン復旧とサンプルデータ投入後に成功ケースを採取する）

## フェーズ10: ドキュメント・フォローアップ

- [x] 本チェックリストを作成し、進捗確認の起点を整備する
- [x] 実施結果・既知課題を `PHASE2_PROGRESS.md` および関連ドキュメントへ反映する運用フローを確立する（備考: 2026-06-15 付で `PHASE2_PROGRESS.md` に Progress-Update-Flow（証跡24h以内反映・同営業日チェックリスト更新・週次/リリース前レビュー・RACI/テンプレ）を追加し、本チェックリスト備考へ要約を反映済み）
- [x] テストデータ・モック資材を `ops/tests/` 配下に整理し、デバッグ再現性を確保する（備考: `docs/server-modernization/phase2/notes/test-data-inventory.md` に headers/payloads/README の棚卸し・命名規則・CI 前提・ADM20/FIDO2 拡充計画を追記し、Checklist 反映に必要な資材整理を完了）

---

### 現時点の総括（2026-06-15 / 2025-11-07 追記）

- 2025-11-07: Web クライアント依存を排除する CLI 主導デバッグ方針と証跡保存ルールを追加。Legacy 実測 → Modernized リプレイ → サーバー内部観測の 3 層証跡を整備し、Runbook と `PHASE2_PROGRESS.md` を連動させる Gate を設定。
- フェーズ1は完了。フェーズ2ではサーバーレイヤーマップ/トレースフロー整理、SpotBugs/Checkstyle/PMD および Nightly CPD のワークフロー定義、`ops/analytics/evidence/nightly-cpd/20240615/` での手動証跡取得、`ops/tools/cpd-metrics.sh` のメトリクス抽出改善まで進捗。Slack/PagerDuty/Grafana の本番証跡は未取得で Ops 対応待ち。
- フェーズ3〜7は未着手。RuntimeDelegate 整備後も `JsonTouchResourceParityTest` / `InfoModelCloneTest` の失敗が続いており、Touch/API パリティ調査が必要。外部接続ラッパー (`PlivoSender`, `ORCAConnection`, `CopyStampTreeBuilder/Director`) の防御的コピー実装と JMS/MBean 32 件の残課題解消が最優先。
- 直近のアクション: 1) Ops 本番 Jenkins で Nightly CPD を実行し Slack/PagerDuty Permalink と Grafana スクリーンショットを Evidence に反映、2) 外部ラッパー向けテスト (`PlivoSenderDefensiveCopyIT`, `ORCAConnectionSecureConfigTest`, `CopyStampTreeRoundTripTest`) を追加して SpotBugs `EI_EXPOSE_REP*` を削減、3) `ops/tools/send_parallel_request.sh` + `test_config.manual.csv` で代表 API の手動パリティベースラインと監査ログ採取を進める。
