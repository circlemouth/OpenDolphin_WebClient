# Charts UI Optimization Plan (Draft Skeleton)

Status: DRAFT (skeleton)
Owner: (TBD by karo)
Scope: Charts UI only (NO functional / API / data / business logic changes)

## 背景 / 目的

- Charts 画面の「視認性」「操作回数」「迷い（判断コスト）」を下げる。
- 対象は UI のみ（レイアウト/表示/スタイル/アイコン化/折りたたみ/ショートカット表示など）。
- 非対象（禁止）: API仕様変更、データ構造変更、業務ロジック変更、サーバー挙動変更。

## 現状の課題（共通）

- (TBD) 1366x768 で情報密度が高く、重要領域が折り返し/スクロールに埋もれる。
- (TBD) 「次に何をすればよいか」が画面上で即時に分かりにくい（状態/導線/優先度）。
- (TBD) 左右パネルやモーダルが同時に開くと、編集面積が不足する。
- (TBD) 送信/印刷/保存などのアクションが分散し、操作回数が増える。

## 提案（足軽案 A/B/C）

### 提案A（足軽3 / cmd_20260207_13_sub_1）

- 要点:
  - 「入力（SOAP）」の視覚階層を最優先にし、周辺情報/操作よりも視線誘導を強める（見出し/区切り/現在入力中の強調）。
  - 状態表示（draft/dirty/lock/保存成功等）を1箇所（上部ステータス帯）へ集約して見落としを減らす。
  - 右ドック（ユーティリティ/タブ）の「作業モード」を明確化し、現在地を強く出す（タブ表現の整理）。
  - 主要アクション（保存/送信/印刷/ユーティリティ開閉）を上部に固定して誤クリック耐性を上げる。
  - ショートカットをボタンのサブラベル等で“見える化”して学習コストを下げる。
- UI変更点（UIのみ根拠）:
  - DOM構造/スタイル/ラベル/配置（見た目）の変更に留め、保存/送信などの業務ロジックは変更しない前提。
  - 右ドックはタブUIの見た目（アイコン+短名+ツールチップ等）を変更するのみで、データ取得/APIは変更しない前提。
- スクショ/証跡:
  - RUN_ID: `20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A`
  - artifacts:
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/notes.md`
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/screenshots/`
  - 参考画像（1366x768 / 1440x900）:
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/screenshots/charts-1366x768-viewport.png`
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/screenshots/charts-docked-1366x768-viewport.png`
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/screenshots/charts-1440x900-viewport.png`
    - `artifacts/verification/20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A/charts-ui-proposal-A/screenshots/charts-docked-1440x900-viewport.png`
- 回帰観点:
  - 既存の compact flags（例: `VITE_CHARTS_COMPACT_UI` 等）との整合。flag差分を最小化する設計が必要。
  - 右ドックの開閉/ショートカット（例: Ctrl+Shift+U）と、入力フォーカス/スクロール補助の干渉に注意。

### 提案B（足軽5 / cmd_20260207_13_sub_2）

- 要点:
  - 3カラム構成は維持しつつ、中央（SOAP）を広め・左右を絞って「主作業=SOAP」を強調（center-first配分）。
  - 余白/ギャップ/罫線/影などの “chrome” を抑え、視覚ノイズを削ってファーストビューの実作業面積を増やす。
  - SOAPカードに薄いティント/アクセント枠を入れ、入力領域を直感的に「主役化」する。
  - ユーティリティは compact 状態で情報量を調整（ショートカット一覧を非表示）し、狭幅での圧迫感を減らす。
- UI変更点（UIのみ根拠）:
  - `chartsStyles` のCSS変数・ボーダー/影/余白/タイポグラフィの調整で実現可能（API/データ/業務ロジック不変）。
  - カラム構成（左/中央/右/ユーティリティ）は維持し、表示優先度と視覚階層のみを変更（機能追加なし）。
  - ユーティリティのショートカット非表示は compact 状態での表示調整のみ（操作導線や機能自体は変更しない）。
- スクショ/証跡:
  - RUN_ID: `20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b`
  - artifacts:
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/notes.md`
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/screenshots/`
  - 参考画像（1366x768 / 1440x900）:
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/screenshots/1366x768/current.png`
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/screenshots/1366x768/proposal-b-mock.png`
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/screenshots/1440x900/current.png`
    - `artifacts/verification/20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b/charts-ui-proposal-B/screenshots/1440x900/proposal-b-mock.png`
- 回帰観点:
  - compact flags（compact UI / compact header）で余白・カラム幅が破綻しないことを確認（特に 1366x768）。
  - SOAP強調（ティント/枠）のトーンが強すぎると他カードとのバランスが崩れるため段階調整が必要。
  - `data-utility-state='compact'` の表示調整が、発見性（ショートカット）を過度に損なわないこと。

### 提案C（足軽8 / cmd_20260207_13_sub_3）

- 要点:
  - 上部の情報群（説明文 + RUN_ID/flags + 監査/配信など）を「sticky 1行サマリ」へ圧縮し、初期表示で主作業（中央）を最大化。
  - “編集帯” として中央入力を背景差/境界で明確化し、視線誘導と誤操作低減を狙う。
  - 右端はユーティリティドックを最小幅のアイコン列へ寄せ、同時展開の圧迫を減らす。
  - StatusPill を短ラベル＋アイコンで 1行に収め、詳細値は hover/詳細行へ退避して階層化する。
- UI変更点（UIのみ根拠）:
  - 上部サマリ化は既存データの「表示順/表示量/折りたたみ」の調整で、API・状態遷移・業務ロジックは不変。
  - 3カラム再整理はレイアウト（CSS grid）中心の変更で、データ取得・保存・監査イベント生成は不変。
  - ユーティリティドックは「見せ方（常時幅/初期開閉）」の変更で、機能追加はしない。
- スクショ/証跡:
  - RUN_ID: `20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c`
  - artifacts:
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/notes.md`
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/screenshots/`
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/mock-proposal-c.html`
  - 参考画像（1366x768 / 1440x900）:
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/screenshots/1366x768-current.png`
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/screenshots/1366x768-mock.png`
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/screenshots/1440x900-current.png`
    - `artifacts/verification/20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c/charts-ui-proposal-C/screenshots/1440x900-mock.png`
- 回帰観点:
  - sticky 化によりキーボードフォーカス/見出し階層/スキップリンクが崩れないよう a11y を再点検。
  - “説明文” を畳む場合、初見ユーザーのオンボーディングを別導線（ヘルプ/ツールチップ）で補う必要。
  - レイアウト再整理は構造変更が大きく、既存flagとの整合・回帰の面積が増える。

## 比較表（必須）

評価スケール案:
- `◎` = 明確に良い
- `○` = 良い
- `△` = 許容
- `×` = 不可/懸念大
- `TBD` = 未評価

| 指標 | 案A | 案B | 案C | 根拠（RUN_ID/証跡/スクショ） |
| --- | --- | --- | --- | --- |
| 1366x768 視認性 | ○ | ◎ | ◎ | A: RUN_ID=`20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A`（`.../charts-1366x768-viewport.png`, `.../charts-docked-1366x768-viewport.png`） / B: RUN_ID=`20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b`（`.../1366x768/proposal-b-mock.png`） / C: RUN_ID=`20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c`（`.../1366x768-mock.png`） |
| 1440x900 視認性 | ○ | ○ | ○ | A: RUN_ID=`20260207T120517Z-cmd_20260207_13_sub_1-charts-ui-proposal-A`（`.../charts-1440x900-viewport.png`, `.../charts-docked-1440x900-viewport.png`） / B: RUN_ID=`20260207T121159Z-cmd_20260207_13_sub_2-charts-ui-proposal-b`（`.../1440x900/proposal-b-mock.png`） / C: RUN_ID=`20260207T121235Z-cmd_20260207_13_sub_3-charts-ui-proposal-c`（`.../1440x900-mock.png`） |
| 操作回数（入力→保存→送信→印刷） | △ | △ | △ | UI改善のため機能追加なし（操作数は原則不変）。Aは操作の“見つけやすさ”改善を狙う。 |
| 学習コスト（既存ユーザーの迷い） | ○ | ◎ | △ | Bは現行構造を維持しつつノイズ削減（最小学習）。Cは構造変化が大きく学習/慣れが必要。 |
| 実装コスト（工数/影響範囲） | △ | ◎ | △ | BはCSS中心（0.5〜1.0人日想定）。A/Cは構造/表現変更が多く増えやすい。 |
| 回帰リスク（最小回帰チェック観点） | △ | ◎ | × | BはCSS中心で差分最小。Cはレイアウト/sticky等で回帰面積が大きい。 |

## 決定（家老決定欄）

- 採用案: 案B（Phase1）
- 決定日: (TBD)
- 判断理由:
  - CSS中心で実装コスト/回帰リスクが最小。
  - 1366x768 の中央入力（SOAP）最大化に直結し、現行構造を維持したまま効果が出る。
- 不採用理由（現時点, Phase2候補）:
  - 案A: 改善幅は大きいが、状態帯/右ドック/アクション配置など“構造変更”が相対的に多く、Phase1での回帰リスクが増える。
  - 案C: 1行サマリ/3カラム再整理/ドック寄せ等で構造変更が大きく、a11y/既存flag整合の回帰面積が大きい。
- 条件付き採用（flag/段階導入）:
  - Phase1: 案B を flag で導入し、最小UI回帰（OFF/ON）をRUNで根拠化する。
  - Phase2: 案A/C の要素を分割して段階導入する（TBD）。

## 実装方針（flag / 段階導入 / 回帰チェック）

- 導入形態:
  - 既存 flag を使う or 新規 flag を追加する: (TBD)
  - flag 名: (TBD)
- 段階導入:
  - OFF/ON の切替で最小回帰が可能な状態を維持する（Docs: `docs/verification-plan.md` を参照）。
- 証跡RUN:
  - flag OFF/ON それぞれで同一シナリオを実施し、RUN_ID と証跡パスを残す（手動 or Playwright）。

## 最小UI回帰チェック（参照）

- `docs/verification-plan.md` の「cmd_20260207_13: Charts UI Optimization（UI only）」の節を参照。
