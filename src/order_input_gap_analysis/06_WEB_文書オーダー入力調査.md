# 06 WEB：文書オーダー入力調査

RUN_ID: 20251228T223147Z

## 参照
- docs/DEVELOPMENT_STATUS.md
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/ChartsActionBar.tsx
- web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx
- web-client/src/features/charts/print/outpatientClinicalDocument.tsx
- web-client/src/features/charts/print/printPreviewStorage.ts
- client/src/main/java/open/dolphin/client/ChartImpl.java
- client/src/main/java/open/dolphin/letter/LetterImpl.java
- client/src/main/java/open/dolphin/letter/Reply1Impl.java
- client/src/main/java/open/dolphin/letter/Reply2Impl.java
- client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java
- client/src/main/java/open/dolphin/letter/resources/LetterView_ja.properties
- client/src/main/java/open/dolphin/letter/resources/MedicalCertificateView_ja.properties
- client/src/main/java/open/dolphin/letter/resources/Reply1View_ja.properties
- client/src/main/java/open/dolphin/letter/resources/Reply2View_ja.properties

## モダナイズ版（web-client）文書オーダー入力の現状

### 1) 文書登録（右固定メニュー）
- 画面: Charts 右固定メニュー → 「文書登録」
- 入力欄: なし（検索・登録 UI は未実装）
- 操作導線: 右パネルでメッセージ表示 → 「診療操作へ移動」「タイムラインへ移動」「ORCAサマリへ移動」
- 備考: 文書テンプレ選択 UI は存在しない
- 参照: web-client/src/features/charts/pages/ChartsPage.tsx

### 2) 印刷/プレビュー導線（診療文書デモ）
- 画面: Charts Action Bar → 「印刷/エクスポート」
- プレビュー: /charts/print/outpatient へ遷移（診療記録・外来サマリ）
- 出力: ブラウザの印刷ダイアログで印刷/PDF保存
- ガード条件（印刷前チェック）
  - 他操作進行中は不可
  - 患者未選択は不可
  - missingMaster=true は不可
  - fallbackUsed=true は不可
  - 認証情報未設定/権限不足は不可
- 文書種別: 「診療記録（外来サマリ）」のみ（デモ出力）
- 参照:
  - web-client/src/features/charts/ChartsActionBar.tsx
  - web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx
  - web-client/src/features/charts/print/outpatientClinicalDocument.tsx

## 旧来版（client）文書オーダー入力の現状

### 1) 新規文書作成（プラグイン/テンプレ選択）
- 画面: 新規文書作成ダイアログ
- テンプレ選択
  - プラグイン（NChartDocument）をリストアップ
  - OpenOffice .odt テンプレートをテンプレディレクトリから列挙
- 必須条件
  - リスト選択しない限り「選択」ボタンは無効
  - .odt 以外のテンプレートは対象外
- 代表的な文書プラグイン
  - 診療情報提供書（紹介状）: LetterImpl
  - 診断書: MedicalCertificateImpl
  - 紹介患者経過報告書: Reply1Impl
  - ご報告（返信書）: Reply2Impl
- 参照: client/src/main/java/open/dolphin/client/ChartImpl.java

### 2) 文書入力フォームと印刷/PDF作成
- 入力欄（例）
  - 紹介状: 紹介先医療機関名、紹介先診療科、患者氏名/性別/生年月日、病名、紹介目的、既往歴/家族歴、症状経過、検査結果、治療経過、現処方、備考 等
  - 診断書: 患者氏名/住所/性別/生年月日、病名、診断内容（証明文） 等
  - 返信書（経過報告）: 紹介元医療機関、担当、患者氏名、生年月日、所見 等
- 発行フロー
  - 各文書画面の「印刷」操作で PDF作成 or フォーム印刷を選択
  - PDF は Project.LOCATION_PDF 配下に保存
- 参照:
  - client/src/main/java/open/dolphin/letter/LetterImpl.java
  - client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java
  - client/src/main/java/open/dolphin/letter/Reply1Impl.java
  - client/src/main/java/open/dolphin/letter/Reply2Impl.java
  - client/src/main/java/open/dolphin/letter/resources/*View_ja.properties

## 旧来版との差分まとめ（文書種別・必須項目・発行フロー）

### 文書種別
- 旧来版: 紹介状/診断書/紹介患者経過報告書/ご報告（返信）/OpenOfficeテンプレなど複数種
- Web: 診療記録（外来サマリ）1種のみ（デモ）

### 必須項目
- 旧来版: 文書テンプレ/プラグイン選択が必須（未選択では進行不可）。各フォーム内の必須入力は画面実装依存。
- Web: 印刷/プレビュー前のガード条件（患者選択・missingMaster/fallbackUsed・認証情報）が明示され、満たさないと出力不可。

### 発行フロー
- 旧来版: 文書フォーム → 印刷操作 → PDF作成 or フォーム印刷（アプリ内フロー）
- Web: Charts Action Bar → 印刷/エクスポート → 印刷プレビュー画面 → ブラウザ印刷ダイアログ（PDF保存）

## 差分表（テンプレート準拠）

| 項目名 | 入力方式 | 必須条件 | 保存挙動 | コード参照 |
| --- | --- | --- | --- | --- |
| Web: 文書登録（右固定メニュー） | ボタン（右パネル起動） | なし（入力UI未実装） | 画面内で導線提示のみ | web-client/src/features/charts/pages/ChartsPage.tsx |
| Web: 印刷/エクスポート（Action Bar） | ボタン → 確認ダイアログ | 患者選択、missingMaster=false、fallbackUsed=false、認証情報OK、他操作中でない | /charts/print/outpatient へ遷移 | web-client/src/features/charts/ChartsActionBar.tsx |
| Web: 印刷プレビュー（診療記録/外来サマリ） | 印刷/ PDFボタン（ブラウザ印刷） | missingMaster=false、fallbackUsed=false、認証情報OK | window.print 呼び出し、セッションにプレビュー状態保存 | web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx |
| Web: 診療記録（外来サマリ）出力 | 固定テンプレート（入力欄なし） | プレビュー状態必須（state/meta） | 画面出力のみ（デモ） | web-client/src/features/charts/print/outpatientClinicalDocument.tsx |
| 旧来版: 新規文書作成（テンプレ/プラグイン選択） | リスト選択（プラグイン/.odt） | リスト選択必須 / .odtのみ対象 | プラグイン起動 or ODT差し込み文書作成 | client/src/main/java/open/dolphin/client/ChartImpl.java |
| 旧来版: 紹介状/返信/診断書フォーム | テキスト入力、日付入力 | 選択済み文書で入力可能（必須入力は画面依存） | 印刷時にPDF作成またはフォーム印刷 | client/src/main/java/open/dolphin/letter/LetterImpl.java |
| 旧来版: 診断書フォーム | テキスト入力、日付入力 | 選択済み文書で入力可能（必須入力は画面依存） | 印刷時にPDF作成またはフォーム印刷 | client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java |
| 旧来版: 紹介患者経過報告書フォーム | テキスト入力、日付入力 | 選択済み文書で入力可能（必須入力は画面依存） | 印刷時にPDF作成またはフォーム印刷 | client/src/main/java/open/dolphin/letter/Reply1Impl.java |
| 旧来版: ご報告（返信書）フォーム | テキスト入力、日付入力 | 選択済み文書で入力可能（必須入力は画面依存） | 印刷時にPDF作成またはフォーム印刷 | client/src/main/java/open/dolphin/letter/Reply2Impl.java |
