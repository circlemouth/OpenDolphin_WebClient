# 08 WEB：処置/検査/指示オーダー入力調査

RUN_ID: 20251228T233301Z

## 参照
- docs/DEVELOPMENT_STATUS.md
- src/order_input_gap_analysis/00_RUN_IDと調査範囲確定.md
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/OrderBundleEditPanel.tsx
- web-client/src/features/charts/orderBundleApi.ts
- client/src/main/java/open/dolphin/order/BaseEditor.java
- client/src/main/java/open/dolphin/order/BaseView.java
- client/src/main/java/open/dolphin/order/resources/BaseView_ja.properties
- client/src/main/java/open/dolphin/order/resources/BaseEditor_ja.properties
- client/src/main/java/open/dolphin/order/RadEditor.java
- client/src/main/java/open/dolphin/order/RadView.java
- client/src/main/java/open/dolphin/order/resources/RadView_ja.properties
- client/src/main/java/open/dolphin/order/resources/RadEditor_ja.properties
- client/src/main/java/open/dolphin/order/AbstractStampEditor.java
- client/src/main/java/open/dolphin/order/EditorSetPanel.java
- client/src/main/java/open/dolphin/stampbox/StampTreePopupAdapter.java
- client/src/main/java/open/dolphin/impl/care/OrderHistoryPanel.java

## モダナイズ版（Web）処置/検査/指示オーダー入力フロー整理
- 入口: Charts 右固定メニュー → 「オーダー編集」→ 右パネルで入力 (OrderBundleEditPanel, entity=generalOrder)。
- 補助入口: 「検査オーダー」は右パネルでメッセージ表示のみ（検索・登録 UI 未実装）。
- 画面構成（オーダー編集）:
  - オーダー名、用法、回数、開始日、メモ。
  - 項目: 項目名・数量・単位の繰り返し行。追加ボタンで行追加、行の✕で削除。
  - 登録済み一覧: 既存オーダー束を表示し、編集/削除が可能。
- 保存フロー:
  - 「追加する/更新する」で /orca/order/bundles に create/update。
  - 保存成功で入力フォームを初期化し、一覧を再取得。
  - 「新規入力」でフォーム初期化（キャンセル相当）。
- ブロック条件:
  - readOnly / missingMaster / fallbackUsed が true の場合は編集不可。
  - patientId 未選択の場合はパネルを表示せずメッセージのみ。
- 入力必須:
  - オーダー名のみ必須（空欄はエラー）。
  - 項目は空欄行が保存時に除外されるが、0件でも保存可能。

## 旧来版との差分ポイント（処置/検査/指示）
- 入力補助:
  - 旧来版は点数マスタ検索（RT/部分一致）とセットテーブル編集で追加。
  - Web は検索/マスタ参照 UI がなく、手入力のみ。
- セット入力/部位検索:
  - 旧来版はスタンプツリー、セットテーブルの Drag & Drop、RadEditor の部位検索ボタンがある。
  - Web はスタンプ操作/部位検索/UI ガイドがなく、1フォームに手入力。
- 複数行編集:
  - 旧来版はセットテーブルで行の並べ替え/削除/クリアが可能。
  - Web は行追加/削除は可能だが並べ替え/一括クリアは未実装。
- 履歴コピー/入力補助:
  - 旧来版はオーダ履歴コピー、スタンプのコピー/ペーストが可能。
  - Web は履歴コピーやスタンプ複製 UI は未実装。
- 必須判定:
  - 旧来版は entity ごとに「診療行為/部位/その他が1件以上」などの必須判定。
  - Web はオーダー名必須のみで、項目必須判定はない。

## 差分表（処置/検査/指示オーダー入力）

| 項目名 | 入力方式 | 必須条件 | 保存挙動 | コード参照 |
| --- | --- | --- | --- | --- |
| Web: オーダー編集の入口 | 右固定メニュー「オーダー編集」ボタン | なし | 右パネルを開きフォーム表示 | web-client/src/features/charts/pages/ChartsPage.tsx |
| Web: 検査オーダー（右固定メニュー） | ボタン（右パネル起動） | なし（入力UI未実装） | メッセージと移動導線のみ | web-client/src/features/charts/pages/ChartsPage.tsx |
| Web: オーダー名 | テキスト入力 | 空欄不可 | 保存時に bundleName として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 用法 | テキスト入力 | 任意 | admin として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 回数 | テキスト入力（初期値 1） | 任意 | bundleNumber として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 開始日 | 日付入力（初期値: 当日） | 任意 | startDate として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: メモ | テキストエリア | 任意 | memo として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 項目 追加 | 「追加」ボタンで行追加 | 任意 | 空欄行は保存時に除外 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 項目 名称 | テキスト入力 | 任意 | items[].name として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 項目 数量 | テキスト入力 | 任意 | items[].quantity として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 項目 単位 | テキスト入力 | 任意 | items[].unit として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 追加/更新 | 送信ボタン | オーダー名必須 / ブロック条件で無効 | /orca/order/bundles に create/update | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 削除 | 一覧の削除ボタン | ブロック条件で無効 | /orca/order/bundles に delete | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 新規入力（リセット） | 「新規入力」ボタン | なし | フォーム初期化（未保存） | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| 旧来: セットテーブル（コード/診療内容/数量/単位） | 検索結果行の選択で追加、数量はセル編集 | 診療行為またはその他が1件以上（entity 条件あり） | 「展開/展開継続」でカルテへ展開 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: コメント入力（診療内容列） | コメントコード行の診療内容セルを直接編集 | コメントコード 81/83/85/86 のみ編集可 | セット内の行として保存 | client/src/main/java/open/dolphin/order/AbstractStampEditor.java |
| 旧来: 数量 | セットテーブルの数量セル編集 | コメントコード 82 は編集不可 | セット内の数量として保存 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: スタンプ名 | テキスト入力 | 空欄時は手技名を補完 | スタンプ名として保存 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: 回数（bundle 回数） | ドロップダウン選択 | 任意 | バンドル回数として保存 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: 検索テキスト/RT/部分一致 | テキスト入力 + チェックボックス | RT 有効時は入力中検索 | 検索結果テーブルへ反映 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: RadEditor 部位検索ボタン | ボタン押下で部位コードを検索 | - | 検索結果テーブルへ反映 | client/src/main/java/open/dolphin/order/RadEditor.java |
| 旧来: スタンプ保存（新規/置換） | 右矢印ボタン | - | スタンプボックスへ保存 | client/src/main/java/open/dolphin/order/EditorSetPanel.java |
| 旧来: スタンプ取り込み（インポート） | 左矢印ボタン | - | スタンプボックスからセットへ取込 | client/src/main/java/open/dolphin/order/EditorSetPanel.java |
| 旧来: スタンプツリーのコピー/ペースト | 右クリックメニュー | entity 一致が必要 | スタンプを複製 | client/src/main/java/open/dolphin/stampbox/StampTreePopupAdapter.java |
| 旧来: オーダ履歴コピー | Ctrl/Cmd+C または右クリック | 選択行が必要 | クリップボードへテキストコピー | client/src/main/java/open/dolphin/impl/care/OrderHistoryPanel.java |

## 差分まとめ（処置/検査/指示）
- Web はオーダー名以外は任意入力で、項目の必須判定がない。
- 旧来版のマスタ検索・部位検索・ドラッグ&ドロップ等の入力補助が Web では未提供。
- Web の保存はオーダー束 API に限定され、カルテ展開/スタンプ保存/展開継続は未実装。
- Web では readOnly/missingMaster/fallbackUsed 時に一括ブロックし、旧来版には同等の UI ブロック概念がない。
