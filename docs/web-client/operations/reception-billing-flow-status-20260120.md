# 受付→診療終了後オーダー確認→会計→処方箋発行 フロー実装状況  
RUN_ID=20260120T091753Z（作成日: 2026-01-20）  
更新: 2026-01-21（RUN_ID=20260121T134718Z）

## 1. 目的と対象
- モダナイズ版 Web クライアント上で、事務員が行う一連の外来業務（予約/予約外受付 → 診療終了後のオーダー確認・送信 → 会計処理 → 処方箋発行）の実装状況と ORCA 利用状況を整理する。  
- 対象コード: `web-client/src/features/reception/*`, `web-client/src/features/charts/*`, `web-client/src/features/outpatient/*`。  
- 参照ログ: `docs/DEVELOPMENT_STATUS.md`（2026-01-13 以降のORCA試験結果）。

## 2. 業務フロー別の現状

### 2.1 受付（予約・予約外/当日受付）
- **UI実装**: `web-client/src/features/reception/pages/ReceptionPage.tsx`  
  - /orca/appointments/list と /orca/visits/list を React Query で取得し、ステータス別リスト（受付中/診療中/会計待ち/会計済み/予約）に表示。  
  - 行ダブルクリックで `buildChartsUrl` を用いて同一 RUN_ID で Charts へ遷移。  
  - 予約外当日受付の登録/取消フォームを追加し、`/orca/visits/mutation`（acceptmodv2, Request_Number=01/02）を実行。Api_Result=00/21 をバナーとリストへ即時反映。  
- **バックエンド接続**: `web-client/src/features/reception/api.ts` が `/orca/appointments/list`（appointlstv2）、`/orca/visits/list`（visitptlstv2）、`/orca/visits/mutation`（acceptmodv2）に接続。preferredSource は `VITE_DISABLE_MSW` に依存。  
- **ORCA状況**: WebORCA Trial では `/api/orca11/acceptmodv2` が 200 応答するケースがある一方、POST 制約やデータ前提で不安定になりやすい。E2E は MSW 前提で実施する方針。  
- **ギャップ**: Trial 実環境での安定した受付登録は未確認（DB前提/制約の影響）。MSW での E2E 証跡採取が残件。

### 2.2 診療終了後のオーダー確認・送信（Charts）
- **送信ボタン実装**: `web-client/src/features/charts/ChartsActionBar.tsx`  
  - 「ORCA送信」: ORCA 公式経路 `/api21/medicalmodv2`（XML）へ送信し、Api_Result/Invoice_Number/Data_Id を取得。送信結果は `orcaClaimSendCache` に保存し、Reception/OrcaSummary/帳票導線で参照。  
  - 「診療終了」: `/api21/medicalmodv23` を後続で実行（結果は参考扱い）。必須項目（Patient_ID/Department_Code/日付）が欠けると警告を出し送信スキップ。  
  - 送信失敗時はバナー・監査ログ・再送キュー（ローカル）に反映。  
  - 証跡: `artifacts/webclient/orca-e2e/20260121/claim-send/`。  
- **オーダー編集**: `web-client/src/features/charts/OrderBundleEditPanel.tsx` + `/orca/order/bundles`（サーバー内製）でローカルカルテのオーダーCRUD。ORCA マスタ参照は実装済みだが、ORCA送信との業務連動は別途整理が必要。  
- **ギャップ**: Trial での Data_Id 実取得は未確認。再送キューはローカル管理のため、実 ORCA との突合せは運用検証が必要。

### 2.3 会計処理（請求確認・収納）
- **表示部**: `web-client/src/features/charts/OrcaSummary.tsx`  
  - `/api21/medicalmodv2` 送信結果（Invoice_Number）をベースに会計ステータス（会計待ち/会計済み）を決定。  
  - 収納情報は ORCA 追加API `/api01rv2/incomeinfv2` を XML POST し、手動リフレッシュで表示（`orcaIncomeInfoApi.ts`）。  
  - `ORCA_QUEUE_STALL_THRESHOLD_MS` を用いたキュー遅延判定のみで、実キュー再送は `/api/orca/queue` の retry/discard（ローカルキュー管理）に限定。  
  - 証跡: `artifacts/webclient/orca-e2e/20260122/billing-status/`。  
- **ORCA状況**: WebORCA Trial では請求データが不足し `incomeinfv2` が空/警告になるケースがある。  
- **ギャップ**: 実 ORCA での会計確定・領収書番号の突合せは未確認。

### 2.4 処方箋発行（帳票）
- **実装**: `web-client/src/features/charts/print/useOrcaReportPrint.ts` + `orcaReportApi.ts`  
  - 印刷ダイアログで `prescriptionv2` ほか ORCA 帳票 API を選択可能。Data_Id 取得後、`/blobapi/{Data_Id}` で PDF を取得しプレビューに保存。  
  - 必須: 患者IDと伝票番号（Invoice_Number）。送信結果の Invoice_Number/Data_Id を直接参照し、Data_Id 未取得時は明示エラーとローカル印刷案内を表示。  
  - 証跡: `artifacts/webclient/orca-e2e/20260122/prescription/`。  
- **ORCA状況**: Trial では prescriptionv2 が Api_Result=0001 になるケースがあり、Data_Id 取得は不安定。  
- **ギャップ**: 実 ORCA での Data_Id 取得→帳票プレビューの実測が未完。

## 3. ORCA 接続状況サマリ（最新ログより抜粋）
- 受付/システム系: `acceptlstv2` class=01 → Api_Result=21（受付なし）, `system01lstv2` → Api_Result=00, `manageusersv2` → Api_Result=0000（2026-01-12 WebORCA Trial）。  
- 帳票: `prescriptionv2` → Api_Result=0001（帳票データなし、Trial で確認）。  
- 追加API: patientmemomodv2 は Trial 側 502 で未搭載疑い。  
- 予約/受付ラッパー: `/orca/appointments/list` `/orca/visits/list` `/orca/visits/mutation` を Web クライアントから利用可能（acceptmodv2 は Trial 制約あり）。

## 4. 主な課題・リスク
- Trial 環境の制約により acceptmodv2 の安定実行が難しく、E2E 証跡は MSW 前提。  
- Trial で Data_Id が返らないケースがあり、帳票の実環境検証が必要。  
- キュー再送/決済確定など「例外時の次の一手」はローカルキュー中心のため、運用設計が残る。

## 5. 優先アクション案（会計は「ORCAへ送信できれば十分」という前提で再整理）
1) **MSW 前提の E2E 証跡採取**: 受付 acceptmodv2 の Playwright 証跡を `artifacts/webclient/orca-e2e/20260121/acceptmodv2/` に保存。  
2) 実環境検証: Data_Id/帳票の実送信確認を ORCA 実環境で計画（`ORCA_CERTIFICATION_ONLY.md` に沿う）。  
3) 例外時導線の補強: 再送・決済確定の運用導線を整理し、必要なら UI/運用手順を追加。
