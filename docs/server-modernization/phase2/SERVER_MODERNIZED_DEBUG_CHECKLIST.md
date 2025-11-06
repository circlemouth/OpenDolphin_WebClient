# server-modernized デバッグチェックリスト（2026-06-14）

server-modernized モジュールのデバッグ状況を把握するためのチェックリスト。  
各項目はレガシーサーバーとの機能同等性確認に向けた実施タスクを網羅しており、進捗更新時は本ファイルと `PHASE2_PROGRESS.md` の両方を更新すること。

## ステータス凡例

- `[x]` … 完了
- `[ ]` … 未完了（未着手または進行中。備考欄で詳細を記載）

---

## フェーズ0: 事前準備・資料棚卸し

- [x] モダナイズ関連ドキュメント（`docs/server-modernization/` 配下）を精読し、既存ツールとスクリプトの利用可否を整理する（備考: `api-smoke-test.md`, `operations/API_PARITY_RESPONSE_CHECK.md` を確認済み）
- [ ] Codex 向け環境構築スクリプト `scripts/setup_codex_env.sh` の実行可否と必要な権限を確認する（備考: 実行検証未実施）
- [ ] Docker Compose (`docker-compose.modernized.dev.yml`) のサービス構成を確認し、デバッグ時の起動順序・依存関係を明文化する（備考: ドキュメント化未完了）

## フェーズ1: ビルド・依存性確認

- [x] `mvn -pl server-modernized -am clean verify -DskipTests` を実行し、ビルド警告および Jakarta 依存差分を記録する（備考: 2025-11-06 `mvn -f server-modernized/pom.xml clean verify -DskipTests` 実行。`Base64Utils` / `Long(long)` / `Character(char)` などの非推奨 API 警告を確認済み。**指針: 非推奨 API 対応は開発完了後の課題として別途チケット化する**）
- [x] `META-INF/persistence.xml` など Jakarta EE 10 対応設定をレビューし、スキーマ不一致を洗い出す（備考: `persistence.xml` は 3.1、`ejb-jar.xml` は 4.0 スキーマで整合。データソース/hibernate プロパティに不一致なし）
- [x] 共通モジュール（`common/`）との互換性確認を実施し、DTO/エンティティの差分一覧を作成する（備考: `notes/common-dto-diff-A-M.md` と `notes/common-dto-diff-N-Z.md` で Legacy との差分・新規 DTO・リスク評価を整理。PHR 系フィールド追加、FirstEncounter 系削除、監査/2FA/ケアプラン新規 DTO、Hibernate 6 の CLOB 対応などフォローアップ課題を抽出済み）

## フェーズ2: 静的解析・コードマッピング

- [ ] `server-modernized/src/main/java` をレイヤー別に整理し、循環依存や未使用コンポーネントを棚卸しする（備考: マッピング未作成）
- [ ] フィルター/インフラ層（例: `LogFilter`, `RequestMetricsFilter`）の挙動をレビューし、ログ・トレース ID の伝搬状況を可視化する（備考: 未着手）
- [x] 静的解析ツール導入可否を調査し、CI 反映方針をまとめる（備考: `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に SpotBugs/Checkstyle/PMD の導入方針と Jenkins/GitHub Actions 実装、Nightly CPD 設計、差分ゲート手順、Ops への資格情報・通知運用フローを記録。`PHASE2_PROGRESS.md` にも 2026-06-14 時点の進捗・残タスクを反映済み）

## フェーズ3: REST/API レイヤー

- [ ] 代表エンドポイント（`open.dolphin.rest`）のシグネチャとレスポンス DTO を Legacy 実装と diff し、差分レポートを作成する（備考: 未着手）
- [ ] SSE / ポーリング併用エンドポイント（`ChartEvent*`）の挙動をデバッグし、再接続および認証フローの検証ステップを定義する（備考: 未着手）
- [ ] DTO コンバータ群の Jackson 設定差異を洗い出し、互換性リスクを整理する（備考: 未着手）

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

- [ ] Micrometer メトリクス出力（`DatasourceMetricsRegistrar`, `RequestMetricsFilter`）の計測内容を収集し、Prometheus 連携可否を確認する（備考: 未着手）
- [ ] Trace ID が JMS / セッション層ログへ伝搬するか end-to-end で確認する（備考: 未着手）
- [ ] REST 例外処理共通化（`AbstractResource`）をレビューし、レスポンスフォーマットとログ整合性を検証する（備考: 未着手）

## フェーズ9: 回帰・API 同等性検証

- [ ] スモークテストスクリプト (`ops/tests/api-smoke-test/`) を用いて Legacy・Modernized のレスポンス比較を実施し、成果物ディレクトリを保存する（備考: Python 実行可否確認が必要）
- [ ] API パリティチェッカー (`scripts/api_parity_response_check.py`) で代表 API の差分を測定し、結果を共有する（備考: 設定ファイル未作成）
- [ ] 監査ログ・外部副作用の検証（例: `/20/adm/factor2/*` 実行後の `d_audit_event`）を含む総合回帰テストを設計する（備考: 未着手）

## フェーズ10: ドキュメント・フォローアップ

- [x] 本チェックリストを作成し、進捗確認の起点を整備する
- [ ] 実施結果・既知課題を `PHASE2_PROGRESS.md` および関連ドキュメントへ反映する運用フローを確立する（備考: 運用策定中）
- [ ] テストデータ・モック資材を `ops/tests/` 配下に整理し、デバッグ再現性を確保する（備考: 未着手）

---

### 現時点の総括（2026-06-14）

- フェーズ1のビルド検証・共通 DTO 差分整理は完了済み。フェーズ2では SpotBugs/Checkstyle/PMD + Nightly CPD の CI 組み込み、`EI_EXPOSE_REP*` 棚卸し、防御的コピー実装、Legacy 除外設定更新まで進捗。Ops 環境での資格情報登録と Nightly 実ジョブ稼働、Slack/PagerDuty 通知疎通、BigQuery/Grafana 連携は未確認のためフォローが必要。
- フェーズ3以降（REST/API 同等性・セッション層・外部連携など）は引き続き未着手。RuntimeDelegate スタブ展開でテストの一部を復旧したものの、`JsonTouchResourceParityTest` / `InfoModelCloneTest` など一部失敗が残っており、次サイクルで解析・修正を行う。
- 直近のアクション: 1) Ops による資格情報棚卸し・Nightly CPD 初回実行と証跡共有、2) SpotBugs 防御的コピー残件（JMS/MBean 32 件）の解消、3) Touch/EHT API パリティ検証とテスト赤字の解消を優先する。
