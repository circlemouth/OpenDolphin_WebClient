# ORCA Master DAO 実装（05/06）
- 期間: 2025-12-30 11:00 - 2026-01-02 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_DAO実装.md`
- 状態: 完了
- 根拠: `server-modernized/src/main/java/open/orca/rest/OrcaMasterDao.java`

## 目的
- ORCA-05/06 の DB テーブルを読み出す DAO を実装する。

## 実装内容（要点）
- ORCA-05（generic-class / generic-price / youhou / material / kensa-sort）の検索・ページング・バージョン解決を実装。
- ORCA-06（hokenja / address）の検索・完全一致取得と有効期間フィルタを実装。
- ORCA DB のテーブル/列名差異に対して DatabaseMetaData で動的解決を行う。

## 実装箇所
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterDao.java`
  - `searchGenericClass` / `findGenericPrice` / `searchYouhou` / `searchMaterial` / `searchKensaSort`
  - `searchHokenja` / `findAddress`
  - `*TableMeta` と `resolveTable`/`columnOrNull` による列解決

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`
- `docs/DEVELOPMENT_STATUS.md`
