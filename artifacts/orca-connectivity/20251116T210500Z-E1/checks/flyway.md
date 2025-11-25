# Flyway 実装メモ (RUN_ID=20251116T210500Z-E1)
- 参照ファイル: `server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql`
- サマリ:
  - `d_phr_key` テーブル（`facilityId/patientId/accessKey` ユニーク + `registered` タイムスタンプ）と `d_phr_key_seq` を作成。
  - `phr_async_job` テーブル（`job_id` UUID, `patient_scope` JSONB, `state/progress/result_uri` など）とインデックス（state, facility+queued_at）を整備。
  - `ALTER TABLE phr_async_job ... TYPE JSONB` により JSON カラムを後方互換で統一。
- 現在の適用状況: `Flyway history` では V0228 までのログが `artifacts/parity-manual/schedule/20251110T231006Z/flyway_history.log` に保存済（本 RUN では DB migrate を再実行しておらず、DDL のレビューのみ）。
- 次アクション: ORMaster DB へ適用する際は `ops/tools/flyway/migrate.sh --target 0228` を実行し、`docs/server-modernization/phase2/operations/logs/<RUN_ID>-flyway.md` に結果を追記。
