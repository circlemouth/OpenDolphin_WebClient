# 受付スケジュール UX ポリシー（改訂案 / RUN_ID=20251202T090000Z）

- 参照元: [src/webclient_screens_plan/01_phase2/screens 3 文書の棚卸.md](../../../src/webclient_screens_plan/01_phase2/screens%203%20文書の棚卸.md)
- 証跡ログ: [docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md](../../server-modernization/phase2/operations/logs/20251202T090000Z-screens.md)
- 目的: 受付〜診療〜会計の状態と待ち時間を、受付側が“一覧で判断”できるようにする。カルテ・基本情報編集・会計送信の入口として動く。
- 非目的: 問い合わせチャットバブルは実装しない（画面右下の常設サポートは置かない）。

---

## 1. 役割とトーン（受付が迷わない設計）

この画面は「今日の流れ」を見る場所にする。細かい設定やメッセージ管理は、ここに集めすぎない。

ヘッダーは常時表示し、次を固定で置く。
- 施設名 / 日付（できれば時刻も）
- ログインユーザー名 + ロール（役割）
- グローバルメニュー（管理・連携設定など）
- システム警告（会計送信の不達、接続不安定など）はヘッダー直下に1か所だけ

※見えている画面でも、上にタブ（外来受付/予約/在宅・訪問）が固定であり、業務の切替が迷いにくい。これを踏襲する。

---

## 2. 画面の骨格（“入口”→“絞り込み”→“リスト”を一列に）

### 2-1. 上部タブ
- **外来受付** / **予約** / **在宅・訪問スケジュール**
（タブ名は同等でよい。タブ切替はヘッダー直下の同じ位置に固定する）

### 2-2. クイック操作（左上に寄せる）
見えている画面の「患者登録」「当日受付」が良い。ここを踏襲して、受付が毎日使う入口を左に寄せる。
- **患者登録**（新患の簡易登録もここから）
- **当日受付**（今日の受付追加）
- （必要なら）カレンダー/一覧切替（予約の粒度切替など）

右側には“例外”だけを置く。
- **未承認一覧**（例外キュー。通常の一覧と分ける）
  - ボタンは目立つ色で、件数バッジを付ける（0件なら落ち着いた表示）

---

## 3. 検索・フィルタ（入力が速く、戻しやすい）

見えている画面の良さは「入力欄が横並び」+「検索」と「全てクリア」が近い点。ここをそのまま取り込む。

### 3-1. 患者検索（横並び）
- 診察券番号
- 生年月日
- 氏名（姓/名）とカナ（姓カナ/名カナ）

**操作ルール**:
- Enterで検索を実行する（ボタンに触らず進める）
- 検索ボタンは虫眼鏡アイコン＋文字で、位置を固定する
- 「全てクリア」を検索の隣に置き、押すと *患者検索欄 + ドロップダウンフィルタ* を一括リセットする

### 3-2. 業務フィルタ（ドロップダウン）
見えている画面通り、最低限はこの3つに絞る。
- 診療科（初期値: すべて）
- 診療種別（初期値: すべて）
- 担当医師（初期値: すべて）

※フィルタを増やすと迷いやすい。追加するなら「自費フラグ」など、受付が日常的に使うものに限る。

---

## 4. リストの出し方（状態別に縦並び + 件数 + 折りたたみ）

見えている画面は、状態別のリストが“縦に積まれている”。これが受付にとってわかりやすいので踏襲する。

### 4-1. セクション構成（最低3つ）
- a. **外来受付リスト**（受付〜診療前/診療中を含む）
- b. **会計待ちリスト**
- c. **会計済みリスト**（重要度が低いので、初期は折りたたみでもよい）

各セクションに共通で付ける:
- 件数表示（例: 「外来受付リスト 12人」）
- 折りたたみボタン（開閉状態はユーザーごとに保持）
- 空のときは「該当なし」を明示（真っ白にしない）

### 4-2. 列（見えている画面を基準に、受付が見たい順）
見えている列の並びはそのまま使いやすい。基本は下記。
1. 受付No
2. 受付内容
3. 受付時間 / 予約時間
4. 状態
5. 名前
6. 診察券番号
7. 担当医師
8. 患者位置（例: 待合/処置室など）
9. 受付コメント

あなたの設計で追加したい要素（年齢/性別、自費アイコン等）は、列を増やしすぎず “アイコン+ツールチップ” で吸収する方が一覧が崩れにくい。

---

## 5. 行の操作（一覧を散らかさない）

一覧は「見る」場所なので、ボタンを並べすぎない。操作は基本2段にする。
- **1段目**: 行クリックで右パネル（サマリ）を開く or カルテを開く
- **2段目**: 行のメニュー（…）に「修正/取消/会計完了/会計送信（再送）」をまとめる

「別画面へ直接移動するリンク（ディープリンク / deep link）」は、Patients 管理への導線として残す。
- Patientsで保存したら、戻る操作でReceptionの *タブ/フィルタ/ソート/折りたたみ* を復元する

---

## 6. 右パネル（サマリ）は“軽く、速く”

右パネルは「いま判断する」ための最小情報に絞る。
- 基本情報サマリ（保険/自費の区分を含む）
- 直近受診日と病名サマリ
- 直近の処方・検査の概要
- 患者メモ（受付が見る用の短文）

※右パネルが重いと一覧の操作が遅くなる。詳細はカルテ側に寄せる。

---

## 7. 例外導線（未承認一覧を“別世界”にする）

見えている画面の「未承認一覧」は、通常フローを守る良い分離。これをあなたの設計にも採用する。

**未承認一覧に集める候補**:
- 会計送信エラー（再送が必要）
- 未紐付の警告（病名や保険など、送れない理由がある）
- キュー遅延（待ちが長い）

未承認一覧では、通常の外来受付リストよりも「原因」と「次の一手」を前に出す。
- 原因コード（あるなら）＋短い説明
- 再送できる/できない
- 次の操作（再送/診療終了取り消し/管理へ連絡）

---

## 8. アラート表示と読み上げ（Reception/Charts 共通）

「画面が読み上げソフトにどう伝えるか」の設定（ARIA）を、会計送信まわりの警告で揃える。

- エラー/警告は強く読み上げ、情報は控えめに読む
- 文言の順番を固定する: `[種別][状態][患者ID/受付ID][送信先][再送可否][次の操作]`
- バナーはヘッダー直下に1か所だけ置く（一覧に重ねない）
- 監査ログには `runId` を含め、UI操作（再送/状態変更/手動更新）の記録を残す

---

## 9. 自動更新・手動更新（“勝手に変わる怖さ”を減らす）

「一定間隔で取り直す（ポーリング / polling）」は 30秒で維持しつつ、受付が納得できる見せ方にする。
- 自動更新しても、選択中の行・フィルタ・ソート・折りたたみは保持する
- 「一覧を更新」ボタンで即時更新できるようにする（押した事実は監査ログへ）
- バナー表示中の再読み上げは抑える（差分だけ読む）

---

## 10. テスト観点（受付で事故が起きやすい所から）

画面操作テストの道具（Playwright）で、次を優先して固める。
- 状態変更→会計送信結果の表示が揃うか（エラー/完了）
- 未承認一覧→再送→一覧への反映が遅れても迷わないか
- Patientsから戻ったときに、一覧の状態が復元されるか
- 役割ごとにボタンが押せる/押せないが一致し、監査ログが残るか

---

## 付録: 接続フロー/telemetry/証跡（RUN_ID群）

### A. 接続フローと差分（RUN_ID=20251204T210000Z）

- **接続フロー**: `resolveMasterSource` で `dataSourceTransition=server` になったタイミングで `httpClient` 経由の外来 API (/api01rv2/claim/outpatient/* など) が実行され、キャッシュ命中／未命中フラグ (`cacheHit`/`missingMaster`) が `telemetryClient` の `funnels/outpatient`（RUN_ID=`20251205T150000Z` + `docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md`）へ送出される。AuthServiceProvider は `recordOutpatientFunnel('resolve_master', …)` で最初のステージをキャプチャし、`handleOutpatientFlags` で `charts_orchestration` を記録したタイミングで `setResolveMasterSource('server')` を呼び出して Reception/Charts の `tone=server` + `dataSourceTransition=server` 表示を同期する。
- **接続図 (概要)**:
```
       [resolveMasterSource]
               |
               v
        [httpClient OUTPATIENT API]
               | (dataSourceTransition=server)
               v
         /api01rv2/claim/outpatient/*
         /api01rv2/appointment/outpatient/*
         /orca21/medicalmodv2/outpatient
         /orca12/patientmodv2/outpatient
               |
               v
          [real ORCA / Modernized server]
               |
          +--- telemetry funnel: cacheHit / missingMaster → `telemetryClient` (`resolve_master` stage)
          |
          v
    [AuthServiceProvider → `handleOutpatientFlags` (charts_orchestration)]
          |
          v
     [Reception / Charts orchestration (flag受信)]
          +--- tone=server banner + `audit.logUiState`
```
- **差分と確認事項**: 04C1 では解説/設計資料に止まっていた `resolveMasterSource`/監査 circulation を 04C2 で telemetry 連携と Orchestration flag の漏れなく残すことに落とし込み、`docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` に API パス一覧・実装済みコード・telemetry funnel の図を証跡化した。

### B. 実装スクリーンショットと ARIA メモ（RUN_ID=20251212T090000Z）

- ReceptionPage/OrderConsole の `tone=server` バナー・`resolveMasterSource` バッジ・`missingMaster` 入力・`missingMaster`/`cacheHit` badge を `artifacts/webclient/ux-notes/20251212T090000Z-reception-ux.md` でスクリーンショット候補（`artifacts/webclient/ux-notes/20251212T090000Z-reception-ux.png`）付きで記録。
- `role=alert` + `aria-live` を tone 毎に切り替えており、Error/Warning は `assertive`、Info は `polite`、`aria-atomic=false` で連続読み上げを防止。lived region に `data-run-id=20251212T090000Z` を付与し、Charts/Patients に carry-over できるようにした。
- `missingMaster`/`cacheHit` badge は Reception/Charts/Patients で共通の `status-badge` CSS/ARIA を再利用し、ツールチップや tone が一致することでトーンの整合性を担保。

### C. 最新実装と記録（RUN_ID=20251204T230000Z）

- ReceptionPage 直下で `ToneBanner` → `ResolveMasterBadge` とステップ表示し、`missingMaster`/`cacheHit` 表示と `missingMaster` 入力メモを OrderConsole に集約することで `aria-live` の意図を単一箇所に保つ。`missingMaster` ノートは `aria-live=assertive`/`polite` を状態依存で切り替えて、警告のみを強調しつつ再取得時に tone=server を継承。
- `artifacts/webclient/ux-notes/20251204T230000Z-reception-ux-implementation.md` に props/flag の差分を記録。
- `docs/server-modernization/phase2/operations/logs/20251204T230000Z-reception-ux.md` に依存 API と `missingMaster` フラグの起点を添えて証跡化。

### D. Step-by-step status + missingMaster 集約（RUN_ID=20251205T062049Z）

- OrderConsole の先頭に Step 1 (`ToneBanner` tone=server) → Step 2 (`ResolveMasterBadge` の `resolveMasterSource`) の構造を導入し、`missingMaster`/`cacheHit` バッジと `missingMaster` コメントを OrderConsole に集中。`OrderConsole` が `data-run-id` を `Zone` 全体に供給するため、Charts/Patients への carry-overと `aria-live` 制御（tone banner=role alert、note=role status）を 1 コンポーネントにまとめられる。
- Artifact: `artifacts/webclient/ux-notes/20251205T062049Z-reception-ux-implementation.md`
- 依存 doc: `docs/server-modernization/phase2/operations/logs/20251205T062049Z-reception-ux.md`
