# E2E診療シナリオ棚卸し

- 作成日: 2026-01-23
- RUN_ID: 20260123T000429Z
- 対象: ORCA preprod 実装棚卸し（テストレビュー / 受付→診療→請求）
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `src/validation/ORCA実環境連携検証.md`
  - `docs/web-client/operations/reception-billing-flow-status-20260120.md`

---

## 実施済みのE2E証跡（最小範囲）

### 1. 非カルテ領域E2E（MSW前提）
- 実行 RUN_ID: `20260103T235314Z`
- 実行日: 2026-01-04 (UTC/JST)
- 実施範囲:
  - Reception: 例外一覧 / キュー状態 / 監査検索
  - Patients: 反映状態 / 監査検索
  - Charts: 送信 / 印刷ガード / 復旧導線
  - Administration: 配信状態 / ガード / 監査イベント
- 証跡: `artifacts/validation/e2e/logs/` / `artifacts/validation/e2e/screenshots/`
- 備考: 実データではなく MSW での UI/監査確認が中心。

### 2. ORCA Trial 連携の画面表示・監査突合
- 実行 RUN_ID: `20260104T225149Z`（UI RUN_ID: `20260104T231148Z`）
- 実施内容:
  - Reception/Charts/Patients/Administration の表示
  - 監査ログ runId の突合
  - ORCA キュー表示と印刷ページ表示
- 証跡: `artifacts/orca-connectivity/20260104T225149Z/`
- 備考: 受付登録・病名/処方の実反映・請求確定は未実施。

---

## E2Eシナリオ棚卸し（受付→診療→請求）

### A. 受付登録（予約/予約外）
- 現状の実装範囲:
  - `/orca/appointments/list` / `/orca/visits/list` 表示
  - `/orca/visits/mutation` で受付登録/取消（acceptmodv2）
- 実施済み証跡:
  - 画面表示・監査突合（RUN_ID=20260104T231148Z）
  - MSW E2E（RUN_ID=20260103T235314Z）
- 不足/未自動化:
  - Trial 実環境での安定した受付登録（acceptmodv2）
  - 受付登録→Charts遷移→同一runId確認の連結証跡
  - 受付取消/再受付の異常系（Api_Result=21/エラー）

### B. 診療（カルテ編集 / 病名 / 処方 / オーダー）
- 現状の実装範囲:
  - Charts 送信（medicalmodv2/medicalmodv23）
  - 病名編集（/orca/disease, /orca/disease/v3）
  - 処方/オーダー編集（/orca/order/bundles）
- 実施済み証跡:
  - Charts 送信/印刷ガードの UI 確認（MSW）
  - ORCA Trial での画面表示・監査突合
- 不足/未自動化:
  - 病名/処方/オーダーの CRUD 実データ反映（UI↔ORCA）
  - 送信失敗時の再送/キュー（ローカル）動作の実証跡
  - Data_Id 取得を伴う診療送信の成功証跡

### C. 会計（請求試算・収納確認）
- 現状の実装範囲:
  - Charts の会計ステータス判定（Invoice_Number）
  - 収納情報取得（incomeinfv2）
  - ORCA キュー表示（/api/orca/queue）
- 実施済み証跡:
  - ORCA キュー表示（entries=0）
  - 会計/請求 UI の基本表示（MSW）
- 不足/未自動化:
  - 実環境での請求試算（Invoice_Number）取得と UI 反映
  - incomeinfv2 による収納情報の突合
  - 会計確定/領収書番号の突合（本番相当データ）

### D. 処方箋発行（帳票）
- 現状の実装範囲:
  - ORCA 帳票 API（prescriptionv2 ほか）
  - Data_Id 取得 → blobapi 取得 → プレビュー
- 実施済み証跡:
  - 印刷確認モーダル/印刷ページ表示（RUN_ID=20260104T231148Z）
- 不足/未自動化:
  - 実 ORCA での Data_Id 取得 → PDF プレビュー成功
  - prescriptionv2 が Api_Result=0001 以外で成功する証跡

---

## 実運用フローの未検証項目（要整理）

1. 受付登録の end-to-end 完結
   - 受付登録 → Charts遷移 → 診療送信 → 会計/帳票までの連結証跡が未取得。
2. 病名/処方/オーダーの実データ反映
   - ORCA 側の病名/処方が更新されること、監査ログが一致することの証跡が不足。
3. 請求試算・収納の確定値突合
   - Invoice_Number 取得と incomeinfv2 の整合、会計済み判定の証跡が不足。
4. 帳票 Data_Id 取得と PDF 表示
   - prescriptionv2 ほか帳票の Data_Id を取得し、blobapi で PDF を開ける証跡が未取得。
5. 例外系フロー（再送/失敗/復旧）
   - 送信失敗、ORCA キュー停滞、Api_Result!=0 を踏んだ再送/復旧導線の証跡が不足。

---

## 追加で必要なE2E証跡（未自動化シナリオ）

- 受付登録（acceptmodv2）成功→Charts遷移→医療送信→会計→帳票までの一連ログ
- 病名/処方/オーダー CRUD の実反映ログ（UI/監査/ORCA応答）
- medicalmodv2/medicalmodv23 の Data_Id 取得ログ
- incomeinfv2 の収納情報表示ログ
- prescriptionv2（ほか帳票）での Data_Id 取得→blobapi PDF 取得ログ
- 失敗系（Api_Result!=0/HTTP 4xx/5xx）での復旧・再送導線ログ

---

## 備考
- 現行の E2E 証跡は MSW 前提（RUN_ID=20260103T235314Z）が中心であり、実環境連携の網羅性は不足している。
- ORCA Trial の制約により acceptmodv2 / 帳票 Data_Id 取得が不安定なため、実環境での再確認が必要。
