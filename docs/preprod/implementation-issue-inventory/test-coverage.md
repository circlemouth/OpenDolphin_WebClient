# テストカバレッジと未実施一覧

- 作成日: 2026-01-22
- RUN_ID: 20260122T190527Z
- 対象: ORCA preprod 実装棚卸し（テストレビュー）
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`

---

## 実施済みカバレッジ（証跡あり）

### 1. E2E / 統合テスト（非カルテ主要フロー）
- 実行 RUN_ID: `20260103T235314Z`
- 実行日: 2026-01-04 (UTC/JST)
- 実行範囲:
  - Reception: 例外一覧 / キュー状態 / 監査検索
  - Patients: 反映状態（未紐付警告）/ 監査検索
  - Charts: 送信 / 印刷ガード表示 / 復旧導線（再取得）
  - Administration: 配信状態 / ガード / 監査イベント（admin セッション）
- 証跡:
  - `artifacts/validation/e2e/logs/`
  - `artifacts/validation/e2e/screenshots/`
  - `artifacts/validation/e2e/README.md`
- 備考: WebClient は MSW ON で実行。

### 2. ナビゲーション/セッション共有の回帰テスト（2026-01-20）
- 単体/結合:
  - `httpClient.test.ts` / `sessionExpiry.test.ts` で 401/419/403 失効判定と BroadcastChannel 連携テストを追加済み
- E2E:
  - Playwright: `tests/e2e/navigation-broadcast.spec.ts`
  - 実行: `RUN_ID=20260120T061247Z npx playwright test tests/e2e/navigation-broadcast.spec.ts --reporter=list`
  - 成果物: `test-results/tests-e2e-navigation-broad-*/trace.zip`
- サブパス配信確認:
  - `web-client/scripts/verify-subpath-preview.mjs`
  - `VITE_BASE_PATH=/foo npm run test:subpath-preview` で `/foo/` と `/foo/f/0001/reception` の 200 を確認

---

## 未実施・不足しているテスト（API単位）

### ORCA 追加API（server-modernized 経由 / xml2・JSON）
- patientgetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaPatientApiResource.java` / `web-client/src/features/patients/patientOriginalApi.ts`
  - エンドポイント: `/api01rv2/patientgetv2`（`/api/api01rv2/patientgetv2`）
  - 未実施理由: ORCA Trial/本番相当の実 API 結合テスト未実施（MSW 前提）
  - 次回前提: ORCA Trial 接続 + 患者IDの準備 + 監査ログ保存先
- patientmodv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaPatientApiResource.java`
  - エンドポイント: `/orca12/patientmodv2`（`/api/orca12/patientmodv2`）
  - 未実施理由: 実 API での更新系テスト未実施（検証用患者データ未確保）
  - 次回前提: 変更可能な検証患者 + ロール権限確認
- medicalmodv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaMedicalApiResource.java`
  - エンドポイント: `/api21/medicalmodv2`（`/api/api21/medicalmodv2`）
  - 未実施理由: 実 API 連携の再現手順未整備
  - 次回前提: 診療データを持つ患者 + 監査ログ保存
- tmedicalgetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/orcaMedicalGetApi.ts`
  - エンドポイント: `/api01rv2/tmedicalgetv2`（`/api/api01rv2/tmedicalgetv2`）
  - 未実施理由: ORCA 実応答の検証証跡なし
  - 次回前提: ORCA Trial 接続 + 取得対象の診療データ
- medicalgetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaMedicalApiResource.java` / `web-client/src/features/charts/orcaMedicalGetApi.ts`
  - エンドポイント: `/api01rv2/medicalgetv2`（`/api/api01rv2/medicalgetv2`）
  - 未実施理由: ORCA 実 API 取得テスト未実施
  - 次回前提: 検証用診療データ + 監査ログ保存
- medicalmodv23
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/orcaMedicalModApi.ts`
  - エンドポイント: `/api21/medicalmodv23`（`/api/api21/medicalmodv23`）
  - 未実施理由: 本番相当での更新系検証未実施
  - 次回前提: 変更可能な診療データ + ロール/権限確認
- diseasegetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaDiseaseApiResource.java` / `web-client/src/features/charts/orcaDiseaseGetApi.ts`
  - エンドポイント: `/api01rv2/diseasegetv2`（`/api/api01rv2/diseasegetv2`）
  - 未実施理由: 病名取得の実 API テストなし
  - 次回前提: 病名を持つ患者データ + ORCA Trial 接続
- diseasev3
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaDiseaseApiResource.java` / `web-client/src/features/charts/orcaDiseaseModApi.ts`
  - エンドポイント: `/orca22/diseasev3`（`/api/orca22/diseasev3`）
  - 未実施理由: 病名更新の実 API テストなし
  - 次回前提: 病名編集権限 + 監査ログ保存
- incomeinfv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/orcaIncomeInfoApi.ts`
  - エンドポイント: `/api01rv2/incomeinfv2`（`/api/api01rv2/incomeinfv2`）
  - 未実施理由: 収納情報の実 API テストなし
  - 次回前提: 会計データが存在する患者 + ORCA Trial 接続
- subjectiveslstv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/soap/subjectivesApi.ts`
  - エンドポイント: `/api01rv2/subjectiveslstv2`（`/api/api01rv2/subjectiveslstv2`）
  - 未実施理由: 症状詳記の実 API テストなし
  - 次回前提: 詳記データがある患者 + 監査ログ保存
- subjectivesv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/soap/subjectivesApi.ts`
  - エンドポイント: `/orca25/subjectivesv2`（`/api/orca25/subjectivesv2`）
  - 未実施理由: 症状詳記更新の実 API テストなし
  - 次回前提: 更新可能な詳記データ + 権限確認
- contraindicationcheckv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/contraindicationCheckApi.ts`
  - エンドポイント: `/api01rv2/contraindicationcheckv2`（`/api/api01rv2/contraindicationcheckv2`）
  - 未実施理由: 禁忌チェックの実 API テストなし
  - 次回前提: 服薬/病名データがある患者
- medicationgetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/charts/orcaMedicationGetApi.ts`
  - エンドポイント: `/api01rv2/medicationgetv2`（`/api/api01rv2/medicationgetv2`）
  - 未実施理由: 投薬情報取得の実 API テストなし
  - 次回前提: 投薬データがある患者
- medicatonmodv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java`
  - エンドポイント: `/orca102/medicatonmodv2`（`/api/orca102/medicatonmodv2`）
  - 未実施理由: マスタ更新系の実 API テストなし
  - 次回前提: ORCA Trial のマスタ更新許可 + 監査ログ保存
- masterlastupdatev3
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/administration/api.ts`
  - エンドポイント: `/orca51/masterlastupdatev3`（`/api/orca51/masterlastupdatev3`）
  - 未実施理由: マスタ更新時刻取得の実 API テストなし
  - 次回前提: ORCA Trial 接続 + 取得ログ保存
- systeminfv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/administration/api.ts`
  - エンドポイント: `/api01rv2/systeminfv2`（`/api/api01rv2/systeminfv2`）
  - 未実施理由: システム状態取得の実 API テストなし
  - 次回前提: ORCA Trial 接続
- system01dailyv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/administration/api.ts`
  - エンドポイント: `/api01rv2/system01dailyv2`（`/api/api01rv2/system01dailyv2`）
  - 未実施理由: 日次処理系の実 API テストなし
  - 次回前提: 実行可能時間帯 + ORCA Trial 接続
- insuranceinf1v2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/patients/insuranceApi.ts`
  - エンドポイント: `/api01rv2/insuranceinf1v2`（`/api/api01rv2/insuranceinf1v2`）
  - 未実施理由: 保険情報取得の実 API テストなし
  - 次回前提: 保険情報がある患者 + ORCA Trial 接続
- medicalsetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/administration/api.ts`
  - エンドポイント: `/orca21/medicalsetv2`（`/api/orca21/medicalsetv2`）
  - 未実施理由: セット情報取得の実 API テストなし
  - 次回前提: セット定義がある環境 + ORCA Trial 接続
- patientlst7v2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaPatientApiResource.java` / `web-client/src/features/patients/patientMemoApi.ts`
  - エンドポイント: `/api01rv2/patientlst7v2`（`/api/api01rv2/patientlst7v2`）
  - 未実施理由: 患者メモ一覧の実 API テストなし
  - 次回前提: メモ登録済み患者 + 監査ログ保存
- patientmemomodv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaPatientApiResource.java` / `web-client/src/features/patients/patientMemoApi.ts`
  - エンドポイント: `/orca06/patientmemomodv2`（`/api/orca06/patientmemomodv2`）
  - 未実施理由: 患者メモ更新の実 API テストなし
  - 次回前提: 更新可能なメモ + 監査ログ保存
- pusheventgetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java` / `web-client/src/features/outpatient/orcaQueueApi.ts`
  - エンドポイント: `/api01rv2/pusheventgetv2`（`/api/api01rv2/pusheventgetv2`）
  - 未実施理由: PUSH 通知の実 API テストなし（キャッシュ冪等化の証跡なし）
  - 次回前提: ORCA Trial 接続 + 受信イベント発生条件の準備
- prescriptionv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/prescriptionv2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- medicinenotebookv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/medicinenotebookv2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- karteno1v2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/karteno1v2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- karteno3v2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/karteno3v2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- invoicereceiptv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/invoicereceiptv2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ
- statementv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java` / `web-client/src/features/charts/orcaReportApi.ts`
  - エンドポイント: `/api01rv2/statementv2`
  - 未実施理由: 帳票 API の実 API テストなし
  - 次回前提: 帳票対象患者 + blobapi 取得ログ

### ORCA 公式 XML プロキシ
- /api01rv2/acceptlstv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaAcceptanceListResource.java` / `web-client/src/features/administration/orcaXmlProxyApi.ts`
  - エンドポイント: `/api01rv2/acceptlstv2`
  - 未実施理由: 実 API の XML 送受信検証未実施
  - 次回前提: ORCA Trial 接続 + XML2 payload の実データ
- /api01rv2/system01lstv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java` / `web-client/src/features/administration/orcaXmlProxyApi.ts`
  - エンドポイント: `/api01rv2/system01lstv2`
  - 未実施理由: 実 API の XML 送受信検証未実施
  - 次回前提: ORCA Trial 接続 + XML2 payload の実データ
- /orca101/manageusersv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java` / `web-client/src/features/administration/orcaXmlProxyApi.ts`
  - エンドポイント: `/orca101/manageusersv2`（`/api/orca101/manageusersv2`）
  - 未実施理由: 管理系 API の権限検証未実施
  - 次回前提: 管理権限アカウント + 監査ログ保存
- /api01rv2/insprogetv2
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java` / `web-client/src/features/administration/orcaXmlProxyApi.ts`
  - エンドポイント: `/api01rv2/insprogetv2`（`/api/api01rv2/insprogetv2`）
  - 未実施理由: 保険情報取得の XML 実 API 検証未実施
  - 次回前提: 保険情報がある患者 + ORCA Trial 接続

### JSON ラッパー
- /orca/appointments/list
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaAppointmentResource.java` / `web-client/src/features/reception/api.ts`
  - エンドポイント: `/orca/appointments/list`
  - 未実施理由: 実 ORCA 接続の結合テスト未実施（MSW 依存）
  - 次回前提: 予約データを持つ検証環境 + 監査ログ保存
- /orca/appointments/mock
  - 実装ファイル: `web-client/src/mocks/handlers/outpatient.ts`
  - エンドポイント: `/orca/appointments/list/mock`
  - 未実施理由: mock/実環境切替の UI 体験検証未実施
  - 次回前提: UI 切替ログの保存（スクリーンショット）
- /orca/patients/local-search
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaPatientLocalSearchResource.java` / `web-client/src/features/patients/api.ts`
  - エンドポイント: `/orca/patients/local-search`
  - 未実施理由: 実 ORCA 検索の結合テスト未実施
  - 次回前提: 検索対象患者 + 監査ログ保存
- /orca/patients/local-search/mock
  - 実装ファイル: `web-client/src/mocks/handlers/outpatient.ts`
  - エンドポイント: `/orca/patients/local-search/mock`
  - 未実施理由: mock/実環境切替の UI 体験検証未実施
  - 次回前提: UI 切替ログの保存
- /orca12/patientmodv2/outpatient
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java` / `web-client/src/features/patients/api.ts`
  - エンドポイント: `/orca12/patientmodv2/outpatient`
  - 未実施理由: 実 ORCA 更新系テスト未実施
  - 次回前提: 更新可能な検証患者 + 監査ログ保存
- /orca12/patientmodv2/outpatient/mock
  - 実装ファイル: `web-client/src/mocks/handlers/outpatient.ts`
  - エンドポイント: `/orca12/patientmodv2/outpatient/mock`
  - 未実施理由: mock での異常系 UI 体験検証不足
  - 次回前提: 失敗ケースの MSW シナリオ記録

### 内製ラッパー
- /orca/medical-sets
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/medical-sets`
  - 未実施理由: 実データと stub 混在の UI 判別テスト未実施
  - 次回前提: stub/実データ混在環境 + 監査ログ保存
- /orca/tensu/sync
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/tensu/sync`
  - 未実施理由: 実環境同期の結合テスト未実施
  - 次回前提: 点数マスタ差分がある環境 + 監査ログ保存
- /orca/birth-delivery
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/birth-delivery`
  - 未実施理由: 実データ前提の UI/監査検証未実施
  - 次回前提: 出産関連データを持つ検証環境
- /orca/medical/records
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/medical/records`
  - 未実施理由: 実データ取得の結合テスト未実施
  - 次回前提: 診療履歴がある患者 + 監査ログ保存
- /orca/patient/mutation
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/patient/mutation`
  - 未実施理由: 実更新系テスト未実施
  - 次回前提: 更新可能な検証患者 + 監査ログ保存
- /orca/chart/subjectives
  - 実装ファイル: `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaSubjectiveResource.java` / `web-client/src/features/administration/orcaInternalWrapperApi.ts`
  - エンドポイント: `/orca/chart/subjectives`
  - 未実施理由: 症状詳記同期の実結合テスト未実施
  - 次回前提: 詳記データがある患者 + 監査ログ保存

---

## 未実施・不足しているテスト（UI単位）

### Reception
- 対象URL: `/f/{facilityId}/reception`
- 手順:
  - ログイン後に自動遷移することを確認
  - 例外一覧を開き、実 API での復旧導線（再取得/再送）を試す
  - mock/実環境切替の表示を切替え、監査ログの変化を確認

### Patients
- 対象URL: `/f/{facilityId}/patients`
- 手順:
  - 患者検索→一覧表示→編集保存を実 ORCA で実行
  - 未紐付警告が出る患者で警告表示と監査メタを確認
  - 監査検索フォームで runId/キーワード検索を試し、結果表示を確認

### Charts
- 対象URL: `/f/{facilityId}/charts`
- 手順:
  - 送信/印刷ガードの実 API 経路を実行し、バナーと監査ログを確認
  - 復旧導線（再取得）を実 API 障害時に実行し、結果を記録
  - 医療記録/病名/主訴の更新を行い auditEvent の整合を確認

### Administration
- 対象URL: `/f/{facilityId}/administration`
- 手順:
  - ORCA 公式 XML プロキシのエンドポイント切替/再送/テンプレ再生成を実行
  - systeminfv2/system01dailyv2 の取得とエラー表示を確認
  - 監査検索 UI とサーバー検索結果の一致確認（検索 API 経由）

### Debug
- 対象URL: `/f/{facilityId}/debug/orca-api`
- 手順:
  - patientgetv2/diseasegetv2/medicalgetv2 を選択して送信
  - 403/エラー系を再現し、バナー/監査ログの出力を確認

### 共通（ナビゲーション/セッション共有）
- 対象URL: `/login` → `/f/{facilityId}/reception`
- 手順:
  - ログイン成功時に即リダイレクトすることを確認
  - 403 応答時の権限不足バナー/トーストが出ることを確認
  - 新規タブ起動時に認証/runId/authFlags が復元されることを確認

---

## 監査ログ（保存先・不足証跡）

### UI 表示
- 保存先: `web-client/src/libs/audit/auditLogger.ts` の in-memory ログ（`window.__AUDIT_EVENTS__`）
- 証跡: `artifacts/validation/e2e/logs/20260103T235314Z-audit-*.json`
- 不足理由: 2026-01-20 以降の最新 UI 監査ログのスクリーンショット/JSON 未取得
- 次回前提: 最新 RUN_ID で `window.__AUDIT_EVENTS__` を保存し、スクリーンショットも取得

### 永続化
- 保存先: 未特定（server-modernized の `SessionAuditDispatcher` / `AuditTrailService` が記録）
- 補足: 過去ログに `d_audit_event` テーブル記載があるが現行 DB 名は未特定
- 不足理由: 保存先の特定と runId 突合ログが未取得
- 次回前提: 保存先（DB/ログ）を特定し、runId で検索/突合できる証跡を取得

### 検索 API
- 保存先: 未特定（UI は `getAuditEventLog` でクライアント内検索）
- 不足理由: サーバー側検索 API のエンドポイントと保存先が未特定
- 次回前提: 監査検索 API の仕様/エンドポイントを特定し、リクエスト/レスポンスログを保存

### 異常系
- 保存先: 未特定（エラー系 auditEvent の永続化/検索 API の突合が未取得）
- 不足理由: 401/403/419/440、ORCA エラー（Api_Result != 0）、XML パース失敗の監査記録証跡が不足
- 次回前提: 異常系シナリオの再現ログ + UI 表示 + 永続化ログをセットで取得

---

## 証跡の有無/欠落理由/再取得内容
- E2E 実行ログ
  - 有無: あり（20260103T235314Z の1回のみ）
  - 欠落理由: 2026-01-20 以降の変更分に対する再取得未実施
  - 再取得内容: `artifacts/validation/e2e/logs/` / `screenshots/` / `README.md` を最新 RUN_ID で更新
- Playwright 実行証跡
  - 有無: あり（trace.zip のみ）
  - 欠落理由: HAR/スクリーンショットの保存先が文書化されていない
  - 再取得内容: trace/HAR/スクリーンショットの保存先を README に明記
- 監査ログ証跡
  - 有無: UI 表示のみ（2026-01-04）
  - 欠落理由: 永続化/検索 API/異常系の証跡が未取得
  - 再取得内容: 保存先ログ + 検索 API のリクエスト/レスポンス + 異常系の再現ログ

---

## 補足（次の検証で必要な前提）
- 実 API 結合テストは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を使用し、監査ログ保存先を事前準備する。
- ORCA 実環境接続は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` に従い、ログを保存する（Phase2 版は Legacy）。
