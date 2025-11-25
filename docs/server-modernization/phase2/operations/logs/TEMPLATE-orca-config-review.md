# ORCA 設定差分監査テンプレート (10 ステップ以内)

1. `export UTC_RUN=$(date -u +%Y%m%dT%H%M%SZ)` → `mkdir -p artifacts/orca-connectivity/${UTC_RUN}` / `touch docs/server-modernization/phase2/operations/logs/${UTC_RUN}-orca-config-review.md`。
2. `rg -n 'claim\.' ops/shared/docker/custom.properties | tee artifacts/orca-connectivity/${UTC_RUN}/config_shared.txt` で ORCA 連携キーを抜き出す。
3. `rg -n 'claim\.' ops/modernized-server/docker/custom.properties 2>&1 | tee artifacts/orca-connectivity/${UTC_RUN}/config_modernized.txt`（ファイル欠如時もログ化）を実行。
4. `git diff --no-index ops/shared/docker/custom.properties ops/modernized-server/docker/custom.properties | tee artifacts/orca-connectivity/${UTC_RUN}/config_diff.txt || true` で差分を取得。
5. `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §3.5 のサブチェックリストと突合し、抜けているキーがないか確認。
6. `claim.conn` の値に差異があれば `curl http://localhost:9080/openDolphin/resources/serverinfo/claim/conn` の結果を `serverinfo_claim_conn_${UTC_RUN}.txt` として保存。
7. `claim.host` / `claim.send.port` に差異があれば `docker exec opendolphin-server-modernized-dev getent hosts <host>` と `nc -vz <host> <port>` を連続実行し、`artifacts/orca-connectivity/${UTC_RUN}/host_check.txt` へまとめる。
8. `claim.jdbc.url` / `claim.user` / `claim.password` 差分は `docker exec opendolphin-postgres-modernized psql -c '\l'` の抜粋で裏付け、`config_db_probe_${UTC_RUN}.txt` に保存。
9. 取得した `config_diff.txt` へのパス、補足ログ、発見事項を `docs/server-modernization/phase2/operations/logs/${UTC_RUN}-orca-config-review.md` に箇条書きで転記し、`git status` を確認してからレビューへ提出。
