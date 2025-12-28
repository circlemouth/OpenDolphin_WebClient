# 00 RUN_ID と調査範囲確定

RUN_ID: 20251228T201657Z

## 参照順（確認済み）
- docs/DEVELOPMENT_STATUS.md
- web-client/README.md

## 調査範囲（オーダー入力の対象）

### 旧来版（client）
- スタンプボックス＋オーダーエディタ（StampBox/EditorSetPanel）を中心に、以下のオーダー種別を対象。
- 対象種別（スタンプタブ）
  - 処方: 処方（medOrder）
  - 処置: 処置（treatment）
  - 検査: 検体検査（laboTest）/生体検査（physiologyOrder）/細菌検査（bacteriaOrder）/放射線（radiologyOrder）
  - 指示: 指導・在宅（instractionChargeOrder）
  - リハビリ: その他（otherOrder）内の「その他（リハビリ）/リハビリ（発生日等）」コード
  - 文書: 新規文書作成（ChartImpl の文書作成フロー）
- 代表コード参照
  - スタンプタブ定義: client/src/main/java/open/dolphin/stampbox/StampBoxResource_ja.java
  - エディタ構成: client/src/main/java/open/dolphin/order/EditorSetPanel.java
  - エディタ基盤: client/src/main/java/open/dolphin/order/BaseEditor.java
  - 処方エディタ: client/src/main/java/open/dolphin/order/RpEditor.java
  - 注射/放射線エディタ: client/src/main/java/open/dolphin/order/InjectionEditor.java, client/src/main/java/open/dolphin/order/RadEditor.java
  - 文書作成: client/src/main/java/open/dolphin/client/ChartImpl.java
  - リハビリ系コード: client/src/main/java/open/dolphin/order/ClaimResource_ja.java

### モダナイズ版（web-client）
- Charts 右パネルからの「処方編集 / オーダー編集」を対象。
- その他（文書登録・検査オーダー・画像/スキャン）は誘導のみで入力 UI 未実装。
- 代表コード参照
  - 右パネル分岐: web-client/src/features/charts/pages/ChartsPage.tsx
  - オーダー入力 UI: web-client/src/features/charts/OrderBundleEditPanel.tsx
  - オーダー API: web-client/src/features/charts/orderBundleApi.ts

## 差分表テンプレート（以降の調査で統一）

| 項目名 | 入力方式 | 必須条件 | 保存挙動 | コード参照 |
| --- | --- | --- | --- | --- |
| 例）処方: RP名 | テキスト入力 | 空欄不可 | 保存時に /orca/order/bundles へ create | web-client/src/features/charts/OrderBundleEditPanel.tsx |

- 項目名: 「画面/機能: 入力欄 or 操作」の粒度で記載する。
- 入力方式: テキスト/セレクト/チェック/検索/ドラッグ&ドロップ/日付/ボタンなど。
- 必須条件: UI バリデーション、読取専用条件、依存フィールドなど。
- 保存挙動: DB/スタンプ/オーダー束/カルテ展開などの保存先と操作結果。
- コード参照: 実装・UI・API のいずれか（複数列挙可）。

## 旧来版（client）オーダー入力の画面・入力欄・操作フロー（洗い出し）

### 1) 共通フロー（スタンプボックス＋オーダーエディタ）
- 画面: スタンプボックス（タブでオーダー種別を選択）
- 操作フロー:
  1. スタンプタブを選択 → 対応エディタ表示
  2. 検索欄でマスタ検索（RT/部分一致など）→ 検索結果から項目追加
  3. セットテーブルで順序調整（Drag & Drop）
  4. セット名（スタンプ名）入力
  5. 「展開」「展開継続」またはスタンプ保存（新規/置換）
- コード参照:
  - タブ/エディタ切替: client/src/main/java/open/dolphin/order/EditorSetPanel.java
  - DnD/検索/検証: client/src/main/java/open/dolphin/order/BaseEditor.java
  - タブ名称: client/src/main/java/open/dolphin/stampbox/StampBoxResource_ja.java

### 2) 処方（medOrder / RpEditor）
- 画面: 処方エディタ
- 入力欄（主なもの）
  - セットテーブル（薬剤/用法/材料）
  - セット名、院内/院外、頓用/臨時
  - 検索テキスト、RT、部分一致、用法フィルタ
- 必須条件（主なもの）
  - 薬剤またはその他が1件以上
  - 用法がちょうど1件
- 保存/展開
  - 「展開」「展開継続」でカルテ展開
  - スタンプ保存（新規/置換）
- コード参照:
  - UI: client/src/main/java/open/dolphin/order/RpView.java
  - バリデーション: client/src/main/java/open/dolphin/order/RpEditor.java

### 3) 処置・検査・指示（BaseEditor 系）
- 画面: 汎用/その他/処置/手術/検体検査/生体検査/細菌検査/指導・在宅
- 入力欄（主なもの）
  - セットテーブル
  - セット名
  - 検索テキスト、RT、部分一致
  - 回数（numberCombo）
- 必須条件（主なもの）
  - 手技（SYUGI）またはその他が1件以上（種別により許可条件が異なる）
- 保存/展開
  - 「展開」「展開継続」でカルテ展開
  - スタンプ保存（新規/置換）
- コード参照:
  - UI: client/src/main/java/open/dolphin/order/BaseView.java
  - バリデーション: client/src/main/java/open/dolphin/order/BaseEditor.java

### 4) 放射線（RadEditor）
- 画面: 放射線エディタ
- 入力欄（主なもの）
  - セットテーブル
  - セット名
  - 部位検索（部位ボタン/部位チェック）
  - 検索テキスト、RT、部分一致
  - 回数
- 保存/展開
  - 「展開」「展開継続」でカルテ展開
  - スタンプ保存（新規/置換）
- コード参照:
  - UI: client/src/main/java/open/dolphin/order/RadView.java
  - 表示文言: client/src/main/java/open/dolphin/order/resources/RadView_ja.properties

### 5) リハビリ（その他/otherOrder 内）
- 画面: その他オーダー（BaseEditor）
- 根拠: ClaimResource に「その他（リハビリ）」「リハビリ（発生日等）」コードあり
- コード参照:
  - client/src/main/java/open/dolphin/order/ClaimResource_ja.java
  - client/src/main/java/open/dolphin/order/BaseEditor.java

### 6) 文書（新規文書作成フロー）
- 画面: 新規文書（プラグイン/テンプレート選択）
- 操作フロー:
  1. 新規文書メニューから起動
  2. プラグイン/テンプレート一覧から選択
  3. 文書作成（OpenOffice テンプレート or プラグイン）
- コード参照:
  - client/src/main/java/open/dolphin/client/ChartImpl.java

## モダナイズ版（web-client）オーダー入力の画面・入力欄・操作フロー（洗い出し）

### 1) 処方編集（medOrder）
- 画面: Charts 右パネル → 処方編集
- 入力欄（主なもの）
  - RP名（bundleName）
  - 用法（admin）/回数（bundleNumber）/開始日（startDate）
  - メモ（memo）
  - 薬剤/項目: 項目名・用量・単位（items）
- 必須条件
  - patientId 必須
  - RP名は空欄不可
  - readOnly / missingMaster / fallbackUsed の場合は編集ブロック
- 保存/削除
  - 保存: /orca/order/bundles へ create/update
  - 削除: /orca/order/bundles へ delete
- コード参照:
  - web-client/src/features/charts/pages/ChartsPage.tsx
  - web-client/src/features/charts/OrderBundleEditPanel.tsx
  - web-client/src/features/charts/orderBundleApi.ts

### 2) オーダー編集（generalOrder）
- 画面: Charts 右パネル → オーダー編集
- 入力欄/必須条件/保存挙動
  - 処方編集と同一フォーム、entity が generalOrder に切り替わる
- コード参照:
  - web-client/src/features/charts/pages/ChartsPage.tsx
  - web-client/src/features/charts/OrderBundleEditPanel.tsx

### 3) 文書登録・検査オーダー・画像/スキャン
- 画面: Charts 右パネルの該当メニュー
- 現状: 画面は誘導のみ（入力 UI 未実装）
- コード参照:
  - web-client/src/features/charts/pages/ChartsPage.tsx

## 差分表作成時の扱い（初期方針）
- 旧来版の「処置/検査/指示/リハビリ」は BaseEditor 系の共通 UI として行単位で整理する。
- モダナイズ版は medOrder/generalOrder のみ実装済みのため、未実装項目は「未実装」行として記録する。
- 文書は旧来版: 新規文書作成フロー、モダナイズ版: 右パネル誘導のみ（入力 UI なし）として差分表に記載する。
