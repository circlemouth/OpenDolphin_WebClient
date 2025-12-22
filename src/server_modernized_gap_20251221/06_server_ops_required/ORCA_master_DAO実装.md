# ORCA Master DAO 実装（05/06）
- 期間: 2025-12-30 11:00 - 2026-01-02 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_DAO実装.md`

## 目的
- ORCA-05/06 の DB テーブルを読み出す DAO を実装する。

## 実装状況（現行コード）
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterDao.java` が存在し、以下の DAO メソッドを実装済み。
  - `searchGenericClass` / `findGenericPrice` / `searchYouhou` / `searchMaterial` / `searchKensaSort`
  - `searchHokenja` / `findAddress`
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java` が存在（ORCA-08 向け）。
- `OrcaMasterResource` は DAO を参照しておらず、現状は fixture/snapshot 読み込みで応答を構成している。

## 未実施（明文化が必要な未対応）
- `OrcaMasterResource` への DAO 組み込み（ORCA-05/06 を DB 参照へ切替）。
- ORCA-05/06 で必要なテーブルのうち、`OrcaMasterDao` に未追加のものがあれば追加することの明文化。
- DAO 実装の動作検証（クエリ/レスポンス）と証跡取得（RUN_ID 付き）の記録。

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`
- `docs/DEVELOPMENT_STATUS.md`
