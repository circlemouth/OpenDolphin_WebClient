# Local Synthetic Baseline

`local_synthetic_seed.sql` は公式 Postgres dump が無い環境でも Legacy / Modernized 双方の DB を最小構成で初期化するための SQL 断片です。

## 使い方
1. `docker compose` で `db` もしくは `db-modernized` を起動する。
2. Hibernate (`hibernate.hbm2ddl.auto=update`) によりテーブルが生成されていることを `psql \dt` で確認する。初回のみ `./scripts/start_legacy_modernized.sh start --build` を流してテーブル作成を促す。
3. `docker exec -i <container> psql -U <user> -d <db> -f /workspace/ops/db/local-baseline/local_synthetic_seed.sql` を実行する（パスはリポジトリをマウントした場所に合わせて調整）。
4. `SELECT userId, commonName FROM d_users WHERE userId='LOCAL.FACILITY.0001:dolphin';` でレコードが入ったことを確認する。

## 生成される内容
- `facility_num` シーケンス（START 200）。
- `d_facility` へのローカル施設レコード（`LOCAL.FACILITY.0001`）。
- `d_users` へのテストユーザー（`LOCAL.FACILITY.0001:dolphin`）。
- 上記ユーザーに `d_roles` の `system-administrator` 権限を付与。

> **注意**: 医療機関や患者の実データは含まれていません。必要に応じて `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` で紹介している JSONL インポート手順や `ops/tests/api-smoke-test` の CLI を併用してください。
