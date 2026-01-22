# server-modernized 監査ログ/トレーサビリティ 棚卸し

- RUN_ID: 20260122T184457Z
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
| AL-01 | schema不統一 | 監査イベント schema | `AuditEventPayload` と `OutpatientFlagResponse.AuditEvent` が別設計。`runId` や `screen/action` が top-level で共通化されていない。 | 監査検索で `runId` や UI 操作単位のフィルタが payload 依存になる。API/UI と DB の突合が手作業化。 | 監査検索が弱く、障害時の根因調査に時間がかかる。 | `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java`, `server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/OutpatientFlagResponse.java` | P1 |
| AL-02 | trace/runId 連携不足 | ORCA以外の監査イベント | ORCA系は `runId` を `details` に入れるが、EHT/ADM 系は `details` に `runId` が無く、`traceId` も SessionTraceContext 依存。 | `runId` での横断トレースができず、画面操作（UI runId）との関連付けができない。 | 「画面操作→API→監査」の追跡が分断される。 | `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`, `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java` | P1 |
| AL-03 | action名の不一致 | `/orca12/patientmodv2/outpatient` | Webクライアント側は `ORCA_PATIENT_MUTATION` を前提に監査設計しているが、server 側は `PATIENTMODV2_OUTPATIENT_MUTATE` を使用。 | 監査ログ検索/ダッシュボードで action が分断され、UI 操作とサーバ監査が一致しない。 | 監査イベントの集計が欠落/二重化し、運用時の検索性が低下。 | `docs/web-client/architecture/web-client-api-mapping.md`, `server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java` | P2 |
| AL-04 | screen/operation紐付け不足 | 監査イベント共通 | `operation` は `details` に入る場合のみ top-level へ昇格され、`screen`/`uiAction` は schema 自体に存在しない。 | 監査イベントを「どの画面/操作から発火したか」で検索できない。 | 監査検索・運用監視で UI 操作粒度の追跡が困難。 | `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`, `server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java` | P2 |
| AL-05 | 送出経路のばらつき | ADM/EHT 系の監査 | 一部は `AuditTrailService` 直呼び、ORCA系は `SessionAuditDispatcher`。JMS 送信/traceId付与の扱いが統一されない。 | 監査ログの取得経路が画面/機能で分断され、外部監視（JMS）への可観測性が不足する。 | 監査の集約・ストリーミングが不完全になり、統合監視が困難。 | `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java`, `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`, `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java` | P2 |
| AL-06 | outcome整合 | `/orca/claim/outpatient` ほか | 監査イベントの `outcome` は固定で `SUCCESS` を返却しており、`details.outcome=MISSING` との整合が取れていない。 | `MISSING`/`BLOCKED` を運用上検知できず、監査が「成功扱い」に偏る。 | 重要な業務不整合が監査検索で捕捉できない。 | `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java`, `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md` | P1 |

## 3. 監査検索の弱点まとめ
- `runId` が top-level に無いため、DB 監査ログの検索は `payload` の JSON 文字列検索に依存しやすい。
- `screen/action` のキーが schema に存在せず、UI 操作と監査ログの紐付けは `details` の自由記述頼み。
- `action` 名の揺れにより、監査集計のレポート・可視化で「同一操作の集計漏れ」が発生する。

## 4. 次アクション案（ドラフト）
- AL-01/02: `AuditEventPayload` に `runId/screen/uiAction` を追加し、`details` からの抽出で top-level を標準化。
- AL-03: `PATIENTMODV2_OUTPATIENT_MUTATE` → `ORCA_PATIENT_MUTATION` など、action 命名を API マッピング側へ揃える。
- AL-05: `AuditTrailService` 直呼び箇所を `SessionAuditDispatcher` 経由へ統一し、JMS 送出と traceId 付与を揃える。
- AL-06: `outcome` を `SUCCESS/MISSING/BLOCKED/ERROR` など UI 側の設計と一致させ、検索軸として活用する。
