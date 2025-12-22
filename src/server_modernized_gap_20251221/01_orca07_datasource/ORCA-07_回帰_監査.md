# ORCA-07 回帰/監査
- 期間: 2025-12-31 09:00 - 2026-01-01 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_回帰_監査.md`

## 目的
- ORCA 接続の監査ログとメトリクスを追加し、接続失敗時のエラーパスを明確化する。

## 実施内容
- ORCA JNDI 取得に加えて、接続取得の成功/失敗を監査ログへ出力。
- ORCA 接続の成功/失敗カウンタと ORCA DataSource のプールメトリクスを追加。
- 接続失敗時は `SQLException` を維持しつつ、失敗理由を監査ログへ記録。

## 変更ファイル
- `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java`
- `server-modernized/src/main/java/open/dolphin/metrics/OrcaDatasourceMetricsRegistrar.java`

## メトリクス
- `opendolphin_orca_datasource_lookup_total`（タグ: outcome/reason）
- `opendolphin_orca_connection_total`（タグ: outcome/reason）
- `opendolphin_orca_db_active_connections`
- `opendolphin_orca_db_available_connections`
- `opendolphin_orca_db_max_used_connections`

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_設計確定.md`
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_JNDI_Datasource_実装.md`
- `docs/DEVELOPMENT_STATUS.md`
