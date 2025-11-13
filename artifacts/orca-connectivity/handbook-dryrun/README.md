# ORCA HTTP 404/405 ハンドブック ドライラン

## 目的
- `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` §6 の手順を、コンテナ再起動なしで事前検証。
- 実行結果は既存ログ/証跡から転用し、Slack テンプレに流し込むとどう見えるかを共有。

## ダミー環境パラメータ
```
RUN_ID=20251120TorcaHttpLogZ9
UTC_TAG=DRYRUN000000Z
BASE_EVIDENCE=artifacts/orca-connectivity/20251119TorcaHttpLogZ1
```

## 取得ファイル一覧
| 種別 | 保存先 | 取得方法 / 備考 |
| --- | --- | --- |
| HTTPライブ（120行） | `artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/http_live_DRYRUN000000Z.log` | `tail -n 120 docker/orca/jma-receipt-docker/logs/orca/http.log` を `ts` なしで実行、タイムスタンプは生ログを利用。
| docker logs since | `.../logs/docker_orca_since_DRYRUN000000Z.log` | `BASE_EVIDENCE/logs/http.log` をコピーして placeholder として使用。
| 404/405 抜粋 | `.../logs/http_404405_extract_DRYRUN000000Z.log` | 上記 HTTP ライブログに対して `rg -n '404|405|Method Not Allowed'` を実行（該当行がなければ空ファイル）。
| host/readlink | `.../logs/host_orca_log_dir_DRYRUN000000Z.txt` / `.../logs/orca_http_symlink_DRYRUN000000Z.txt` | いずれもホスト側の `ls -l` / `readlink` のみ。コンテナ再起動は行わない。
| httpdump サンプル | `.../httpdump/sample/request.http` / `response.http` | ダミー API でファイル構成を確認。実 API には到達しない。

## Slack テンプレサンプル
```
[RUN_ID=20251120TorcaHttpLogZ9 / UTC=DRYRUN000000Z]
http_live: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/http_live_DRYRUN000000Z.log
since: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/docker_orca_since_DRYRUN000000Z.log
extract: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/http_404405_extract_DRYRUN000000Z.log
host/readlink: host_orca_log_dir_DRYRUN000000Z.txt / orca_http_symlink_DRYRUN000000Z.txt
httpdump: httpdump/sample/
Doc update: Runbook §4.5, logs/2025-11-13, DOC_STATUS, PHASE2_PROGRESS
所見: DRYRUN: 404/405 の抽出対象なし、フォルダ構成のみ事前確認
```

## 検証メモ
- 参考元 `BASE_EVIDENCE` は `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/README.md` に整理されており、本ドライラン README もそちらからリンク。
- Slack 投稿前にこのテンプレへ新しい RUN_ID / UTC を差し替えるだけで提出できることを次回トリアージで実演予定。
