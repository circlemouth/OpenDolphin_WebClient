# 3.4 永続化 / データアクセスモダナイズ完了報告

チェックリスト 3.4 の各項目について、実施内容と運用上のフォローを以下に整理する。

## 1. PostgreSQL JDBC 42.x + TLS 対応

- `server-modernized/pom.xml` で JDBC ドライバを 42.7.3 へ更新し、`ops/modernized-server/docker/configure-wildfly.cli` のデータソース定義に `sslmode`／`sslrootcert` を追加した。これにより、TLS 接続が必須の環境でも WildFly の再設定なしに接続できる。
- Docker Compose では `DB_SSLMODE`／`DB_SSLROOTCERT` を環境変数として受け取り、Secrets に格納された証明書をボリュームマウントするだけで TLS を有効化できる。デフォルト値は `prefer` とし、ローカル検証用の平文接続も維持した。
- 旧バージョンからの移行では `.env`（もしくは Secrets Manager のキー）に以下の値を追加するだけでよく、アプリケーション再起動時に新しい設定が反映される。
  ```env
  DB_SSLMODE=verify-full
  DB_SSLROOTCERT=/opt/jboss/ssl/root-ca.pem
  ```

## 2. persistence.xml の Secrets 外部化

- `server-modernized/src/main/resources/META-INF/persistence.xml` を Jakarta EE 8 (JPA 2.2) 仕様に合わせて新設し、JNDI `java:jboss/datasources/PostgresDS` のみを参照する構成へ変更した。これにより JDBC URL・資格情報はすべて WildFly データソースへ委譲され、Git に資格情報が残らない。
- Secrets 管理は `server-modernized/config/server-modernized.env.sample` をひな形として整備。既存利用者は現行の `custom.properties` に加えて `.env` を作成し、CI/CD から環境変数として注入するだけで移行が完了する。
- Hibernate プロパティは `javax.persistence.schema-generation.database.action=none` を基本とし、不要な自動 DDL 生成を停止。Lazy Load の強制有効化を禁止し、セッション境界外アクセスが発生した場合は明示的に例外が出るよう調整した。

## 3. スキーマのリバースエンジニアリングと Flyway 化

- `server-modernized/tools/flyway/` に Flyway CLI 設定 (`flyway.conf`) とエクスポートスクリプト (`scripts/export-schema.sh`) を追加し、PostgreSQL からのスキーマ抽出を自動化した。
- 初回移行では `pg_dump --schema-only` の結果を Secrets Storage に保管し、本リポジトリには `V0001__baseline_tag.sql` を配置してベースラインを登録。以後の変更は `V0002__performance_indexes.sql` 以降で管理する。
- CI では `flyway -configFiles=server-modernized/tools/flyway/flyway.conf migrate` を nightly で実行し、DDL の整合性を自動検証する。失敗時はデプロイを停止する運用ルールを定義した。

## 4. Lazy/Eager 設定と N+1 クエリ対策

- `persistence.xml` で `hibernate.query.fail_on_pagination_over_collection_fetch=true` を設定し、N+1 が発生しやすいコレクションフェッチ＋ページングを検出。
- Flyway の `V0002__performance_indexes.sql` でレスポンス遅延が顕著だった主要クエリ向けのインデックスを作成。`pg_trgm` 拡張の有効化と合わせて Like 検索の負荷も軽減した。
- 監視面では `SessionTraceManager`（3.3 で導入）と組み合わせ、慢性的な N+1 が発生した場合に警告が残るよう `WARN` ログを追加。既存ユーザーはログ監視ルールに `N_PLUS_ONE_DETECTED` を追加するだけでアラートが受け取れる。

## 5. バイナリ添付のオブジェクトストレージ移行

- 添付ファイルの新規保存先として S3 互換ストレージ設定を `server-modernized/config/attachment-storage.sample.yaml` に整理。`storage.type=database|s3` を切り替え可能にし、段階的な移行を可能とした。
- 既存データは当面 DB に残しつつ、新規アップロードのみ S3 を利用する「デュアルライト」方式を採用。移行ツールは Flyway マイグレーションとは独立したジョブとして提供し、S3 バケットのライフサイクル（30 日後に Standard-IA、10 年後に自動削除）も定義済み。
- ユーザー影響としては、院内ネットワークから S3 へのアウトバウンド接続が必要になる。ファイアウォール開放と IAM ロールの付与を移行手順に含め、失敗時は従来通り DB 保存へフォールバックする設計とした。

## 6. 既存ユーザーへの移行手順サマリ

1. Secrets 管理基盤（Vault / AWS Secrets Manager 等）へ `DB_HOST` など 6 項目を登録し、CI/CD でコンテナへ注入する。
2. TLS を有効化する場合はルート証明書を `/opt/jboss/ssl/root-ca.pem` へマウントし、`DB_SSLMODE=verify-full` を設定。
3. `flyway baseline` を実行して `flyway_schema_history` を生成後、`flyway migrate` を実行して索引マイグレーションを適用。
4. 添付ストレージを S3 に切り替える場合は `attachment-storage.yaml` を Secrets として登録し、アプリケーション再起動時に読み込む。

以上により、チェックリスト 3.4 の未完了項目はすべて解消された。
