# RUN_ID=20251111Tnetdiag3 ホスト↔9080 ネットワーク診断

## 収集物
- pf ルール抜粋: `pf_rules_9080.txt`（該当ルールなし）
- lo0 9080 キャプチャ: `lo0_9080.pcap` / `lo0_9080_readable.txt`
- socat 経路キャプチャ: `lo0_socat_19080.pcap` / `lo0_socat_19080_readable.txt`
- curl ログ: `curl_localhost_9080_ipv4.log`, `curl_localhost_9080_ipv6.log`, `curl_localhost_9080_ipv4_short.log`, `curl_localhost_19080_via_socat.log`
- tcpdump 所見メモ: `tcpdump_notes.txt`
- Docker backend ログ: `docker_backend.log`

## 観測結果
1. **pf ルール**: `pfctl -sr | grep -E '9080|docker|127.0.0.1'` はヒットなし。pf 側で 9080 を遮断しているエントリやアンカーは見当たらず、pf 起因のブロック兆候なし。
2. **ホスト→9080 直接（IPv4/IPv6）**: TCP SYN/SYN-ACK/ACK は双方完了し、curl が送った GET 115 byte は 9080 側で ACK されている。以降 9080 側は 15s 間隔で ACK のみ送付し HTTP payload を返さず、約 2 分後に FIN/RST で切断。アプリ層でレスポンス生成されていないか、ポートフォワード先へ転送されていない。
3. **socat (19080→9080)**: IPv6 (::1) では LISTEN していないため即 RST。IPv4 では 19080 側でも 9080 側でも SYN 完了後にリクエストを書き込めているが、下流 9080 から応答が来ないため、socat 越しでも全く同じタイムアウト症状。従って経路途中でのフィルタリングではなく、9080 以降の応答欠如が原因。
4. **Docker backend ログ**: curl 実行タイミング (2025-11-12 07:56 JST) に `nw_path_libinfo_path_check` 等の情報ログのみで、port-forward エラーや vpnkit の失敗ログは出ていない。

## 想定要因
- **pf ルール**: ブロック証跡なし。pf は原因から除外。
- **Docker port-forward/vpnkit**: 9080 側で SYN を受け ACK まで応答しているが、アプリデータがホストへ戻ってこない。vpnkit の NAT テーブルに該当エントリが無効化されている／後段コンテナへの転送が失敗している可能性が高い。
- **VPN/ローカルフィルタ**: VPN 切断やフィルタ差異を確認できるログや RST はなく、`lo0` 内で完結している。現時点では低優先度。

## 推奨恒久対策
1. **Docker port-forward の再構成**: `docker compose stop helper && docker compose up helper -d` または `com.docker.backend` の再起動で 9080 port-forward を再登録させ、vpnkit の stale entry を消去する。再登録後に `netstat -an | grep 9080` で LISTEN/ESTABLISHED が Docker プロセス (`vpnkit`/`com.docker.backend`) 経由になっているか確認。
2. **pf 例外の予防追加**: 影響が疑われた場合に備え、`/etc/pf.conf` のアンカーへ `pass in on lo0 proto tcp from 127.0.0.1 to any port 9080` など明示的 pass を追加し、`pfctl -f` で読み込み（要 Change 管理）。ただし現状は不要なため優先度低。
3. **VPN/Firewall 切り分け**: VPN クライアントを一時停止し、同じ tcpdump を再取得して差分を確認。VPN でループバック経路に干渉するケースは稀だが、社内セキュリティポリシーに従い念のため判別。
4. **恒久回避運用**: ホスト側アクセス復旧まで helper コンテナ経由 (例: `docker exec helper curl http://localhost:9080/...`) を継続し、重要作業前には 19080 等の代替 LISTEN を常設する場合は IPv6 バインド（`TCP-LISTEN:19080,bind=[::1],fork`）も組み合わせておく。

## 追加メモ
- tcpdump で確認できる通り、パケットは lo0 内で完結しており外部 NIC まで出ていない。
- `curl` の IPv4/IPv6 双方で現れた ACK ストームは 9080 側がアプリ応答を生成していないサイン。アプリ／Docker 両面のログ突合が必要。
- 次アクションとして Docker Desktop の診断（`/Applications/Docker.app/Contents/MacOS/com.docker.diagnose`）で port-forward の状態を取得することを推奨。
