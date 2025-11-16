# 2025-11-16 Trace / Audit Review（RUN_ID=20251116T151200Z）

- 指示: 【ワーカー指示】認証/監査/証跡レビュー（RUN_ID=20251116T151200Z）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`
- 対象ドキュメント / コード: `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md`, `docs/web-client/operations/mac-dev-login.local.md`, `server-modernized/src/main/java/open/dolphin/security/audit/*`, `server-modernized/src/main/java/open/dolphin/msg/gateway/ExternalServiceAuditLogger.java`
- 対象証跡: `artifacts/parity-manual/TRACEID_JMS/{20251116TtracePropagationZ1,20251117TtraceAuditZ1}/`, `artifacts/parity-manual/messaging/20251118TmessagingParityZ2/`, `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` ほか

## 1. Trace Harness / Audit Trail 現状
- `artifacts/parity-manual/TRACEID_JMS/20251116TtracePropagationZ1/logs/jms_dolphinQueue_read-resource.txt` は `messages-added=6L` / `message-count=0L`、`20251117TtraceAuditZ1` は `messages-added=9L` を示し、JMS までは Trace-ID が届いている。
- 同 RUN の `d_audit_event_trace_http_{200,400,401,500}.sql` は 400/401/500 で **0 rows** のまま。`d_audit_event_seq_status.txt` も `min_id=-47` / `max_id=91` / `total=43` から変動なしで、例外経路の監査が記録できていない。
- `TRACE_PROPAGATION_CHECK.md` は RUN_ID=`20251111TclaimfixZ3` 時点の分析で止まっており、11/16-17 の結果（JMS 伸長と `d_audit_event` 未更新）の反映が未実施。Doc STATUS/Runbook 双方で現状を共有する必要がある。

## 2. ExternalServiceAuditLogger の確認
- `MessagingGateway` / `MessageSender`（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`, `server-modernized/src/main/java/open/dolphin/session/MessageSender.java`）が Trace-ID を生成し JMS プロパティ `X-Trace-Id` と `ExternalServiceAuditLogger` へ連携していることをコードレビューで再確認。
- `artifacts/parity-manual/messaging/20251118TmessagingParityZ2/logs/modern_server.log` には `event=CLAIM_REQUEST/CLAIM_SUCCESS/DIAGNOSIS_* traceId=parity-...` の INFO 行が揃っており、監査用 logger `open.dolphin.audit.external` が稼働している。
- ただし `TRACE_PROPAGATION_CHECK.md` と ops ログには ExternalServiceAuditLogger の実測リンクがなく、worker が参照するハブから当該証跡へ辿れない。Spec: `ExternalServiceAuditLogger` 節を Runbook に追記し、`artifacts/parity-manual/messaging/` の参照方法をまとめる必要がある。

## 3. 認証メモ（mac-dev-login.local.md）
- `docs/web-client/operations/mac-dev-login.local.md` は 2025-11-06 時点の `admin2025` / `doctor2025` を案内しつつ「Git へコミットしない」旨を記載している。現在は Git 追跡下にあり、Web クライアントの RUN 手順からも参照されているため、次回更新時に (1) 認証情報のローテーション、(2) 証跡リンク（`artifacts/parity-manual/db-restore/...`）を備考へ記録するタスクを追加する。
- Manager checklist（PHASE2_WEB_CLIENT_EXPERIENCE ほか）には「mac-dev-login 現行チェック」欄があるが、直近 RUN では更新日/証跡の裏付けが欠けていたため、本 RUN で現行確認済みとして DOC_STATUS を更新する。

## 4. Ops ログのガバナンス確認
- `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` は単一ファイル内に複数 RUN_ID を列挙しているが、各節で `RUN_ID`, 操作時刻, 証跡フォルダへのフルパスを明記しており、Phase2 ガバナンスに沿っていた。
- `20251116T170500Z-{coverage,orca-medical,orca-wrapper,orca-ui-sync}.md` も参照チェーン / RUN_ID / 更新対象ドキュメントを嵌め込み済み。Trace/Audit 周りのログだけが 11/11 以降更新されていなかったため、本ログでギャップを補完する。

## 5. TODO / 推奨アクション
1. `TRACE_PROPAGATION_CHECK.md` §7 へ `RUN_ID={20251116TtracePropagationZ1,20251117TtraceAuditZ1}` の結果（JMS 進捗 / `d_audit_event` 未更新 / 401-500 未達）を記載し、ブロッカー一覧を刷新する。
2. `SessionAuditDispatcher`→`AuditTrailService` の経路で 4xx/5xx 例外時にも `AuditEventPayload` が生成されるよう、`LogFilter` unauthorized 経路の payload を `status=failed` + `traceId` 付きで SQL に反映する（コード改修は別 RUN で実施）。
3. `docs/web-client/operations/mac-dev-login.local.md` を 2025-11-16 付けで棚卸しし、次回 RUN で資格情報更新と証跡リンク付与を行う。
