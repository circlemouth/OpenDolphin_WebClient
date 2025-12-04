# 受付スケジュール UX ポリシー（RUN_ID=20251202T090000Z）

- 参照元: [src/webclient_screens_plan/01_phase2/screens 3 文書の棚卸.md](../../../src/webclient_screens_plan/01_phase2/screens%203%20文書の棚卸.md)
- 証跡ログ: [docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md](../../server-modernization/phase2/operations/logs/20251202T090000Z-screens.md)
- 目的: 受付〜診療〜会計のステータスと待ち時間を可視化し、カルテ・基本情報編集・ORCA 送信のハブとして動く画面の UX 方針を整理する。

## 1. 役割とトーン
- 今日の患者フローを一覧で把握し、受付ロールでも最低限の修正・再送ができる安心感を与える。
- ヘッダーで施設ロゴ・日付時刻・ログインユーザー＋ロール・グローバルメニュー・システムアラート（ORCA 接続など）を常時表示。
- ステータス別タブ（受付状況/診察終了）とフィルタを左レールに配置し、待ち時間や優先度を即座に判断できる色/アイコンを使う。

## 2. ユースケースと情報構造
- 受付登録/修正/取消、新患の簡易登録、過去受診歴検索→当日受付追加。
- 受付状況/診察終了タブでの状態確認、診療科/担当医/時間帯/自費フラグフィルタ、待ち時間/診療科/受付時間ソート、自動更新。
- 行アクション: カルテを開く／基本情報編集（Patients 管理へのディープリンク）／受付修正・取消／診察終了タブではカルテ再表示・ORCA 送信/再送・会計完了チェック。
- 中央テーブル要素: ステータス・患者ID・氏名・年齢/性別・自費アイコン・受付時間・待ち時間・予約区分・診療科・担当医・メモ有無。
- 右パネル要素: 基本情報サマリ、直近診療日＋病名サマリ、処方・検査などの概要、患者メモ。
- 印刷/エクスポートの導線をテーブル操作の延長に置き、受付ロールが自走できる位置にまとめる。

## 3. データ・API 前提
- 受付/予約/診療ステータスをまとめて取得する受付リソース（一覧＋予約/受付登録/修正/取消の POST/PUT/DELETE）。
- Patient/Insurance リソースで患者検索と基本情報編集を行い、患者メモ/履歴サマリ取得用の軽量 API を併用。
- ORCA 送信ステータス取得と送信/再送コマンドを提供する ORCA 連携リソース。エラー理由を返却し、会計・オーダー送信を含む。
- 自動更新では上記一覧 API をポーリングし、誰がいつどの患者の受付をどう変更したかを監査ログへ記録する。

## 4. 遷移・権限・認証
- 行の「カルテを開く」で患者IDと自費/保険モードを Chart Entry に渡す。診療終了で受付ステータスと ORCA 送信キューを更新し、エラーは診察終了タブへ返す。
- 「基本情報編集」は Patients 管理画面へのディープリンク。保存後に Reception へ戻れる履歴を保持する。
- role=受付/看護/医師/管理者で操作可否を分け、受付ロールが手動調整できる範囲は Administration で定義。全操作に監査ログを残す。

## 5. アラートバナー / ライブリージョン（Reception=Charts 共通）
- 対象イベント: ORCA 送信エラー（コード付き/再送可否）、未紐付病名警告、送信キュー遅延（再送・待機中）。Reception と Charts で同文言・同トーンを共有し、色は Error=赤、Warning=琥珀、Info=青に統一。
- `aria-live` と `role=alert` の組み合わせ: Error/未紐付/遅延は `aria-live=assertive`、完了/情報は `aria-live=polite`。`data-run-id=\"20251202T090000Z\"` を付与し、スクリーンリーダーで前後の更新を識別できるようにする。
- テキスト構造: `[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション（再送/診療終了取り消し/管理へ連絡）]` を固定順にし、Charts 側で出たバナーを Reception 診察終了タブへミラー表示する。
- live 領域の置き場所: Reception はヘッダー直下に共通バナー領域を 1 箇所設け、一覧上に重ねない。Charts で表示された最新バナーを Reception へ戻る際に carry over する。
- ログ出力: 送信/再送ボタン・診療終了・ステータス手動変更のたびに監査ログへ `action`, `patientId`, `queueStatus`, `tone`, `ariaLive`, `runId` を記録し、Playwright の `fetchAuditLog` で検証可能にする。

## 6. 自動更新・手動更新・ステータス遷移・権限
- ステータス遷移（デフォルト）: 受付→診療開始→診療終了→会計完了。診療開始/診療終了は Charts 側の操作が一次トリガー、Reception は手動調整可。会計完了は受付・管理ロールのみ操作可。
- ロール別操作: 受付=受付登録/修正/取消・会計完了チェック・ORCA 再送、看護=ステータス補助変更と再送可（会計完了は不可）、医師=診療開始/診療終了・再送、管理者=全操作＋遷移ルール編集（Administration）。非活性時は理由ツールチップで明示。
- 自動更新: 受付一覧/キュー状態を 30s ポーリング。バナーが表示中でも更新し、tone/aria-live は再度 announce させない（`aria-live` は残しつつ `aria-atomic=false` で差分のみ読み上げ）。
- 手動更新: 「一覧を更新」ボタンで即時リロードし、直前のタブ/フィルタ/ソートを保持。更新時に audit へ `manualRefresh=true` を記録。
- 監査ログ: ステータス変更/再送/診療終了解除/自動更新失敗を `action`, `beforeStatus`, `afterStatus`, `role`, `source=auto|manual`, `runId=20251202T090000Z` 付きで保存。ORCA 送信 API のレスポンスコードも付与。

## 7. 次アクション（RUN_ID=20251202T090000Z）
- ORCA エラー/未紐付/遅延バナーの tone と aria-live を Charts と共通ヘルパーで実装し、`ux/ux-documentation-plan.md` にハンドオフ条件を記載する。
- Patients へのディープリンク戻り動作、印刷/エクスポート時の監査記録を Playwright ケース化する際に本稿へ反映する。
- Reception から Patients への導線で編集権限ガードが効き、監査ログが登録されることを確認する。

## 8. 接続フローと差分（RUN_ID=20251204T210000Z）

- 接続フロー: `resolveMasterSource` で `dataSourceTransition=server` になったタイミングで `httpClient` 経由の外来 API (/api01rv2/claim/outpatient/* など) が実行され、キャッシュ命中／未命中フラグ (`cacheHit`/`missingMaster`) が telemetry funnel ログに送出される。Reception/Charts の Orchestration がこの flag を受信したら同じ tone=server バナーを出し、`audit.logUiState` との整合性を検証できるようにする。
- 接続図 (概要):

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
               +--- telemetry funnel: cacheHit / missingMaster → `telemetryClient`
               |
               v
         [Reception / Charts orchestration (flag受信)]
               +--- tone=server banner + `audit.logUiState`
```
- 差分と確認事項: 04C1 では解説/設計資料に止まっていた `resolveMasterSource`/監査 circulation を 04C2 で telemetry 連携と Orchestration flag の漏れなく残すことに落とし込み、`docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` に API パス一覧と実装予定を証跡化した。ただし現在のリポジトリには `web-client/src/libs/telemetry/telemetryClient.ts` および `web-client/src/features/charts` が欠落しているため、実際のファネルログ出力はこれらの assets が復元されてから対応する必要がある。

## 9. テスト観点メモ
- ステータス変更（受付→診療終了）と ORCA 送信結果バナーが `aria-live` で読まれ、tone がエラー/完了で揃うか。
- 診察終了タブで ORCA 再送後にバナーへ反映されるまでの遅延とリトライ導線を計測し、フィルタ状態が保持されたままか。
- Patients から戻る導線で選択タブ・フィルタ・ソートが復元されるか（前画面履歴/専用戻るリンク双方）。
- 役割ごとのボタン活性・再送可否が role/承認状態に従うことと、操作時に監査ログが残ることを UI＋API でクロスチェックする。
## 9. 実装スクリーンショットと ARIA メモ（RUN_ID=20251212T090000Z）
- ReceptionPage/OrderConsole の `tone=server` バナー・`resolveMasterSource` バッジ・`missingMaster` 入力・`missingMaster`/`cacheHit` badge を `artifacts/webclient/ux-notes/20251212T090000Z-reception-ux.md` でスクリーンショット候補（`artifacts/webclient/ux-notes/20251212T090000Z-reception-ux.png`）付きで記録。
- `role=alert` + `aria-live` を tone 毎に切り替えており、Error/Warning は `assertive`、Info は `polite`、`aria-atomic=false` で連続読み上げを防止。lived region に `data-run-id=20251212T090000Z` を付与し、Charts/Patients に carry-over できるようにした。
- `missingMaster`/`cacheHit` badge は Reception/Charts/Patients で共通の `status-badge` CSS/ARIA を再利用し、ツールチップや tone が一致することでトーンの整合性を担保。`resolveMasterSource` バッジの `transitionDescription` には snapshot→server/fallback の変化を示す文言を入れ、監査メタと `tone=server` の起点をわかりやすくした。
