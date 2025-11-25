# Gate40-DB ベースライン再試行ログ（UTC 2025-11-08T10:14:55Z）
- 目的: Secrets dump 受領後に Legacy/Modernized Postgres へベースライン復旧を実施し、Gate #40 をクローズするための証跡を収集する。
- 状況: Secrets ストレージ `~/Secrets` が依然マウントされておらず、DDL/seed ファイルを受領できていない。shasum 記録および `psql -f` / `flyway baseline,migrate` 着手条件を満たさないため DB 操作は見合わせた。
- アクション: Runbook 0章に従い再度 Ops/DBA へ配布依頼を送付（`artifacts/parity-manual/db-restore/20251108T062436Z/baseline_search.log` へ 10:14:55Z エントリを追記）。
- ブロッカー: Secrets dump 未受領。Ops/DBA のチケット ID 発番待ち。
- 次アクション: Secrets 受領後に shasum 記録 → `docker compose -f docker-compose.modernized.dev.yml up -d db-modernized` → `psql -f <schema/seed>` → `flyway/flyway:10.17 baseline` / `migrate` を実施し、
  - `psql_dt_modern.log`
  - `psql_counts_modern.log`
  - `flyway_baseline.log`
  - `flyway_migrate.log`
  を本ディレクトリへ保存する。
