# Network Recovery Evidence Template

## 1. 利用フロー
1. `RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)_netrecover` のように UTC で一意な ID を決める。
2. `cp -R artifacts/parity-manual/network/TEMPLATE artifacts/parity-manual/network/${RUN_ID}` でテンプレートを複製する。
3. 以降のコマンドは `LOG_ROOT=artifacts/parity-manual/network/${RUN_ID}` を前提に実行し、pfctl/curl/tcpdump/docker logs の証跡を各ファイルへ追記する。
4. 証跡採取後は `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` §9 のチェックリスト、および `docs/web-client/planning/phase2/DOC_STATUS.md` のネットワーク復旧行を更新する。

## 2. 個別ファイルの記入方法

### 2.1 `docker_backend_portforward.log`（docker logs / port-forward 再生成）
- **コマンド**: `docker compose --profile helper port backend 9080 | tee ${LOG_ROOT}/docker_backend_portforward.log`
- **追記**: port-forward 実行後すぐに `docker compose logs --tail 200 backend server-modernized-dev 2>&1 >> ${LOG_ROOT}/docker_backend_portforward.log` を実行し、docker logs の抜粋をまとめて保存する。
- **記入例**:
  ```text
  2025-11-12T05:12:03Z host=macmini1 helper backend -> 0.0.0.0:9080
  2025-11-12T05:12:05Z docker compose logs --tail 50 backend
  backend  | 2025-11-12T05:11:58.412Z INFO  Started ProtocolHandler [http-nio-8080]
  backend  | 2025-11-12T05:12:01.933Z WARN  Connection reset by peer (helper port refresh)
  ```

### 2.2 `host_curl_9080.log`（curl）
- **コマンド**: `curl -v http://localhost:9080/healthz --max-time 10 2>&1 | tee ${LOG_ROOT}/host_curl_9080.log`
- **追記**: HTTP ステータス・レスポンスサマリ・VPN 状態（例: "VPN=On"）を先頭コメントへ書き、curl エラー時は `--trace-ascii` で再取得する。
- **記入例**:
  ```text
  # 2025-11-12T05:14:22Z status=200 VPN=Off
  * Connected to localhost (127.0.0.1) port 9080 (#0)
  > GET /healthz HTTP/1.1
  < HTTP/1.1 200 OK
  < X-Upstream: server-modernized-dev:8080
  ```

### 2.3 `pf_rules_9080.txt`（pfctl）
- **コマンド**: `sudo pfctl -sr | grep -E "9080|vpnkit" | tee ${LOG_ROOT}/pf_rules_9080.txt`
- **追記**: ルールを取得した直前に実施した操作（Docker restart/pf reload など）とホスト名を先頭行へ記録する。
- **記入例**:
  ```text
  # 2025-11-12T05:16:03Z host=macmini1 action=pfctl -f /etc/pf.conf (no edits)
  pass in  on lo0 proto tcp from 127.0.0.1 to any port = 9080 flags S/SA keep state
  pass out on lo0 proto tcp from 127.0.0.1 to any port = 9080 flags S/SA keep state
  ```

### 2.4 `lo0_9080.pcap`（tcpdump）
- **コマンド**: `sudo tcpdump -i lo0 port 9080 -w ${LOG_ROOT}/lo0_9080.pcap -U -G 10 -W 1`
- **追記**: 収集後に `tcpdump -nn -tttt -r ${LOG_ROOT}/lo0_9080.pcap | head -n 5 > ${LOG_ROOT}/lo0_9080.pcap.sample.txt` を作成し、HTTP ステータスの有無を README または `host_curl_9080.log` へメモする。
- **記入例**（sample から抜粋）:
  ```text
  2025-11-12 05:17:45.123456 IP6 ::1.59432 > ::1.9080: Flags [S], seq 781236459, win 65535
  2025-11-12 05:17:45.125678 IP6 ::1.9080 > ::1.59432: Flags [S.], ack 781236460
  2025-11-12 05:17:45.130011 IP6 ::1.59432 > ::1.9080: Flags [P.], GET /healthz HTTP/1.1
  ```

## 3. 後処理
- 4 ファイルが揃ったら `tree ${LOG_ROOT}` とハッシュ (`shasum lo0_9080.pcap`) を `README.txt` 末尾に追記し、Runbook §9 の「テンプレ適用チェックリスト」を参照して DOC_STATUS を Active に更新する。
- 必要に応じて `artifacts/parity-manual/network/${RUN_ID}/` 全体を gzip してチケットへ添付する。
