# ORCA Master API 実接続
- 期間: 2026-01-02 11:00 - 2026-01-05 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_API_実接続.md`
- 状態: 完了
- 根拠: `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java` / `server-modernized/src/main/java/open/orca/rest/OrcaMasterDao.java`

## 目的
- /orca/master/* を fixture から DB 実データへ切替する。
- ETag/TTL/監査メタを本番仕様に合わせる。

## 参照
- `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_DAO実装.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
- `docs/DEVELOPMENT_STATUS.md`
