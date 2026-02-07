# カルテ版管理（Charts UI）比較表
RUN_ID=20260206T150641Z-cmd_20260206_23_sub_2-charts-revision

前提:
- revision は immutable。
- 過去版編集/復元は "上書き" ではなく "新revision追加"。
- 競合は baseRevisionId と latestRevisionId の不一致で検知。

| 観点 | 案A: エディタ内 Revision Drawer（推奨） | 案B: Timeline内 版タイムライン | 案C: Draft→Publish workflow |
| --- | --- | --- | --- |
| 編集履歴の見やすさ（誰がいつ何を） | 高（編集画面で即見れる、到達が短い） | 中〜高（時系列で自然だが、展開が必要） | 中（履歴は見れるが、Draft概念を理解要） |
| 差分/復元の分かりやすさ | 高（同一UIでプレビュー→復元版追加） | 中（復元はTimeline起点で分かるが編集へ遷移が入る） | 高（復元=checkout→publishで一貫、ただし手順は多い） |
| 過去版編集=改訂版追加UX（上書き禁止） | 高（保存ボタンを "改訂版を追加" に固定） | 中（編集パネル側の文言統一が要る） | 高（publishが版追加なので上書きが概念上起きない） |
| cmd21 Do転記との整合（sourceRevisionId監査） | 高（Doプレビュー/適用が同一文脈で実装しやすい） | 中（Doが左/別パネルにある場合、監査連携の実装箇所が分散） | 中〜高（DraftでDo適用→publish時にsourceRevisionIdを確定できる） |
| 実装コスト/回帰リスク | 中（共通Drawer/差分UI/409ハンドリングを各エディタに） | 低〜中（Timeline拡張中心、編集パネルは最小追加） | 高（Draft状態管理、publish導線の追加） |
| パフォーマンス | 中（差分は遅延ロードで対処） | 中（Timelineが肥大化しやすい） | 中（Draft管理はクライアント側負荷が増えやすい） |

## 推奨案
推奨: **案A（Revision Drawer）**
- "上書き禁止" を UI 文言と操作で強制しやすい。
- 過去版閲覧/差分/改訂/復元/競合が散らず、誤操作リスクが低い。
- cmd21 Do転記の「転記元revisionIdを監査へ残す」要件も、プレビューUIと同じ設計原則で統一できる。

---

## flag 段階導入案（必須）
Phase 1（閲覧のみ）:
- `VITE_CHARTS_REVISION_HISTORY=1`
  - Revision timeline の表示のみ（read-only）
  - Editor には `revisionId` と `editor/updatedAt` を表示

Phase 2（過去版編集=改訂版追加）:
- `VITE_CHARTS_REVISION_EDIT=1`
  - `この版を改訂`（baseRevisionId をセットして draft）
  - 保存は `改訂版を追加`（上書き不可）
  - cmd21 Do転記: `VITE_CHARTS_DO_COPY=1` のDo操作で `sourceRevisionId` を必須ログ化（監査payload.details）

Phase 3（復元/競合）:
- `VITE_CHARTS_REVISION_RESTORE=1`
  - `この版を復元`（復元プレビュー→復元版追加）
- `VITE_CHARTS_REVISION_CONFLICT=1`
  - 409 conflict を UI でガイド（rebase/別改訂/キャンセル）

監査（Do転記/復元/改訂）共通ルール:
- `logAuditEvent.payload.details` に以下を常に入れる:
  - `operationPhase: 'do' | 'edit' | 'restore'`
  - `sourceRevisionId`（Do/復元）
  - `baseRevisionId`（改訂作業）
  - `createdRevisionId`（新規追加された版）
