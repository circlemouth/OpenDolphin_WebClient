# ORCA HTTP 404/405 次回トリアージ用テンプレート

1. `cp -R artifacts/orca-connectivity/template-next-run/RUN_ID_PLACEHOLDER artifacts/orca-connectivity/${RUN_ID}` で本フォルダを複製し、ディレクトリ名・ファイル名に含まれる `RUN_ID_PLACEHOLDER` を実際の RUN_ID に置換して利用する。
2. `logs/` 配下へ `http_live_<UTC>.log`、`docker_orca_since_<UTC>.log`、`http_404405_extract_<UTC>.log`、`host_orca_log_dir_<UTC>.txt`、`orca_http_symlink_<UTC>.txt` を保存する。
3. `httpdump/` は API パス単位のサブディレクトリを作成し、`request.http` / `response.http` を格納する。`httpdump/sample/` の `.gitkeep` は構成例として残しておく。
4. 詳細な実行順序は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` §7 のチェックリストを参照する。
