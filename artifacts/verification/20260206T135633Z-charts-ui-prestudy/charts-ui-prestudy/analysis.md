# Charts UI最適化 事前調査（pre-study）

- RUN_ID: 20260206T135633Z-charts-ui-prestudy
- 対象URL: `http://localhost:5173/f/<facilityId>/charts?patientId=<...>&runId=<RUN_ID>`
- 証跡:
  - `measurements.json` / `measurements.md`
  - `screenshots/`（患者識別領域は blur マスク）

## 1. 現状UI棚卸し（主要要素）

### 常時表示必須（頻繁に見る）
- アクションバー: `#charts-actionbar`（診療終了/ORCA送信/ドラフト/印刷）
- 患者サマリ（sticky）: `#charts-patient-summary`（患者/受付/安全表示/承認/ロック）
- 中央入力（センター列）
  - SOAP: `#charts-soap-note`（入力・履歴）
  - タイムライン: `#charts-document-timeline`

### 低頻度（通常は隠して良い）
- Charts topbar（説明+RUN_ID/flags/監査/配信ステータス）: `#charts-topbar`
- ORCA原本/テレメトリ等のデバッグ寄りパネル
  - `#charts-orca-original` / `#charts-telemetry`

### 一時表示可（操作時のみ出せば良い）
- 左列（患者・病名）: `.charts-workbench__column--left`
  - PatientsTab / DiagnosisEditPanel
- 右列（サマリ・原本）: `.charts-workbench__column--right`
  - memo / OrcaSummary / OrcaOriginal / MedicalOutpatient
- ユーティリティドロワー（右サイド）: `.charts-workbench__side`

## 2. サイズ別計測（スクロール/中央入力領域）

### 計測方法
- Playwright で viewport を切替し、DOM の bounding box を取得。
- スクショは `#charts-patient-summary` と左列等を blur でマスク。

### 結果サマリ（重要）
- **いずれのサイズでも「ページ先頭(top)」時点では中央入力（center列）が viewport に入らず `centerVisibleHeight=0`。**
  - SOAPカード（#charts-soap-note）の `y` が 1456〜1514px 付近にあり、中央入力に到達するまで **約 1.2k〜1.5k px の縦スクロールが必要**。
- 中央入力（SOAP）へスクロールした状態(soap)では、center列の可視高さは概ね viewport を使えている。

### 数値（抜粋）
- 1366x768
  - top: centerWidth=580px, centerVisibleHeight=0px, scrollY=0
  - soap: centerWidth=580px, centerVisibleHeight=768px, scrollY=1477
- 1440x900
  - top: centerWidth=613px, centerVisibleHeight=0px, scrollY=0
  - soap: centerWidth=613px, centerVisibleHeight=841px, scrollY=1353
- 1920x1080
  - top: centerWidth=827px, centerVisibleHeight=0px, scrollY=0
  - soap: centerWidth=827px, centerVisibleHeight=931px, scrollY=1210

固定領域（要素高さ、参考）:
- topbar: 272〜296px
- actionbar: 340〜369px
- patient summary(sticky): 371px

スクロール発生箇所（本RUNの状態）:
- window: overflow（document scroll）= true
- `.document-timeline__virtual`: DOM未検出（データ/状態により内部スクロール化される想定）
- `.charts-docked-panel__tabs`: overflow=false（このRUNでは溢れなし）

## 3. 改善案（最低3案）

### 案A: 「縦スタック削減」= topbar折りたたみ + summary/actionbarのコンパクト化（最小改修）
- ねらい: **初期表示で中央入力を viewport 内に入れる**。
- 手段:
  - `#charts-topbar` を `<details>` か「折りたたみカード」に変更し、デフォルトは閉。
  - `#charts-actionbar` の上段メタ/ガード説明を縮約し、必要時のみ展開。
  - `#charts-patient-summary` を1行/2行のコンパクト表示にし、詳細はトグルで展開。

### 案B: 「フォーカスモード」= 中央入力最大化 + 左右はオーバーレイ（UX差分大・効果大）
- ねらい: **中央入力幅を最大化**（1366/1440 で 580〜613px は狭い）。
- 手段:
  - フォーカスモードON時: 左列/右列/ユーティリティを折りたたみ（ボタン/ショートカットで呼び出し）。
  - 既存 `.charts-workbench[data-utility-state]` を拡張し、列幅CSS変数を切替。

### 案C: 「スクロール設計の刷新」= workbench固定高 + 各列個別スクロール（実装難）
- ねらい: windowスクロールを減らし、編集領域を安定化。
- 手段:
  - workbench を `height: calc(100vh - <sticky> )` にして、列/カード内スクロールへ寄せる。
  - タイムラインは virtualization container を常用化して overflow-y を明確化。

## 4. 3案比較表（観点A〜F + 難易度/リスク/効果）

| 案 | A: スクロール削減 | B: 中央入力最大化 | C: 情報探索性 | D: 実装難易度 | E: 回帰リスク | F: 期待効果 | コメント |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 高 | 中 | 高 | 低 | 低 | 高 | 初期表示の縦スタックが課題の本筋。まずここ。 |
| B | 中 | 高 | 中 | 中 | 中 | 高 | パワーユーザー向け。好みが分かれるのでフラグ前提。 |
| C | 高 | 中 | 中 | 高 | 高 | 中〜高 | スクロール設計変更は副作用が大きい（フォーカス/アクセシビリティも）。 |

## 5. 推奨案（結論）

- **推奨: 案A をデフォルト改善として採用**。
  - 理由: 今回計測で「top時に中央入力が0px可視」が確定しており、最小改修で効果が大きい。
- **次点: 案B を feature flag + ショートカットで段階導入**。

### 段階導入（例）
1. `VITE_CHARTS_LAYOUT=compact_header`（flag）で topbar折りたたみ + summary/actionbar縮約のみ
2. default ON（問題なければ）
3. `VITE_CHARTS_FOCUS_MODE=1` で案B導入（ユーザー設定で保持）
