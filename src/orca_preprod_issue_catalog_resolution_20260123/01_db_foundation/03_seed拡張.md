# 03_seed拡張

- RUN_ID: 20260124T144121Z
- 作業日: 2026-01-24
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/03_seed拡張.md
- 対象IC: IC-04
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md
  - src/validation/E2E_統合テスト実施.md

## 実施内容
- `ops/db/local-baseline/local_synthetic_seed.sql` に patient/karte seed を追加。
- facilityId + patientId で upsert し、既存患者がいる場合は更新のみ（Karte は患者単位で未作成時のみ挿入）。
- `hibernate_sequence` を facility/user/roles に加えて patient/karte まで再調整。
- `opendolphin.d_patient_seq` / `opendolphin.d_karte_seq` が存在する場合は `setval` で同期。
- seed の内容を `ops/db/local-baseline/README.md` に反映。

## seed データ（最小構成）
| 区分 | facilityId | userId | patientId | 患者名 | 性別 | 生年月日 | Karte |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local | LOCAL.FACILITY.0001 | dolphin | 00001 | Seed Patient | M | 1970-01-01 | created=CURRENT_DATE |
| Modernized | 1.3.6.1.4.1.9414.72.103 | doctor1 | 00001 | Seed Patient | M | 1970-01-01 | created=CURRENT_DATE |

## 投入手順
1. `setup-modernized-env.sh` で DB 初期化と seed を適用。
   - 例:
     `ORCA_API_USER= ORCA_API_PASSWORD= MODERNIZED_APP_HTTP_PORT=19192 MODERNIZED_APP_ADMIN_PORT=20197 MODERNIZED_POSTGRES_PORT=55640 MINIO_API_PORT=19302 MINIO_CONSOLE_PORT=19303 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
2. 既存コンテナへ seed を再投入する場合（必要時のみ）。
   - `docker ps` で該当コンテナ名（`opendolphin-postgres-modernized-<worktree>`）を確認。
   - 実行例:
     `docker exec -i <container> psql -U opendolphin -d opendolphin_modern -v ON_ERROR_STOP=1 -f /workspace/ops/db/local-baseline/local_synthetic_seed.sql`

## 検証
- 実行コマンド:
  `ORCA_API_USER= ORCA_API_PASSWORD= MODERNIZED_APP_HTTP_PORT=19192 MODERNIZED_APP_ADMIN_PORT=20197 MODERNIZED_POSTGRES_PORT=55640 MINIO_API_PORT=19302 MINIO_CONSOLE_PORT=19303 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 確認SQL:
  - `SELECT facilityid, patientid, fullname FROM d_patient WHERE patientid='00001' ORDER BY facilityid;`
  - `SELECT p.facilityid, p.patientid, k.id AS karte_id, k.created FROM d_karte k JOIN d_patient p ON p.id=k.patient_id WHERE p.patientid='00001' ORDER BY p.facilityid;`
- ログ:
  - `artifacts/preprod/seed/seed-20260124T144121Z.log`

## 変更ファイル
- ops/db/local-baseline/local_synthetic_seed.sql
- ops/db/local-baseline/README.md
- docs/preprod/implementation-issue-inventory/data-migration.md
- src/orca_preprod_issue_catalog_resolution_20260123/01_db_foundation/03_seed拡張.md
