# Trace / LogFilter Update（RUN_ID=20251116T210500Z-C）

- 対象: `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` §7、`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## 1. Runbook 更新
- §7 を「Trace Harness 再取得ログ（401/500 監査フォロー）」へ再構成し、`TRACEID_JMS/{20251116TtracePropagationZ1,20251117TtraceAuditZ1}` および `operations/logs/20251116T210500Z-C-jms-probe.md` の結果を整理。
- 401/500 ケースの監査欠落をブロッカーとして明示し、JMS `messages-added`=6→9 / `message-count`=0 / `d_audit_event`=43 停滞を表に追記。

## 2. 実装差分
- `LogFilter` に `REST_ERROR_RESPONSE` 監査を追加し、`chain.doFilter` 後または例外発生時に 4xx/5xx 応答を `SessionAuditDispatcher` へ送るよう対応。
- 未認証ガード `recordUnauthorizedAudit` では二重記録を避けるため `ERROR_AUDIT_RECORDED` 属性を設定。
- 例外情報（クラス・メッセージ）、`httpStatus`、`facilityId` を `AuditEventPayload.details` へ収集。
- 変更ファイル: `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`

## 3. 次アクション
1. `ops/tools/send_parallel_request.sh --profile compose trace_http_{400,401,500}` を再取得し、`d_audit_event` に `REST_ERROR_RESPONSE` 行が追加されるかを確認。 
2. `TRACE_PROPAGATION_CHECK.md` §7 の表を更新し、監査行が作成された RUN を記録。
3. `MessagingGateway` の JMS property 名修正後、`ops/tools/jms-probe.sh` を再走させて Audit/JMS 両経路で Trace-ID が揃うことを証跡化する。
