# 20251119TbaselineFixZ1 Legacy/Modernized Postgres ベースライン復旧ログ

- 実施日時: 2025-11-13 05:05Z〜05:18Z
- 担当: Worker #1 (Codex)
- 目的: Runbook `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` に沿って Legacy / Modernized 両 Postgres をローカル合成ベースライン（Hibernate DDL + `local_synthetic_seed.sql` + Flyway baseline/migrate）で再初期化し、証跡を `artifacts/parity-manual/db-restore/20251119TbaselineFixZ1/` に集約する。

## 実施サマリ

1. `docker compose ps` と `curl /serverinfo/jamri`（Legacy/Modernized）を採取。`SYSAD` ヘッダーでは 401 だったため、シード投入後に `LOCAL.FACILITY.0001:dolphin` アカウントで再取得し、レスポンスヘッダーを `serverinfo_jamri_*.txt` に保存。
2. ホストに `psql` が無かったため、すべての `psql` コマンドは `docker exec -i opendolphin-postgres(-modernized)` で実行。
3. Legacy/Modernized それぞれで `DROP SCHEMA opendolphin CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;` を実行して完全に初期化。Legacy DB から `pg_dump --schema-only` した成果物（`legacy_schema_dump.sql`）を両 DB に流し込み、Hibernate DDL欠如時の代替とした（`legacy_schema_apply.log` / `modern_schema_apply.log`）。
4. `ops/db/local-baseline/local_synthetic_seed.sql` を両 DB に投入し、`
   \dt` と代表テーブル件数（`d_facility=2, d_users=2, d_patient=2` など）を `legacy_psql_dt.log` / `modern_psql_dt.log` / `*_table_counts.log` へ記録。
5. Flyway については `opendolphin.flyway_schema_history` を削除したうえで `flyway/flyway:10.17` コンテナで `baseline → migrate → info` を Legacy/Modernized の順に実行し、`0,0001,0002,0003,0220,0221,0222,0223,0224,0225,0226,0227` の `Success` を確認。
6. 追加で `facility_num` シーケンスや `d_users/d_patient_visit` 件数を README 内に明記し、Runbook へ報告する差分として `local_synthetic_seed.sql` の WEB1001 患者 ID 修正を記録。

## 主要コマンドと結果

| Step | コマンド/処理 | 証跡 |
| --- | --- | --- |
| Stack 状態採取 | `docker compose --project-name legacy-vs-modern ... ps` | `docker_compose_ps.txt` |
| Legacy/Modernized serverinfo | `curl -H "userName: LOCAL.FACILITY.0001:dolphin" ... /serverinfo/jamri` | `serverinfo_jamri_legacy.txt`, `serverinfo_jamri_modernized.txt` |
| スキーマ初期化 | `DROP SCHEMA opendolphin/public CASCADE; CREATE SCHEMA public;` | `legacy_schema_apply.log`, `modern_schema_apply.log` |
| シード投入 | `docker exec -i ... psql -f ops/db/local-baseline/local_synthetic_seed.sql` | `legacy_seed.log`, `modern_seed.log` |
| テーブル確認 | `psql -c '\dt'`, `SELECT count(*) ...` | `legacy_psql_dt.log`, `modern_psql_dt.log`, `*_table_counts.log` |
| Flyway baseline/migrate/info | `docker run --network container:<db> flyway/flyway:10.17 ...` | `flyway_baseline_{legacy,modern}.log`, `flyway_migrate_{legacy,modern}.log`, `flyway_info_{legacy,modern}.log` |

## 件数サマリ（シード投入後）

| DB | d_facility | d_users | d_roles | d_patient | d_karte | d_patient_visit | d_letter_module | d_nlabo_item | d_appo | d_stamp_tree |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Legacy (localhost:5432/opendolphin) | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 1 |
| Modernized (localhost:55432/opendolphin_modern) | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 1 |

`facility_num` シーケンスは両 DB とも `setval=8`（ログ末尾参照）。

## Flyway 状態 (2025-11-13)

- Legacy / Modernized ともに `flyway info` で `Schema version: 0227` を確認。
- `flyway_schema_history` 内容: `0 (Baseline)`, `0001`, `0002`, `0003`, `0220`, `0221`, `0222`, `0223`, `0224`, `0225`, `0226`, `0227`。
- baseline/migrate 実行ログは `flyway_*.log` を参照。

## 既知課題 / メモ

1. `psql` クライアントがホストに未導入だったため、Runbook に追記されている fallback (`docker exec ... psql`) で作業済み。
2. `ops/db/local-baseline/local_synthetic_seed.sql` の WEB1001 セクションで `patientId='1.3.6.1.4.1.9414.72.103:WEB1001'` を挿入すると後続の `patientId='WEB1001'` 参照が NULL になり、`d_karte` 挿入で `patient_id` の NOT NULL 制約に失敗していた。今回 `patientId='WEB1001'` へ修正（コミット未作成）し、Runbook 備考として報告予定。
3. Modernized DB は Hibernate による DDL 生成前だったため、Legacy DB から `--schema-only` dump を流し込んで両環境のスキーマを揃えた。Runbook 4.1 にも代替案として追記が必要。

## 次アクション

- `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の DB 行へ `RUN_ID=20251119TbaselineFixZ1` と完了日 (2025-11-13) を追記。
- `docs/web-client/planning/phase2/DOC_STATUS.md` の該当セクションを `Done (2025-11-13 / RUN_ID=20251119TbaselineFixZ1)` へ更新。
- `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` に今回の fallback（`pg_dump --schema-only` 適用、`local_synthetic_seed.sql` 修正点）を備考追加予定。
