# Charts: 印刷/エクスポート（診療文書）実装ログ（RUN_ID=`20251217T233649Z`）

対象: `web-client` / Charts（外来・本番品質）  
タスク: `src/charts_production_outpatient/ux/26_印刷_エクスポート_診療文書.md`

## 目的
- “診療記録の出力” を商用要件として最低限実装し、印刷プレビュー（A4/余白/ヘッダ）と PDF 出力導線を整備する。
- 監査ログに “誰が・いつ・何を出力したか” を runId と紐づけて残す（現状は Web クライアント内の監査ログ蓄積）。
- 個人情報の取り扱い（画面/印刷）と、出力時の注意喚起（tone=warning）を整備する。

## 実装サマリ
- Charts アクションバーに **「印刷/エクスポート」** を追加し、患者選択済みの場合にプレビューページへ遷移する。
- プレビューページは A4 ページを模したレイアウト（余白・ヘッダ・フッタ）で表示し、`window.print()` により印刷/保存（PDF）を実行する。
- 出力操作（プレビューオープン、印刷開始、afterprint）を `recordChartsAuditEvent` で監査ログへ記録する。

## 追加/変更した主なファイル
- 画面/ルーティング
  - `web-client/src/AppRouter.tsx`: `/charts/print/outpatient` ルートを追加
  - `web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx`: 印刷プレビュー画面（警告バナー、印刷/PDFボタン）
  - `web-client/src/features/charts/ChartsActionBar.tsx`: 「印刷/エクスポート」導線と監査記録を追加
- 印刷レイアウト
  - `web-client/src/features/charts/print/outpatientClinicalDocument.tsx`: A4 レイアウトの診療文書（外来サマリ）テンプレ
  - `web-client/src/features/charts/print/printStyles.ts`: `@page size A4` と余白、screen/print の切替スタイル
- 監査/スキーマ
  - `web-client/src/features/charts/audit.ts`: `details.actor` を許可し、PRINT_OUTPATIENT に出力者情報を追加
  - `web-client/src/libs/audit/auditLogger.ts`: UI state action に `print` を追加
  - `web-client/src/libs/auth/storedAuth.ts`: localStorage から `facilityId/userId` を読み `actor` を解決するヘルパ
- テスト
  - `web-client/src/features/charts/__tests__/chartsAccessibility.test.tsx`: ルータ依存追加に伴い `MemoryRouter` でラップ
  - `web-client/src/features/charts/__tests__/chartsPrintAudit.test.ts`: PRINT_OUTPATIENT の監査 payload を検証

## 仕様メモ
- **PDF 出力**: ブラウザ印刷ダイアログを利用し、「送信先: PDF に保存」を選ぶ方式。ファイル生成/ダウンロードの実装は行っていない（依存追加を避け、運用差分を減らすため）。
- **actor（出力者）解決**: `sessionStorage(opendolphin:web-client:auth)` を優先し、ログイン情報と乖離し得る `localStorage(devFacilityId/devUserId)` 依存を避ける。
- **リロード耐性**: `location.state` が失われるケースに備え、印刷プレビュー状態を `sessionStorage` に短期保存（最大10分）し復元できるようにした。出力後/閉じるで破棄する（PHI を含むため）。
- **個人情報の注意喚起**: プレビューページ上部に `ToneBanner tone="warning"` を表示し、画面共有/印刷物管理/破棄に関する注意を促す。印刷時は banner/ツールバーは非表示。
- **監査ログ**:
  - `subject=outpatient-document-preview`（プレビューを開いた）
  - `subject=outpatient-document-output`（印刷/PDF 出力開始・afterprint）
  - `details` には `runId`/`actor`/`patientId`/`appointmentId`/`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed` を含める。

## 未実施/今後
- サーバー側の永続監査テーブル（例: `d_audit_event`）への記録は未実装（現状の Web クライアント監査ログ/コンソール露出で暫定）。
- 文書内容は「外来サマリ」テンプレに留め、SOAP/検査/処方/文書オーダーなどの構造化出力は別タスクで拡張する。
