# ORCA-07 設計確定（DataSource/Vault）

## 目的
- ORCA DB 接続の責務を **JNDI DataSource** と **Secrets 管理（Vault 等）** に分離し、`custom.properties` 依存を段階的に廃止する。
- 環境切替・資格情報ローテーション・監査対応の基盤を確定する。

## 前提（現状整理）
- ORCA DB 接続は `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java` から **JNDI** で取得している（`java:jboss/datasources/ORCADS`）。
- WildFly 側の DataSource は `ops/modernized-server/docker/configure-wildfly.cli` で **ORCADS** を作成し、`DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD/DB_SSLMODE/DB_SSLROOTCERT` を参照している。
- `custom.properties` は `ORCAConnection` の `claim.*` 設定や `OrcaResource` などの施設情報で利用されており、ファイル全体の廃止は現時点で不可能。
- ただし `claim.jdbc.*` は既に **無視される** ことを警告ログで通知している（`ORCAConnection#warnLegacyJdbcConfig()`）。

## 責務分割（設計確定）

### 1) JNDI DataSource（接続・プール責務）
- 役割: DB への **接続プール** と **JDBC 接続設定** の単一責任。
- 参照名: **`java:jboss/datasources/ORCADS` を正**とし、既存コードの修正を最小化する。
  - 将来の移行で `java:/datasources/OrcaDb` などへ名称変更する場合は **別名エイリアス**で吸収する（コード側のハード変更は避ける）。
- 設定ソース: **環境変数 / コンテナ外部注入**（Vault から注入された値を採用）。
- 推奨パラメータ（現行 CLI のデフォルトを尊重）
  - `min-pool-size=5`, `max-pool-size=50`
  - `background-validation=true`, `background-validation-millis=60000`
  - `validate-on-match=true`, `check-valid-connection-sql="SELECT 1"`
  - `query-timeout=60`
  - `sslrootcert` は未設定時に削除し、指定時のみ追加

### 2) Secrets 管理（Vault 等）
- 役割: **資格情報・接続先 URL・SSL 証明書パス**の保管とローテーション管理。
- DataSource への注入値は **Vault（または Secrets Manager）→ 環境変数** の経路で投入する。
- 変数名の方針
  - **ORCA 専用の Secrets**（推奨）: `ORCA_DB_HOST`, `ORCA_DB_PORT`, `ORCA_DB_NAME`, `ORCA_DB_USER`, `ORCA_DB_PASSWORD`, `ORCA_DB_SSLMODE`, `ORCA_DB_SSLROOTCERT`
  - **既存互換**（当面のフォールバック）: `DB_HOST` 系（`configure-wildfly.cli` 既定値）
  - 具体的な優先順位は実装フェーズで決めるが、**ORCA 専用 → 共通 DB** の順で評価する設計を前提にする。
- 監査: Secrets の値はログへ出力しない。**secretRef/version のみ**を監査ログに残す。

## `custom.properties` 依存の段階廃止方針

### フェーズ 0（現状）
- `claim.jdbc.*` は **警告ログを出して無視**（実装済み）。
- `claim.conn` など **非秘密情報のみ** を `custom.properties` から参照。

### フェーズ 1（設計確定）
- ORCA DB 接続に関する値は **JNDI DataSource に一本化**し、`custom.properties` に残っていても無効扱い。
- `custom.properties` に `claim.jdbc.*` が存在する場合は **起動時警告 + 監査イベント** に残す。

### フェーズ 2（移行完了後）
- `claim.conn` などの **非秘密フラグも環境変数へ移行**し、`custom.properties` は施設情報等の最小用途に限定。
- 以降は **`custom.properties` を接続情報の出所にしない** ことを原則化する。

## 監査・運用ルール（設計）
- 監査ログ（例）
  - `jndiName`: `java:jboss/datasources/ORCADS`
  - `secretRef`: `kv/modernized-server/orca/db` 等（実値は伏字）
  - `secretVersion`: 文字列（Vault の version）
  - `event`: `ORCA_DATASOURCE_LOOKUP_SUCCESS/FAILURE`
  - 失敗時は **例外種別のみ**記録し、ホスト名や資格情報は記録しない。
- ローテーション手順（設計）
  1. Vault で新しい version を発行
  2. CI/CD で環境変数を更新し DataSource をリロード
  3. 旧資格情報を revoke
  4. 監査ログへ `secretRef` と `version` を記録

## 非スコープ
- WildFly への設定投入・Vault 実連携・ORCA 実 DB 接続の検証。
- `custom.properties` 自体の全廃（施設コードなど他用途が残るため）。

## 参照
- `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java`
- `ops/modernized-server/docker/configure-wildfly.cli`
- `ops/modernized-server/checks/verify_startup.sh`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`（ORCA-07 記載）
