# Webクライアント ORCA 追加API 接続計画

更新日: 2026-01-13
RUN_ID: 20260113T064654Z

## 目的
モダナイズ版サーバーに追加実装された ORCA API を Web クライアントの業務画面へ段階的に接続するための計画を整理する。既存の Web クライアント実装を踏まえ、合理的な実装予定部位（画面・モジュール・API 層）を明示する。

## 参照ドキュメント（現行）
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/orca-additional-api-implementation-notes.md`（追加 API の仕様・ルール）

## 前提
- ORCA との通信は **server-modernized 経由**（Web クライアントから直叩きしない）。
- 既存の ORCA 通信（XML2/JSON）に合わせ、`httpFetch` + `observability` + `audit` を継承する。
- JSON 応答の API（帳票・pusheventgetv2）は XML2 と異なるエラーハンドリング/パース経路を設計する。

## 既存実装の確認（合理的な実装予定部位）
- ORCA 追加 API の手動検証 UI
  - `web-client/src/features/debug/OrcaApiConsolePage.tsx`
- 患者メモ連携（patientlst7v2 / patientmemomodv2）
  - `web-client/src/features/patients/patientMemoApi.ts`
  - `web-client/src/features/patients/PatientsPage.tsx`
- ORCA 原本パネル（diseasegetv2 / medicalgetv2 / diseasev3 / medicalmodv2）
  - `web-client/src/features/charts/OrcaOriginalPanel.tsx`
  - `web-client/src/features/charts/orcaDiseaseGetApi.ts`
  - `web-client/src/features/charts/orcaDiseaseModApi.ts`
  - `web-client/src/features/charts/orcaMedicalGetApi.ts`
  - `web-client/src/features/charts/orcaMedicalModApi.ts`
- 患者更新（/orca12/patientmodv2/outpatient）
  - `web-client/src/features/charts/PatientInfoEditDialog.tsx`
  - `web-client/src/features/charts/PatientsTab.tsx`
  - `web-client/src/features/patients/api.ts`
- ORCA キュー・送信状態
  - `web-client/src/features/outpatient/orcaQueueApi.ts`
  - `web-client/src/features/outpatient/orcaQueueStatus.ts`
  - `web-client/src/features/charts/ChartsActionBar.tsx`
  - `web-client/src/features/charts/DocumentTimeline.tsx`
- 印刷/出力 UI（現状はローカル印刷）
  - `web-client/src/features/charts/ChartsActionBar.tsx`
  - `web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx`
  - `web-client/src/features/charts/pages/ChartsDocumentPrintPage.tsx`
- ORCA API 一覧（外来系）
  - `web-client/src/libs/http/httpClient.ts`

## 接続計画（機能別）

### 1. 患者情報（patientgetv2 / patientmodv2 / patientlst7v2 / patientmemomodv2）
- **patientgetv2**
  - 予定部位: Patients 詳細の「ORCA 原本」/「参照」セクションを新設
  - 具体候補: `web-client/src/features/patients/PatientsPage.tsx` 内に原本表示パネルを追加
  - XML2/JSON どちらも取得可能にし、施設設定で切替（デフォルト XML2）
  - 検証導線: Debug ORCA API Console のテンプレ追加
- **patientmodv2**
  - 既存の `/orca12/patientmodv2/outpatient` と役割を整理
  - 予定方針: 画面の患者編集は既存の outpatient エンドポイントを維持し、**原本送信用**の patientmodv2 は「ORCA 原本パネル」内の保険/基本情報送信として扱う
- **patientlst7v2 / patientmemomodv2**
  - 既存実装を維持し、UI/メッセージの整合（runId/Api_Result/不足タグ表示）を強化
  - デフォルトの Base_Date/Perform_Date を `today` に固定（既存挙動に合わせる）

### 2. 診療（medicalgetv2 / tmedicalgetv2 / medicalmodv2 / medicalmodv23）
- 予定部位: Charts の「ORCA 原本」および診療送信フロー
  - 既存: `OrcaOriginalPanel` に medicalgetv2/medicalmodv2 がある
  - 追加: tmedicalgetv2 を原本パネルに追加（中途/最新の取得）
  - 追加: medicalmodv23 を「診療終了時の追加更新」扱いで `ChartsActionBar` 送信時の後段へ検討
- 画面連携:
  - 送信前チェックは `ChartsActionBar` の既存 guard を流用し、未保存/権限/マスタ欠損時は blocked
  - Api_Result と missingTags を ORCA 送信結果バナーへ反映

### 3. 病名（diseasegetv2 / diseasev3）
- 既存: `OrcaOriginalPanel` で diseasegetv2/diseasev3 を利用済み
- 追加方針:
  - Charts の病名編集（既存 `/orca/disease`）と ORCA 原本 API の対応表をドキュメント化
  - 原本取得結果を病名編集パネルへ「参照コピー」できるように拡張（将来）
  - 対応表: `docs/web-client/architecture/orca-disease-api-mapping.md`

### 4. 収納・症状詳記・禁忌・コード変換
- **incomeinfv2（収納）**
  - 予定部位: Charts の会計/請求サマリ（OrcaSummary）に「収納情報」サブパネルを追加
  - ORCA 送信前チェックと同じ UI トーンでデータ欠損・Api_Result を表示
- **subjectiveslstv2 / subjectivesv2（症状詳記）**
  - 予定部位: Charts SOAP エリア（S: 主観情報）に「症状詳記」タブを追加
  - 既存 SOAP の監査ログと同じ runId/traceId を付与
- **contraindicationcheckv2（禁忌チェック）**
  - 予定部位: OrderBundleEditPanel（処方/オーダー編集）で保存前にチェック
  - チェック結果を `ToneBanner` またはパネル内に警告表示
- **medicationgetv2（コード変換）**
  - 予定部位: オーダー入力時のコード補正/検索（OrderBundleEditPanel or Master Search API）
  - 既存 `orderMasterSearchApi` を拡張して変換/正規化に利用

### 5. マスタ・システム情報
- **medicatonmodv2 / masterlastupdatev3**
  - 予定部位: Administration の「ORCA マスタ」セクションに追加
  - masterlastupdatev3 で更新検知 → medicatonmodv2 の同期指示（将来）
- **systeminfv2 / system01dailyv2 / insuranceinf1v2**
  - system 系は Administration のヘルスチェック/バージョン表示へ統合
  - insuranceinf1v2 は Patients 画面の保険選択補助（保険者検索/候補提示）に接続
- **medicalsetv2（セットコード）**
  - 予定部位: OrderBundleEditPanel で「セット検索」機能に接続

### 6. PUSH通知（pusheventgetv2）
- 予定部位: Reception / Charts のステータス通知
  - `OrcaQueue` の UI に準拠して「新着 ORCA イベント」を表示
  - 既存の polling サイクル（30s）に合わせ、pusheventgetv2 を追従
- 仕様上の冪等化は server-modernized が担保（クライアントは Event summary を表示するのみ）

### 7. 帳票（prescriptionv2 / medicinenotebookv2 / karteno1v2 / karteno3v2 / invoicereceiptv2 / statementv2 / blobapi）
- 予定部位:
  - Charts の「印刷/出力」導線に ORCA 帳票の出力モードを追加
  - 既存 `ChartsActionBar` の「印刷」から帳票種別を選択 → `/api01rv2/*v2` を呼び出し
  - JSON 応答で `Data_Id` を受けた場合、`/blobapi/{Data_Id}` を取得して PDF を表示/保存
- PDF 表示戦略:
  - `charts/print/document` に PDF プレビュー専用モードを追加（既存の print ページを再利用）
  - 出力結果は `printPreviewStorage` と同様に runId で監査ログへ記録

## API 層設計（共通方針）
- XML2 API
  - `web-client/src/libs/xml/xmlUtils.ts` を共通利用
  - `Api_Result` と `Api_Result_Message` を統一的に抽出
- JSON API
  - 新規ユーティリティ（例: `orcaJsonUtils.ts`）で共通メタ抽出
  - `Data_Id` を含む帳票は blobapi 取得までを 1 つの API モジュールにまとめる
- 観測・監査
  - `observability` の `runId/traceId` を付与（`httpFetch` 経由）
  - `auditLogger` へ `ORCA_*` 系アクションを追加し、結果/blocked理由を保存

## UI/権限制御
- ORCA 接続を伴う操作は、既存の `session` 権限（admin/doctor/nurse/assistant）に合わせて制御
- 送信/更新/印刷の確認モーダルは既存の `ChartsActionBar` ルールを流用
- master 未同期（missingMaster/fallbackUsed）時は ORCA 送信を停止し、理由を明示

## テスト/検証計画（実装時）
- MSW 追加ハンドラ:
  - `web-client/src/mocks/handlers` に JSON/Blob 付き帳票レスポンスを追加
  - XML2 API 追加分のサンプル応答を整備
- UI テスト:
  - Charts 送信/印刷のガード（`ChartsActionBar`）
  - Patients 原本参照（patientgetv2）
  - 症状詳記/禁忌チェックの警告表示

## 非対象（本計画では実装しない）
- 実機 ORCA 接続の運用ログ取得（`docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` に従う別タスク）
- Phase2 Legacy ドキュメントの更新

## 次のアクション
1. 画面単位の優先度付け（Patients → Charts → Administration → Reception）
2. XML2/JSON API の共通パースユーティリティ設計
3. 帳票 PDF プレビューの UI 仕様確定
