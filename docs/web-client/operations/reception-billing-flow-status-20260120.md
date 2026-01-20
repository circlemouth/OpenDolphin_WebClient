# 受付→診療終了後オーダー確認→会計→処方箋発行 フロー実装状況  
RUN_ID=20260120T091753Z（作成日: 2026-01-20）

## 1. 目的と対象
- モダナイズ版 Web クライアント上で、事務員が行う一連の外来業務（予約/予約外受付 → 診療終了後のオーダー確認・送信 → 会計処理 → 処方箋発行）の実装状況と ORCA 利用状況を整理する。  
- 対象コード: `web-client/src/features/reception/*`, `web-client/src/features/charts/*`, `web-client/src/features/outpatient/*`。  
- 参照ログ: `docs/DEVELOPMENT_STATUS.md`（2026-01-13 以降のORCA試験結果）。

## 2. 業務フロー別の現状

### 2.1 受付（予約・予約外/当日受付）
- **UI実装**: `web-client/src/features/reception/pages/ReceptionPage.tsx`  
  - /orca/appointments/list と /orca/visits/list を React Query で取得し、ステータス別リスト（受付中/診療中/会計待ち/会計済み/予約）に表示。  
  - 行ダブルクリックで `buildChartsUrl` を用いて同一 RUN_ID で Charts へ遷移。  
  - 受付の新規登録・変更（予約外患者の当日受付、取消/修正）は UI なし。  
- **バックエンド接続**: `web-client/src/features/reception/api.ts` が `/orca/appointments/list`（appointlstv2）と `/orca/visits/list`（visitptlstv2）にフェッチ。preferredSource は `VITE_DISABLE_MSW` に依存。  
- **ORCA状況**: 2026-01-12 の WebORCA Trial 実測で appointlstv2 は HTTP 200/Api_Result=21（受付なし）で疎通確認済み。visitptlstv2 も 200 応答だがデータなし（DEVELOPMENT_STATUS 記載）。  
- **ギャップ**: 受付新規作成・更新用の `/orca/visits/mutation`（acceptmodv2）や `/orca/appointments/mutation` は未接続（`docs/web-client-unused-features.md` A-1参照）。予約外患者をその場で受付に乗せる導線が未実装。

### 2.2 診療終了後のオーダー確認・送信（Charts）
- **送信ボタン実装**: `web-client/src/features/charts/ChartsActionBar.tsx`  
  - 「ORCA送信」: `/orca/claim/outpatient` へ JSON POST。サーバー側はローカル DB の受付/文書を束ねて返す `OrcaClaimOutpatientResource`（DataSource=server）で、ORCA 本体への送信は未実装。  
  - 「診療終了」: `/orca21/medicalmodv2/outpatient` を呼び出し、成功後に `medicalmodv23`（ORCA公式XML `/api21/medicalmodv23`）を条件付きで送信。必須項目（Patient_ID/Department_Code/日付）が欠けると警告を出し送信スキップ。  
  - 送信失敗時はトースト/バナーと audit/telemetry 記録のみで、受付ステータスの巻き戻しや再送キュー統合は未対応。  
- **オーダー編集**: `web-client/src/features/charts/OrderBundleEditPanel.tsx` + `/orca/order/bundles`（サーバー内製）でローカルカルテのオーダーCRUD。ORCAマスタ参照・適用病名チェック・ORCA送信連動は未実装。  
- **ギャップ**: 実 ORCA への会計送信経路が欠落。`/orca/claim/outpatient` はローカル集計に留まり、ORCA 側の請求データ/伝票番号が発行されないため後続の会計・帳票が繋がらない。

### 2.3 会計処理（請求確認・収納）
- **表示部**: `web-client/src/features/charts/OrcaSummary.tsx`  
  - `/orca/claim/outpatient` の返却バンドルを会計ステータス（会計待ち/会計済み）として表示。  
  - 収納情報は ORCA 追加API `/api01rv2/incomeinfv2` を XML POST し表示（`orcaIncomeInfoApi.ts`）。  
  - `ORCA_QUEUE_STALL_THRESHOLD_MS` を用いたキュー遅延判定のみで、実キュー再送は `/api/orca/queue` の retry/discard（ローカルキュー管理）に限定。  
- **ORCA状況**: WebORCA Trial では請求を発行していないため `incomeinfv2` はデータなし/警告になるケースが多い（Api_Result 未確認含む）。  
- **ギャップ**: 収納確定・領収書番号連携・会計済み遷移を操作する UI/処理が存在しない。ORCA 側での請求送信が未完了なため、会計・収納が成立しない。

### 2.4 処方箋発行（帳票）
- **実装**: `web-client/src/features/charts/print/useOrcaReportPrint.ts` + `orcaReportApi.ts`  
  - 印刷ダイアログで `prescriptionv2` ほか ORCA 帳票 API を選択可能。Data_Id 取得後、`/blobapi/{Data_Id}` で PDF を取得しプレビューに保存。  
  - 必須: 患者IDと伝票番号（Invoice_Number）。伝票番号は `incomeinfv2` 取得結果から選択する想定。  
- **ORCA状況**: 2026-01-12 実測で prescriptionv2 は Api_Result=0001（帳票データなし）となり PDF 取得不可（`docs/DEVELOPMENT_STATUS.md` 記録）。原因は請求未作成による Data_Id 欠落。  
- **ギャップ**: (1) 伝票番号を自動取得するフローが会計処理未実装で塞がれている。(2) Data_Id 取得失敗時の代替（ローカル印刷/再送指示）が無い。(3) ORCA Trial では必要データが欠落するため、実環境検証が未実施。

## 3. ORCA 接続状況サマリ（最新ログより抜粋）
- 受付/システム系: `acceptlstv2` class=01 → Api_Result=21（受付なし）, `system01lstv2` → Api_Result=00, `manageusersv2` → Api_Result=0000（2026-01-12 WebORCA Trial）。  
- 帳票: `prescriptionv2` → Api_Result=0001（帳票データなし）。  
- 追加API: patientmemomodv2 は Trial 側 502 で未搭載疑い。  
- 予約/受付ラッパー: `/orca/appointments/list` `/orca/visits/list` は server-modernized で実装済み・runId/traceId 透過済み（2026-01-14 更新）。

## 4. 主な課題・リスク
- 受付業務で最重要な「予約外患者の当日受付登録/取消」が未実装。ORCA の acceptmodv2 連携が無く、受付リストは参照専用。  
- 診療終了後の「ORCA送信」がローカル集計に留まっており、ORCA 側に請求・伝票が生成されない。会計・処方箋発行が連鎖的にブロック。  
- ORCA 帳票（処方箋等）は伝票番号/Data_Id 依存だが、現状のフローでは取得できず失敗する。  
- WebORCA Trial で不足している API/帳票データ（patientmemomodv2, prescriptionv2 等）があり、本番相当の確認が未完。  
- キュー再送/決済確定など「例外時の次の一手」を UI で誘導する導線が不足。

## 5. 優先アクション案（会計は「ORCAへ送信できれば十分」という前提で再整理）
1) 受付機能拡充: `ReceptionPage` に当日受付登録/取消を追加し、`/orca/visits/mutation`（acceptmodv2）を接続。予約外患者ID入力と保険/自費選択を必須化。  
2) **最優先: ORCA 請求送信の実装**  
   - ChartsActionBar の「ORCA送信」を ORCA公式請求経路（例: `/api21/medicalmodv2` + `/api21/medicalmodv23`、必要なら `/api01rv2/acsimulatev2`）へ接続し、Api_Result / Invoice_Number / Data_Id を取得。  
   - 送信結果（Api_Result/Api_Result_Message/Invoice_Number/Data_Id）を Reception/OrcaSummary に反映し、送信済みであれば会計完了扱いとする。ローカル会計処理は不要。  
3) 収納/再計算 UI の簡素化: ORCA送信が成功したらステータスを「会計済み」へ更新し、`incomeinfv2` は確認用リフレッシュボタンのみ（強制取得が必要な場合に限定）。  
4) 処方箋発行の復旧: 送信で得た Invoice_Number / Data_Id をそのまま `prescriptionv2` へ渡す。取得できない場合は「ORCA未送信/伝票なし」のエラー表示に留め、ローカル印刷はオプション扱い。  
5) E2E/結合テスト: 受付→診療終了→ORCA送信→帳票出力（処方箋）までを Playwright で追加し、Api_Result と Invoice_Number/Data_Id の受渡しのみを検証対象に簡素化。  
6) 実環境検証: WebORCA Trial で不足する Data_Id/帳票は実機 ORCA での送信結果確認を計画（`ORCA_CERTIFICATION_ONLY.md` に沿う）。
