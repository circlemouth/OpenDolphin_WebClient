# Letter/Lab Audit 実装計画（フェーズ4-2）

## 背景
- RUN_ID=`20251111TrestfixZ` の `PUT /odletter/letter` / `GET /lab/module/WEB1001,0,5` は HTTP 200 だが、`artifacts/parity-manual/{letter,lab}/20251111TrestfixZ/logs/{d_audit_event_latest.tsv,jms_dolphinQueue_read-resource*.txt}` が空のまま。
- `LetterServiceBean#saveOrUpdateLetter` は `resolveKarteReference` により FK を解決できるようになったが、監査呼び出しがなく TraceId を残せない。`DocInfoModel.sendClaim=true` 時に JMS も 0L のまま早期 return している。
- `NLabServiceBean#getLaboTest` / `getLaboTestItem` は DTO を返すだけで監査を記録しない。空配列 `[]` を返せるようになったため、resultCount=0 でも Audit/JMS を発生させる設計を確定させる必要がある。

## 修正対象ファイル
1. `server-modernized/src/main/java/open/dolphin/session/LetterServiceBean.java`
2. `server-modernized/src/main/java/open/dolphin/rest/LetterResource.java`
3. `server-modernized/src/main/java/open/dolphin/session/NLabServiceBean.java`
4. `server-modernized/src/main/java/open/dolphin/rest/NLabResource.java`
5. `common/src/main/java/open/dolphin/audit/AuditEventEnvelope.java`（details 追加キーが必要な場合）
6. `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java`（SessionAuditDispatcher 連携）
7. `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`（AuditEventEnvelope 受信時の JMS publish API 追加）
8. 新規 `server-modernized/src/main/java/open/dolphin/security/audit/LetterAuditHelper.java`（仮）と `SessionAuditDispatcher` 実装クラス

## Tx / Audit / JMS 方針
- `LetterServiceBean` / `NLabServiceBean` は `@ApplicationScoped @Transactional @SessionOperation` のため Tx 属性は `REQUIRED`。`AuditTrailService#write` は `@Transactional(REQUIRES_NEW)` なので業務 Tx とは分離される。`SessionAuditDispatcher` を `@Dependent` or `@ApplicationScoped` で用意し、`auditTrailService.write(...)` の戻り `AuditEventEnvelope` を JMS へ委譲。
- Letter: `saveOrUpdateLetter` で `AuditEventEnvelope.builder("LETTER_MUTATION", "LetterServiceBean")` を生成し、`linkId` 有無で `details.mutationType` を `create/update` に振り分け、`model.getLetterType()`・`model.getConsultantHospital()`・`model.getPatientId()` などを格納。`DocInfoModel` を `DocInfoService` もしくは `doc_info_letters` リレーションから取得し、`sendClaim`, `claimDate`, `labtestOrderNumber` を details に載せる。`LetterResource` では `model` に `SessionTraceContext` を紐付け、persist 後に `LetterAuditHelper#recordSendClaim` → `MessagingGateway.dispatchClaim` の順で呼び出し、Audit と JMS の TraceId を共通化。
- Lab: `NLabServiceBean#getLaboTest` / `getLaboTestItem` / `create` / `deleteLabTest` から `writeLabAudit(action, fidPid, resultCount, sampleDateRange)` を呼び出し、`AuditEventEnvelope` を `LAB_RESULT_FETCH` / `LAB_RESULT_CREATE` / `LAB_RESULT_DELETE` として記録。`fidPid` を `facilityId:patientId` に分解し、`details.patientId` / `facilityId` / `laboCenterCode`（複数の場合はカンマ連結）を設定。0件でも `details.resultCount=0` を残し、JMS 側にも `AuditEventEnvelope` を publish。
- JMS: `SessionAuditDispatcher` で `AuditEventEnvelope` を `ObjectMessage`（`MessagingHeaders.PAYLOAD_TYPE=AUDIT` 予定）として `java:/queue/dolphin` へ enqueue。`MessageSender` へ `handleAuditEvent(AuditEventEnvelope envelope)` を追加し、`TRACEID_JMS_RUNBOOK.md` §5.8 の `messages-added>0L` 期待を満たす。Fallback（JMS unavailable）の場合は WARN ログと `details.jmsFallback=true` を追記する。

## テスト計画 / RUN_ID
1. **事前条件**
   - 両 Postgres で `psql -v run_id=<RUN_ID> -f ops/db/local-baseline/reset_d_audit_event_seq.sql` を実行し、`/tmp/d_audit_event_{before_seq_reset,seq_validation,seq_status}_<RUN_ID>.{csv,txt}` を取得して `artifacts/parity-manual/db/<RUN_ID>/` へ保存。
   - `scripts/start_legacy_modernized.sh start --build` → helper コンテナ `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace buildpack-deps:curl bash` を起動し、`BASE_URL_{LEGACY,MODERN}` を `server` / `server-modernized-dev` に設定。
2. **Letter Audit ラン**
   - RUN_ID=`20251115TletterAuditZ1`
   - コマンド: `ops/tools/send_parallel_request.sh --profile compose PUT /odletter/letter rest_error_letter_audit`
   - 期待: `logs/d_audit_event_letter_{legacy,modern}.tsv` に `action=LETTER_MUTATION` / `requestId=parity-letter-<RUN_ID>` が 1 行以上。`logs/jms_dolphinQueue_read-resource{,_legacy}.{before,after}.txt` で Modern `messages-added` が +1、Legacy は 0 と記録。
3. **Lab Audit ラン**
   - RUN_ID=`20251115TlabAuditZ1`
   - コマンド: `ops/tools/send_parallel_request.sh --profile compose GET /lab/module/WEB1001,0,5 rest_error_lab_audit`
   - 期待: Modern `d_audit_event` に `LAB_RESULT_FETCH` が 1 行以上（`details.resultCount>=0`）。JMS before/after で `messages-added` が +1。空配列ケースも `details.resultCount=0` を確認。
4. **証跡保存**
   - `artifacts/parity-manual/letter/20251115TletterAuditZ1/` と `artifacts/parity-manual/lab/20251115TlabAuditZ1/` を新設し、`{legacy,modern}/response.json`、`logs/{send_parallel_request.log,d_audit_event_*.tsv,jms_dolphinQueue_read-resource*.txt}`、`tmp/parity-headers/{letter,lab}_<RUN_ID>.headers` を格納。Run 完了後に `docs/server-modernization/phase2/DOC_STATUS.md` と `TRACEID_JMS_RUNBOOK.md` §5.8 を更新。

## 依存事項 / TODO
- `SessionTraceManager` が `actorId` / `patientId` を属性として保持している前提。`SessionOperationInterceptor` を letter/lab リソースで通過させること（`@SessionOperation` 付与済み）。
- `MessagingGateway` に Audit 用の payload type を追加する際は既存 CLAIM/DIAGNOSIS と衝突しないようヘッダーを拡張する。
- レガシーサーバー側の Audit/JMS は今回のタスク範囲外。Legacy の `d_audit_event` が空でも「許容」条件を Runbook / Checklist に追記する。
- テストが `helper` コンテナ依存である点を `PHASE2_PROGRESS.md` と `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` にも追記し、ホスト → 9080 経路が復旧するまでこのルートを維持する。
