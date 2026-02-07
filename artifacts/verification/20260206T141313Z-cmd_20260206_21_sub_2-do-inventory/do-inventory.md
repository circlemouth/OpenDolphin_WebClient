# Do機能 棚卸しメモ (cmd_20260206_21_sub_2)

- RUN_ID: 20260206T141313Z-cmd_20260206_21_sub_2-do-inventory
- 対象: Charts（web-client）

## 結論（現状の対応関係）

- 「過去参照（過去カルテ/過去受診）」
  - 実装あり（PatientsTab の履歴 UI で encounter を切替）。
- 「Do文書（過去文書の再適用）」
  - 実装あり（DocumentCreatePanel の文書履歴からフォームへ反映）。監査ログ details.operationPhase='do'。
- 「Do処方/Doオーダー（過去オーダーの再適用）」
  - 実装は「履歴コピー」として存在（OrderBundleEditPanel の登録済みオーダー一覧の `コピー` → 編集フォームへ反映 → 展開/保存）。
  - 監査ログ details.operationPhase は 'copy'（'do' ではない）。
- 「Do転記（カルテ記載: SOAP等）」
  - “Do”相当の「過去記載をドラフトへ再適用」は未実装に見える。
  - 代替としてテンプレ挿入（SOAP_TEMPLATE_APPLY）と、SubjectivesPanel の「SOAP S をコピー」程度。

## 現状実装（コード参照）

### 1) 過去参照（過去カルテ/過去受診）

- 受診履歴の表示/検索/切替:
  - `web-client/src/features/charts/PatientsTab.tsx:1387` 付近
  - タブ: 直近3回 / 過去90日 / 全期間検索
  - `historyEntriesForSelected.map(...)` のボタンで `jumpToEncounter(entry)`

### 2) Do文書（文書履歴の再適用）

- 文書履歴取得:
  - `web-client/src/features/charts/DocumentCreatePanel.tsx:700` 付近
  - `fetchLetterList({ karteId })` → `fetchLetterDetail({ letterId })` → `setSavedDocs(...)`
- 再適用（履歴→編集フォーム反映）:
  - `web-client/src/features/charts/DocumentCreatePanel.tsx:811` 付近 `handleReuseDocument`
  - 患者不一致はブロック（notice + audit outcome blocked）
  - `ensureDocumentDetail` で詳細を補完後、`setForms(...)` でフォームへ反映
  - 監査:
    - `recordChartsAuditEvent({ action: 'document_template_reuse', ... details: { operationPhase: 'do', inputSource: 'history_copy', ... } })`

### 3) Do処方/Doオーダー（履歴コピー）

- オーダー履歴取得:
  - `web-client/src/features/charts/orderBundleApi.ts:65` `fetchOrderBundles({ patientId, entity?, from? })`
- 履歴コピー（履歴→編集フォーム反映）:
  - `web-client/src/features/charts/OrderBundleEditPanel.tsx:1044` 付近 `copyFromHistory`
  - 編集ガード中はブロック（notice + audit outcome blocked）
  - `toFormStateFromHistoryCopy(bundle, today)` → `setForm(nextForm)`
  - notice: 「履歴をコピーしました。内容を確認して反映してください。」
  - 監査: `action: 'CHARTS_ORDER_HISTORY_COPY'`, `details.operationPhase: 'copy'`
- 反映（次の導線）:
  - `web-client/src/features/charts/OrderBundleEditPanel.tsx:3481` 付近
  - `展開する` / `展開継続する` / `保存して追加(更新)`
- UI上の入口（登録済み一覧）:
  - `web-client/src/features/charts/OrderBundleEditPanel.tsx:3505` 付近
  - `登録済み{title}` のリストに `コピー`/`編集`/`削除` ボタン
- “Do=新規作成”の裏付け（テスト）:
  - `web-client/src/features/charts/__tests__/orderBundleHistoryCopy.test.tsx:72`
  - 履歴コピー→保存して追加 → mutate payload の operation='create' かつ documentId/moduleId undefined

### 4) Do転記（SOAP等のカルテ記載）

- SOAP記載UI:
  - `web-client/src/features/charts/SoapNotePanel.tsx:398` 付近
  - セクションごとに `latestBySection` の「記載履歴なし/最新メタ」を表示するが、「履歴から再適用」操作は見当たらない
- SOAP記載履歴の閲覧:
  - `web-client/src/features/charts/DocumentTimeline.tsx:1075` 付近に「SOAP記載履歴」リスト
  - 表示のみ（ここからドラフトへ戻す/転記するUIは見当たらない）
- 既存の“コピー”導線（限定的）:
  - `web-client/src/features/charts/soap/SubjectivesPanel.tsx:328` 付近
  - 「SOAP S をコピー」: `setSubjectivesCode(suggestedText ?? '')`

## 左パネルへ移す/追加する改修ポイント（提案）

前提: 現状の “Do相当” は、右側のユーティリティパネル（OrderBundleEditPanel / DocumentCreatePanel）内にある。
- `web-client/src/features/charts/pages/ChartsPage.tsx:2510` 付近
  - 左列: `PatientsTab` + `DiagnosisEditPanel`
  - 中央列: `SoapNotePanel` + `DocumentTimeline`
  - 右側: `utilityPanelAction` に応じて `OrderBundleEditPanel` / `DocumentCreatePanel` を表示

### 段階導入案（最小リスク順）

1. Phase 1（最小）: 左パネルに “入口だけ” 追加
  - 例: `PatientsTab` 内（履歴カードの下）に「Do: 処方/注射/検査/処置/文書」を追加。
  - ボタンは「右パネルを該当モードで開く」だけに留め、コピー対象の選択は既存リストの `コピー` を使う。
  - 改修点:
    - `ChartsPage.tsx` に `openUtilityPanel('med-order-edit' 等)` を呼ぶ handler を渡す
    - `PatientsTabProps` に `onOpenDoPanel?(entity)` を追加（依存最小）

2. Phase 2（中）: 左パネルから “直近を1-clickコピー”
  - 選択 encounter の直近オーダー/文書を取得し、コピー対象を1つ決めて右パネルへ適用。
  - 改修点:
    - `OrderBundleEditPanel` 内部関数 `copyFromHistory` を外へ出し、共有 util/hook 化（例: `orderBundleDo.ts`）
    - 左パネル側で `fetchOrderBundles({ patientId, entity, from })` を呼び、対象 bundle を決める
    - Document も同様に “履歴→反映” の共有化（DocumentCreatePanel へ imperative handle を渡す/ store 化）

3. Phase 3（大）: 左パネルに “Do専用ビュー（候補一覧 + フィルタ + プレビュー）”
  - 左パネルでコピー対象の一覧/プレビューを完結。

## 最小スコープ案（転記プレビュー + Undo）

既存挙動は「コピー実行時に編集フォームを上書き」なので、誤操作の戻しが弱い。

### 共通（文書/オーダー）

- プレビュー: “適用前” に差分/要点を確認（最低限は確認ダイアログでも可）
  - dirty（編集途中）なら上書き警告 + 差分表示
- Undo: “直前のフォームstate” をローカルに1世代スナップショットして戻せるようにする
  - UI: `履歴コピーしました` notice の横に `元に戻す` を出す
  - 実装ポイント:
    - Order: `copyFromHistory` 実行前に `prevForm` を保存しておき `setForm(prevForm)` で復帰
    - Document: `handleReuseDocument` 実行前に `prevForms/prevActiveType` を保存して復帰

### Do転記（SOAP）を最小で成立させる案

- 対象を絞る: まずは `P欄(plan)` だけ、または `S/O/A/P` のうち1セクションだけ
- 実装の当たり:
  - `DocumentTimeline.tsx` の SOAP記載履歴（表示済み）に `ドラフトへ転記` を追加
  - クリックで該当セクションの draft を上書き（+ プレビュー/Undo）
  - draftDirty の更新は既存 `onDraftDirtyChange` 連携に合わせる（`ChartsPage.tsx` の `handleDraftDirtyChange`）

## 依存する回帰点（要注意）

- 編集ロック/承認ロック（readOnly）
  - OrderBundleEditPanel は `isBlocked` を見てコピー自体をブロック（`copyFromHistory`）
  - 文書も readOnly 状態や patient mismatch を考慮
- draftDirty と患者切替
  - `ChartsPage.tsx` で `PatientsTab`/`SoapNotePanel` が `onDraftDirtyChange` を共有
  - Do適用は「dirty扱い」になるのが自然（自動で dirty を落とすのは危険）
- 印刷/文書モーダル
  - 文書は履歴/テンプレ/印刷の導線が絡む（`DocumentCreatePanel.tsx`, `pages/ChartsDocumentPrintPage.tsx`）
- 送信/展開（オーダー）
  - Do（履歴コピー）後の `展開する` / `保存して追加` の挙動を変えないこと
- ショートカット/フォーカス
  - 左パネルに入口を増やす場合、フォーカス復帰（`onRequestRestoreFocus`）や `data-focus-anchor` の整合に注意

