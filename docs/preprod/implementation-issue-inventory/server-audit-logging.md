# server-modernized 監査ログ/トレーサビリティ 棚卸し

- RUN_ID: 20260122T195143Z
- 実施日: 2026-01-22
- 対象: server-modernized（`server-modernized/src/main/java`）
- 目的: 監査ログの網羅性と trace/runId 連携の不足を可視化し、監査検索の弱点を整理する。
- 参照: `docs/DEVELOPMENT_STATUS.md`, `docs/server-modernization/server-modernized-code-review-20260117.md`, `docs/web-client/architecture/web-client-api-mapping.md`
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照ドキュメント
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
- `docs/server-modernization/server-modernized-code-review-20260117.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java`
- `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`
- `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java`
- `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/OutpatientFlagResponse.java`
- `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.txt`
- `artifacts/api-architecture-consolidation/20260117T220347Z/claim-outpatient.json`
- `artifacts/orca-connectivity/20260105T215636Z/audit/d_audit_event_claim_deprecation.tsv`

## 1. 現状の対応範囲（確認済み）

### 1-1. ORCA系 API の監査メタ（runId/traceId 等）
- `/orca/claim/outpatient` / `/orca/appointments/list` / `/orca21/medicalmodv2/outpatient` で `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/recordsReturned` が `details` に載る。
- `OutpatientFlagResponse.AuditEvent` をレスポンスに同梱し、`traceId/requestId` を UI 側へ返却。

### 1-2. SessionAuditDispatcher での監査送出
- ORCA系は `SessionAuditDispatcher` 経由で JMS + DB の二重経路で監査イベントを保存。
- `details` から `facilityId` / `operation` を抽出し、監査イベントの top-level に反映する設計。

### 1-3. 監査改ざん検知（ハッシュチェーン）
- `AuditTrailService` が `payloadHash` / `previousHash` / `eventHash` を付与し、改ざん検知可能な形で保存する。

## 2. 監査ログのギャップ一覧（優先度付き）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 区分 | 対象 | 現状 | 差分/課題 | 影響 | 根拠（ファイル/コンポーネント） | 優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AL-01 | schema不統一 | 監査イベント schema | `AuditEventPayload` と `OutpatientFlagResponse.AuditEvent` が別設計。`runId` や `screen/action` が top-level で共通化されていない。 | 監査検索で `runId` や UI 操作単位のフィルタが payload 依存になる。API/UI と DB の突合が手作業化。 | 監査検索が弱く、障害時の根因調査に時間がかかる。 | `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java#L10-L22`（payloadにrunId/screen無し）, `server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/OutpatientFlagResponse.java#L105-L113`（レスポンス側AuditEvent別定義） | P1 |
| AL-02 | trace/runId 連携不足 | ORCA以外の監査イベント | ORCA系は `runId` を `details` に入れるが、EHT/ADM 系は `details` に `runId` が無く、`traceId` も SessionTraceContext 依存。 | `runId` での横断トレースができず、画面操作（UI runId）との関連付けができない。 | 「画面操作→API→監査」の追跡が分断される。 | `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java#L1640-L1684`（detailsにtraceId/sessionOperationのみ、runId無し）, `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java#L51-L137`（ORCA系はrunId/traceIdを取り扱い） | P1 |
| AL-03 | action名の不一致 | `/orca12/patientmodv2/outpatient` | Webクライアント側は `ORCA_PATIENT_MUTATION` を前提に監査設計しているが、server 側は `PATIENTMODV2_OUTPATIENT_MUTATE` を使用。 | 監査ログ検索/ダッシュボードで action が分断され、UI 操作とサーバ監査が一致しない。 | 監査イベントの集計が欠落/二重化し、運用時の検索性が低下。 | `docs/web-client/architecture/web-client-api-mapping.md`（ORCA_PATIENT_MUTATION前提）, `server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java#L148-L169`（action=PATIENTMODV2_OUTPATIENT_MUTATE） | P2 |
| AL-04 | screen/operation紐付け不足 | 監査イベント共通 | `operation` は `details` に入る場合のみ top-level へ昇格され、`screen`/`uiAction` は schema 自体に存在しない。 | 監査イベントを「どの画面/操作から発火したか」で検索できない。 | 監査検索・運用監視で UI 操作粒度の追跡が困難。 | `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java#L10-L22`（screen/uiAction無し）, `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java#L88-L110`（facility/operationのみ昇格） | P2 |
| AL-05 | 送出経路のばらつき | ADM/EHT 系の監査 | 一部は `AuditTrailService` 直呼び、ORCA系は `SessionAuditDispatcher`。JMS 送信/traceId付与の扱いが統一されない。 | 監査ログの取得経路が画面/機能で分断され、外部監視（JMS）への可観測性が不足する。 | 監査の集約・ストリーミングが不完全になり、統合監視が困難。 | `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java#L1640-L1668`（AuditTrailService直呼び）, `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java#L41-L86`（JMS送出経路） | P2 |
| AL-06 | outcome整合 | `/orca/claim/outpatient` ほか | 監査イベントの `outcome` は固定で `SUCCESS` を返却しており、`details.outcome=MISSING` との整合が取れていない。 | `MISSING`/`BLOCKED` を運用上検知できず、監査が「成功扱い」に偏る。 | 重要な業務不整合が監査検索で捕捉できない。 | `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java#L127-L134`（detailsはMISSING/ SUCCESSだがauditEventはSUCCESS固定） | P1 |

## 3. 監査検索の弱点まとめ
- `runId` が top-level に無いため、DB 監査ログの検索は `payload` の JSON 文字列検索に依存しやすい。
- `screen/action` のキーが schema に存在せず、UI 操作と監査ログの紐付けは `details` の自由記述頼み。
- `action` 名の揺れにより、監査集計のレポート・可視化で「同一操作の集計漏れ」が発生する。

## 4. 監査ログ検索観点（具体手順 + 詰まりやすい点）
- runId での追跡: `d_audit_event.payload` の JSON 文字列検索が必須。
  手順例: `payload` に `"runId":"<RUN_ID>"` が含まれる行を抽出する。
  詰まりポイント: `runId` が top-level に無いため、索引が効かず高コスト。
- traceId / requestId での連鎖確認: `d_audit_event.trace_id` / `request_id` で抽出。
  手順例: `trace_id='<TRACE_ID>'` で直近監査を抽出する。
  詰まりポイント: traceId は取得できるが UI の runId と直接紐付かない（AL-02）。
- operation での操作分類: `details.operation` がある場合のみ top-level に昇格。
  手順例: top-level `operation` が null の場合は `payload` 内の `operation` を抽出する。
  詰まりポイント: `operation` が payload に入っていない操作は分類不能（AL-04）。
- outcome での異常検知: `details.outcome` と top-level `outcome` の整合を確認。
  手順例: `payload` に `"outcome":"MISSING"` を含む行を抽出し、同一行の top-level `outcome` と比較する。
  詰まりポイント: `auditEvent.outcome` が固定 SUCCESS の API がある（AL-06）。

## 5. 監査ログ出力経路の差分（統合表）

| 観点 | SessionAuditDispatcher | AuditTrailService（直呼び） | 影響/注意点 | 根拠 |
| --- | --- | --- | --- | --- |
| 送出先 | DB + JMS | DBのみ | JMS 기반の外部監視に差異が出る（AL-05）。 | `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java#L41-L86`, `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java#L43-L92` |
| traceId 付与 | payload/envelopeから補完 | payloadからのみ | UI traceId と合流しやすいのは前者。 | `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java#L88-L110` |
| runId 付与 | details 依存 | details 依存 | どちらも top-level に runId を持たない（AL-01/02）。 | `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java#L10-L22` |
| payload上位フィールド | facilityId/operation を昇格 | 昇格なし | 検索性に差が出る（AL-04/05）。 | `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java#L105-L109` |
| 主な対象 | ORCA系 REST | ADM/EHT 系 | 経路差分が監査の分断要因。 | `server-modernized/src/main/java/open/dolphin/orca/rest/*`, `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java#L1640-L1668` |

## 6. 実測証跡（最小抜粋）

### 6-1. JMS 送出の証跡（AL-05 / AL-06）
出典: `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.txt`
```
07:14:22,105 INFO  [open.dolphin.session.MessageSender] ... Audit envelope drained from JMS queue [traceId=trace-patients-20260117T220347Z, action=PATIENT_OUTPATIENT_FETCH, resource=/openDolphin/resources/orca/patients/local-search, outcome=SUCCESS]
07:14:22,168 INFO  [open.dolphin.session.MessageSender] ... Audit envelope drained from JMS queue [traceId=trace-claim-20260117T220347Z, action=ORCA_CLAIM_OUTPATIENT, resource=/openDolphin/resources/orca/claim/outpatient/information, outcome=SUCCESS]
```
- AL-05 裏付け: ORCA系は JMS 経由で監査イベントが送出されている。
- AL-06 裏付け: ORCA_CLAIM_OUTPATIENT が outcome=SUCCESS で送出されている（details 側は 6-3 の payload で確認）。

### 6-2. DB 監査テーブル抜粋（AL-02）
出典: `artifacts/orca-connectivity/20260105T215636Z/audit/d_audit_event_claim_deprecation.tsv`
```
event_time	action	request_id	trace_id	actor_id	actor_role	patient_id	resource	ip_address
2026-01-06 07:04:30.325816+09	ORCA_PATIENT_MUTATION	orca-claim-deprecation-20260105T215636Z-patient_mutation	orca-claim-deprecation-20260105T215636Z-patient_mutation	LOCAL.FACILITY.0001:dolphin			/openDolphin/resources/orca/patient/mutation	178.128.69.202
```
- AL-02 裏付け: runId が top-level 列として存在せず、payload 依存でしか検索できないことが分かる。

### 6-3. 監査イベント payload JSON 抜粋（AL-06）
出典: `artifacts/api-architecture-consolidation/20260117T220347Z/claim-outpatient.json`
```
"auditEvent":{"action":"ORCA_CLAIM_OUTPATIENT","resource":"/openDolphin/resources/orca/claim/outpatient/information","outcome":"SUCCESS","details":{...,"outcome":"MISSING",...},"traceId":"trace-claim-20260117T220347Z","requestId":"req-claim-20260117T220347Z"}
```
- AL-06 実測裏付け: 監査イベントの `outcome=SUCCESS` に対して `details.outcome=MISSING` が同一 payload 内で併存している。

## 7. 確認ポイント一覧（軽量）
- AL-01: `AuditEventPayload` に `runId/screen/uiAction` が存在しないことを確認（payloadのフィールド一覧を確認）。
- AL-02: EHT系の監査 `details` に `runId` が入らないこと、ORCA系は `details.runId` があることを確認。
- AL-03: `/orca12/patientmodv2/outpatient` の監査 action が `PATIENTMODV2_OUTPATIENT_MUTATE` で固定されていることを確認。
- AL-04: `SessionAuditDispatcher` が `facilityId/operation` 以外を top-level に昇格しないことを確認（`screen/uiAction` 不在）。
- AL-05: EHT系が `AuditTrailService.record` を直接呼び、JMS送信が走らない経路であることを確認。
- AL-06: `details.outcome=MISSING` の場合でも `auditEvent.outcome=SUCCESS` になる箇所を確認。

## 8. 次アクション案（ドラフト）
- AL-01/02: `AuditEventPayload` に `runId/screen/uiAction` を追加し、`details` からの抽出で top-level を標準化。
- AL-03: `PATIENTMODV2_OUTPATIENT_MUTATE` → `ORCA_PATIENT_MUTATION` など、action 命名を API マッピング側へ揃える。
- AL-05: `AuditTrailService` 直呼び箇所を `SessionAuditDispatcher` 経由へ統一し、JMS 送出と traceId 付与を揃える。
- AL-06: `outcome` を `SUCCESS/MISSING/BLOCKED/ERROR` など UI 側の設計と一致させ、検索軸として活用する。
