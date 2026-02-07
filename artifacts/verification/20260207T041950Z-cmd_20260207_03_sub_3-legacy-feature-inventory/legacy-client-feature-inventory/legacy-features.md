# 旧来版クライアント 主要機能棚卸し（根拠付き）

- RUN_ID: 20260207T041950Z-cmd_20260207_03_sub_3-legacy-feature-inventory
- 探索範囲（確定）: `OpenDolphin_WebClient/client/`（Java/Swing の旧来クライアント実装）
- 目的: WEBクライアント突合用に、旧来版が持つ主要機能を「大項目→小項目」で一覧化し、各項目に根拠（コード/リソースの所在）を添える
- 注記:
  - 本書は「コード/リソースからの棚卸し」であり、実機での画面確認・実データ動作確認は含まない
  - 根拠が見つからないものは「不明」とし、追加で必要な証跡を併記する

## 0. 旧来版クライアントの所在（探索結果）

- 旧来版（既存）クライアント実装は、`OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/` を中心に存在
  - メインウィンドウ: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`
  - 受付/患者検索/予定カルテ/ラボ受信などの「メインタブ」プラグイン群: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/**`

## 1. ログイン/起動

- ログインダイアログ
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（LoginDialog を起動し AUTHENTICATED でサービス開始）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/login/LoginDialog.java`（所在）

- 起動時サービス（受付受信/CLAIM送信/MML送信/受付リレー）
  - 受付受信サーバ（PVTServer）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（`Project.USE_AS_PVT_SERVER` で `startPvtServer()`）
  - CLAIM送信（会計連携）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（`Project.SEND_CLAIM` で `startSendClaim()`）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/claim/SendClaimImpl.java`
  - MML送信
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（`Project.SEND_MML` で `startSendMml()`）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/mml/SendMmlImpl.java`
  - 受付リレー（ディレクトリへ中継）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（`Project.PVT_RELAY` で `PVTRelayProxy` 登録）

## 2. 受付

- 受付リスト（来院リスト）
  - 表示カラム（受付番号/患者ID/来院時間/氏名/性別/保険/生年月日/担当医/診療科/予約/メモ/状態）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java`（`NAME=\"受付リスト\"` とカラム定義）
  - 状態アイコン（カルテopen/CLAIM修正/CLAIM送信済 等）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java`（`chartBitArray` / `chartIconArray`）
  - 受付フィルタ（例: 診療行為送信済を隠す）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/pvt/resources/WatingListImpl.properties`（`Hide Sent Clinical Accounting`）

- 受付情報とカルテの結線
  - 受付（PVT）からカルテを開く前提の文言
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/labrcv/NLaboTestImporter.java`（受付を通していない場合の扱いコメント/ダイアログ文言）

- 受付バーコード対応
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java`（`受付バーコード対応` コメント・`barcodeDialog`）
  - 不明点: 実際のバーコード入力仕様（データ形式/運用手順/画面遷移）
    - 追加証跡: 運用資料、または実機での画面キャプチャ

## 3. 患者一覧/検索

- 患者検索（患者一覧）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/psearch/PatientSearchImpl.java`（`患者検索PatientSearchPlugin`）
  - 機能: テーブル表示、年齢表示トグル、コピー、（条件次第で）一括表示や権限制御の分岐
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/psearch/PatientSearchImpl.java`

- 予定カルテ（予約/未来日）一覧
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java`（`予定カルテ対応`）
  - 機能: 予定日の患者一覧、未来処方適用、CLAIM送信アクションの存在
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java`（`applyRpAction` / `claimAction`）

## 4. カルテ（閲覧/編集/履歴）

- カルテの中核（編集・表示）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/ChartImpl.java`
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/KarteEditor.java`
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/KarteViewer2.java`

- 文書（カルテ）履歴
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/DocumentHistory.java`

- サマリー（自由記載）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/pinfo/FreeDocument.java`（タイトル: サマリー、印刷/保存あり）

## 5. オーダー/入力支援（スタンプ）

- スタンプ箱（StampBox）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java`（ログイン後に `StampBoxPlugin` を起動）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampBoxPlugin.java`

- スタンプのエクスポート/インポート（運用支援）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/UserStampBoxExportImporter.java`

- スタンプ編集（処方/注射/画像/検査/処置/病名などのエディタ群）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/EditorSetPanel.java`（`AbstractStampEditor` 群を束ねる）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/RpEditor.java`（処方）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/InjectionEditor.java`（注射）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/RadEditor.java`（放射線）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/DiseaseEditor.java`（病名）

- 点数/マスタ検索（ORCA連携）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/BaseEditor.java`（`OrcaDelegaterFactory.create()` で `getTensuMasterBy*` を呼び分け）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/MasterItem.java`（手技/材料/薬剤/用法/部位 の classCode を保持）

- 文章入力支援（スタンプ補完）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/AbstractCodeHelper.java`（modifier+Space/Enter で StampTree からポップアップ補完）

## 6. 画像/シェーマ

- シェーマ編集（描画）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schema/SchemaEditorImpl.java`（線/塗り/テキスト/undo 等の編集UIを構築）

- 画像ブラウザ（複数実装を選択）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/img/ImageBrowserProxy.java`（Default/TFS/Unitea/FCR を Project 設定で切替）
  - 根拠（実装群の所在）: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/img/`

## 7. 検査（ラボ）

- ラボ受信（ファイル取り込み）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/labrcv/NLaboTestImporter.java`（`DAT/HL7/TXT/CSV` 等のファイル取り込み）

- ラボ結果表示（テーブル＋グラフ）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/lbtest/LaboTestPanel.java`（JFreeChart 使用）

- ラボ結果の印刷/PDF出力
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/lbtest/LaboTestOutputPDF.java`（PDF生成）

- Falco連携（HL7）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/falco/HL7Falco.java`
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/falco/FalcoSender.java`
  - 不明点: 実運用条件（接続先/フロー/画面）
    - 追加証跡: 運用資料 or 設定サンプル

## 8. 会計/帳票（CLAIM/印刷）

- CLAIM送信（会計連携）
  - クライアント側ソケット送信（ACK/NAK・リトライ・キュー）
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/claim/SendClaimImpl.java`
  - カルテ保存からCLAIM生成・送信イベント通知
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/ClaimSender.java`

- カルテPDF出力（保存時）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/KartePDFSender.java`（`Project.KARTE_PDF_SEND_AT_SAVE`）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/letter/KartePDFMaker.java`

- 紹介状/診断書（文書）
  - 紹介状
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/letter/LetterImpl.java`
  - 診断書
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java`
  - PDF出力基盤
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/letter/*PDFMaker*.java`

## 9. 各種マスタ/管理/設定

- 施設/ユーザー管理
  - 施設情報の編集、ユーザー追加、ユーザー一覧
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java`
  - パスワード変更/プロフィール変更
    - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/profile/ChangePasswordImpl.java`

- 接続/会計連携設定（プロパティシート類）
  - 根拠（設定Bean）: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/project/ConnectionSettingBean.java`
  - 根拠（会計/CLAIM設定Bean）: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/project/ClaimSettingBean.java`
  - 根拠（プロジェクト設定ダイアログ）: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/project/ProjectSettingDialog.java`

## 10. ショートカット/操作性

- メニューのキーボードショートカット（Accelerator）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/WindowsMenuFactory.java`（`setAccelerator(...)`）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/MacMenuFactory.java`（`setAccelerator(...)`）

- スタンプ補完ショートカット（modifier+Space/Enter）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/AbstractCodeHelper.java`

## 11. 運用（バックアップ等）

- スタンプ箱のエクスポート/インポート（運用移行の一部として利用可能）
  - 根拠: `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/UserStampBoxExportImporter.java`

- アプリ/DBバックアップ（不明）
  - 本探索範囲（旧来クライアント実装）では「DBバックアップ/リストア」や「データ退避運用」を直接示す実装・運用手順は未特定
  - 追加証跡:
    - 運用手順書（院内運用、サーバ側バックアップジョブ、DB dump手順）
    - もしくは `OpenDolphin_WebClient/ops/` 配下の運用資料で「旧来版運用」と明確に紐づくもの
