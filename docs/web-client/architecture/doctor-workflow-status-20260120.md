# 医師業務フロー実装状況（RUN_ID=20260120T091852Z）

## 調査範囲と参照
- 対象: モダナイズ版 Web クライアントにおける「受付済み患者の診療開始→カルテ入力→オーダー→文書→印刷」までの UI / API 実装。
- 参照: `docs/DEVELOPMENT_STATUS.md`, `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`, 各実装コード（パスは本文記載）。
- 方法: コードリーディングと既存ドキュメント確認のみ（実ORCA接続は未実施）。

## サマリ
- 受付一覧〜カルテ起動、ORCA請求送信、ORCA帳票印刷は `/orca/*` 系エンドポイント経由で実装済み。
- SOAP本文・紹介状/診断書は **ブラウザ内（sessionStorage）保存のみでサーバー永続化なし**。ORCA送信とも未連携。
- ドキュメントタイムラインは受付/請求フラグと手動SOAP履歴を並べる構成で、実カルテ記録 `/api/karte/*` 取得は未実装。
- ORCA実機検証と病名/処方/オーダー CRUD のE2Eは未実施（`docs/DEVELOPMENT_STATUS.md` 懸念点に残存）。

## 実装詳細（業務フロー順）

### 1. 受付・患者選択
- 受付/予約リスト取得: `/orca/appointments/list` + `/orca/visits/list` を `fetchAppointmentOutpatients` で統合、missingMaster・cacheHit・dataSourceTransitionをバナー表示。`web-client/src/features/reception/pages/ReceptionPage.tsx`。
- 請求・キュー状態: `/orca/claim/outpatient` でバンドルとキューを取得し例外一覧を生成。`reception/api.ts`。
- Chartsへの遷移: 行ダブルクリックで `buildChartsUrl` を生成し runId を持ち回り。

### 2. カルテ基盤/コンテキスト
- Chartsは `encounterContext` に patientId/appointmentId/receptionId/visitDate を保持し、タブロック・runId・authFlags を BroadcastChannel 共有。`charts/pages/ChartsPage.tsx`, `charts/useChartsTabLock.ts`。
- `ChartsActionBar` が送信/診療終了/印刷/ロックを統括し、runId・traceIdを監査に記録。`charts/ChartsActionBar.tsx`。

### 3. SOAP/診療録入力
- `SoapNotePanel` はテンプレ挿入・セクション別保存を提供するが、保存先は **ページ状態＋sessionStorage(`opendolphin:web-client:soap-history:v2`) のみ**。サーバー/ORCA送信なし。`charts/SoapNotePanel.tsx`。
- 署名・診療終了フローとSOAP保存は連携していないため、送信しても本文はORCA/サーバーに渡らない。

### 4. 病名
- 参照: `/orca/disease/import/{patientId}`、更新: `/orca/disease`（JSON）。`charts/diseaseApi.ts` と `DiagnosisEditPanel.tsx` が CRUD を実行し監査ログを付与。
- ORCA原本確認: `OrcaOriginalPanel.tsx` から `diseasegetv2`/`medicalgetv2`/`tmedicalgetv2` を手動XML送信可。

### 5. オーダー・処方
- オーダー束 CRUD: `/orca/order/bundles`（JSON）で作成/更新/削除。`charts/OrderBundleEditPanel.tsx`。
- マスタ検索: `/orca/master/generic-class`, `/orca/master/youhou`, `/orca/master/material`, `/orca/master/kensa-sort`, `/orca/tensu/etensu` 等。`charts/orderMasterSearchApi.ts`。
- 禁忌チェック/コード変換: `/api01rv2/contraindicationcheckv2`、`/api01rv2/medicationgetv2` を XML 送信。`charts/contraindicationCheckApi.ts`, `charts/orcaMedicationGetApi.ts`。
- セット/スタンプ: ローカル保存＋サーバー stamp API を併用（`charts/stampApi.ts`）。

### 6. 患者基本情報・保険
- 患者検索: `/orca/patients/local-search`（mock併用）。`patients/api.ts`。
- 患者更新: `/orca12/patientmodv2/outpatient` を POST して ORCAへ反映。Patients/Charts両方から利用。
- 患者メモ: `/orca/patient/memo` 系は取得のみ、Trialでは 502 例あり（過去ログ参照）。

### 7. ORCA送信・会計
- ORCA請求送信: `ChartsActionBar` の「送信」で `/orca/claim/outpatient` POST。
- 診療終了: `/orca21/medicalmodv2/outpatient` に JSON POST。追従で `/api21/medicalmodv23` を XML 送信（必須フィールド不足時はスキップ）。
- キュー監視: `/api/orca/queue` ポーリング、`/api01rv2/pusheventgetv2` でpushイベント取得。`outpatient/orcaQueueApi.ts`, `outpatient/orcaQueueStatus.ts`。
- サマリ表示: `/orca21/medicalmodv2/outpatient` の応答を `OrcaSummary` で表示。`charts/api.ts`, `charts/OrcaSummary.tsx`。

### 8. タイムライン/監査
- `DocumentTimeline` は「受付エントリ + claimフラグ + ORCAキュー + 手動SOAP履歴」を統合表示。**実カルテ文書(`/api/karte/*`)の取得は未実装**。`charts/DocumentTimeline.tsx`。
- 監査ログは `logAuditEvent` で runId/dataSourceTransition/cacheHit/missingMaster を付与。

### 9. 文書作成（紹介状・診断書 等）
- `DocumentCreatePanel` で紹介状/診断書/返信書のテンプレ編集と保存を提供するが、保存先は **sessionStorage(`opendolphin:web-client:charts:document-history`) のみ**。サーバー保存・ORCA送信なし。`charts/DocumentCreatePanel.tsx`。
- 出力はローカルPDFプレビュー（`/charts/print/document`）に渡すだけで、ORCA帳票とは別経路。

### 10. 印刷・帳票
- 外来カルテ印刷/エクスポート: `ChartsActionBar` → `/charts/print/outpatient` へ遷移しブラウザ印刷。データは直前の選択エントリとバナーのみ（医療記録本文は含まれない）。`charts/print/outpatientClinicalDocument.tsx`。
- ORCA帳票印刷: `useOrcaReportPrint` から `/api01rv2/prescriptionv2` / `medicinenotebookv2` / `karteno1v2` / `karteno3v2` / `invoicereceiptv2` / `statementv2` を XML 送信し、`Data_Id` を `blobapi` で取得して PDF プレビュー。`charts/print/useOrcaReportPrint.ts`。
- 会計情報取得: 帳票入力補助に `/api01rv2/incomeinfv2` を利用。`charts/orcaIncomeInfoApi.ts`。

## ORCAエンドポイント利用一覧（主要のみ）
- 受付/予約: `/orca/appointments/list`, `/orca/visits/list`
- 請求/キュー: `/orca/claim/outpatient`(GET/POST), `/api/orca/queue`, `/api01rv2/pusheventgetv2`
- 診療情報取得: `/orca21/medicalmodv2/outpatient`
- 診療終了追送: `/api21/medicalmodv23`
- 病名: `/orca/disease/import/{patientId}`, `/orca/disease`
- オーダー: `/orca/order/bundles`; マスタ `/orca/master/*`, `/orca/tensu/etensu`; 禁忌 `/api01rv2/contraindicationcheckv2`; 薬剤変換 `/api01rv2/medicationgetv2`
- 患者: `/orca/patients/local-search`, `/orca12/patientmodv2/outpatient`
- 原本参照: `/api01rv2/diseasegetv2`, `/api01rv2/medicalgetv2`, `/api01rv2/tmedicalgetv2`
- 帳票: `/api01rv2/prescriptionv2`, `medicinenotebookv2`, `karteno1v2`, `karteno3v2`, `invoicereceiptv2`, `statementv2`, `/blobapi/{dataId}`, `/api01rv2/incomeinfv2`

## 主要な問題点 / リスク
1. SOAP・紹介状/診断書がブラウザ内保存のみでサーバー永続化も ORCA送信もなし。セッション跨ぎや他端末で参照不可。`charts/SoapNotePanel.tsx`, `charts/DocumentCreatePanel.tsx`。
2. タイムラインが受付/請求フラグ主体で、実カルテ文書・既存カルテ API 取得が未実装。医療記録の真正性・過去参照が担保されない。`charts/DocumentTimeline.tsx`。
3. 診療終了/ORCA送信は `/orca21/medicalmodv2/outpatient` に限定され、SOAP/オーダー本文との結合や署名データは送出していない。実診療データ不在のまま請求だけ送れるリスク。`charts/ChartsActionBar.tsx`。
4. 病名/オーダー CRUD の実運用検証・自動テスト未整備（`docs/DEVELOPMENT_STATUS.md` の懸念が継続）。入力バリデーションはクライアント実装のみでサーバー側保証は未確認。
5. ORCA 実環境での疎通・認証確認が未実施（Trialでの 502/404 例あり）。本番接続前に `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に沿った再検証が必要。
6. 帳票印刷はORCA帳票とローカル文書が分断され、カルテ本文（SOAP等）との突合が行われない。入力値（invoice番号等）も手入力で誤送信リスク。
7. 読取専用/ロック状態の実運用確認が不足。複数タブや並行編集時の競合解決は `useChartsTabLock` 依存だがE2E未確認。

## 推奨フォローアップ（抜粋）
- SOAP・文書を server-modernized 経由で永続化する API 実装と、ORCA送信フローへの紐付けを優先。
- タイムラインを `/api/karte/*` など実カルテAPIへ切替し、受付/請求データと統合した監査ログを取得。
- ORCA実機での end-to-end（受付→診療終了→帳票出力）試験と監査ログ確認を実施。
- 病名/オーダー CRUD・印刷・ロックに関する E2E/結合テストを追加し、`docs/DEVELOPMENT_STATUS.md` の懸念解消を記録。
