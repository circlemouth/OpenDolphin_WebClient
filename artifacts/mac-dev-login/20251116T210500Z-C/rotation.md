# RUN_ID=20251116T210500Z-C mac-dev-login credential rotation

- Date: 2025-11-16 21:15 UTC
- Scope: Admin (`1.3.6.1.4.1.9414.72.101:admin`) and doctor (`...:doctor1`) accounts used by mac-dev-login.local.md
- Reason: Follow-up from docs/server-modernization/phase2/operations/logs/20251116T151200Z-trace-audit-review.md §3 TODO

## Steps
1. Generated new passphrases `admin2025!C` / `doctor2025!C` offline (no shared secrets committed elsewhere).
2. Calculated MD5 hashes for WildFly seed inputs via macOS `md5` command:
   - `echo -n 'admin2025!C' | md5` → `dc58cb63a8c8e05c71d1e0b4b1461a50`
   - `echo -n 'doctor2025!C' | md5` → `be041fe5460747ccc56d9943b3143175`
3. Updated mac-dev-login.local.md with the new plain/MD5 values and noted the previous credentials as revoked on 2025-11-16.
4. Flagged DOC_STATUS 行 66 に RUN_ID と証跡パスを追記。

## Follow-up
- Next rotation no later than 2025-12-15 or immediately after helper compose secrets are refreshed.
- When reseeding DB, ensure `ops/db/local-baseline/users_seed.sql` uses the hashes above.
