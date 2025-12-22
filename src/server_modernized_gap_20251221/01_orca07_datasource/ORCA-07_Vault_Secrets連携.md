# ORCA-07 Vault Secrets 連携
- 期間: 2025-12-29 09:00 - 2025-12-30 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`

## 目的
- ORCA DB 認証情報を Vault から注入し、`custom.properties` 依存を段階廃止する。

## スコープ
- Vault 連携の設定整理とサーバー側の取得経路整備。

## 実施内容
- ORCA DataSource が `ORCA_DB_*` を優先し、未指定時は `DB_*` にフォールバックするよう WildFly CLI を更新。
- 起動時に ORCA DB 認証情報の不足を検知し、監査ログへ `ORCA_DATASOURCE_LOOKUP_*` を記録して起動失敗させる。
- 監査ログは secretRef/version のみ出力し、秘密情報は出力しない。

## 環境変数
- ORCA Secrets（推奨）: `ORCA_DB_HOST` / `ORCA_DB_PORT` / `ORCA_DB_NAME` / `ORCA_DB_USER` / `ORCA_DB_PASSWORD` / `ORCA_DB_SSLMODE` / `ORCA_DB_SSLROOTCERT`
- 監査メタ（任意）: `ORCA_DB_SECRET_REF` / `ORCA_DB_SECRET_VERSION`
- 既存互換: `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_SSLMODE` / `DB_SSLROOTCERT`

## 未実施
- Vault 実連携の有効化・RUN_ID 証跡取得。

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_JNDI_Datasource_実装.md`
- `docs/DEVELOPMENT_STATUS.md`
