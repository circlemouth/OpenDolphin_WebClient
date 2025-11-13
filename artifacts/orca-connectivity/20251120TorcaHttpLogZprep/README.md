# RUN_ID=20251120TorcaHttpLogZprep

- 取得日時: 2025-11-13 21:22 JST（UTC_TAG=20251113T122203Z）
- 目的: ハンドブック §7（404/405 即応セット）の本番テンプレを実際に適用し、`template-next-run` から複製したディレクトリへ証跡ファイルをそろえる。
- dummy リクエスト: `curl --max-time 10 -sv "http://localhost:8000/api01rv2/patientgetv2?id=000001"`（Basic 認証なし → HTTP 401）。ログ上では直近の `/orca11/acceptmodv2` 405 も抽出され、404/405 抜粋フローを確認できた。

## 実施内容（§7 対応状況）
1. **RUN_ID 初期化**: `scripts/orca_prepare_next_run.sh 20251120TorcaHttpLogZprep` で `artifacts/orca-connectivity/template-next-run/` から複製。`logs/` と `httpdump/` 配下を mkdir で補強。
2. **ライブ HTTP 追跡**: `tail -n200 -F docker/orca/jma-receipt-docker/logs/orca/http.log` を 10 秒強実行し、生ログを `perl -MPOSIX=strftime` 後処理で UTC タイムスタンプ付き `logs/http_live_20251113T122203Z.log` へ保存（202 行）。
3. **docker logs --since**: `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 20m --timestamps > logs/docker_orca_since_20251113T122203Z.log` を採取。`--tail` 省略でも 1.2s で完了し、直近 405/401 メッセージを含む。
4. **404/405 抜粋**: `rg -n '404|405|Method Not Allowed' logs/http_live_*.log` を実行し、`logs/http_404405_extract_20251113T122203Z.log` に 405/401 両ケースを記録。
5. **マウント確認**: `ls -l docker/orca/jma-receipt-docker/logs/orca` と `readlink .../orca_http.log` の結果を `host_orca_log_dir_*.txt` / `orca_http_symlink_*.txt` に保存。
6. **httpdump**: `httpdump/api01rv2_patientgetv2/request.http` / `response.http` に `curl -sv` 全文・レスポンスボディを保管。`Allow` は返却されず 401 となったが、構成確認目的は達成。
7. **メタ情報**: `logs/meta_20251113T122203Z.txt` へ RUN_ID / UTC_TAG を明記し、`artifacts/...` 配下で Runbook 参照できるよう整理。

> 補足: 09:12Z, 11:29Z 台で取得したウォームアップ結果（`http_live_20251113T091235Z.log` など）も残している。正式提出は UTC_TAG=20251113T122203Z を参照する。

## Slack 報告テンプレ（差し替え例）
```
[RUN_ID=20251120TorcaHttpLogZprep / UTC=20251113T122203Z]
http_live: artifacts/orca-connectivity/20251120TorcaHttpLogZprep/logs/http_live_20251113T122203Z.log (202行)
since: artifacts/orca-connectivity/20251120TorcaHttpLogZprep/logs/docker_orca_since_20251113T122203Z.log
extract: artifacts/orca-connectivity/20251120TorcaHttpLogZprep/logs/http_404405_extract_20251113T122203Z.log
host/readlink: host_orca_log_dir_20251113T122203Z.txt / orca_http_symlink_20251113T122203Z.txt
httpdump: httpdump/api01rv2_patientgetv2/{request,http}
Doc update: Runbook §4.5, logs/2025-11-13, DOC_STATUS, PHASE2_PROGRESS
所見: patientgetv2 は Basic 認証未付与のため 401。ログには `/orca11/acceptmodv2` 405 も継続しているため、route/API_ENABLE の調整が必要。
```

## 次アクションメモ
- 401 解消のため `curl -u ormaster:***` での再取得や、`api_enable`/`receipt_route` 反映状況を `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` に追記予定。
- 本 RUN_ID をもって PHASE2_PROGRESS.md の ORCA セクションに「テンプレ本番実行済み」を登録。
