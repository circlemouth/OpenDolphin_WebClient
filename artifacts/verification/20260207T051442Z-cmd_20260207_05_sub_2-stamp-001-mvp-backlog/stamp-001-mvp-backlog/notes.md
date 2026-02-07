# cmd_20260207_05_sub_2: STAMP-001 操作単位分解と最小MVP Backlog

- RUN_ID: 20260207T051442Z-cmd_20260207_05_sub_2-stamp-001-mvp-backlog
- 対象: `STAMP-001`（スタンプ閲覧: legacy StampBox 相当）
- 前提（既存根拠）: `artifacts/verification/20260207T044439Z-cmd_20260207_03_sub_7-stamp-001-parity/stamp-001-parity/notes.md`

## 1) Legacy StampBox: 代表操作（操作単位）

| 操作ID | 操作（legacy） | 根拠（legacyコード） | 補足 |
| --- | --- | --- | --- |
| L1 | エンティティ（処方/注射/検査…）のスタンプツリーを切替えて閲覧 | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampBoxPlugin.java`（`JTabbedPane parentBox` + `getStampTree(entity)`） | StampBox は独立ウィンドウとして常時参照しやすい |
| L2 | ツリー展開/折りたたみ（フォルダ）でスタンプを探す | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTree.java`（`JTree`、root非表示、drag enabled、tooltip有効） | ツリー階層でのブラウズが基本導線 |
| L3 | スタンプ選択時に詳細（メモ）を表示する | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTreePanel.java`（`infoArea.setText(info.getStampMemo())`） | 「選んで中身を見る」操作が成立 |
| L4 | 右クリックメニューでフォルダ/ノード管理（新規フォルダ/リネーム/削除） | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTreePopupAdapter.java`（`createNewFolder/renameNode/deleteNode`） | スタンプ運用（整理）要素を含む |
| L5 | 右クリックでコピー/貼り付け（クリップボード連携） | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTreePopupAdapter.java`（Copy/Paste + `canPaste(...)`） | entity互換条件あり |
| L6 | ドラッグ&ドロップで貼り付け（ツリー内/カルテとの間） | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTreeTransferHandler.java`, `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/StampTree.java`（`addStamp(...)`） | StampBox は入力支援UIとして操作コストが低い |
| L7 | テキスト入力支援（キーボードで候補提示→挿入） | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/AbstractCodeHelper.java`（modifier+Space/Enterでpopup） | 「検索」というより「入力中に候補を出す」導線 |

## 2) Web 現状: 対応する操作（操作単位）

| 操作ID | 操作（Web現状） | 根拠（Webコード） | legacy対応 |
| --- | --- | --- | --- |
| W1 | サーバースタンプ一覧を取得（ツリー名+スタンプリスト） | `web-client/src/features/charts/stampApi.ts`（`fetchStampTree` → `GET /touch/stampTree/:userPk`） | L1/L2のデータ面の一部 |
| W2 | サーバースタンプ詳細を取得 | `web-client/src/features/charts/stampApi.ts`（`fetchStampDetail` → `GET /touch/stamp/:stampId`） | L3のデータ面 |
| W3 | 「既存スタンプ」を選択（ローカル/サーバー） | `web-client/src/features/charts/OrderBundleEditPanel.tsx`（`既存スタンプ` `<select>` optgroup） | L2の代替だがツリー/検索なし |
| W4 | 取り込み（フォームへ反映） | `web-client/src/features/charts/OrderBundleEditPanel.tsx`（`importStamp` + serverは `fetchStampDetail`） | L6の代替（DnD無し） |
| W5 | コピー/ペースト（スタンプクリップボード） | `web-client/src/features/charts/OrderBundleEditPanel.tsx` + `web-client/src/features/charts/stampStorage.ts` | L5の代替（UI違い） |
| W6 | ローカル保存（個人スタンプ） | `web-client/src/features/charts/stampStorage.ts`（localStorage） | L4/L5の一部代替（ただしサーバ同期/ツリー管理は別） |

## 3) 不足（STAMP-001としてのギャップ）

- G1: **ツリーUI（階層/分類の視認性）**
  - 現状: `<select>` でフラット列挙（`treeName` は option 表示の suffix 程度）
  - 影響: 大量スタンプで「見つける」コストが高い

- G2: **検索UI（名前/メモ等で絞り込み）**
  - 現状: 検索フィールド無し
  - 影響: legacy の「探す（ブラウズ/入力支援）」の操作性が担保できない

- G3: **横断導線（どこからスタンプライブラリを開くか）**
  - 現状: `OrderBundleEditPanel` 内の機能に閉じており、StampBoxのような常設/横断参照の導線がない

- G4: **詳細プレビュー（選択→中身/メモ確認）**
  - legacy: 選択でメモ表示（`StampTreePanel`）
  - Web: 取り込み後にフォームで把握はできるが、選択段階のプレビューが弱い

## 4) 最小MVP Backlog（操作単位での不足を埋める）

### MVP-1: ツリーUI（分類ブラウズ）

- 目的: G1を埋める
- 最小仕様:
  - `treeName`（分類）単位で折りたたみ可能な一覧
  - entity（処方/注射/検査…）は既存の `stampTargets` と同等の切替
- 実装候補（置き場所）:
  - 第1案: `OrderBundleEditPanel` の「既存スタンプ」セクションを置換（既存導線を強化）

### MVP-2: 検索UI（フィルタ）

- 目的: G2を埋める
- 最小仕様:
  - スタンプ名で部分一致
  - 可能なら memo も対象（`StampTreeEntry.memo` が利用できる前提）

### MVP-3: 横断導線（StampBox相当の入口）

- 目的: G3を埋める
- 最小仕様:
  - Charts のユーティリティ/ドック領域に「スタンプ」タブ（ライブラリ）を追加し、選択→コピー（クリップボード）までを提供
  - OrderBundleEditPanel は「ペースト」で取り込めるため、相互接続が最小で成立

### MVP-4: 詳細プレビュー

- 目的: G4を埋める
- 最小仕様:
  - 選択中スタンプの `memo` と、必要最低限の item 先頭数を表示
  - サーバースタンプは選択時に `fetchStampDetail`（負荷に注意して debounce/明示ボタンでも可）

