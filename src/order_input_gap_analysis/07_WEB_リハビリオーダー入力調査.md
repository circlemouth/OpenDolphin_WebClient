# 07 WEB：リハビリオーダー入力調査

RUN_ID: 20251228T233033Z

## 参照
- docs/DEVELOPMENT_STATUS.md
- src/order_input_gap_analysis/00_RUN_IDと調査範囲確定.md
- src/order_input_gap_analysis/03_旧来版_リハビリオーダー入力調査.md
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/OrderBundleEditPanel.tsx
- web-client/src/features/charts/orderBundleApi.ts

## モダナイズ版（Web）リハビリオーダー入力フロー整理
- 入口: Charts 右固定メニュー → 「オーダー編集」→ 右パネルで入力 (OrderBundleEditPanel, entity=generalOrder)。
- 画面構成（オーダー編集フォーム）:
  - オーダー名（bundleName）
  - 用法（admin）/ 回数（bundleNumber）
  - 開始日（startDate）
  - メモ（memo）
  - 薬剤/項目: 項目名・数量・単位の繰り返し行（追加/削除）
  - 登録済み一覧: 既存オーダー束を表示し、編集/削除が可能
- 保存フロー:
  - 「追加する/更新する」で /orca/order/bundles に create/update
  - 保存成功で入力フォームを初期化し、一覧を再取得
  - 「新規入力」でフォーム初期化（キャンセル相当）
- ブロック条件:
  - readOnly / missingMaster / fallbackUsed が true の場合は編集不可
  - patientId 未選択の場合はパネルを表示せずメッセージのみ
- リハビリ固有項目の対応:
  - 部位: 専用入力欄なし（項目名/メモで自由記述する想定）
  - 回数: bundleNumber に手入力
  - 期間: 開始日のみ入力可能（終了日入力 UI なし）
  - 指示: メモ欄で自由記述
  - 担当者: 専用入力欄なし

## 旧来版との差分ポイント（リハビリ）
- スケジュール連携:
  - 旧来版: schedule モジュールで予約/予定カルテを管理（オーダー入力とは別画面）。
  - Web: 右パネルのオーダー編集に予約/スケジュール連携 UI なし。
- 入力補助:
  - 旧来版: マスター検索（RT/部分一致）＋検索結果テーブルから追加、DnDで並び替え。
  - Web: 検索/マスタ参照 UI はなく手入力のみ。部位・指示・担当者の専用 UI も未実装。
- 保存/取消挙動:
  - 旧来版: 「展開」「展開継続」「クリア」などカルテ展開中心の操作。
  - Web: /orca/order/bundles の create/update/delete のみ（カルテ展開/展開継続は未実装）。

## 差分表（リハビリオーダー入力）

| 項目名 | 入力方式 | 必須条件 | 保存挙動 | コード参照 |
| --- | --- | --- | --- | --- |
| Web: リハビリ入力の入口 | 右固定メニュー「オーダー編集」ボタン | なし | 右パネルを開きフォーム表示 | web-client/src/features/charts/pages/ChartsPage.tsx |
| Web: オーダー名 | テキスト入力 | 空欄不可 | bundleName として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 用法（指示相当） | テキスト入力 | 任意 | admin として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 回数 | テキスト入力（初期値 1） | 任意 | bundleNumber として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 期間（開始日） | 日付入力（初期値: 当日） | 任意 | startDate として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 期間（終了日） | 入力欄なし | 未実装 | endDate 未送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 指示/コメント | テキストエリア | 任意 | memo として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 担当者 | 入力欄なし | 未実装 | 専用フィールドなし | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 部位 | 入力欄なし（項目名で自由記述） | 任意 | items[].name として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 項目数量/単位 | テキスト入力 | 任意 | items[].quantity / items[].unit として送信 | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| Web: 追加/更新 | 送信ボタン | オーダー名必須 / ブロック条件で無効 | /orca/order/bundles に create/update | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 削除 | 一覧の削除ボタン | ブロック条件で無効 | /orca/order/bundles に delete | web-client/src/features/charts/OrderBundleEditPanel.tsx / web-client/src/features/charts/orderBundleApi.ts |
| Web: 新規入力（リセット） | 「新規入力」ボタン | なし | フォーム初期化（未保存） | web-client/src/features/charts/OrderBundleEditPanel.tsx |
| 旧来: リハビリ項目（診療内容） | マスター検索→結果選択でセットテーブルに追加（DnD並べ替え） | 1 件以上で有効 | ClaimItem として BundleDolphin に保存 | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: 部位 | マスター検索で slot=部位（SLOT_BUI）項目を選択して追加 | 任意 | ClaimConst.BUI の ClaimItem として保存 | client/src/main/java/open/dolphin/order/AbstractStampEditor.java |
| 旧来: 回数 | 回数コンボ（1-10） | 任意 | BundleDolphin.bundleNumber に保存 | client/src/main/java/open/dolphin/order/BaseView.java |
| 旧来: 指示/コメント | コメントコード行の診療内容セル編集 | 任意 | ClaimItem.name を編集 | client/src/main/java/open/dolphin/order/AbstractStampEditor.java |
| 旧来: 期間 | 専用入力欄なし（コメント行で代替） | なし | 専用フィールドなし | client/src/main/java/open/dolphin/order/BaseView.java |
| 旧来: 担当者 | 専用入力欄なし | なし | 専用フィールドなし | client/src/main/java/open/dolphin/order/BaseView.java |
| 旧来: 保存（展開/展開継続） | ボタン | セットテーブル有効時 | VALUE_PROP 送出→編集終了/クリア | client/src/main/java/open/dolphin/order/BaseEditor.java |
| 旧来: クリア | ボタン | なし | セットテーブルクリア | client/src/main/java/open/dolphin/order/BaseEditor.java |

## 差分まとめ（リハビリ）
- Web はリハビリ専用 UI がなく、generalOrder の汎用オーダー編集で手入力する。
- 旧来版のマスター検索/部位選択/コメントコードなどの入力補助は Web では未実装。
- Web は開始日のみ入力可能で期間終了日の入力 UI がない。
- 保存/取消は /orca/order/bundles の create/update/delete とフォームリセットのみで、旧来版の展開/展開継続は未実装。
