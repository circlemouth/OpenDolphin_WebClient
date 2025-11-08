# DEV_ENV_COMPATIBILITY_NOTES

Runbook #25/#26 で報告された CRLF 行末によるシェル実行失敗を再発させないための互換性メモ。scripts/ および ops/tools/ の実行スクリプトを LF へ強制し、関連証跡・運用フローをここに集約する。

## 2025-11-08: Worker #1 対応サマリ

- `.gitattributes` を新規作成し、`scripts/**`・`ops/tools/**` で利用する `*.sh / *.bash / *.zsh / *.ksh / *.command / *.cli / *.env / *.env.* / *.profile / *.ps1 / *.psm1` を `text eol=lf` に固定。外部依存（node_modules 等）はスコープから外し、Runbook #25/#26 の再現環境と同じ CLI 群のみ影響を与えるようコメントで範囲を明示。
- `git status --porcelain` を採取して既存差分を棚卸し→`git add --renormalize .` 実行→`tracked_before.txt` の一覧を `git restore --staged` し、他タスクの変更を巻き込まない形で scripts/ 配下の newline だけをステージ。追加の `RENORMALIZE_EXCLUDE` は不要と判断。
- `rg -l '\r$' -g '*.sh' scripts` で CRLF が残っていた `scripts/setup_codex_env.sh` と `scripts/run-static-analysis-diff.sh` を特定し、`perl -pi -e 's/\r$//'` で LF 化。
- `file` コマンドで代表ファイル（`scripts/setup_codex_env.sh`, `ops/tools/send_parallel_request.sh`, `ops/tools/send_parallel_request.profile.env.sample`）の改行を確認し、`git diff --stat` を取得。`HEAD` 版との比較 (`file_checks_head.txt`) も記録しており、CRLF -> LF の変化がログで追える。
- 証跡一式は `artifacts/parity-manual/setup/20251108-renormalize/` に保存（`git_status_before.txt`, `tracked_before.txt`, `file_checks_before.txt`, `file_checks_after.txt`, `file_checks_head.txt`, `git_diff_stat_scripts.txt`, `git_add_renormalize.log`）。

## 実行時の補足

1. `.gitattributes` 変更後に `git add --renormalize .` を実施すると tracked ファイルが一括でステージされるため、事前に `git status --porcelain` を記録しておき、既存作業ファイルを `git restore --staged $(cat tracked_before.txt)` で戻す。
2. scripts/ops/tools のみをスコープにしているため、他ディレクトリで CRLF を維持したいファイル（node_modules, tmp 等）には影響なし。追加ディレクトリで LF 強制が必要になった場合は `.gitattributes` にパターン行を追記し、本ファイルに根拠と実行ログを残す。
3. 代表ファイルの `file` コマンド結果を Runbook 証跡として残すことで、`git config core.autocrlf` が異なる環境でも LF で配布できることを運用面で担保できる。

## 次のアクション

- 他タスクで追加されたシェル/CLI ファイルも scripts/ops/tools 配下であれば自動的に LF になる。別ディレクトリの CLI ツールを投入する際は `.gitattributes` と本ファイルを更新し、`artifacts/parity-manual/setup/<timestamp>-renormalize/` へ証跡を追加すること。
- Runbook #25/#26 の検証ログ（2025-11-07 版）と紐付けるため、`PHASE2_PROGRESS.md` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` の備考欄へ本ノートおよび証跡パスを明記済み。
