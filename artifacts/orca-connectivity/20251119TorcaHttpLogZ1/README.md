# RUN_ID=20251119TorcaHttpLogZ1

- 取得日: 2025-11-13 14:55 JST
- 目的: `start-weborca.sh` の `REDIRECTLOG` 処理と `/var/log/orca` シンボリックリンクの実体を確認し、既存 `docker/orca/jma-receipt-docker/logs/orca/` へ HTTP ログが書き出されていることを証跡化。
- 実施内容:
  - `docker/orca/jma-receipt-docker/logs/orca/` をホスト側で参照し、`http.log` と `orca_http.log -> http.log` のシンボリックリンクを `ls -l` / `readlink` で取得。
  - `http.log` の末尾 200 行を `logs/http.log` に保存し、`tail -F` で追従した際の保存形式サンプルとして Runbook §4.2 に展開できるよう整備。
  - `jma-receipt.env` と `start-weborca.sh` から `REDIRECTLOG` 関連行を抜粋し、`config/` 配下に保管。
- 注意事項: 既存コンテナの再起動や `docker cp` は行っていない。`tail` 取得もホストボリューム上のファイル操作のみ。
- 関連ドキュメント更新対象: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`（§4.2, §4.5）、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`。

## ドライラン参照
- 次回トリアージ前のリハーサルとして、RUN_ID=`20251120TorcaHttpLogZ9` / UTC=`DRYRUN000000Z` を用いた証跡テンプレを `artifacts/orca-connectivity/handbook-dryrun/README.md` にまとめた。
- Slack テンプレは本 README 下部の雛形と同一構成のため、RUN_ID / UTC を差し替えるだけで事前共有が可能。

## Slack / 共有ノート提出テンプレ
```
[RUN_ID=20251119TorcaHttpLogZ1 / UTC=20251113T145500Z]
http_live: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/http_live_<UTC>.log
since: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/docker_orca_since_<UTC>.log
extract: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/http_404405_extract_<UTC>.log
host/readlink: host_orca_log_dir_<UTC>.txt / orca_http_symlink_<UTC>.txt
httpdump: <api ディレクトリ一覧>
Doc update: Runbook §4.5, logs/2025-11-13, DOC_STATUS, PHASE2_PROGRESS
所見: <404/405 の要約と次アクション>
```
次回トリアージでは RUN_ID / UTC のみ置き換えてそのまま共有可能（`handbook-dryrun` サンプルで整合性済み）。
