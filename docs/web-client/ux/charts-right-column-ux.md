# ChartsPage 右カラム / DocumentTimeline UX モック (RUN_ID=20251129T120000Z)

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/web-client/ux/improvementPlan.md`（「カルテ画面の統合 UX 改善」節）→ `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` §3 → 本稿。
- 目的: 右カラムのタブ/アコーディオン、Lab/Certificate 連携、ORCA 状態バッジ、DocumentTimeline ↔ 本体連動、RUN_ID/監査リンクつきコンテキストカードを一つの UI モックに落とし込み、DOC_STATUS/ログ/監査へつなぐ基盤を整理する。

## 1. UX ゴール
1. **DocumentTimeline とカルテ本体を同期**: タイムライン上の文書/オーダ/ラボイベントを選択すると `handleReferenceDocumentSelected`/`handleTimelineOrderSelected`/`handleTimelineLabSelected` で `referenceDocument`/`planCards`/`referenceLabModules` を更新し、`WorkSurface` の参考パネルとハイライト（`HighlightStrip`、`referenceSplitOpen`）に即時反映させる。選択中の文書 ID は `documentTimeline` props に含まれるので、DocumentTimeline 側も `aria-live` フィードバック（`InlineFeedback`）でスクリーンリーダーに伝える。これにより「Timeline で見ている項目＝中央 SOAP の文脈」が一貫する。
2. **右カラムパネルで文書遷移とショートカットをまとめる**: `OrderConsole` によるタブ化された右カラム（`medication`/`exam`/`imaging`/`procedure`/`documents`/`billing`）を核に、Plan カード・オーダライブラリ・ORCA 検索・Lab/Certificate などを収めることでカルテ本体と高さを合わせ、必要な情報を折りたたみ／展開で表示する。`PlanSection` は `planCards` を種類別に表示し、`StatusBadge` で件数を示す。
3. **Lab/Certificate のショートカット**: タイムラインの `lab` イベントを選ぶと `setReferenceLabModules` で `LabResultsPanel` の表示対象が絞られ、`renderPlanSection('exam')` 内で `LabResultsPanel` を配置しているため、右カラム `exam` タブ内で「選択されたラボ＋トレンド図＋値の異常青・赤表示」が即座に確認できる。文書イベントや紹介状の選択では `documents` タブ内の `PatientDocumentsPanel`/`MedicalCertificatesPanel` にフォーカスすると、DocumentTimeline `/letter`/`/document` イベントの RUN_ID や証跡ファイルへのリンクを含むカードを優先表示する案。`handleTimelineOrderSelected` は `planCards` を更新し、`focusedPlanCardId` を `WorkSurface` に渡して中央でも注視させる。
4. **ORCA 状態バッジと `aria-live`**: `OrcaOrderPanel` の `renderDataSourceBadges` は `data-run-id` 属性つき `FilterBadge` を並べ、`dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed`/`runId`/`snapshotVersion` を視覚化する。`renderDataSourceWarning` は `DataSourceBanner`（`role="status" aria-live="polite"`）を通じて missingMaster/fallbackUsed や dataSourceTransition を読み上げ、`aria-live` と `StatusBadge` によるトーン変更で `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` §3 のアクセシビリティ要件を満たす。
5. **RUN_ID/監査リンクとコンテキストカード**: 右カラム・ORCA バナー・DocumentTimeline のあらゆる操作は `data-run-id` で `renderDataSourceWarning`/`DataSourceBanner` に RUN_ID を埋め込み、`audit.logChartsAction` に沿ったログとリンク。左カラム `ContextCard` は `ContextItemDescriptor` に基づき `monshin`/`vital`/`media`/`summary` のカードを表示し、`onSnippetDragStart` でコピー、ピン留めや履歴展開で文脈カードを整頓。DocumentTimeline の `InlineFeedback` や `DetailCard` も `aria-live` を持ち、監査操作（Document rename, edit, refresh）を即時に伝える。

## 2. Layout モック
```
+------------------+-----------------------------+------------------------+
| Left (Document   | Center (WorkSurface)        | Right (OrderConsole)    |
| Timeline + Memo) | - SOAP tabs (note/summary/  | - Tabs = medication/exam |
| - Memo + Context  |   observe)                  |   /imaging/procedure/    |
| - Context cards   | - Reference split (selected |   documents/billing      |
| - DocumentTimeline|   document highlight)       | - PanelGroup (plan cards, |
|                   | - HighlightStrip (aria-live)|   ORCA badges/warnings,   |
|                   | - Draft inputs + plan cards |   LabResults/MRP/etc.)   |
|                   |                             | - Collapse toggle + modal|
+------------------+-----------------------------+------------------------+
```

### 2.1 右カラムタブ/アコーディオン要件
- `OrderConsole` では `ConsoleTab`（`medication`〜`billing`）に対応するアイコンと `PanelGroup` を用意し、`renderPlanSection` で計画カードを `PlanCardList` にまとめる。計画カードは `PlanCardActions` で中央 `WorkSurface` へ注目させ (`onPlanCardFocus`)、`TextField`/`TextArea` でインライン編集可能。
- タブ切替は `handleTabSelect` で `activeTab` を更新し、右カラムは `PanelContainer` で collapsed/expanded/hover modal を制御。hover 展開や force collapse 時のモーダルオーバーレイ（`ModalOverlay`）を考慮し、狭い解像度でも `console` を隠さない。
- `decisionSupportMessages` と `LabResultsPanel` は `PanelGroup` の上段に置き、`StatusBadge` で `cards.length` を表示。Plan に紐づかない `LabResultsPanel`・`MedicalCertificatesPanel` はタブごとに `PanelGroup` に追加し、アクセス制御（`orderEditingDisabled`）を props で渡す。

### 2.2 Lab / Certificate 連携ショートカット
- Timeline の `handleTimelineLabSelected` は選択した module を `referenceLabModules` にマップし、`LabResultsPanel` の `useLaboItemTrend`/`useLaboModules` フックで `trend` + `abnormal` 青赤表示を更新。Lab トレンドカードから `DocumentTimeline` の lab event へ `onLabEventSelected` を送り返す双方向フローを想定。
- `documents` タブには `PatientDocumentsPanel`/`MedicalCertificatesPanel`/`SchemaEditorPanel` を縦に並べ、DocumentTimeline の `kind='document'` イベントリンク（`docInfoModel.id`）がこれらパネルのプリセットテンプレート（`documentPreset`）や `document modules` を開く。`MedicalCertificatesPanel` は `onSaved` でカルテ再取得 `karteQuery.refetch` をトリガし、DocumentTimeline に `Document` を追加するループを補完。
- Shortcut 表記: DocumentTimeline の `EventIcon` + `TimelineTitle` を押すと `handleReferenceDocumentSelected` で `WorkSurface` の reference view が開き、`ReferenceTitle`/`ReferenceMeta` で検証できる `RUN_ID`/`confirmedAt` を表示。

### 2.3 ORCA ステータスバッジ + aria-live
- `OrcaOrderPanel` の `renderDataSourceBadges` 出力 (`FilterBadge` のタグ群) は `data-test-id="orca-data-source-badges"` をつけ、キャッシュ・master 取得状況を `aria-label` で補足する。`DataSourceBanner`（`role="status" aria-live="polite"`）で `missingMaster` や `fallbackUsed` を screen reader に通知し、実 API 呼び出し完了/失敗で `runId` 付き `data-run-id` 属性を更新。
- `RenderDataSourceWarning` には `transition`（`from→to`）も表示し、`docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` §3 の「RUN_ID 表示」「Danger 操作の隔離」ルールに沿って caution-tone banner を右カラム先頭に置く。`aria-live` は `warning`/`info` `tone` で差別化し、Playwright 等の監査テストでも `runId` 付き DOM を拾って API coverage を記録できるようにする。

### 2.4 DocumentTimeline ↔ 本体連動ハイライト
- `DocumentTimelinePanel` 各 `TimelineItem` は `onDocumentSelected` で `DocumentModelPayload` を渡し、`handleReferenceDocumentSelected` が `setReferenceDocument` + `setReferenceLabModules` + `setLabSelectionActive(false)` を実行。`WorkSurface` は `referenceDocument` を `documentSections` 配列に変換し、右上「参照パネル」の toggle に従って `SurfaceCard` を展開し、該当の `Subjective`/`Objective` を `onInsert` で本文へ差し込める。
- `WorkSurface` の `HighlightStrip`（`aria-live="polite"`）は DocumentTimeline で開いた `Document` の内容に応じた否定語・数値・トピックを抽出し、`DocumentTimeline` 選択時に `setReferenceDocument` された `documentSections` で `Subjective` などが luminous highlight される flow を提案。
- DocumentTimeline とは別に `onTimelineOrderSelected` は `planCards` を `createPlanCard` + `updatePlanCards` で central plan list に追加し `focusedPlanCardId` をセット。これにより `PlanCardActions` の「中央で編集」ボタンを押すと `WorkSurface` が `Plan` セクションへ自動スクロールする設計を想定。

### 2.5 RUN_ID / 監査リンク付きコンテクストカード
- `ContextCard` 内の `ContextItemRow` には `drag` イベントで `onSnippetDragStart` を呼び、`monshin`/`vital`/`media`/`summary` のスニペットを SOAP に貼り付ける体験を定義。`ContextHeader` には `履歴` 展開トグルとピン留め管理を置き、`historyEntries` で `showHistory` の切替を制御。
- DocumentTimeline・ORCAバナー・ContextCard すべてに `runId` プロパティを盛り、`docs/server-modernization/phase2/operations/logs/20251129T120000Z-charts.md` の RUN_ID を相互参照するリンクカードを追加することで `audit.logChartsAction` や `logReceptionAction` の `runId` 追跡を完結させる。「RUN_ID=20251129T120000Z」のフラグを `DataSourceBanner`/`FilterBadge`/`ContextItemList` に沿って tooltip または `data-run-id` 属性で添える。

## 3. UI モック案
1. **左カラム**: 問診メモ + DocumentTimeline 直下に ContextCard（ピン留め/履歴 toggle） + DocumentTimelinePanel。選択中のイベントは `DocumentTimeline` 下部の `DetailCard` で `metadata`（担当医/時間）を表示し、`aria-live` で更新を通知。
2. **中央 (WorkSurface)**: `WorkspaceViewTabs` で `記録入力`/`サマリ`/`観察` を切り替え。`Subjective/Objectve` セクションと `Plan` cards に DocumentTimeline 選択時の `referenceDocument` を重ね、`HighlightStrip` でキーワード・数値を抜粋。参考文書パネル (`referenceSplitOpen`) を開くと timeline で選んだ文書の `title/confirmDate` を表示し、`onSubjectiveInsertText` で本文へ投入可能。
3. **右カラム**: `OrderConsole` は collapsed モードでアイコンリストを見せ、hover で展開。`medication` タブの Plan cards + `ORCA` + `OrderSet` + `StampLibrary` を縦並び、`exam` では `LabResultsPanel` + `ORCA` で検査/ラボへのショートカット、`documents` では `PatientDocumentsPanel`/`MedicalCertificatesPanel`/`SchemaEditorPanel` を文書＆証明書の連携ハブとする。
4. **ORCA 状態バッジ**: `FilterBadge` カラムに `runId`/`cacheHit`/`missingMaster`/`fallbackUsed` を表示し、`DataSourceBanner` で `missingMaster` や `dataSourceTransition` を `aria-live` 伝達。banner をクリックすると `docs/server-modernization/phase2/operations/logs/20251129T120000Z-charts.md` の `ORCA 状態` セクションへスクロールするリンクを開くイメージ。
5. **Context & RUN_ID card**: `ContextItemRow` の `Button` で `actionLabel`（「コピー」「プレビュー」）を表示し、`pinned` entries は `ContextPinButton` で優先表示。`ContextHeader` 右上に `RUN_ID=20251129T120000Z` のバッジを置き、同 ID で `docs/web-client/planning/phase2/DOC_STATUS.md` へエントリを新設する。

## 4. 次のステップ
1. この doc を `docs/web-client/README.md` の UX セクションへリンクし、`planning/phase2/DOC_STATUS.md` の Web クライアント UX 行に `RUN_ID=20251129T120000Z` + `docs/server-modernization/phase2/operations/logs/20251129T120000Z-charts.md` を記載。
2. 上記 RUN_ID を元に `docs/server-modernization/phase2/operations/logs/20251129T120000Z-charts.md` を作成して UX モックの証跡・ORCA/DocumentTimeline 依存・監査リンク付与を記録。
3. `docs/web-client/ux/ux-documentation-plan.md` と `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` にこの RUN_ID とリンクを反映し、マネージャー報告ラインを閉じる。
