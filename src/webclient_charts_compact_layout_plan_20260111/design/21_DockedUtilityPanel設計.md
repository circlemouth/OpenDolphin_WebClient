# 21 DockedUtilityPanel 設計

- RUN_ID: `20260111T010000Z`
- 作業日時: 2026-01-11 10:00 (JST)
- 期間: 2026-01-11 19:00 〜 2026-01-12 19:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_charts_compact_layout_plan_20260111/design/21_DockedUtilityPanel設計.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/10_現状UI棚卸し.md`
- `src/webclient_charts_compact_layout_plan_20260111/discovery/12_3カラム化影響調査.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`

## 1. DockedUtilityPanel の役割と前提
- 右固定メニューを **Docked（占有型）** に変更し、通常は「コンパクトな導線群」、必要時のみ「DetailPanel（編集/作成領域）」を表示する。
- **オーバーレイしない**方針を基本とし、開閉時にメイン3カラムの可視領域を維持する。
- DockedUtilityPanel は Charts の主要導線（病名/処方/オーダー/文書/画像/診療操作への移動）を統合する。
- 用語: DockedUtilityPanel = 右端に常駐する外枠、DetailPanel = expanded 時に表示される編集/作成領域。

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
expanded: Docked幅を拡張し、DetailPanel を表示
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
  例: `charts-workbench__body { padding-right: var(--charts-utility-width); }`
- 右列（OrcaSummary 等）は DockedUtilityPanel の開閉に応じて **横幅が縮む**が、
  `minmax(300px, 1.05fr)` の下限を超えない範囲で調整する。

### 2-4. expanded 幅の採用理由
expanded 幅（280/320/360px）は、DetailPanel 内の編集フォーム（病名/処方/オーダー）の入力欄が
1カラムで読める最小幅を確保しつつ、右列（OrcaSummary/MedicalRecord）の最小幅 300px を下回らない
バランス点として設定する。`padding-right` でDockedUtilityPanel分を差し引いても、
1440px 以上なら右列の視認性を保ち、1280px 台は 320px に抑えることで中央列の可視性を維持、
1024px 台は 280px に縮めて3カラム破綻を防ぐ。

### 2-5. ブレイクポイント
- **≥1440px**: `expanded=360px` / `compact=64px`。
- **1280〜1439px**: `expanded=320px` / `compact=64px`。
- **1024〜1279px**: `expanded=280px` / `compact=56px`。
- **<1024px**: DockedUtilityPanel は **下部ドロワー型**に切り替え、
  `width: 100%`, `height: clamp(280px, 40vh, 420px)` を採用。`padding-right` は 0。

### 2-6. 右列最小幅の前提
- 右列の最小幅は **300px** を下限とする（OrcaSummary の2カラム最小幅確保）。
- expanded 時に右列が 300px を下回る場合は **expanded を維持せず compact へ自動復帰**する。
- 上限は 360px を超えない（DetailPanel の過剰拡張を防止）。

## 3. 表示状態とトリガー

### 3-1. 状態
- **compact**: デフォルト状態。縦ボタン（アイコン+短いラベル）だけ表示。
- **expanded**: クリックした機能の DetailPanel を表示。

### 3-2. トリガー
- **開く**
  - compact 内の機能ボタン（病名/処方/オーダー/検査/文書/画像/右パネル）
  - キーボード: `Ctrl+Shift+U` で DockedUtilityPanel を開閉、`Ctrl+Shift+1〜6` で対象タブを直接開く
- **閉じる**
  - パネルヘッダの閉ボタン
  - `Escape`
  - 同一ボタンの再クリック（トグル）

### 3-3. 表示ルール
- **既定は compact**。
- 患者切替時は **expanded を閉じて compact に戻す**（誤編集防止）。
- 編集対象の権限不足/読取専用の場合、ボタンは `disabled` + 理由表示（tooltip）。
- `Alt+U` / `Alt+1〜6` はブラウザ標準ショートカットと衝突するため採用しない。
  代替として `Ctrl+Shift+U / Ctrl+Shift+1〜6` を採用し、衝突時は UI トグルのみで運用可能。

## 4. フォーカス移動とアクセシビリティ

### 4-1. フォーカス移動
- compact → expanded へ切替時、フォーカスは **DetailPanel 内の見出し**へ移動。
- expanded → compact へ閉じる時は **起点となったトリガーボタン**へ戻す。
- expanded 中に他タブへ切替した場合、**新規 DetailPanel の先頭入力**へ移動。

### 4-2. ARIA
- トリガーボタンは `aria-expanded` と `aria-controls` を必須。
- `aria-controls` は `charts-docked-panel` を指す。
- compact のボタン群には `aria-label` で機能名を明示。

### 4-3. Tab 順序
- compact 時の順序:
  1) DockedUtilityPanel ボタン群
  2) メイン3カラム（左→中→右）
  3) 補助導線（タイムライン/ORCA へのジャンプ）
- expanded 時の順序:
  1) DetailPanel 内操作（見出し→入力→アクション）
  2) メイン3カラム（左→中→右）
  3) DockedUtilityPanel ボタン群
- **モーダルではない**ためフォーカストラップは不要。ただし Escape は閉じる。

### 4-4. フォーカス復帰（ケース別）
- Close ボタン: 直前に開いたトリガーボタンへ戻す。
- Escape: 直前に開いたトリガーボタンへ戻す。
- 同一ボタン再クリック: そのボタン自身へ戻す。
- 患者切替: DockedUtilityPanel の先頭ボタンへ戻す。

## 5. DockedUtilityPanel の構造

### 5-1. 表示構造（expanded = DetailPanel）
```
[DockedUtilityPanel]
┌──────────────────────────────┐
│ Header: タイトル + Close      │
│ Tabs: 病名/処方/オーダー/... │
├──────────────────────────────┤
│ Content: 選択機能の DetailPanel│
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
- `DiagnosisEditPanel`（DetailPanel）を表示し、見出しにフォーカス

2) 「処方編集」へ切替
- expanded 維持、Content だけ切替
- `OrderBundleEditPanel` 先頭入力へフォーカス

3) 閉じる
- `Escape` または Close ボタンで compact に戻る
- フォーカスは直前のトリガーへ復帰

## 7. 右列縮小時の UI 影響ルール
- 優先して残す要素（右列/OrcaSummary）:
  - ヘッダ（患者/診療サマリ）
  - 警告/アラートバナー
  - 主要数値（診療情報のキーバリュー）
- 縮小時に折りたたむ要素:
  - 詳細テーブル/履歴一覧は **下部から省略**（最下部から折りたたむ）
  - セカンダリ情報は **アコーディオン化**（閉じた状態を既定）
- MedicalRecord は **タイトル + 直近サマリ**を最優先で残し、詳細本文は折りたたむ。

## 8. 小画面時の下部ドロワー仕様（<1024px）
- 高さ: `height: clamp(280px, 40vh, 420px)` を固定採用。
- スクロール制御: ドロワーは内部スクロール可、メインはスクロール許可（ビュー固定なし）。
- 閉じる操作: Close ボタン / `Escape` / トリガーボタン再クリック。スワイプ閉じは採用しない。

## 9. 未決事項
- タブ数の増減時に `Ctrl+Shift+1〜6` の割当が溢れる場合の方針（例: 7以降は未割当）。
