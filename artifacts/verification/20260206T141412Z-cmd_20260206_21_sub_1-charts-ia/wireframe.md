# Charts 情報設計案（中央SOAP最大化 + 左=過去参照 + 左からDo）
RUN_ID=20260206T141412Z-cmd_20260206_21_sub_1-charts-ia

前提:
- 中央=SOAP（+必要最小のタイムライン）を最大化。
- 左=過去カルテ記載/過去オーダー参照（要約→選択で詳細）。
- 左の各行から Do（処方/オーダー/記載転記）を実行。
- Doは「プレビュー→適用→Undo（1世代）」を必須とする。
- 既存の実装資産: 文書=DocumentCreatePanel「コピーして編集」、オーダー束=OrderBundleEditPanel「履歴コピー」、SOAP=履歴/ドラフト（sessionStorage）

---

## 案A: 左=Past Hub（記載+オーダーを統合リスト）/ 中央=SOAP固定 / 右=現状維持

狙い:
- 左を「過去参照 + Do」の単一入口にして迷いを減らす。
- 中央SOAPの横幅を確保しつつ、左にDoを集約。

レイアウト（概略）:

```
[SummaryBar + ActionBar (sticky, compact)]
----------------------------------------------------
| Left: Past Hub (30-34%) | Center: SOAP (66-70%)  |
| - Search/Filter         | - SOAP note            |
| - Past Cards list       | - (Timeline: collapsed)|
|   * Past Note summary   |                        |
|   * Past Orders summary |                        |
|   [Do SOAP] [Do Rx]     |                        |
|   [Do Order] [Details]  |                        |
----------------------------------------------------
| Right: Utility Drawer (on demand) / OrcaSummary (optional dock) |
```

Left: Past Hub の情報構造:
- タブ2枚: `過去記載` / `過去オーダー`
- 既定は「直近N件 + 検索」
- 各行は "Encounter/日付" をキーにして、以下を必ず表示:
  - 記載サマリ: S/O/A/P の冒頭（無い項目は省略）
  - オーダーサマリ: 処方/検査/処置の件数
  - Doボタン群: `Do記載転記` `Do処方` `Doオーダー`（disabled理由をツールチップで出す）
  - `詳細` で右ドロワー or モーダルで全文/全オーダーを表示

Do操作（共通フロー）:
1. 左行の Do を押す
2. `プレビュー` を開く
   - SOAP: 対象セクション（S/O/A/P）別に差分表示（before/after）
   - Rx/Order: 適用対象（置換/追記）と件数、重複の扱いを表示
3. `適用` で中央/ユーティリティのドラフトに反映
4. `Undo` で直前のドラフトへ復帰（スナップショット 1世代）

Undo設計（実装の現実解）:
- 適用前に "現在のドラフトstate" を1世代だけ保持し、Undoで復元。
- Undoは "直前の1操作" のみ保証（複数回適用したら最後のみUndo）。

既存機能の流用ポイント:
- Rx/Order: OrderBundleEditPanel の `copyFromHistory` を Past Hub から呼ぶ（もしくは同等の shared util）
- 文書: DocumentCreatePanel の `handleReuseDocument` と同等の "reuse" 操作
- SOAP: SoapNotePanel の履歴/ドラフト生成を拡張し、"過去EncounterのSOAP → 現Encounter draft" の転記を追加

メリット:
- 中央SOAPの横幅を犠牲にしない（右を常時表示しない前提にしやすい）
- Past参照とDoが左に集約され、操作回数が減る
- 段階導入がしやすい（左パネルだけ追加/置換）

デメリット/リスク:
- Past Hub が肥大化しやすい（タブ/検索/virtualizeが必要）
- SOAP転記の差分UI（S/O/A/P）を新規実装する必要がある

---

## 案B: 左=Past Hub（常時最小） + "Doキュー"（適用前ステージング） / 中央=SOAP最大化

狙い:
- Do適用を"即時反映"ではなく"ステージング"して誤操作を減らす。
- Undoを単なる1世代復元ではなく、ステージング解除として扱える。

レイアウト（概略）:

```
[SummaryBar + ActionBar]
--------------------------------------------------------------
| Left (narrow 260px): Past list | Center (flex): SOAP        |
| - cards (compact)              | - SOAP note                |
| - [Do]押下で右下にQueue追加     | - Timeline collapsed        |
--------------------------------------------------------------
| Bottom/Side: Do Queue (staging) [pending items] [apply all] |
```

Doキュー仕様:
- 左で選んだ "Do" は即時適用せず、`Do Queue` に積む。
- Queue item: 種別（SOAP/Rx/Order/Doc）、元Encounter、件数、上書き/追記モード
- `プレビュー` はQueue itemを開いて確認
- `適用` は item単体または `apply all`
- `Undo` は "適用済み item" を 1回だけ戻せる（=前state復元）

メリット:
- 誤操作リスクが最小（適用前に必ずレビュー可能）
- 複数Doをまとめて反映できる（受付→診療でありがちな"まとめ転記"に強い）

デメリット/リスク:
- UIが増える（Queueが常時見える/邪魔になる可能性）
- 実装コストが案Aより高い

---

## 案C: 左=Past Hub / 中央=SOAP + "History Split"（中央に過去詳細を一時展開）

狙い:
- 左は一覧だけにして軽く保ち、過去詳細は中央に一時展開して読みやすくする。
- 画面幅が狭い（1366/1440）環境で、過去詳細表示が窮屈にならない。

レイアウト（概略）:

```
[SummaryBar + ActionBar]
----------------------------------------------------
| Left: Past list        | Center: SOAP + Split view|
| - Encounter list       |  [SOAP] [Past Details]   |
| - [Preview]            |  ┌──────────┬──────────┐ |
| - [Do ...]             |  | SOAP draft| Past note | |
|                        |  |           | /orders    | |
|                        |  └──────────┴──────────┘ |
----------------------------------------------------
```

特徴:
- 左で `プレビュー` を押すと、中央が一時的に2分割。
- 右に過去詳細（記載全文 + オーダー一覧）を表示しながら `適用`。

メリット:
- 過去詳細が読みやすい（左の狭い幅に押し込めない）
- プレビュー体験が良い

デメリット/リスク:
- 中央SOAPが分割時に狭くなる（ただし"一時"）
- Split実装（レイアウト/フォーカス/スクロール同期）が必要
