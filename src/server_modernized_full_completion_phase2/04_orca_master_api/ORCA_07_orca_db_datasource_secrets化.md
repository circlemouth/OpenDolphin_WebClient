# ORCA-07 ORCA DB Datasource / Secrets 化

- RUN_ID: 20251220T082857Z
- 対象: ORCA DB 接続（JNDI `java:jboss/datasources/ORCADS`）

## 実施内容
- `custom.properties` の `claim.jdbc.*` を使用する経路を廃止し、JNDI Datasource に統合。
- `custom.properties` に残っている `claim.jdbc.*` は警告ログを出して無効化。
- ORCA DB 接続は WildFly 側の ORCADS 設定で集中管理。

## Secrets ローテーション
- ORCADS の認証情報は `DB_USER` / `DB_PASSWORD` を差し替え、WildFly を再起動。
- 直指定値はアプリ側から参照しないため、`custom.properties` への資格情報追加は禁止。

## 監査ログ
- 起動時に `claim.jdbc.*` が残っている場合は `open.orca.rest.ORCAConnection` の WARNING を記録。
- ORCADS の設定確認は `ops/modernized-server/checks/verify_startup.sh` の `read-resource` 出力を証跡として保存。
