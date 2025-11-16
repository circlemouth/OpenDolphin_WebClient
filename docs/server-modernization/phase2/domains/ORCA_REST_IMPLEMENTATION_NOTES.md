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

## 6. Sprint2 エンドポイント設計詳細

### 6.1 共通ガードレール（Resource / Service / DTO）
- **Resource 責務**: 新旧 ORCA ラッパーは `open.dolphin.rest.OrcaResource` 配下に `@POST` メソッドとして集約し、`AbstractResource` を継承して `jakarta.ws.rs` 系アノテーションへ統一する。`@Context HttpServletRequest` で `X-Trace-Id` を受け取り、`rest-api-modernization.md` §2 の方針どおり Jakarta 依存 (`jakarta.inject.Inject`, `jakarta.ws.rs.core.Response`) を使用する。
- **Service 責務**: Resource 層は ORCA リクエスト変換と応答整形のみを担い、業務ロジックは従来の `AppoServiceBean` / `PVTServiceBean` / `PatientServiceBean` / `ChartEventServiceBean` / `ClaimSender` に委譲する。必要な場合は `OrcaAppointmentFacade` や `OrcaPatientSyncFacade` のような薄い Facade を `server-modernized` に追加し、DTO ↔ InfoModel のマッピングを集中管理する。
- **DTO 責務**: `open.dolphin.rest.dto.orca` 配下に Sprint2 のリクエスト/レスポンス DTO を全て配置し、`rest-api-modernization.md` §3 のシリアライザ設定に合わせて `jackson-databind 2.17` でシリアライズする。ORCA 生データ（Shift_JIS JSON/XML）は DTO へ取り込む前に `OrcaApi` 側で UTF-8 に再デコードする。
- **例外処理**: ORCA HTTP エラー／`Api_Result != "0000"` は `OrcaGatewayException` へ正規化し、`ExceptionMapper<OrcaGatewayException>` で HTTP 424（ORCA 応答不整合）、429（ORCA 側 4097／レート制限）、504（タイムアウト）など REST レイヤーの意味を付与する。監査用に `AuditTrailService` へ `status=failed` を記録し、レスポンス JSON には `apiResult`, `orcaMessage`, `traceId` を含める。
- **Shift_JIS / Serializer**: ORCA 側とは `Content-Type: application/json; charset=Shift_JIS` を固定し、`OrcaConnect` 内で `Charset.forName("MS932")` を使って変換。Resource 層では UTF-8 JSON を `application/json` で返却し、`AbstractResource#getSerializeMapper` の `FAIL_ON_UNKNOWN_PROPERTIES=false` / `WRITE_DATES_AS_TIMESTAMPS=false` 設定を継承する。
- **テスト導線**: すべての Sprint2 エンドポイントは `ORCA_CONNECTIVITY_VALIDATION.md` §4.3（P0 予約〜受付）と §4.4（患者同期・症状）を準拠テストとし、curl 証跡は `ORCA_API_STATUS.md` の Matrix 行へ RUN_ID 付きでリンクする。

### 6.2 API ごとの設計ノート
#### <a id="appointlstv2-matrix-no6"></a> appointlstv2（Matrix No.6）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/appointlst.md`](../operations/assets/orca-api-spec/raw/appointlst.md)。`Appointment_Time` / `Appointment_Information` の Shift_JIS フィールドと `Api_Result` パターンを踏まえる。
- **モダナイズ REST URI**: `POST /orca/appointments/list`（`OrcaResource#listAppointments`）。`@Consumes(MediaType.APPLICATION_JSON)` / `@Produces(MediaType.APPLICATION_JSON)` で 1 日分の予約一覧を返却。
- **Service/DTO 変更点**: `OrcaAppointmentListRequest/Response` を `open.dolphin.rest.dto.orca` へ追加し、`AppoServiceBean.putAppointments` を再利用してローカルキャッシュへ自動同期。`OrcaApi#appointlstv2` を追加して `OrcaConnect` が Shift_JIS 送受信を処理する。
- **テスト/Runbook 連携**: `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 の P0-2 手順で curl 証跡を取得し、`ORCA_API_STATUS.md` 2.1 行に RUN_ID を追記。`logs/<date>-orca-connectivity.md` の `P0_appointlstv2` ディレクトリと突き合わせる。

#### <a id="appointlst2v2-matrix-no15"></a> appointlst2v2（Matrix No.15）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/appointlst2.md`](../operations/assets/orca-api-spec/raw/appointlst2.md)。患者別予約検索の `Patient_ID` / `Base_Date` 条件を順守。
- **モダナイズ REST URI**: `POST /orca/appointments/patient`。`patientId` と `baseDate` で抽出し、`reservations[].visitStatus` を計算して返す。
- **Service/DTO 変更点**: `PatientAppointmentListRequest/Response` DTO を新設し、`AppoServiceBean` に `diffReservationsForPatient` ヘルパーを追加。ORCA 応答から `visitStatus` / `cancelFlag` を再構築し、Web クライアントへ 1 件単位の更新通知を出す。
- **テスト/Runbook 連携**: `ORCA_CONNECTIVITY_VALIDATION.md` §4.3（追加ケース）へ患者別テンプレを追記し、`ORCA_API_STATUS.md` に P1 範囲として `Api_Result`/`Detailed_Result` を記録。RUN_ID は `P0_appointlst2v2` で統一。

#### <a id="acsimulatev2-matrix-no16"></a> acsimulatev2（Matrix No.16）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/acsimulate.md`](../operations/assets/orca-api-spec/raw/acsimulate.md)。`Ac_Simulate_Result` の金額配列、`Api_Result` エラーコード一覧を参照。
- **モダナイズ REST URI**: `POST /orca/billing/estimate`。カルテ側の `BillingSimulationRequest` を受け、ORCA から得た見積りを返却。
- **Service/DTO 変更点**: `BillingSimulationRequest/Response` DTO を `ClaimSender` と共有し、`ClaimSender` に試算モードを追加 (`ClaimSender#acsimulate` → `OrcaApi#acsimulatev2`)。`warnings[]` には ORCA の `Detailed_Result` を格納し、`ClaimBundle` 生成エラーは `OrcaGatewayException` で 422 を返す。
- **テスト/Runbook 連携**: Runbook §4.3 の任意 API セットへ `acsimulate` テンプレを追加し、`PHASE2_PROGRESS.md` の ORCA 欄で RUN_ID を管理。`logs/<date>-orca-connectivity.md` `P1_acsimulatev2` の `Api_Result` を必ず貼付。

#### <a id="visitptlstv2-matrix-no18"></a> visitptlstv2（Matrix No.18）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/visitpatient.md`](../operations/assets/orca-api-spec/raw/visitpatient.md)。`request_Number=01/02` の切り替えと `Visit_Patient_Information` 配列を参照。
- **モダナイズ REST URI**: `POST /orca/visits/list`。`visitDate` と `requestNumber` を受け、来院一覧を返却。
- **Service/DTO 変更点**: `VisitPatientListRequest/Response` DTO を定義し、`PVTServiceBean.addPvt` を呼び出して `PatientVisitModel` キャッシュを更新。保険組合せ不足時は `PatientServiceBean` の `mergeInsuranceFromVisit` を呼ぶ。
- **テスト/Runbook 連携**: Runbook §4.3 の P0-4 ステップに visit API を追加し、`logs/<date>...` の `P0_visitptlstv2` ディレクトリへ HTTP 証跡を保存。`ORCA_API_STATUS.md` 2.1 表の Matrix No.18 に RUN_ID を追記する。

#### <a id="patientlst1v2-matrix-no8"></a> patientlst1v2（Matrix No.8）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/patientidlist.md`](../operations/assets/orca-api-spec/raw/patientidlist.md)。期間指定で `Patient_ID` 群を取得。
- **モダナイズ REST URI**: `POST /orca/patients/id-list`。`baseStartDate` / `baseEndDate`（90 日以内）と `includeTestPatient` をパラメータ化。
- **Service/DTO 変更点**: `PatientIdBatchRequest/Response` を作成し、`PatientServiceBean.scheduleOrcaSync` で差分同期キュー（`syncTicketId`）を登録。`Api_Result=0001`（対象なし）は HTTP 204 へ変換。
- **テスト/Runbook 連携**: Runbook §4.4(1) に ID リスト取得手順を記載し、`ORCA_API_STATUS.md` 2.2 節へ日付範囲と RUN_ID を追加。証跡は `logs/<date>-orca-connectivity.md#patientlst1v2` と同期。

#### <a id="patientlst2v2-matrix-no9"></a> patientlst2v2（Matrix No.9）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/patientlist.md`](../operations/assets/orca-api-spec/raw/patientlist.md)。複数 ID の患者基本情報／保険配列の返却仕様を参照。
- **モダナイズ REST URI**: `POST /orca/patients/batch`。最大 200 件の `patientIds[]` と `continuationToken` を受付。
- **Service/DTO 変更点**: `PatientListBatchRequest/Response` を実装し、`PatientServiceBean#mergeOrcaPatient`（新設）で upsert。`HealthInsuranceModel` の差し替えは `includeInsurance` フラグ判断。
- **テスト/Runbook 連携**: Runbook §4.4(2) へバッチ取得を追加し、`logs/.../patientlst2v2` の `Api_Result` と `Patient_Count` を記録。`ORCA_API_STATUS.md` Matrix No.9 に反映。

#### <a id="patientlst3v2-matrix-no10"></a> patientlst3v2（Matrix No.10）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/patientshimei.md`](../operations/assets/orca-api-spec/raw/patientshimei.md)。氏名／カナ検索条件、`Option_Mode` の意味を参照。
- **モダナイズ REST URI**: `POST /orca/patients/name-search`。`fuzzyMode=prefix|suffix|partial` で ORCA の `Option_Mode` を切替。
- **Service/DTO 変更点**: `PatientNameSearchRequest/Response` DTO を追加し、`PatientServiceBean.searchPatientsByKeyword` を呼び出して ORCA→ローカル両方のヒット件数を返却。受信結果は `PatientLiteDTO` に変換して Web クライアント検索へ表示。
- **テスト/Runbook 連携**: Runbook §4.4(3) へ検索テンプレを追加し、`logs/.../patientlst3v2` に検索語と `Api_Result` を控える。`ORCA_API_STATUS.md` Matrix No.10 に RUN_ID を追加。

#### <a id="patientlst6v2-matrix-no14"></a> patientlst6v2（Matrix No.14）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/insurancecombi.md`](../operations/assets/orca-api-spec/raw/insurancecombi.md)。保険組合せ (`Insurance_Combination_Information`) と適用期間を参照。
- **モダナイズ REST URI**: `POST /orca/insurance/combinations`。`patientId`＋日付範囲でフィルタし、1 年超は 422。
- **Service/DTO 変更点**: `InsuranceCombinationRequest/Response` DTO を実装し、`PatientServiceBean.mergeInsuranceHistory` を通じて `HealthInsuranceModel` 履歴テーブルを更新。保険番号が欠落した場合は HTTP 400 を返す。
- **テスト/Runbook 連携**: Runbook §4.4(4) に保険組合せの curl 例を追記し、`logs/.../patientlst6v2` で `Combination_Mode`・件数を証跡化。`ORCA_API_STATUS.md` Matrix No.14 に RUN_ID を紐付け。

#### <a id="patientmodv2-matrix-no17"></a> patientmodv2（Matrix No.17）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/patientmod.md`](../operations/assets/orca-api-spec/raw/patientmod.md)。`mode=01/02/03` の操作と `Patient_Information` の必須項目を参照。
- **モダナイズ REST URI**: `POST /orca/patient/mutation`。`operation=create|update|delete` を `mode` へマッピングし、結果を即時返却。
- **Service/DTO 変更点**: `PatientMutationRequest/Response` DTO を作成し、`PatientServiceBean` に `applyOrcaMutation`（操作別 upsert/delete）を追加。成功時は `AuditTrailService` へ `ORCA_PATIENT_MUTATION` イベントを発火し、失敗時は 409 を返却。ORCA 側の `Warning_Message` は `warnings[]` として返却。
- **テスト/Runbook 連携**: Runbook §4.4(5) で mutation API はシミュレーションのみ（本番では POST 禁止）と記載し、`ORCA_API_STATUS.md` では Evidence 行に 405/禁止理由を残す。検証は Sandbox データで 1 回だけ行い、RUN_ID=`P1_patientmodv2` を付与。

#### <a id="subjectivesv2-matrix-no35"></a> subjectivesv2（Matrix No.35）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/subjectives.md`](../operations/assets/orca-api-spec/raw/subjectives.md)。`Subjectives_Information` の最大文字数や `Detailed_Result` の警告を参照。
- **モダナイズ REST URI**: `POST /orca/chart/subjectives`。`body`（1,000 文字以内）と `soapCategory`、担当医コードを受けて症状詳記を登録。
- **Service/DTO 変更点**: `SubjectiveEntryRequest/Response` DTO を新設し、`KarteServiceBean` が ORCA 応答を保存後 `ChartEventServiceBean` で `SUBJECTIVE_IMPORT` SSE を送信。Shift_JIS 変換は共通ヘルパー `OrcaSubjectiveMapper` で行う。
- **テスト/Runbook 連携**: Runbook §4.4(6) に `subjectivesv2` テンプレ（本番書き込み禁止のため dry-run）の取得とログ化手順を追加し、`logs/.../subjectivesv2` へ 405/Api_Result 証跡を残す。`ORCA_API_STATUS.md` Matrix No.35 にも 405 証跡を掲載して書き込み禁止を明示する。

#### <a id="appointmodv2-matrix-no2"></a> appointmodv2（Matrix No.2）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/appointmod.md`](../operations/assets/orca-api-spec/raw/appointmod.md)。`Appointment_Date/Time`、`Appointment_Information`、`Patient_Information`、`Api_Warning_Message` の扱いを参照。
- **モダナイズ REST URI**: `POST /orca/appointments/mutation`。`requestNumber`（01=登録/02=取消/03=新規患者の番号割当）、`appointmentDate`、`appointmentTime`、`departmentCode`、`physicianCode`、`medicalInformation`、`appointmentInformation`、`patient` サマリ、`note` を JSON で受け付け、レスポンスへ `appointmentId`、`warnings`、`rawXml` を格納する。
- **Service/DTO 変更点**: `AppointmentMutationRequest/Response` と `OrcaAppointmentMutationFacade` を `server-modernized` へ追加し、ORCA XML を Shift_JIS で送信 → 応答の `Appointment_Information` を `AppointmentModel` へ写経 → `AppoServiceBean#putAppointments` と `AuditTrailService` で来院予定キャッシュと監査を同期する。新規患者（requestNumber=03）の場合は `PatientServiceBean` へ患者番号の確定を委譲し、ORCA へ再送するリトライ導線を確保する。
- **テスト/Runbook 連携**: WebORCA Trial は POST `/orca14/appointmodv2` を 405（Allow: OPTIONS, GET）で遮断するため CRUD 実測不可。RUN_ID=`20251116T164200Z` では firecrawl 仕様と DTO 差分のみを証跡化し、`artifacts/orca-connectivity/20251115TrialConnectivityCodexZ1/blocked/README.md` の `TrialLocalOnly` 行と同じ扱いにする旨をログへ記録する。

#### <a id="acceptmodv2-matrix-no4"></a> acceptmodv2（Matrix No.4）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/acceptmod.md`](../operations/assets/orca-api-spec/raw/acceptmod.md)。`Request_Number=01-03`、受付 ID と患者番号の突合、`Api_Warning_Message` の再現条件を参照。
- **モダナイズ REST URI**: `POST /orca/visits/mutation`。`requestNumber`、`acceptId`、`acceptDate`、`acceptTime`、`departmentCode`、`physicianCode`、`medicalInformation`、`insurance` 配列、`userId` を JSON で受け付け、レスポンスは `visitStatus`、`warnings`、`pvt` サマリを返却する。
- **Service/DTO 変更点**: `VisitMutationRequest/Response` と `OrcaVisitMutationFacade` を介して ORCA XML を送受信し、応答結果を `PVTServiceBean#addPvt`／`PVTServiceBean#rollbackPvt` に流し込む。受付登録時は自動で `ChartEventServiceBean` へ `VISIT_ACCEPTED` イベントを発行し、取消時は `VisitHistoryService` で履歴を残す。`NewPatientPatch` が送られた場合は `PatientServiceBean#mergeTemporaryPatient` を呼び出し、患者番号確定を支援する。
- **テスト/Runbook 連携**: Trial 環境は `/orca11/acceptmodv2` も 405 応答となるため、RUN_ID=`20251116T164200Z` の検証ログでは「Trial通信不可だが実装完了（仕様ベース）」タグと `trialsite.md#limit` 引用のみを残す。`ORCA_CONNECTIVITY_VALIDATION.md` §4.3 の P0-1 テンプレへは `curl` 例の代わりに `blocked/README.md` 参照を記載する。

#### <a id="system01lstv2-matrix-no11"></a> system01lstv2（Matrix No.11）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/systemkanri.md`](../operations/assets/orca-api-spec/raw/systemkanri.md)。`class=01-07` と `Request_Number` の併用、診療科／職員／医療機関基本情報／入金方法／診療内容／患者状態コメントのレイアウトを参照。
- **モダナイズ REST URI**: `POST /orca/system/management`。`requestNumber` もしくは `class`（01:診療科、02:職員、03:医療機関基本、04:診療内容、05:入金方法、06:診療内容グループ、07:患者状態コメント）を指定し、`baseDate`、`doctorFilters` などをオプションで渡す。
- **Service/DTO 変更点**: `SystemMasterSnapshotRequest/Response` DTO を追加し、`SystemServiceBean` と `ServerInfoResource` で持つキャッシュへ `departments[]`, `staff[]`, `facility`, `paymentMethods[]`, `patientStatus[]` を突き合わせて反映する。診療科や職員コードは `SystemMasterSyncService`（新設）で ID 冪等性を検証し、`AuditTrailService` に `SYSTEM_MASTER_SNAPSHOT` イベントを記録する。
- **テスト/Runbook 連携**: WebORCA Trial では管理メニュー自体が閉じられているため、本 RUN_ID の証跡は firecrawl 仕様／DTO 定義に限定。`ORCA_API_STATUS.md` Matrix No.11 と `coverage/coverage_matrix.md` の `Trial非提供(機能制限)` 行へ `Trial通信不可だが実装完了（RUN_ID=20251116T164200Z, 仕様ベース）` を追記し、実接続はローカル ORMaster 環境が復旧してから行う。

#### <a id="manageusersv2-matrix-no32"></a> manageusersv2（Matrix No.32）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/userkanri.md`](../operations/assets/orca-api-spec/raw/userkanri.md)。`Request_Number=01-04`、`Menu_Item_Information`、管理者権限の戻り値を参照。
- **モダナイズ REST URI**: `POST /orca/system/users`。`requestNumber`、`userId`、`password`（ハッシュ）、`facilityId`、`groupNumber`、`menuPrivileges[]`、`staffInfo` を JSON で受け付け、レスポンスで `menuItems[]`・`administratorPrivilege` を返却する。
- **Service/DTO 変更点**: `OrcaUserManagementRequest/Response` を `open.dolphin.rest.dto.orca` へ追加し、`UserServiceBean`／`SystemServiceBean` での職員同期と `AuditTrailService` への `USER_MUTATION` 記録を同時に行う。登録/更新時は `MenuItemPrivilege` DTO を既存 `RoleModel` へマッピングし、削除時は `UserCleanupService`（新設）で Web クラ側キャッシュを整理する。
- **テスト/Runbook 連携**: Trial ではシステム管理［1010 職員情報］が参照のみのため `manageusersv2` も POST 不能。RUN_ID=`20251116T164200Z` では firecrawl 仕様と DTO スキーマ定義を `docs/server-modernization/phase2/operations/logs/20251116T164200Z-orca-sprint2.md` へ添付し、実配線はクラウド ORMaster 環境の許可待ちとする。

#### <a id="receiptprintv3-matrix-no42"></a> receiptprintv3（Matrix No.42）
- **ORCA spec 参照**: [`../operations/assets/orca-api-spec/raw/report_print.md`](../operations/assets/orca-api-spec/raw/report_print.md)。`Form_ID`、`Print_Mode=PDF`、`Data_Id`／`print002` PUSH、`/blobapi/<Data_Id>` 取得手順を参照。
- **モダナイズ REST URI**: `POST /orca/report/print`。`formId`（`shohosen`, `okusuri_techo`, `karte_no1` など 10 種類）、`printMode`（`PUSH` or `PDF`）、`patientId`、`karteId`、`documentBytes`、`options`（差し込み情報/書式/紙サイズ）を受け付け、レスポンスには `dataId` と `downloadUrl`（`/blobapi/{dataId}`）を返却する。
- **Service/DTO 変更点**: `ReportPrintJobRequest/Response` と `ReportPrintJobService` を新設し、ORCA から戻る `Data_Id` を `BlobService` へ登録 → `ReportQueue` にジョブを積み、`push-exchanger` が `print002` イベントを受けてプリンタ／ダウンロードへ接続できるようにする。PDF 直接取得モードでは `BlobProxyResource` で `zip` を公開し、`Data_Id` の TTL を `ReportArchiveRepository` に記録する。
- **テスト/Runbook 連携**: trialsite §4 の制限により帳票印刷はトライアル環境で禁止されている。RUN_ID=`20251116T164200Z` では DTO/処理フローのみ更新し、`ORCA_API_STATUS.md` Matrix No.42 と `logs/20251116T164200Z-orca-sprint2.md` に「Trial通信不可だが実装完了（仕様ベース）」タグを残す。push-exchanger／`/blobapi` の統合テストはローカル ORMaster インスタンスまたは顧客環境での再開待ち。
