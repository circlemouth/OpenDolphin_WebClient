# サーバー近代化計画（ライブラリアップデート優先）

## 目的と背景
- 既存サーバー資産（`server/` 配下）はコード改修を避けつつ、ビルド環境と依存ライブラリを最新 LTS に追従させる。
- 現行構成は Java 8 / Java EE 7 / WildFly 9 系を前提としており、ライブラリの脆弱性および保守性に課題がある。
- 今回は現行スクリプトを複製した `server-modernized/` ディレクトリを新設し、作業中も元資産を保持する。
- Web クライアント刷新とサーバーモダナイズを並行実施しており、**既存サーバースクリプトの変更が一時停止された場合は `server-modernized/` 配下のみで作業を行い、`server/` 以下のコードには手を触れない** 方針を徹底する。

## 既存ドキュメントの整理
- `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`：WildFly 26 + PostgreSQL 14 を用いたローカル検証手順。近代化後のターゲットランタイムの基準とする。
- `docs/web-client/operations/TEST_SERVER_DEPLOY.md`：WildFly 9 系での手動デプロイ手順。旧環境との差分確認・ロールバック用の基準とする。
- `docs/web-client/architecture/REPOSITORY_OVERVIEW.md`：サーバー依存関係、資格情報外部化の注意点を記載。pom 更新時のレビューチェックリストとして活用する。
- `docs/server-modernization/server-api-inventory.md`：旧サーバー REST API の全エンドポイント一覧。検証観点の抜け漏れ防止に利用する。
- `docs/server-modernization/api-smoke-test.md`：レスポンス互換性検証用スモークテストの運用手順。

## フェーズ 1：ライブラリアップデート実施計画
1. **ビルド環境の整備**
   - Java バージョンを 11 もしくは 17 へ引き上げ、Maven プラグイン互換性を確認。
   - WildFly 26 LTS イメージを用いた検証環境（Docker Compose）の再構築。

2. **依存ライブラリの更新候補**（`server/pom.xml` / `server-modernized/pom.xml`）
   | ライブラリ | 現行 | 更新候補 | 対応方針 |
   | --- | --- | --- | --- |
   | `javax:javaee-web-api` / `javaee-api` | 7.0 | Jakarta EE 8 (`jakarta.platform:jakarta.jakartaee-web-api`) | 互換 API 置換を検証。コード改修不要なら `provided` スコープで差し替え。 |
   | `org.jboss.resteasy:*` | 3.0.10.Final | WildFly 26 同梱の RESTEasy 4 系 | WildFly モジュール提供版へ切替し、WAR へのバンドルを削減。 |
   | `org.apache.velocity:velocity` | 1.7 | 2.3 系 | テンプレート互換性の事前検証。 |
   | `postgresql:postgresql` | 9.2-1002.jdbc4 | 42.x 系 JDBC ドライバ | WildFly の `module` 差し替えを含めて検証。 |
   | `org.glassfish:javax.json` | 1.0.4 | `jakarta.json:jakarta.json-api` 1.1 以降 | Jakarta API への移行を確認。 |
   | `com.plivo:plivo-java` | 3.0.6 | 最新安定版 | API 互換性と TLS 要件の確認。 |
   | `com.googlecode.jsontoken:jsontoken` | 1.1 | 1.1.1（フォーク版含む） | 依存関係の解消を確認。 |
   | `org.jboss.ejb3:jboss-ejb3-ext-api` | 2.1.0 | WildFly 推奨バージョン | WildFly 26 バンドルに合わせる。 |

3. **設定の外部化とセキュリティ**
   - `wildfly-maven-plugin` にハードコードされている管理者資格情報を Maven `settings.xml` へ退避し、`server-modernized` 側で `-Dwildfly.user` などプロパティ置換を行う。
   - Docker/Compose 環境の `.env` との整合性チェックリストを作成し、CI/CD 環境へ展開できるよう準備する。

4. **検証とリグレッション**
   - 単体テスト（該当すれば）と手動動作確認を `LOCAL_BACKEND_DOCKER.md` の手順で実施し、WildFly ログで deprecation 警告を確認。
   - 旧環境へロールバックする手順を `TEST_SERVER_DEPLOY.md` ベースで維持し、差分影響を文書化する。

## フェーズ 2：モダン要件への発展的対応（次段階で実施）
- **タイムスタンプ・監査**：電子署名、タイムスタンプ付与、アクセス監査ログの拡充を検討。外部タイムスタンプ局連携や DB スキーマ変更の是非を評価。
- **情報の信憑性強化**：MD5 ベース認証の刷新（トークンベース / mTLS）、レスポンス署名、ゼロトラスト前提のアクセス制御層導入。
- **通信セキュリティ**：HTTPS 常時化、HSTS・CSP ヘッダ適用、WAF/リバースプロキシ連携。
- **運用監視**：APM 導入、メトリクス収集、ログ集中管理基盤との連携。

これらはライブラリアップデート完了後に改めて評価し、別途工程表を策定する。
