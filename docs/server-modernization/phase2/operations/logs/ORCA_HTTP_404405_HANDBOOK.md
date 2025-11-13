# ORCA HTTP 404/405 トリアージ ワーカーハンドブック

## 1. RUN_ID / UTC_TAG 命名
- RUN_ID は `YYYYMMDDTorcaHttpLogZ<連番>` を基本とし、同日に複数回実施する場合は `Z2`, `Z3`…と増分（例: `RUN_ID=20251120TorcaHttpLogZ2`）。
- UTC_TAG はログ採取直前の UTC タイムスタンプを `date -u +%Y%m%dT%H%M%SZ` で取得（例: `UTC_TAG=20251120T031500Z`）。
- `artifacts/orca-connectivity/${RUN_ID}/logs/` を `mkdir -p` し、全コマンド出力先をここへ統一。`httpdump/<api>/` も同 RUN_ID 配下に作成する。

## 2. 標準取得コマンド
1. **HTTP ライブ追跡**  
   ```bash
   tail -F docker/orca/jma-receipt-docker/logs/orca/http.log \
     | ts '%Y-%m-%dT%H:%M:%SZ' \
     | tee "artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log"
   ```
   - `ts` が無い場合は `while read line; do printf "%s %s\n" "$(date -u +%FT%TZ)" "$line"; done` で代用。
2. **再起動直後の欠損補完**  
   ```bash
   docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 20m --timestamps \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/docker_orca_since_${UTC_TAG}.log" 2>&1
   ```
   - `--since` は状況に応じて 15m/2h へ調整。`
3. **404/405 抜粋**  
   ```bash
   rg -n '404|405|Method Not Allowed' \
     "artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log" \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/http_404405_extract_${UTC_TAG}.log"
   ```
4. **マウント/シンボリック確認**  
   ```bash
   ls -l docker/orca/jma-receipt-docker/logs/orca \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/host_orca_log_dir_${UTC_TAG}.txt"
   readlink docker/orca/jma-receipt-docker/logs/orca/orca_http.log \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/orca_http_symlink_${UTC_TAG}.txt"
   ```

## 3. httpdump ディレクトリ
- API ごとに `artifacts/orca-connectivity/${RUN_ID}/httpdump/<api>/` を作成。例: `httpdump/api01rv2_patientgetv2/`。
- `curl -v` 実行時は `.../request.http` へコマンド＋リクエスト、`.../response.http` にレスポンス本文とヘッダーを保存。
- 405/404 判定に影響する `Allow` ヘッダーは response 側へ必ず残す。

## 4. ドキュメント更新ポイント
1. **ログ台帳** `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md`  
   - RUN_ID 節へ `http_live_*` / `docker_orca_since_*` / `http_404405_extract_*` / `host_orca_log_dir_*` / `orca_http_symlink_*` / `httpdump/*` のパスと概況を追記。  
2. **Runbook** `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`  
   - §4.2 の証跡表と §4.5 の監査欄へ対応 RUN_ID をリンク。手順更新があった場合は §4.9 のテンプレ参照先も調整。  
3. **DOC_STATUS** `docs/web-client/planning/phase2/DOC_STATUS.md`  
   - 「ORCA HTTP ログ」項目を RUN_ID / 状態（In Progress, Done）で更新。  
4. **PHASE2_PROGRESS** `docs/server-modernization/phase2/PHASE2_PROGRESS.md`  
   - 課題欄「ORCA 404/405」へ RUN_ID、実施者、結果（例: `REDIRECTLOG 405 継続, サポート問い合わせ待ち`）を追記。  

## 5. 報告テンプレ（Slack / メモ）
```
RUN_ID=<ID> / UTC=<UTC_TAG>
http_live: artifacts/.../http_live_<UTC>.log
since: artifacts/.../docker_orca_since_<UTC>.log
extract: artifacts/.../http_404405_extract_<UTC>.log
host/readlink: host_orca_log_dir_<UTC>.txt / orca_http_symlink_<UTC>.txt
httpdump: <api> ディレクトリ一覧
所見: <404 or 405 の要約>
ドキュメント更新: Runbook §4.5, logs/<date>, DOC_STATUS, PHASE2_PROGRESS
```

> 参考成果物: `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/`。

## 6. ドライラン実施テンプレ（UTC_TAG=DRYRUN000000Z）
次回トリアージ前に取得手順を迷わず再現できるよう、ダミー RUN_ID / UTC_TAG を使ってフォルダ構成と Slack テンプレの整合性だけを確認する。実コマンドで触れるのはホスト上の `tail` / `ls` 程度に留め、証跡ファイルは既存 RUN_ID (`20251119TorcaHttpLogZ1`) から複製する。

1. 変数とフォルダの初期化
   ```bash
   export RUN_ID=20251120TorcaHttpLogZ9
   export UTC_TAG=DRYRUN000000Z
   mkdir -p "artifacts/orca-connectivity/${RUN_ID}/logs"
   mkdir -p "artifacts/orca-connectivity/${RUN_ID}/httpdump/sample"
   ```
2. ログ取得コマンドのドライラン
   - `tail -n 120 docker/orca/jma-receipt-docker/logs/orca/http.log > artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log`
   - `cp artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/docker_orca_since_20251113T145500Z.log artifacts/orca-connectivity/${RUN_ID}/logs/docker_orca_since_${UTC_TAG}.log`
   - `rg -n '404|405|Method Not Allowed' artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log > artifacts/orca-connectivity/${RUN_ID}/logs/http_404405_extract_${UTC_TAG}.log`
   - `ls -l docker/orca/jma-receipt-docker/logs/orca > artifacts/orca-connectivity/${RUN_ID}/logs/host_orca_log_dir_${UTC_TAG}.txt`
   - `readlink docker/orca/jma-receipt-docker/logs/orca/orca_http.log > artifacts/orca-connectivity/${RUN_ID}/logs/orca_http_symlink_${UTC_TAG}.txt`
   いずれもコンテナ再起動は不要で、ホスト共有ボリューム上の操作のみで完結する。
3. httpdump サンプル
   ```bash
   tee "artifacts/orca-connectivity/${RUN_ID}/httpdump/sample/request.http" <<'EOF'
   curl -v https://dummy.orca/api -X POST -H 'Content-Type: application/json' -d '{"patientId":"0000"}'
   EOF
   tee "artifacts/orca-connectivity/${RUN_ID}/httpdump/sample/response.http" <<'EOF'
   HTTP/1.1 405 Method Not Allowed
   Allow: POST
   Content-Type: application/json
   {"error":"dryrun","detail":"handbook template verification"}
   EOF
   ```
   実 API への送信は行わず、ファイルレイアウトと `Allow` ヘッダー記録だけを検証する。
4. Slack テンプレ整合性
   - 上記ファイルセットを参照したサンプルを `artifacts/orca-connectivity/handbook-dryrun/README.md` に保存する。
   - `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/README.md` からも同 README を参照し、テンプレ記載内容と提出形式が一致することを確認する。

Slack/メモ用テンプレに `RUN_ID=20251120TorcaHttpLogZ9 / UTC=DRYRUN000000Z` を流し込み、各行のパスを `handbook-dryrun` の成果物へ置き換えればドライラン完了となる。

## 7. 実運用チェックリスト（404/405 即応セット）
ハンドブックを 1 ページで配布できるよう、次回 404/405 が発生したら下記 7 ステップを順番に実行する。空ディレクトリ構成は `artifacts/orca-connectivity/template-next-run/` から丸ごとコピーし、`RUN_ID_PLACEHOLDER` を実 RUN_ID に置換して利用する。

0. **RUN_ID / UTC_TAG 事前宣言** — Slack と端末に `RUN_ID=YYYYMMDDTorcaHttpLogZ#`、`UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)` を投稿し、以下で使う変数として `export`。`cp -R artifacts/orca-connectivity/template-next-run/RUN_ID_PLACEHOLDER artifacts/orca-connectivity/${RUN_ID}` で空ディレクトリを複製したら `logs/` と `httpdump/` を `mkdir -p` で補強する。ドライラン成果物 `artifacts/orca-connectivity/handbook-dryrun/README.md` を見ながら値だけ差し替える。
1. **ライブ HTTP 追跡** — `tail -F docker/orca/jma-receipt-docker/logs/orca/http.log | ts '%Y-%m-%dT%H:%M:%SZ' | tee artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log` を開始し 120 行以上採取。tail 停止時は `Ctrl+C` でファイルを確定する。
2. **docker logs --since 補完** — `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 20m --timestamps > artifacts/orca-connectivity/${RUN_ID}/logs/docker_orca_since_${UTC_TAG}.log 2>&1` を実行し、tail が開始される前の欠損を埋める。症状開始時刻に合わせて `--since` を 15m/2h へ調整可。
3. **404/405 抜粋** — `rg -n '404|405|Method Not Allowed' artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log > artifacts/orca-connectivity/${RUN_ID}/logs/http_404405_extract_${UTC_TAG}.log` を実行。該当行が無くても空ファイルを提出する。
4. **マウント/シンボリック確認** — `ls -l docker/orca/jma-receipt-docker/logs/orca > artifacts/orca-connectivity/${RUN_ID}/logs/host_orca_log_dir_${UTC_TAG}.txt`、`readlink docker/orca/jma-receipt-docker/logs/orca/orca_http.log > artifacts/orca-connectivity/${RUN_ID}/logs/orca_http_symlink_${UTC_TAG}.txt` で tail 元の設定を記録。`allow-other` やパスの齟齬が無いかを即レビュー。
5. **httpdump 保存** — 404/405 を出した API 単位で `artifacts/orca-connectivity/${RUN_ID}/httpdump/<api>/request.http` と `response.http` を作成し、`curl -v` のコマンド全文・ヘッダー・`Allow` を残す。テンプレは §3 を参照。
6. **Slack 報告** — §5 のテンプレに `RUN_ID` と取得ファイルを差し込み、`http_live` / `since` / `extract` / `host/readlink` / `httpdump` の 5 行が揃っているかを送信前にセルフチェックする。

> PDF 化が必要な場合は本節をエクスポートすれば 1 枚で配布できる。RUN_ID 実施後は `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` と `PHASE2_PROGRESS.md` の ORCA セクションへ追記すること。
