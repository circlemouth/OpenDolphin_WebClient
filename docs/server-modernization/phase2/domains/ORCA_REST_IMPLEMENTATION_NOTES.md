# Phase2 Sprint2 ORCA REST 実装メモ

## 1. スコープ整理
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` と `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` に基づき、Phase2 Sprint2 では **ORCA-REST-01**（Matrix No.6/15/16/18）と **ORCA-REST-02**（Matrix No.8/9/10/14/17/35）を同スプリントで仕上げる。参照チケットは [`SERVER_MODERNIZATION_PLAN.md` Phase2 Backlog](../../web-client/architecture/SERVER_MODERNIZATION_PLAN.md#phase-2-backlog-orca-rest-%E3%83%A9%E3%83%83%E3%83%91%E3%83%BC)。
- ORCA-REST-01 に含める API: `appointlstv2`, `appointlst2v2`, `acsimulatev2`, `visitptlstv2`。Web クライアントからの予約・請求試算・来院一覧要求を ORCA へ委譲しつつ、`AppoServiceBean` / `PVTServiceBean` / `ClaimSender` の監査とキャッシュ更新を維持する。
- ORCA-REST-02 に含める API: `patientlst1/2/3v2`, `patientmodv2`, `patientlst6v2`, `subjectivesv2`。患者同期と保険組合せ取得・症状詳記登録を `PatientServiceBean` / `HealthInsuranceModel` / `ChartEventServiceBean` に連携する。

## 2. 既存コードレビュー結果
### OrcaResource / OrcaApi / OrcaConnect
- `open/orca/rest/OrcaResource` は GET ベースのマスタ取得 API しか提供しておらず、`POST` ハンドラや JSON DTO が未整備。`@Singleton` で `ObjectMapper` 初期化や `AuditTrailService` 連携も欠落しているため、REST ラッパー追加時は `AbstractResource` 相当のエラーレスポンスと `X-Trace-Id` 連携を新設する必要がある。
- `open.dolphin.common.OrcaApi/OrcaConnect` には `appointlst`, `appointlst2`, `diseaseget`, `acceptlst` などのヘルパーは存在するが、`patientlst1/2/3`, `patientlst6`, `acsimulate`, `subjectives` などのメソッドは未定義。XML テンプレを `assets/orca-api-requests` から移植し、Shift_JIS のまま `OrcaApi#orcaSendRecv` に渡す新メソッドを追加する。

### PatientServiceBean
- 施設内検索 (`getPatientsByName/Kana/Digit`) と `HealthInsuranceModel` の差分更新、`ChartEventServiceBean` 連携が実装済み。バッチ同期に必要なインターフェース（例: ORCA から受け取った `PatientModel` DTO を upsert する `mergeOrcaPatient`）が無いので、`patientId` 主キーでの upsert・保険配列再構築・`appMemo` 更新・`ChartEvent` の発火を追加予定。

### AppoServiceBean / PVTServiceBean
- `AppoServiceBean` は PUT `/appo` 経由で `AppointmentModel` を永続化し、監査イベント `APPOINTMENT_MUTATION` を発火する。ORCA ラッパーでは ORCA 応答を単純に返すだけでなく、`putAppointments` を呼んで来院予定のキャッシュ同期を図る。
- `PVTServiceBean` は来院登録（`addPvt`）と受付検索の両方を扱い、保険情報の差し替えや `ChartEventServiceBean` 通知を行う。`visitptlstv2` 応答から `PatientVisitModel` を組み立てる DTO コンバータを用意し、既存の `addPvt` を再利用して来院キャッシュへ書き込む。

### ClaimSender / ChartEventServiceBean
- `ClaimSender` は `DocumentModel` ベースの CLAIM 送信を行い、`ClaimHelper` が診療内容を Velocity で整形している。`acsimulatev2` ラッパーではクライアントから受け取った `BillingSimulationRequest` から `ClaimBundle` を生成し、`ClaimSender` のテンプレート処理を流用して ORCA へシミュレーションリクエストを送る。
- `ChartEventServiceBean` はカルテ更新時の SSE 通知を担う。`subjectivesv2` を通じた症状詳記登録後、ORCA 応答を `KarteServiceBean` に保存し、`ChartEventServiceBean` で `SUBJECTIVE_IMPORT` イベントを送る。

## 3. 追加する DTO / Service インターフェース
| 種別 | 目的 / 主フィールド | 実装予定パッケージ |
| --- | --- | --- |
| `OrcaAppointmentListRequest/Response` | 予約一覧リクエスト（日付・診療内容・医師コード）と `slots[]` に ORCA XML の `Appointment_Time`, `Medical_Information`, `Patient_Information` をマッピング。 | `open.dolphin.rest.dto.orca` |
| `PatientAppointmentListRequest/Response` | `patientId`, `baseDate`, `departmentCode` と予約配列。来院済みフラグや受付IDを保持。 | 同上 |
| `BillingSimulationRequest/Response` | `patientId`, `karteId`, `performDate`, `departmentCode`, `claimBundles[]`。レスポンスは `estimate`（税込/公費/自己負担）と `warnings`。 | 同上 + `open.dolphin.msg` で ClaimSender へ引き渡す変換ロジック |
| `VisitPatientListRequest/Response` | `visitDate`, `departmentCode`, `requestNumber`。レスポンスは `visits[]`（受付順・保険組合せ）と `pvtCacheUpdated`。 | 同上 |
| `PatientIdBatchRequest/Response` | `baseStartDate`, `baseEndDate`, `includeTestPatient`。レスポンスは `patients[]` と `syncTicketId`。 | 同上 |
| `PatientListBatchRequest/Response` | `patientIds[]`, `continuationToken`, `includeInsurance`。複数 `HealthInsuranceDTO` を含む。 | 同上 |
| `PatientNameSearchRequest/Response` | 氏名・カナ・生年月日・性別・前方/後方/部分一致。レスポンスは `hits[]`。 | 同上 |
| `PatientMutationRequest/Response` | `operation`, `patientPayload`, `traceId`, `auditId`。`PatientServiceBean` へ upsert/delete を指示。 | 同上 |
| `InsuranceCombinationRequest/Response` | `patientId`, `baseDate`, `rangeStart`, `rangeEnd`。レスポンスに各組合せの適用期間と負担率。 | 同上 |
| `SubjectiveEntryRequest/Response` | `patientId`, `karteId`, `performDate`, `soapCategory`, `body`, `insuranceCombinationNumber`, `departmentCode`, `physicianCode`。レスポンスに `entryId`, `warnings`, `auditId`, `runId`。 | 同上 |

追加 Service/API フック:
- `OrcaResource` に `@POST` エンドポイントを新設し、`AbstractResource` 相当のエラーハンドリング／`@Context HttpServletRequest` 取得／`X-Trace-Id` 反映を実装。
- `OrcaApi` へ `patientlst1/2/3`, `patientlst6`, `subjectives`, `visitptlst`, `acsimulate` 用メソッドを追加し、`OrcaConnect` で公開。
- `PatientServiceBean` に ORCA 同期用の upsert メソッドと `PatientVisitModel` との紐付けを追加、`AuditTrailService` のイベントタイプを `ORCA_PATIENT_SYNC` / `ORCA_PATIENT_MUTATION` で統一。

## 4. エンドポイント別設計要約
### 4.1 ORCA-REST-01（予約・請求・来院）
1. **`POST /orca/appointments/list`**: `appointmentDate` 必須、`medicalInformation` コードを `^(0[1-7]|99)$` で検証。ORCA から取得した予約を `AppoServiceBean.putAppointments` へ流し、返却 JSON には `apiResult`, `slots`, `runId` を含める。
2. **`POST /orca/appointments/patient`**: `patientId`（数字 1〜16 桁）必須。`baseDate` が 180 日超未来なら 422。ORCA 応答を元に患者タブへ表示し、`reservations[].visitStatus` で `AppoServiceBean` の状態差分チェックを行う。
3. **`POST /orca/billing/estimate`**: `claimBundles[]` が空なら 400。`ClaimSender` で生成する XML を `OrcaConnect#acsimulate` へ送信し、ORCA の `Result_Msg` を `warnings[]` として返却。必要に応じて `KarteServiceBean` のドラフトカルテへ試算値を差し込む。
4. **`POST /orca/visits/list`**: `visitDate` 必須。`requestNumber` で日次詳細 (`01`) と月次カレンダー (`02`) を切替。ORCA 応答を `PVTServiceBean.addPvt` へマッピングし、戻り値には `pvtCacheUpdated` フラグを含める。

### 4.2 ORCA-REST-02（患者同期・症状）
1. **`POST /orca/patients/id-list`**: 90 日以内の `baseStartDate/baseEndDate` を強制し、結果を `PatientServiceBean` の同期キューに投入。レスポンスには `syncTicketId`（差分実行 ID）を含め、後続バッチ API で再利用する。
2. **`POST /orca/patients/batch`**: `patientIds[]`（最大 200 件）を ORCA へ渡し、氏名・住所・保険配列を `PatientModel` に変換。`includeInsurance=true` 時は `HealthInsuranceModel` を全差し替え。
3. **`POST /orca/patients/name-search`**: `name` または `kana` が必要。`fuzzyMode`（`prefix/suffix/partial`）に応じて ORCA リクエストを切替し、ローカル DB のヒット件数も付加する。
4. **`POST /orca/patient/mutation`**: `operation`×payload を検証後、ORCA へ反映し、結果を `PatientServiceBean` へ反映。監査は `AuditTrailService` の `ORCA_PATIENT_MUTATION` イベントを使用。
5. **`POST /orca/insurance/combinations`**: `patientId` 必須、`rangeStart/rangeEnd` は 1 年以内。レスポンスを `HealthInsuranceModel` の履歴テーブルに登録し、`PatientVisitModel` へ紐付け。
6. **`POST /orca/chart/subjectives`**: `body` 1,000 文字超は 422。ORCA 応答に含まれる `Api_Result`, `Reskey`, `Detailed_Result` を `SubjectiveEntryResponse` として返し、`KarteServiceBean` が保管する症状詳記と `ChartEventServiceBean` の SSE 通知へ反映。

## 5. Runbook / 検証方針
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` 2.3 節の REST ラッパー行へ Phase2 Sprint2 / Runbook 参照を明記済み。開発前に `RN_ID` を `ORCA_CONNECTIVITY_VALIDATION.md` §4.2〜§4.4（予約・請求）および §4.3〜§4.4（患者・症状）に沿って取得し、`logs/<date>-orca-connectivity.md` に記録する。
- 疎通確認コマンドは `curl --cert-type P12` による公式 ORCA 参照のみを使用。`ORCAcertification/` 配下の証明書・Basic 認証情報を共有し、`assets/orca-api-requests/*.json` のテンプレから JSON/XML を生成する。
- DTO 追加やエンドポイント実装後は `docs/web-client/planning/phase2/DOC_STATUS.md` 更新、および `SERVER_MODERNIZATION_PLAN.md` Backlog の関連チケットへ進捗を反映する。
