# ORCA 追加API 実装ノート

更新日: 2026-01-12
RUN_ID: 20260112T231511Z

## 目的
モダナイズ版サーバーで追加実装した ORCA API の仕様参照・運用ルールをまとめる。
Phase2 ドキュメントは Legacy/Archive のため、本メモを現行参照とする。

## 共通ルール
- ORCA HTTP は `OrcaHttpClient` を共通層として利用する。
- WebORCA の場合は `/api` プレフィックスを付与する（ON/OFF は環境設定で切替）。
- リクエストは原則 xml2（`application/xml; charset=UTF-8`）。帳票と `pusheventgetv2` は JSON 応答。
- `Api_Result` が 0 のみで構成される場合（例: `00`, `000`, `0000`）を成功とみなす。
- `Api_Result` が一時的な排他/処理中と判定される場合は短いバックオフで最大 2 回リトライ。
- 通信エラーは指数バックオフで最大 3 回リトライ。4xx はリトライしない。

## WebORCA /api プレフィックス
- ORCA 基本 URL が WebORCA の場合は `/api` を自動付与する。
- 例: `https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2`

## 帳票 (report_print) / blobapi
- 帳票 API は JSON 応答。PDF 出力モードの場合 `Data_Id` が返る。
- `Data_Id` を使って `/blobapi/{Data_Id}` を GET し、zip 内の PDF を取り出して返却する。
- PDF 生成待ちのため blobapi は短い間隔で数回リトライする。

## API 一覧（xml2 / JSON）

### 患者情報
- patientgetv2: GET `/api01rv2/patientgetv2`（xml2/JSON）
- patientmodv2: POST `/orca12/patientmodv2?class=XX`（xml2）

### 診療（中途/取得）
- medicalmodv2: POST `/api21/medicalmodv2?class=XX`（xml2）
- tmedicalgetv2: POST `/api01rv2/tmedicalgetv2`（xml2）
- medicalgetv2: POST `/api01rv2/medicalgetv2`（xml2）
- medicalmodv23: POST `/api21/medicalmodv23`（xml2）

### 病名
- diseasegetv2: POST `/api01rv2/diseasegetv2`（xml2）
- diseasev3: POST `/orca22/diseasev3`（xml2）

### 収納
- incomeinfv2: POST `/api01rv2/incomeinfv2`（xml2）

### 症状詳記
- subjectiveslstv2: POST `/api01rv2/subjectiveslstv2`（xml2）
- subjectivesv2: POST `/orca25/subjectivesv2?class=XX`（xml2）

### 禁忌・コード変換
- contraindicationcheckv2: POST `/api01rv2/contraindicationcheckv2`（xml2）
- medicationgetv2: POST `/api01rv2/medicationgetv2`（xml2）

### マスタ/システム
- medicatonmodv2: POST `/orca102/medicatonmodv2?class=XX`（xml2）
- masterlastupdatev3: POST `/orca51/masterlastupdatev3`（xml2、空リクエスト可）
- systeminfv2: POST `/api01rv2/systeminfv2`（xml2）
- system01dailyv2: POST `/api01rv2/system01dailyv2`（xml2）
- insuranceinf1v2: POST `/api01rv2/insuranceinf1v2`（xml2）

### セット
- medicalsetv2: POST `/orca21/medicalsetv2`（xml2）

### 患者メモ
- patientlst7v2: POST `/api01rv2/patientlst7v2`（xml2）
- patientmemomodv2: POST `/orca06/patientmemomodv2`（xml2）

### PUSH通知
- pusheventgetv2: POST `/api01rv2/pusheventgetv2`（JSON 応答）

### 帳票（外来）
- prescriptionv2: POST `/api01rv2/prescriptionv2`（JSON 応答）
- medicinenotebookv2: POST `/api01rv2/medicinenotebookv2`（JSON 応答）
- karteno1v2: POST `/api01rv2/karteno1v2`（JSON 応答）
- karteno3v2: POST `/api01rv2/karteno3v2`（JSON 応答）
- invoicereceiptv2: POST `/api01rv2/invoicereceiptv2`（JSON 応答）
- statementv2: POST `/api01rv2/statementv2`（JSON 応答）

## 仕様リンク（公式）
- Overview: `/receipt/tec/api/overview.html`
- patientgetv2: `/receipt/tec/api/patientget.html`
- patientmodv2: `/receipt/tec/api/patientmod.html`
- medicalmodv2: `/receipt/tec/api/medicalmod.html`
- medicalgetv2: `/receipt/tec/api/medicalinfo.html`
- diseasegetv2: `/receipt/tec/api/disease.html`
- diseasev3: `/receipt/tec/api/diseasemod2.html`
- incomeinfv2: `/receipt/tec/api/shunou.html`
- subjectiveslstv2: `/receipt/tec/api/subjectiveslst.html`
- subjectivesv2: `/receipt/tec/api/subjectives.html`
- contraindicationcheckv2: `/receipt/tec/api/contraindication_check.html`
- medicationgetv2: `/receipt/tec/api/medicationgetv2.html`
- insuranceinf1v2: `/receipt/tec/api/insurance_list.html`
- systeminfv2: `/receipt/tec/api/systemstate.html`
- system01dailyv2: `/receipt/tec/api/system_daily.html`
- masterlastupdatev3: `/receipt/tec/api/master_last_update.html`
- patientlst7v2: `/receipt/tec/api/patient_memo_list.html`
- patientmemomodv2: `/receipt/tec/api/patientmemomodv2.html`
- medicalmodv23: `/receipt/tec/api/first_calculation_date.html`
- medicalsetv2: `/receipt/tec/api/setcode.html`
- pusheventgetv2: `/receipt/tec/api/pusheventget.html`
- medicatonmodv2: `/receipt/tec/api/medicatonmod.html`
- report_print: `/receipt/tec/api/report_print/`
