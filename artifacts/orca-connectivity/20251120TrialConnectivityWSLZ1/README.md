# RUN_ID=20251120TrialConnectivityWSLZ1 接続証跡

> trialsite Snapshot Summary（`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`、stat: **2025-11-15 08:24:06 JST**）には「`https://weborca-trial.orca.med.or.jp/` / `trial` / `weborcatrial`」「新規登録／更新／削除 OK（トライアル環境でのみ）」「登録情報は誰でも閲覧でき定期的にリセットされる」「お使いいただけない機能一覧は `#limit` を参照」と記載されている。本 RUN では同記載を README/log へ引用し、公開環境で実データを扱わないよう注意喚起している。

## 実行環境
- 実行端末: WSL2 Ubuntu 24.04.3 LTS (`/etc/os-release`)
- ネットワーク設定: `/etc/resolv.conf` は generateResolvConf=true の既定値で自動生成され、Nameserver は `10.255.255.254`。
- いずれのコマンドも proxy 無しで直接インターネットへ到達。

## 実行コマンドと証跡
1. **nslookup weborca-trial.orca.med.or.jp**（2025-11-15 08:52:40 JST、再取得 13:10:52 / 14:37:34 JST）
   - ファイル: `dns/nslookup.txt`（初回）、`dns/nslookup_2025-11-15T131052+0900.txt`（再取得1）、`dns/nslookup_2025-11-15T14:37:34+09:00.txt`（再取得2）
   - 結果: `weborca-trial1.japaneast.cloudapp.azure.com` → `172.192.77.103` を返答。Nameserver は `10.255.255.254`。
2. **openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp**（2025-11-15 08:52:44 JST、再取得 13:11:03 / 14:37:39 JST）
   - ファイル: `tls/openssl_s_client.txt`, `tls/openssl_s_client_2025-11-15T131103+0900.txt`, `tls/openssl_s_client_2025-11-15T14:37:39+09:00.txt`
   - 結果: TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384、証明書 `*.orca.med.or.jp`（Sectigo）を検証し `Verification: OK`。
3. **curl -vv -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/acceptlstv2**（2025-11-15 08:52:49 JST、13:11:10 JST）
   - ファイル: `crud/acceptlstv2/curl.log`, `crud/acceptlstv2/curl_2025-11-15T131110+0900.log`, `crud/acceptlstv2/payload.acceptlst_connectivity.json`
   - 結果: いずれも HTTP 200 (`Server: nginx/1.18.0`) / `Api_Result=91「処理区分未設定」`。処理区分パラメータ無し payload でも通信路・Basic 認証が健全であることを確認。
4. **curl -vv -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseA**（2025-11-15 08:52:52 JST、13:11:22 JST）
   - ファイル: `crud/phr_phase_a/curl.log`, `crud/phr_phase_a/curl_2025-11-15T131122+0900.log`
   - 結果: HTTP 404 / `{"Code":404,"Message":"code=404, message=Not Found"}`。`trialsite` の機能一覧に PHR API の記載は無いが、現状は公開されていないため Blocker として Runbook/ログへ記録。

## 証跡ディレクトリ構成
- `dns/`：DNS 解決ログ（初回＋再取得）
- `tls/`：OpenSSL TLS チェックログ（初回＋再取得）
- `crud/acceptlstv2/`：受付一覧 POST（2 回分）および payload
- `crud/phr_phase_a/`：/20/adm/phr/phaseA GET（2 回分）

## 補足メモ
- すべての curl は `-vv` + `tee` でヘッダー/ボディ/証明書情報を同一ファイルに保存し、`trial/weborcatrial` Basic 認証で実行。
- `trialsite` 由来の注意喚起（実データ禁止・リセットあり）は `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と本 README 両方に明記。
- 404 応答は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` のテンプレに従い Blocker として扱い、PHR CRUD Run へ引き継ぎ済み。
