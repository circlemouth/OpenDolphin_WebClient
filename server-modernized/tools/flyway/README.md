# Flyway 運用メモ（V0225 以降）

- 対象: `server-modernized/tools/flyway/sql/V0225__letter_lab_stamp_tables.sql` で追加した letter/lab/stamp 系テーブルとシーケンス。
- 目的: Legacy/Modernized 双方で `LetterServiceBean` / `NLabServiceBean` / `StampServiceBean` の CRUD を同一スキーマで再現し、`ops/tools/send_parallel_request.sh` による parity 取得を再開できる状態にする。

## 適用順序
1. **Flyway migrate**  
   ```bash
   docker run --rm --network legacy-vs-modern_default \
     -v "$PWD":/workspace -w /workspace \
     flyway/flyway:10.17 \
     -configFiles=server-modernized/tools/flyway/flyway.conf \
     migrate
   ```
   - `flyway_schema_history` に `0225` が追加され、`d_letter_module_seq` / `d_letter_module` / `d_nlabo_module` / `d_nlabo_item` / `d_stamp_tree` が作成される。
   - ここでは **実行ログのみ取得** し、Docker 上の Postgres への適用はホスト担当者へ引き継ぐ。
2. **Seed 再投入 (`ops/db/local-baseline/local_synthetic_seed.sql`)**  
   - Flyway 適用後に、Legacy (`db`) / Modernized (`db-modernized`) それぞれへ同シードを流し込み、`id=8` の紹介状・`id=9101/9201/9202` のラボデータ・`id=9` のスタンプツリーを復元する。
   - 例:  
     ```bash
     docker compose exec db-modernized psql -U opendolphin -d opendolphin \
       -f ops/db/local-baseline/local_synthetic_seed.sql
     ```
   - 実際の `docker compose exec` はホスト環境が実施する。開発コンテナ内ではファイル更新と手順書のみを提供する。
3. **コンテナ再起動 & parity 取得**  
   - `scripts/start_legacy_modernized.sh down && start --build` → `ops/tools/send_parallel_request.sh --profile compose --case {letter,lab,stamp}` の順。
   - 本 README では順序のみ記載し、再起動および `send_parallel_request.sh` の実行はホスト担当者に委譲する。

## 追加されたオブジェクト
| オブジェクト | 用途 | 備考 |
| --- | --- | --- |
| `d_letter_module_seq` / `d_letter_module` | `LetterModule` 用紹介状テーブル | `karte_id` FK・`karte_id` インデックスあり。セEDで WEB1001 向け紹介状を復元。 |
| `d_nlabo_module` / `d_nlabo_item` | `NLaboModule/NLaboItem` | サンプルとして HGB/WBC 2 件を投入。`patientId+sampleDate` で並び替え可能なインデックスを付与。 |
| `d_stamp_tree_seq` / `d_stamp_tree` | `StampTreeModel` | `user_id` FK + インデックス。`doctor1` の個人ツリーを base64 TreeBytes でシード。 |

> **Note:** ここまでの手順で DB へ変更を適用したら、`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` の §4 (DB Gate) に従って証跡（Flywayログ / psql 出力）を `artifacts/parity-manual/` へ保存する。

## PK パリティ状況（2025-11-11 更新）

- **PK 揃え済み→再取得待ち**: `ops/db/local-baseline/local_synthetic_seed.sql` で `WEB1001` の `d_karte.id` を強制的に 10 へ固定し、Modern DB 側でも `d_karte` レコードを `id=10` へ入れ替えたうえで `opendolphin.hibernate_sequence` を `SELECT setval('opendolphin.hibernate_sequence', 10, true);` で再採番済み。`docker exec opendolphin-postgres(-modernized)` で双方の `hibernate_sequence` を確認し、証跡として `artifacts/parity-manual/db/20251111T062323Z/karte_id_check.txt` を保存した。Appo/Schedule/Letter/Lab/Stamp parity の RUN_ID は `20251110TnewZ` のままなので、Docker 再デプロイと再取得は後続タスクで対応する。
