# 20251116TapiparityZ2 DB reseed memo

- Ran `tmp/sql/local_seed_base.sql` via `docker exec opendolphin-postgres* psql -v ON_ERROR_STOP=1` to reapply the local synthetic baseline without hitting the WEB1001 block (`ops/db/local-baseline/local_synthetic_seed.sql` fails at the Chart summary seed; see `legacy_seed.log`, `modern_seed.log`).
- Reset doctor1 credentials on both databases: `UPDATE d_users SET password='doctor2025' WHERE userid IN ('1.3.6.1.4.1.9414.72.103:doctor1','9001:doctor1');` so that CLI headers with the plain password succeed.
- Verified `SELECT count(*) FROM d_users;` (legacy/modern logs) and curl `GET /openDolphin/resources/dolphin` returned 200 prior to rerunning the parity tests.
