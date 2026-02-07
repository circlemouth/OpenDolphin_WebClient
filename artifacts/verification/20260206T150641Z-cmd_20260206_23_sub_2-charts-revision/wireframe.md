# Charts UI: カルテ版管理（Revisions）案
RUN_ID=20260206T150641Z-cmd_20260206_23_sub_2-charts-revision

用語（本提案内）:
- `revisionId`: 版ID（immutable）。最新版=latestRevisionId。
- `baseRevisionId`: 改訂作業が始まった元版。保存時の競合検知キー。
- 「過去版編集」= 過去版を直接上書きせず、**改訂版を新規追加**する。

前提/要件:
- 版タイムライン（誰が/いつ/何を）を閲覧できる。
- 差分が見られる（最低限: 変更量と要約、できれば before/after）。
- 復元は「過去版へ戻す」ではなく、**過去版を元に新しい revision を追加**として扱う（上書き禁止を自然に）。
- 競合（他者が先に最新版を追加した等）を明示し、安全に解決できる。
- cmd_20260206_21 の Do転記は「転記元 revisionId」を監査へ残す導線と整合。

---

## 案A（推奨）: エディタ内「Revision Drawer」

配置:
- 中央の編集対象（SOAP/文書/オーダー）それぞれに、ヘッダ右上へ `履歴` ボタン。
- `履歴` で右側に Drawer を開き、Revision timeline と操作（閲覧/改訂/復元/差分）を集約。

ワイヤ（概略）:

```
[Editor Header]
  タイトル / 対象 / status-pill(読み取り/編集中)
  Revision: v12 (revisionId=R12)  [履歴] [差分] [保存=改訂版追加]

[Drawer: Revision Timeline]
  v12  2026-02-06 12:10  doctorA  (latest)   [閲覧] [差分] [この版を改訂]
  v11  2026-02-06 11:40  doctorB             [閲覧] [差分] [この版を改訂] [この版を復元]
  v10  2026-02-06 10:05  doctorA             ...

[差分ビュー]
  before(v11) | after(v12)
  - 最低限: 変更量サマリ（+12 -3）、変更セクション（S/O/A/P、処方、オーダー等）
```

操作モデル:
- 閲覧: 任意の revision を read-only で表示。
- 過去版編集: `この版を改訂` → Editor に「改訂作業（baseRevisionId=対象revisionId）」としてロード。
  - 保存ボタンの文言を `改訂版を追加` に固定（"上書き" をUIから消す）。
- 復元: `この版を復元` → "復元プレビュー" を表示 → `復元版を追加`（baseRevisionId=対象revisionId、reason=restore）

競合（Conflict）:
- `改訂版を追加` 実行時にサーバが `baseRevisionId != latestRevisionId` を検知したら 409。
- UIは「競合」ダイアログ:
  - (1) 自分の改訂（draft） vs (2) 最新版（latest） の差分を並べる
  - 選択肢:
    - `最新版をベースに差分を再適用（rebase）`（可能なら自動、難しければ手動）
    - `別改訂として保存（派生元=baseRevisionIdのまま）`（監査に残す）
    - `キャンセル`

cmd21 Do転記（整合）:
- Do実行時は必ず「転記元revisionId」を UI 上で確認可能にし、監査へ残す。
  - 例: Past Hub 行に `v11` を表示、Doプレビューに `sourceRevisionId=R11` を表示。
  - `logAuditEvent.payload.details` に `doSource: { kind, sourceDocId, sourceRevisionId }` を必須で入れる。

メリット:
- 編集中の文脈で完結（履歴/差分/復元/競合が散らない）。
- 「上書き禁止」を UI 文言で自然に徹底できる。

デメリット:
- 各エディタ（SOAP/文書/オーダー）に共通 Drawer/UI を組み込む必要。

---

## 案B: DocumentTimeline 内「版タイムライン」 + 編集は別パネル

配置:
- DocumentTimeline（中央下）に、文書/記載の各エントリを「版グループ」としてまとめる。
- エントリ展開で `vN` 一覧（編集者/時刻/要約/差分）を表示。
- `この版を改訂` は DocumentCreatePanel / SOAPPanel を開いて改訂編集。

ワイヤ（概略）:

```
[DocumentTimeline]
  2026-02-06 SOAP記載 (v12 latest) [展開]
    - v12 doctorA 12:10 (latest) [閲覧] [差分] [この版を改訂]
    - v11 doctorB 11:40         [閲覧] [差分] [この版を改訂] [この版を復元]

[Editor Panel]
  baseRevisionId=v11 の改訂作業
  [改訂版を追加]
```

操作モデル:
- Revision の閲覧/差分はタイムライン上で行う。
- 編集は既存パネル（DocumentCreatePanel 等）を再利用。

メリット:
- 版管理が「時系列」になじむ（Timeline を伸ばすだけ）。
- 画面の主要導線（SOAP編集）を邪魔しにくい。

デメリット:
- 版操作が Timeline に埋もれる（頻用時は到達が増える）。
- 編集と履歴が分離し、競合時のガイドが複雑になりやすい。

---

## 案C: 「Draft（作業中）→ Publish（版追加）」を明示するワークフロー

配置:
- 中央エディタは常に Draft。
- 上部に `Draft（未公開）` と `Publish（改訂版を追加）` を明示。
- 履歴は Drawer だが、操作は Draft に集約（checkout して publish）。

要点:
- 過去版編集= `checkout v11 → Draftへ` → `Publish` で新 revision を作る。
- 競合は `Publish` 時に検知。

メリット:
- 編集者の認知モデルが明確（"下書き" と "版" を分ける）。

デメリット:
- 現行の「編集=保存」感覚からは一段変わる（学習コスト）。
