# RUN_ID=20251111Tnetdiag3 ネットワーク診断ログ一覧

- 収集日時 (JST): 2025-11-12 07:48〜07:57
- 目的: ホスト→Docker port-forward (localhost:9080) が握手後も応答しない事象の調査。再ビルドは行わず、helper/socat 経由アクセスと pf/vpnkit の状態を可視化。
- 参照: `analysis.md`（診断所見要約）、`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md §8/§9`（本 README からリンク）

## ファイル別サマリ
| ファイル | 取得方法 | 取得時刻 (JST) | 所見 |
| --- | --- | --- | --- |
| `analysis.md` | `vim` で RUN_ID サマリを記述 | 07:57 | pf での阻害要素なし、vpnkit port-forward が応答を返せていない仮説、helper 継続運用推奨を整理。 |
| `pf_rules_9080.txt` | `sudo pfctl -sr | rg -E '9080|docker|127.0.0.1'` | 07:48 | `[matchなし]` の通り、9080 を遮断する pf エントリ無し。 |
| `lo0_9080.pcap` | `sudo tcpdump -i lo0 port 9080 -vv -w lo0_9080.pcap` | 07:49:39〜07:51:38 | SYN/ACK 完了後に GET 115 byte を送出するが、以降 ACK のみで HTTP payload 不在。 |
| `lo0_9080_readable.txt` | `tcpdump -tttt -nn -r lo0_9080.pcap > ...` | 07:49:39〜07:51:38 | パケットタイムラインを可読化。15s 間隔の ACK 継続と FIN/RST での切断を確認。 |
| `tcpdump_9080_stdout.log` | 上記 tcpdump の標準出力 | 07:49:39〜07:51:38 | キャプチャ件数 33 / フィルタ受信 590。ドロップ 0。 |
| `curl_localhost_9080_ipv4.log` | `curl -v http://localhost:9080/openDolphin/resources/serverinfo/jamri` | 07:49:39〜07:51:39 | 120 秒待機しても 0 byte 受信。握手成功後に応答ゼロ。 |
| `curl_localhost_9080_ipv4_short.log` | `curl -v --max-time 20 ...` | 07:52 | 20 秒で `Operation timed out`。長時間待機と同じ症状を短時間で再現。 |
| `curl_localhost_9080_ipv6.log` | `curl -6 -v http://localhost:9080/...` | 07:52:10〜07:52:40 | ::1 でも握手後に 30 秒でタイムアウト。IPv6/IPv4 どちらも無応答。 |
| `lo0_socat_19080.pcap` | `sudo tcpdump -i lo0 port 19080 -vv -w lo0_socat_19080.pcap` | 07:53:15〜07:54:20 | IPv6 (::1) は即 RST。IPv4 では 19080→9080 へリクエスト可だが応答なし。 |
| `lo0_socat_19080_readable.txt` | `tcpdump -tttt -nn -r lo0_socat_19080.pcap > ...` | 07:53:15〜07:54:20 | socat 経路でも ACK のみで payload 無し。socat では問題回避できないと確認。 |
| `tcpdump_socat_stdout.log` | 上記 tcpdump の標準出力 | 07:53:15〜07:54:20 | パケット 38 件 / フィルタ受信 553。ドロップ 0。 |
| `curl_localhost_19080_via_socat.log` | `curl -v http://localhost:19080/openDolphin/resources/serverinfo/jamri` (socat: `TCP-LISTEN:19080,fork TCP:localhost:9080`) | 07:53〜07:55 | ::1 接続は即拒否、IPv4 は 120 秒待機でレスポンスなし。helper 経由でも未復旧。 |
| `socat_pid.txt` | `pgrep -x socat > socat_pid.txt` | 07:53 | helper port-forward 用に起動した `socat` の PID=59517 を記録。 |
| `docker_backend.log` | `log show --style syslog --process com.docker.backend --last 10m` | 07:55〜07:56 | `nw_path_libinfo_path_check` など情報ログのみ。vpnkit のエラーイベントは記録されず。 |
| `tcpdump_notes.txt` | キャプチャ後に `vim` でメモ | 07:56 | IPv4/IPv6/socat それぞれのタイムラインと推定原因（port-forward 停滞）を文字化。 |

## 所見と次アクション（2025-11-12 時点）
- pf では 9080 に関する deny/anchor が無いため、通信断は Docker port-forward/vpnkit 再生成で解消する見込み。
- 恒久対策（Docker Desktop 再起動 → port-forward 再登録、pf pass の予防追記、VPN 停止検証）はマネージャー作業。手順は Runbook §9 に集約。
- 恒久対策完了までは `docker run --network legacy-vs-modern_default buildpack-deps:curl ...` 等の helper 経由アクセス、または `socat TCP-LISTEN:19080,fork TCP:localhost:9080` を必須とする。
