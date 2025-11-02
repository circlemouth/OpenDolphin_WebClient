# 旧サーバーモダナイズ実装計画（チェックリスト）

## 1. 現行サーバー仕様サマリ
- **実行環境**: Java 8 / Java EE 7 / WildFly 9 系を前提としたモノリシック WAR 配備で、Java 11/17 への移行が未着手（参考: `docs/server-modernization/library-update-plan.md`）。
- **ビルド & デプロイ**: Maven で `opendolphin-server` WAR を生成し、`wildfly-maven-plugin` 1.0.2.Final で本番 WildFly 管理ポートへ直接デプロイする構成。プラグイン設定にはホスト名・管理ユーザー・パスワードがハードコードされている（`server/pom.xml`）。
- **主要依存ライブラリ**: Java EE API 7.0、RESTEasy 3.0.10.Final、Apache Velocity 1.7、PostgreSQL JDBC 9.2 系、Plivo Java SDK 3.0.6 など旧世代の依存関係に留まっている（`server/pom.xml`）。
- **API レイヤー**: `open.dolphin.*.rest` パッケージを中心に AdmissionResource / DemoResource / DolphinResource などが REST API を公開し、入院・受付・カルテ・ユーザー管理などのエンドポイントが `/20/adm/*` `/demo/*` `/touch/*` で提供されている（`docs/server-modernization/server-api-inventory.md`）。
- **業務ロジック**: `open.dolphin.session`（および `adm10` / `adm20` の各 session パッケージ）が `@Stateless` EJB と JPA `EntityManager` を用いてカルテ・診断・患者情報を処理している。例: `KarteServiceBean` がカルテ情報・アレルギー・身体計測などをまとめて返却する（`server/src/main/java/open/dolphin/session/KarteServiceBean.java`）。
- **補助コンポーネント**: `open.dolphin.msg`（ClaimSender、DiagnosisSender など）によるレセプト電文連携、Apache Velocity による帳票テンプレート、Plivo 経由の SMS 送信機能、JPA クエリベースの統合 DB アクセスを含む。

## 2. モダナイズ基本方針
1. `server-modernized/` ディレクトリを作業ベースに、既存 WAR と同等機能を段階的に Jakarta EE / 最新 WildFly へ移行する。
2. REST API の互換性を維持しつつ、セキュリティ・監査要件を補強（2FA、監査ログ、TLS 常時化）。
3. 外部サービス（SMS、レセプト電文等）との統合ポイントを棚卸しし、API ゲートウェイやメッセージング基盤への移行可否を判定する。
4. インフラは Docker Compose / CI で再現可能な形へ再構成し、設定値は Secrets/Env へ外部化する。

## 3. コンポーネント別チェックリスト

### 3.1 プラットフォーム & ビルド基盤
- [x] Java 11 もしくは 17 をビルドターゲットに設定し、Maven プラグイン（compiler, surefire 等）の互換性を検証する。`server-modernized/pom.xml` で Java 17 + 最新プラグインへ更新済み。
- [x] WildFly 26 LTS 以降のランタイムに合わせて Jakarta EE 8 API へ置換し、`jakarta.*` 依存へ切り替える。依存座標は Jakarta API へ移行済み。
- [x] `wildfly-maven-plugin` の接続情報を Maven Settings / 環境変数へ外部化し、CI/CD から秘密情報を除去する。`server-modernized/pom.xml` で `serverId`/環境変数プロファイルを導入し、`.env.sample`・運用ドキュメントを更新。
- [x] `server-modernized/pom.xml` に BOM 管理を導入し、RESTEasy・JDBC ドライバ等を WildFly 同梱版へ寄せる。WildFly BOM を import して依存バージョンを統制。
- [x] Docker Compose に従来サーバー (`server`) とモダナイズ版 (`server-modernized` プロファイル) の両構成を用意し、ヘルスチェックや環境変数テンプレートを `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` に統合済み。WildFly 26.1.3.Final ベースの Dockerfile は `docker/server-modernized/` に分離し、評価時のみ起動できるよう切替手順を記載。

### 3.2 REST API レイヤー
- [ ] `server-api-inventory.yaml` と既存 `*.rest` 実装を突合し、全エンドポイントの入力/出力スキーマを OpenAPI で定義する。
- [ ] Admission / Dolphin / Demo リソースで使用している JAX-RS アノテーションを Jakarta RESTful Web Services 仕様へ移行し、デフォルトエンコーディングやエラー応答を整理する。
- [ ] レスポンスシリアライザ（Jackson / JSON-B）を最新化し、Legacy JSON と互換性検証を行う。
- [ ] WebSocket / サーバー送信イベント相当のチャネル（`/chartEvent/subscribe` 等）の代替実装方針を決定する。
- [ ] API 認証ヘッダと 2FA エンドポイントのセキュリティ要件（レート制限・監査ログ）を追加設計する。

### 3.3 セッション/EJB 層
- [ ] `open.dolphin.session`・`adm10.session`・`adm20.session` に存在する `@Stateless` Bean を CDI/シングルトンへリファクタするか、Jakarta EJB 互換 API へ移行する。
- [ ] `EntityManager` 利用箇所の JPQL/Native クエリを棚卸しし、パフォーマンスクリティカルなクエリにインデックス/ビューを設計する。
- [ ] ClaimSender / DiagnosisSender など JMS 依存を含むメッセージング部を評価し、Jakarta Messaging or 外部メッセージングサービスへの移行方針を決定する。
- [ ] 例外ハンドリングとトランザクション境界を再設計し、分散トレーシング用のコンテキスト伝播を追加する。
- [ ] バッチ処理・定期ジョブの有無を調査し、スケジューラ（Jakarta Concurrency / 外部ジョブ基盤）へ移行する。

### 3.4 永続化 / データアクセス
- [ ] PostgreSQL JDBC ドライバを 42.x 系へ更新し、SSL/TLS 設定を有効化する。
- [ ] 永続化ユニット定義・`persistence.xml` の JDBC URL/資格情報を Secrets 管理に移す。
- [ ] DB スキーマをリバースエンジニアリングし、マイグレーションツール（Flyway/Liquibase）で版管理する。
- [ ] エンティティの lazy/eager 設定と N+1 クエリを監査し、REST API のレスポンス最適化を図る。
- [ ] バイナリ添付（Schema/Attachment）格納方式を見直し、オブジェクトストレージ導入を検討する。

### 3.5 帳票・テンプレート / ドキュメント生成
- [ ] Apache Velocity テンプレートを現行仕様へ棚卸しし、国際化・アクセシビリティ要件を確認する。
- [ ] PDF 生成ライブラリ（iText 等）のアップデート方針を決定し、ライセンス互換性を再確認する。
- [ ] 帳票出力の署名・タイムスタンプ付与ワークフローをモダン実装へ統合する。
- [ ] テンプレートリポジトリを Git 管理し、プレビュー/テスト手順を CI に組み込む。

### 3.6 外部サービス連携
- [ ] Plivo SMS API の最新 SDK / REST API 仕様を確認し、TLS 要件・API キー管理を更新する。
- [ ] ORCA / レセプト電文送信処理（`open.dolphin.msg`）のプロトコル仕様と監査ログ要件を整理する。
- [ ] 将来の API ゲートウェイ（Kong / Apigee 等）導入時のルーティング・認証統合方針をまとめる。
- [ ] 外部接続設定を環境変数化し、Sandbox/本番の切り替え手順を定義する。

### 3.7 セキュリティ / コンプライアンス
- [ ] 2 要素認証エンドポイント（`/20/adm/factor2/*`）の実装をレビューし、FIDO2/TOTP 等の最新方式へ更新する。
- [ ] HTTPS 常時化、HSTS、CSP、WAF 連携など運用レベルのセキュリティ設定を整備する。
- [ ] 操作ログ・監査証跡の要件を `docs/server-modernization/api-smoke-test.md` と突き合わせ、改ざん耐性のあるログ保管を実装する。
- [ ] 個人情報保護対応（第三者提供記録・アクセス制御）を `docs/web-client/architecture/SERVER_MODERNIZATION_PLAN.md` の法令要件と整合させる。
- [ ] 設定変更・デプロイ作業のワークフローを標準化し、権限分離とレビュー手順を明文化する。

### 3.8 品質保証 / 運用
- [ ] API 互換性検証用スモークテスト（`api-smoke-test.md`）を自動化し、CI パイプラインで旧/新サーバー比較を実行する。
- [ ] 監視メトリクス（応答時間、DB 接続数、エラーレート）を定義し、APM or Prometheus/Loki 収集基盤を導入する。
- [ ] リリース手順・ロールバック手順を更新し、旧サーバーとの共存期間中のカットオーバープランを策定する。
- [ ] 利用者向け周知（メンテナンスウィンドウ、2FA 再登録等）のコミュニケーション計画を準備する。
- [ ] SLA/SLO と障害対応フローをドキュメント化し、訓練計画を立てる。

---

本チェックリストは旧サーバー仕様を踏まえたモダナイズ実装タスクの出発点であり、進捗に応じて `server-modernized/` 配下の成果物および関連ドキュメントを更新すること。
