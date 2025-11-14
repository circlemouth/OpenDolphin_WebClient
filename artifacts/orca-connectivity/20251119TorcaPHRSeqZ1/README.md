# RUN_ID=20251119TorcaPHRSeqZ1 概要
- 2025-11-14 失敗 Evidence を `backup/20251119TorcaPHRSeqZ1_20251114_failed/` へ退避し、テンプレート（template-next-run + PHR テンプレ）を再展開（2025-11-14 再実施開始）。
- Secrets 再承認済み構成 + 最新 PKCS#12 パスフレーズで Phase-C/D/E（PHR-06/07/11）を再測。結果は ORCA 側 API 未開放により `405/404` で停止したが、PKCS#12 エラーは解消し実測証跡を `httpdump/trace/screenshots/` へ更新。
- Modernized server（`docker-compose.modernized.dev.yml`）を起動し `serverinfo/claim_conn.json` と `wildfly/phr_20251119TorcaPHRSeqZ1.log` を採取済。監査 SQL は `audit/sql/PHR_*.sql` を参照。
