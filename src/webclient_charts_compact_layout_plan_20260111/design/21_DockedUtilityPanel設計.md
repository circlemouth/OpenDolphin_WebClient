# 21 DockedUtilityPanel 設計

- RUN_ID: `20260111T004054Z`
- 期間: 2026-01-11 19:00 〜 2026-01-12 19:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_charts_compact_layout_plan_20260111/design/21_DockedUtilityPanel設計.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/10_現状UI棚卸し.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/12_3カラム化影響調査.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`

## 1. DockedUtilityPanel の役割と前提
- 右固定メニューを **Docked（占有型）** に変更し、通常は「コンパクトな導線群」、必要時のみ「拡張パネル（編集/作成）」を表示する。
- **オーバーレイしない**方針を基本とし、開閉時にメイン3カラムの可視領域を維持する。
- DockedUtilityPanel は Charts の主要導線（病名/処方/オーダー/文書/画像/診療操作への移動）を統合する。

## 2. レイアウト仕様（compact / expanded）

### 2-1. 仕様図（概念）
```
[Charts Workbench - 3 columns + Docked]
┌──────────────────────────────────────────────────────────────────────────┐
│ SummaryBar                                                                │
├───────────────┬─────────────────────────┬────────────────────────┬───────┤
│ Left Column   │ Center Column           │ Right Column           │ Docked│
│ PatientsTab   │ Soap + Timeline         │ OrcaSummary + Record   │ Utility│
│ ...           │ ...                     │ ...                    │ Panel │
└───────────────┴─────────────────────────┴────────────────────────┴───────┘

compact: Docked幅は最小、常時表示の縦ボタン群のみ
expanded: Docked幅を拡張し、編集/作成パネルを表示
```

### 2-2. 幅定義（CSS変数）
- `--charts-utility-compact-width: 64px`
- `--charts-utility-expanded-width: 320px` (基準)
- `--charts-utility-expanded-width-wide: 360px` (≥1440px)
- `--charts-utility-expanded-width-narrow: 280px` (1024〜1279px)

### 2-3. 3カラムとの共存
- `charts-workbench__body` は **3カラム**の grid を維持。
- DockedUtilityPanel は **右端に張り付く占有ブロック**として配置し、
  コンテンツ領域には `padding-right: var(--charts-utility-width)` を付与して **重なりを防ぐ**。
- 右列（OrcaSummary 等）は DockedUtilityPanel の開閉に応じて **横幅が縮む**が、
  `minmax(300px, 1.05fr)` の下限を超えない範囲で調整する。

### 2-4. ブレイクポイント
- **≥1440px**: `expanded=360px` / `compact=64px`。
- **1280〜1439px**: `expanded=320px` / `compact=64px`。
- **1024〜1279px**: `expanded=280px` / `compact=56px`。
- **<1024px**: DockedUtilityPanel は **下部ドロワー型**に切り替え、
  `width: 100%`, `height: 40vh` を目安に表示。`padding-right` は 0。

## 3. 表示状態とトリガー

### 3-1. 状態
- **compact**: デフォルト状態。縦ボタン（アイコン+短いラベル）だけ表示。
- **expanded**: クリックした機能の編集/作成パネルを表示。

### 3-2. トリガー
- **開く**
  - compact 内の機能ボタン（病名/処方/オーダー/検査/文書/画像/右パネル）
  - キーボード: `Alt+U` で DockedUtilityPanel を開閉、`Alt+1〜6` で対象タブを直接開く
- **閉じる**
  - パネルヘッダの閉ボタン
  - `Escape`
  - 同一ボタンの再クリック（トグル）

### 3-3. 表示ルール
- **既定は compact**。
- 患者切替時は **expanded を閉じて compact に戻す**（誤編集防止）。
- 編集対象の権限不足/読取専用の場合、ボタンは `disabled` + 理由表示（tooltip）。

## 4. フォーカス移動とアクセシビリティ

### 4-1. フォーカス移動
- compact → expanded へ切替時、フォーカスは **パネル内の見出し**へ移動。
- expanded → compact へ閉じる時は **起点となったトリガーボタン**へ戻す。
- expanded 中に他タブへ切替した場合、**新規パネルの先頭入力**へ移動。

### 4-2. ARIA
- トリガーボタンは `aria-expanded` と `aria-controls` を必須。
- `aria-controls` は `charts-docked-panel` を指す。
- compact のボタン群には `aria-label` で機能名を明示。

### 4-3. Tab 順序
- compact 時: ボタン群 → メイン3カラム → 右列の順。
- expanded 時: パネル内操作 → メイン3カラム → Dockedボタン群（逆走防止）。
- **モーダルではない**ためフォーカストラップは不要。ただし Escape は閉じる。

## 5. DockedUtilityPanel の構造

### 5-1. 表示構造（expanded）
```
[DockedUtilityPanel]
┌──────────────────────────────┐
│ Header: タイトル + Close      │
│ Tabs: 病名/処方/オーダー/... │
├──────────────────────────────┤
│ Content: 選択機能のパネル     │
├──────────────────────────────┤
│ Footer: 補助説明/導線         │
└──────────────────────────────┘
```

### 5-2. Content 内容
- 病名編集: `DiagnosisEditPanel`
- 処方/オーダー編集: `OrderBundleEditPanel`
- 文書作成: `DocumentCreatePanel`
- 画像/スキャン: 既存 UI へ誘導

## 6. 操作フロー（状態遷移）

### 6-1. フロー図
```
[compact] --(機能ボタン)--> [expanded: 機能A]
[expanded: 機能A] --(別ボタン)--> [expanded: 機能B]
[expanded] --(Close/Esc/同一ボタン)--> [compact]
[expanded] --(患者切替)--> [compact]
```

### 6-2. 具体シナリオ
1) ユーザーが「病名編集」を押下
- DockedUtilityPanel が expanded に切替
- `DiagnosisEditPanel` を表示し、見出しにフォーカス

2) 「処方編集」へ切替
- expanded 維持、Content だけ切替
- `OrderBundleEditPanel` 先頭入力へフォーカス

3) 閉じる
- `Escape` または Close ボタンで compact に戻る
- フォーカスは直前のトリガーへ復帰

## 7. 未決事項
- DockedUtilityPanel のショートカットキー割り当て（Alt+U/Alt+1〜6）の最終決定。
- 小画面時の下部ドロワー高さ（40vh の調整余地）。
- 右列（OrcaSummary/MedicalRecord）の最小幅と折返しルールの確定。
