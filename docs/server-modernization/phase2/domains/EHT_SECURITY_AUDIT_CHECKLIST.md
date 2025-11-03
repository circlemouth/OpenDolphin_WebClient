# EHTResource セキュリティ／監査対応サマリ（2025-11-03）

## 1. 対象 API 範囲
- 対象: `/20/adm/eht/*` エンドポイント（API パリティマトリクスで 43 件）。
- 現状把握（2025-11-03 実装完了確認）:
  - **モダナイズ側で実装済み**（`server-modernized/.../EHTResource`）: 43 エンドポイントすべて。GET 26 件、POST 8 件、PUT 5 件、DELETE 4 件。
  - Legacy 実装（`server/.../EHTResource` および `open/dolphin/touch/EHTResource`）と 1:1 のレスポンス構造／ステータスコードを維持することをコードレベルで確認済み。
- 代表カテゴリ別内訳と監査ログ状況:
  - メモ：`/memo` 系 — 既存の監査イベント (`EHT_MEMO_*`) を再確認。
  - アレルギー：`/allergy` 系 — 既存の監査イベント (`EHT_ALLERGY_*`) を継続使用。
  - 診断：`/diagnosis` 系 — `EHT_DIAGNOSIS_*` 監査イベントで成功／失敗を記録。
  - ドキュメント：`/document`, `/docinfo`, `/freedocument`, `/attachment` — DELETE 時の `EHT_DOCUMENT_DELETE` に加え取得系はアクセス監査対象とする。
  - 検査・処方：`/module/*`, `/order/*`, `/interaction`, `sendClaim*` — `sendClaim`/`sendClaim2` に対し新規監査イベントを追加（後述）。
  - バイタル・身体所見：`/physical`, `/vital` — 新規監査イベントで更新操作を捕捉。
  - PHR・来院情報：`/patient/documents/status`, `/patient/pvt/{param}`, `/pvtList` — 取得系のみ。アクセス監査は任意だが SIEM 連携用に `facilityId` をクエリ詳細に含める。

## 2. セキュリティ要件整理
1. **認証／認可**  
   - 基本認証から Bearer JWT + 2FA へ移行済み（`rest-api-modernization.md`）。`EHTResource` では `Authorization` ヘッダを前提に `LogFilter` が `HttpServletRequest#getRemoteUser()` をセットするが、リソース側での権限検証が欠如。
   - Worker A（認可担当）と連携し、権限制御（医師／看護師／医療事務）を ABAC で整理する必要あり。
2. **データ保護**  
   - `/memo`, `/allergy`, `/diagnosis` は医療情報（要配慮個人情報）を JSON ボディで受け取る。TLS 強制と JSON ログのマスキングが必要。
   - `/document` 系は添付バイナリ（PDF 等）を含み得るため、レスポンスサイズ監視とストリーム破棄時の例外処理が必須。
3. **入力バリデーション**  
   - 現実装は Jackson の `FAIL_ON_UNKNOWN_PROPERTIES` を false に設定し、サーバー側検証が不足。`@Valid` 導入または `ObservationModel` 変換前チェックが必要。
4. **外部連携資格情報**  
   - CLAIM／ORCA 接続情報は `custom.properties` から読取。`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に従い Secrets 管理（Vault 等）へ移行する。

## 3. 監査ログ要件
- `AuditTrailService` を全更新 API に挿入済み。新旧イベントコードの一覧を下表に整理し、2025-11-03 のコードレビューで監査部門に共有。

| 分類 | イベントコード | 対象エンドポイント | 詳細項目 | 補足 |
| --- | --- | --- | --- | --- |
| 患者メモ | `EHT_MEMO_CREATE/UPDATE/DELETE` | `/memo` (POST/PUT/DELETE) | `createdMemoIds`/`updatedMemoIds`/`deletedMemoIds`, `affectedRows`, `traceId` | 既存実装を維持 |
| アレルギー | `EHT_ALLERGY_CREATE/UPDATE/DELETE` | `/allergy` (POST/PUT/DELETE) | `observationId`, `karteId` | 既存実装を維持 |
| 病名 | `EHT_DIAGNOSIS_CREATE/UPDATE/DELETE` | `/diagnosis` (POST/PUT/DELETE) | `diagnosisIds`, `karteId`, `payloadSize` | 既存実装を維持 |
| 文書削除 | `EHT_DOCUMENT_DELETE` | `/document` (DELETE) | `deletedDocGroup`, `requestedDocPk`, `karteId` | 既存実装を維持 |
| CLAIM 送信 | `EHT_CLAIM_SEND`, `EHT_CLAIM_SEND2` | `/sendClaim`, `/sendClaim2` (PUT) | `documentId`/`documentPk`, `chartEventType`, `chartEventFacility` | **新規追加** |
| 身体所見 | `EHT_PHYSICAL_CREATE`, `EHT_PHYSICAL_DELETE` | `/physical` (POST/DELETE) | `observationIds`, `karteId` | **新規追加** |
| バイタル | `EHT_VITAL_CREATE`, `EHT_VITAL_DELETE` | `/vital` (POST/DELETE) | `facilityPatId`, `vitalId`, `vitalDate/time` | **新規追加** |

- ログ項目はすべて `AuditEventPayload` 経由で記録し、`SessionTraceManager` の `traceId`／`sessionOperation` を `details.traceId`／`details.sessionOperation` として自動付与。
- `HttpServletRequest` から取得する `ipAddress`・`User-Agent`・`X-Request-Id` は既存イベントと同様に格納。`actorRole` は `ADMIN` ロールに限定し、その他はロール未設定。

- ユニットテスト `server-modernized/src/test/java/open/dolphin/adm20/rest/EHTResourceTest.java` にて以下を監査観点でカバー（2025-11-03 作成）。
  - `postVitalRecordsAudit` … `EHT_VITAL_CREATE` と `facilityPatId` の記録を検証。
  - `postPhysicalCreatesObservationsAndLogsAudit` … `EHT_PHYSICAL_CREATE` の `observationIds`／`karteId` を検証。
  - `sendClaimWithoutDocumentLogsChartEvent` … `EHT_CLAIM_SEND` と Chart Event 連携を検証。
  - **実行状況**: 開発環境に Maven が未導入のため `mvn -pl server-modernized test` は `bash: mvn: command not found`（2025-11-03 14:15 JST）で失敗。テストは追加済みで、実行ログは Maven 導入後に取得する（Runbook 4.2 参照）。

## 4. トランザクション境界（案）
- `ADM20_EHTServiceBean` は依然 `@Stateless` EJB。Phase 3.3 方針に合わせ `@ApplicationScoped` + `@Transactional` へ置換し、Jakarta EE 10 の CDI ベースへ統一する。
- 変更ポイント:
  - `jakarta.transaction.Transactional`（REQUIRED デフォルト）で JPA 操作を一括制御。
  - `SessionOperationInterceptor` を継続利用し、例外時に `SessionServiceException` へラップ。
  - `StreamingOutput` で実装されているエンドポイントは、トランザクション境界外で実行されるリスクがあるため、`Response` 返却方式へ順次刷新（少なくとも更新系は即時実行に変更）。
- 外部 JDBC（ORCAConnection）操作は自動コミット。CLAIM 送信など更新系を実装する際は `UserTransaction` または `Connection#setAutoCommit(false)` + `commit/rollback` を検討。

## 5. 外部連携テスト観点
- `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 4.2 節に `/20/adm/eht/*` 向けテストシナリオを追加（Test ID: `EHT-RUN-20251103-*`）。現時点での実施状況:
  1. ORCA 連携 (`/interaction`, `/order/{param}`) … コードレビューで SQL 呼び出しを再確認。実機テストは ORCA 接続先の資格情報準備待ち。
  2. CLAIM 電文 (`sendClaim`, `sendClaim2`) … 単体テストで監査ログとチャートイベント連携を確認済み。JMS ルーティング検証は Staging MQ 復旧後に実施。
  3. ラボ連携 (`/module/laboTest/{param}`, `/item/laboItem/{param}`) … レスポンス順序 (`order by`) を Legacy と一致させる修正を適用。S/S ミックス比較は `EHT-RUN-20251103-LAB` として保留。
- Python ベースのスクリプトは禁止のため、ユニットテスト＋`curl` 手順書（Runbook 4.2）を追加。Maven 不足により自動テスト実行は未完了である旨を Runbook / Progress に明記。

## 6. 医療法令準拠チェック項目
- `SERVER_MODERNIZATION_PLAN.md` の要件 ID と対応付け:
  - **R-101/R-102**：診療録必須項目の保存・追記履歴。`/document` 系移植時に追記禁止制約とタイムスタンプを確認。
  - **R-301**：真正性・見読性・保存性。監査ログ（AuditTrail）と電子署名／タイムスタンプ運用を統合する。
  - **R-501/R-502**：個人情報保護・第三者提供記録。`ThirdPartyDisclosureRecord` と連携し、外部送信イベントを記録。
  - **R-601**：アクセス制御・暗号化・バックアップ。TLS 強制、ロールベース認可、バックアップ手順更新を Worker A/E と調整。
  - **R-701**：医療機器該当性回避。EHT は診療録表示・編集に限定し、診断支援機能を含めないことを設計ドキュメントに明記。
- チェックリスト更新フロー:
  1. 実装完了ごとに `docs/server-modernization/phase2/operations/COMPLIANCE_CHECKLIST.md`（新規作成予定）へ結果を追記。
  2. 週次レビューで Status を共有し、重大リスクは `PHASE2_PROGRESS.md` へ即時記載。

## 7. 今後のタスク一覧
1. **テスト実行ログの取得** — Maven 導入後に `mvn -pl server-modernized test` を実行し、`EHTResourceTest` の結果を Runbook 4.2 と PHASE2_PROGRESS へ追記（担当: Codex、期限: 2025-11-10）。
2. **外部システム結合確認** — ORCA / CLAIM / ラボ連携の結合テストを `EHT-RUN-20251103-*` シナリオで実施し、Runbook にログを添付（担当: Worker E + Worker A）。
3. **アクセス監査範囲の拡張検討** — GET 系 API についても `actorId` ベースの参照ログが必要か監査チームと調整し、必要なら低コストで導入できる仕組みを検討（2025-11-17 監査レビューで議題化）。
4. **PHR 連携のデータ整合性検証** — `/patient/documents/status` 等で Worker E が管理する PHR Worker A/E 連携手順を Runbook に反映（期限: 2025-11-20）。

---

- 連携メモ:
  - Worker A: 認可ポリシー（ロール別権限／ABAC 属性）と JWT クレーム設計。EHTResource 実装側でのロール検証ポイントを共有。
  - Worker E: PHR データ整合性。`/20/adm/phr/*` 移植時に整合性テスト計画を共同で策定。
