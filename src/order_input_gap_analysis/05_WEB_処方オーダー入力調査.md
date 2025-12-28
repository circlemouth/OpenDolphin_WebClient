# 05 WEB：処方オーダー入力調査

RUN_ID: 20251228T221313Z

## 参照
- docs/DEVELOPMENT_STATUS.md
- src/order_input_gap_analysis/00_RUN_IDと調査範囲確定.md
- web-client/src/features/charts/OrderBundleEditPanel.tsx
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/orderBundleApi.ts
- client/src/main/java/open/dolphin/order/RpView.java
- client/src/main/java/open/dolphin/order/RpEditor.java

## モダナイズ版（Web）処方オーダー入力フロー整理
- 入口: Charts 右固定メニュー → 「処方編集」→ 右パネルで入力 (OrderBundleEditPanel, entity=medOrder)。
- 画面構成:
  - RP名、用法、回数、開始日、メモ。
  - 薬剤/項目: 項目名・用量・単位の繰り返し行。追加ボタンで行追加、行の✕で削除。
  - 登録済み一覧: 既存オーダー束を表示し、編集/削除が可能。
- 保存フロー:
  - 「追加する/更新する」で /orca/order/bundles に create/update。
  - 保存成功で入力フォームを初期化し、一覧を再取得。
  - 「新規入力」でフォーム初期化（キャンセル相当）。
- ブロック条件:
  - readOnly / missingMaster / fallbackUsed が true の場合は編集不可。
  - patientId 未選択の場合はパネルを表示せずメッセージのみ。
- 入力必須:
  - RP名のみ必須（空欄はエラー）。
  - 薬剤/項目は空欄行が保存時に除外されるが、0件でも保存可能。

## 旧来版との差分ポイント（処方）
- 入力補助:
  - 旧来版は検索（RT/部分一致）、用法フィルタ、内用/外用/頓用/臨時フラグ、検索結果テーブルから追加。
  - Web は検索/マスタ参照 UI がなく、手入力のみ。
- 必須判定:
  - 旧来版は「薬剤またはその他が1件以上」「用法がちょうど1件」の必須判定。
  - Web は RP名のみ必須で、用法/薬剤/項目の必須判定なし。
- 選択UI:
  - 旧来版はスタンプテーブル＋ドラッグ&ドロップで順序調整、用法はマスタから選択。
  - Web はテキスト入力のみで順序変更 UI はなし。
- 保存/取消導線:
  - 旧来版は「展開」「展開継続」「スタンプ保存（新規/置換）」「クリア/削除」など。
  - Web は「追加/更新」「削除」「新規入力（フォームリセット）」のみで、カルテ展開/スタンプ保存は未実装。

## 差分表（処方オーダー入力）

| 項目名 | 入力方式 | 必須条件 | 保存挙動 | コード参照 |
| --- | --- | --- | --- | --- |
| Web: 処方編集の入口 | 右固定メニュー「処方編集」ボタン | なし | 右パネルを開きフォーム表示 | web-client/src/features/charts/pages/ChartsPage.tsx |
| Web: RP名 | テキスト入力 | 空欄不可 | 保存時に bundleName として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 用法 | テキスト入力 | 任意 | admin として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 回数 | テキスト入力（初期値 1） | 任意 | bundleNumber として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 開始日 | 日付入力（初期値: 当日） | 任意 | startDate として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: メモ | テキストエリア | 任意 | memo として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 薬剤/項目 追加 | 「追加」ボタンで行追加 | 任意 | 空欄行は保存時に除外 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 薬剤/項目 名称 | テキスト入力 | 任意 | items[].name として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 薬剤/項目 用量 | テキスト入力 | 任意 | items[].quantity として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 薬剤/項目 単位 | テキスト入力 | 任意 | items[].unit として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 追加/更新 | 送信ボタン | RP名必須 / ブロック条件で無効 | /orca/order/bundles に create/update | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 削除 | 一覧の削除ボタン | ブロック条件で無効 | /orca/order/bundles に delete | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 新規入力（リセット） | 「新規入力」ボタン | なし | フォーム初期化（未保存） | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| 旧来: スタンプ名 | テキスト入力（黄色） | 実質必須（未入力はデフォルト名） | 展開/保存時にスタンプ名として使用 | client/src/main/java/open/dolphin/order/RpView.java / client/src/main/java/open/dolphin/order/RpEditor.java |
| 旧来: 内服/外用/頓用/臨時 | ラジオ/チェックボックス | 任意 | スタンプ属性に反映 | client/src/main/java/open/dolphin/order/RpView.java |
| 旧来: 検索（RT/部分一致/用法フィルタ） | チェック/セレクト/検索テキスト | 任意 | マスタ検索の補助 | client/src/main/java/open/dolphin/order/RpView.java / client/src/main/java/open/dolphin/order/RpEditor.java |
| 旧来: セットテーブル（薬剤/用法/材料） | テーブル入力＋DnD | 薬剤/その他1件以上 & 用法1件必須 | 展開/スタンプ保存に反映 | client/src/main/java/open/dolphin/order/RpView.java / client/src/main/java/open/dolphin/order/RpEditor.java |
| 旧来: 展開/展開継続 | ボタン | 上記必須条件を満たす | カルテ展開 | client/src/main/java/open/dolphin/order/RpEditor.java |
| 旧来: クリア/削除 | ボタン | なし | 入力クリア/削除 | client/src/main/java/open/dolphin/order/RpView.java |

## 差分まとめ（処方）
- Web は RP名以外は任意入力で、薬剤/用法の必須判定がない。
- 旧来版のマスタ検索・用法選択・ドラッグ&ドロップ等の入力補助が Web では未提供。
- Web の保存はオーダー束 API に限定され、カルテ展開/スタンプ保存/展開継続は未実装。
- Web では readOnly/missingMaster/fallbackUsed 時に一括ブロックし、旧来版には同等の UI ブロック概念がない。
