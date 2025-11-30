# Web カルテ UI リファレンス集約

最終更新日: 2025-11-01（DocumentTimeline 安定化・エラーメッセージ改善、担当: Codex）

Web クライアントのカルテ UI（`ChartsPage` 配下）の仕様・構成案は複数の資料に分散しています。本ファイルは UI 改修や新規実装を行うエージェントが参照すべき一次資料を整理し、着手前に確認すべき観点をまとめたものです。**カルテ UI に関する変更を提案・実装する前に、必ず以下の資料を読み、記載された要件・レイアウト・フローを満たすようにしてください。**

## 1. レイアウトと UX の基準
- [`ux/ONE_SCREEN_LAYOUT_GUIDE.md`](ONE_SCREEN_LAYOUT_GUIDE.md)
  - カルテ主画面の三カラム構成（左: 病名・既往歴・タイムライン、中: SOAP 編集、右: オーダ/結果ペイン）と、過去カルテのスプリット表示ルールを定義しています。
  - 「過去カルテスナップ」「分割ビュー」「ナースステーション導線」など、カルテ UI が遵守すべき業務フロー別レイアウト要件が整理されています。
  - 2025-11-01: 左レールの SafetySummaryCard（アレルギー/既往/内服サマリ）とドラッグ/コピー操作を追記。
  - 2025-11-01 (追記): 23インチ(1920px)を標準幅とした列比率・右レール折りたたみ条件を `ux/ONE_SCREEN_LAYOUT_GUIDE.md` に追加し、ChartsPage のブレークポイントと一致させた。
  - 2025-11-01 (追記): 旧 Swing クライアント（スクリーンショット 1280×720）の列幅を参照し、左/中央/右＝264px/736px/264px を基準としたリサイズ計画を追加。Web 版では `clamp()` を利用しつつ中央カラムの上限を撤廃し、大画面では残余幅をすべて占有するレイアウトへ更新。
  - 2025-11-01 (追記): 中央カラムの `clamp()` 上限を廃止した経緯と検証結果を `ux/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/KARTE_SCREEN_IMPLEMENTATION.md` に記載。右ペイン折りたたみ時も余白が残らない動作を確認済み。
  - 2025-11-01 (追記): AppShell 共通コンテナの `contentMaxWidth` を撤廃し、患者一覧・受付一覧・ChartsPage いずれもウィンドウ幅へ追従するよう統一した旨を反映。
  - 2025-11-01 (追記): 患者未選択時は PatientHeaderBar をコンパクト表示（約 60px）に切り替え、カルテ閲覧画面特有の上部余白を圧縮する設計を追加。
- [`design-system/ALPHA_COMPONENTS.md`](../design-system/ALPHA_COMPONENTS.md)
  - カルテ画面で使用するテーブル/データリスト、補助パネル等の共通コンポーネント設計の現状を確認できます。カルテタイムラインや患者リストに共通 UI を適用する際はここでコンポーネントの状態管理ポリシーを確認してください。

## 2. カルテタイムラインと補助パネル
- [`features/CARE_MAP_TIMELINE.md`](../features/CARE_MAP_TIMELINE.md)
  - CareMap カレンダーおよび日別タイムラインの仕様。カルテ文書・予約・検査・添付を種別フィルタで切り替える挙動や、カルテ右ペインとの情報同期について記載しています。
- 2025-11-01 (担当: Codex): DocumentTimelinePanel のカテゴリ同期・選択保持・詳細ペインのエラートーン整理を反映。エラー表示は `info`/`warning`/`danger`/`neutral` の 4 種で統一し、API 由来のメッセージをそのまま提示する方針に更新。
- [`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`](../features/RECEPTION_SCHEDULE_AND_SUMMARY.md)
  - カルテ右ペインのサマリ文書カード、施設予約一覧との連携仕様、カルテ生成/予約削除フローの UI 条件がまとまっています。
- [`features/FACILITY_SCHEDULE_VIEW.md`](../features/FACILITY_SCHEDULE_VIEW.md)
  - 受付・予約 UI とカルテ遷移ボタンの連携仕様。カルテ画面から参照する関連情報の更新要件を確認できます。
- [`features/LAB_RESULTS_VIEWER.md`](../features/LAB_RESULTS_VIEWER.md)
  - カルテ右ペインに統合された検査結果ビューアの操作・表示要件。カルテ UI 改修時に互換性を保つ必要があります。

## 3. カルテ編集・オーダ・文書連携
- [`features/PHASE3_STAMP_AND_ORCA.md`](../features/PHASE3_STAMP_AND_ORCA.md)
  - スタンプライブラリと ORCA マスター検索 UI の構成。カルテ内でのスタンプ挿入、禁忌チェック、診療行為コード連携のガイドラインを確認できます。
- [`features/ORDER_ENTRY_DATA_GUIDE.md`](../features/ORDER_ENTRY_DATA_GUIDE.md)
  - カルテ保存時に必要なデータ項目と UI 入力欄の対応。Subjective/Objective/Assessment の編集フローや患者文書テンプレートとの同時下書き要件が記載されています。
- [`features/MEDICAL_CERTIFICATES_AND_SCHEMA.md`](../features/MEDICAL_CERTIFICATES_AND_SCHEMA.md)
  - 診断書・シェーマ編集 UI がカルテとどのように同期するかをまとめています。補助パネルや CareMap への反映条件も明示されています。

## 4. 運用・監査観点での UI 要件
- [`process/SWING_PARITY_CHECKLIST.md`](../process/SWING_PARITY_CHECKLIST.md)
  - Swing 版との機能差分と UI ガード条件。カルテ・文書タイムラインや排他制御に関するチェックリストを遵守してください。
- [`process/API_UI_GAP_ANALYSIS.md`](../process/API_UI_GAP_ANALYSIS.md)
  - カルテ関連 API と UI の結び付き、および未移植機能の整理。既存 UI の不足箇所を把握する際に参照します。
- [`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md`](../process/SECURITY_AND_QUALITY_IMPROVEMENTS.md)
  - カルテ保存・排他制御・監査ログの UI 側要件。UI 改修で監査計測やイベント送出を変更する場合は必ず反映が必要です。
- [`operations/RECEPTION_WEB_CLIENT_MANUAL.md#64-ui-ワイヤーフレームと通知バリアント`](../operations/RECEPTION_WEB_CLIENT_MANUAL.md#64-ui-%E3%83%AF%E3%82%A4%E3%83%A4%E3%83%BC%E3%83%95%E3%83%AC%E3%83%BC%E3%83%A0%E3%81%A8%E9%80%9A%E7%9F%A5%E3%83%90%E3%83%AA%E3%82%A2%E3%83%B3%E3%83%88)
  - `chart-events.replay-gap` を受信した際のトースト/バナー/再取得ボタン構成、状態遷移（Idle→GapDetected→Reloading→Recovered/Retry）、Web/Touch 向け擬似コードをまとめた最新仕様。2026-06-14 追記で Touch 向け `ReplayGapState` 詳細・監査ペイロード・ローカル通知（Worker T）を掲載。ChartsPage の患者ヘッダーに同じ UX を適用する際は必ず参照すること。
- `ChartSyncStatus` / AppShell リアルタイム指標（ChartsHeader + Reception の gap カード）を最新の差分に揃えました。gapSize/sequence/Last-Event-ID を提示し、`rest/charts/patientList?clientUUID=<UUID>&sequence=<ID>&gapSize=<N>` で manual resync するボタンを常設、操作後に `audit.logReplayGapState(action="manual-resync")` を送出して Runbook（`operations/RECEPTION_WEB_CLIENT_MANUAL.md#6-chart-eventsreplay-gap-受信時のリロード-ux`）と `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` の gapSize ＝ `sequence - oldestHistoryId` ルールをまたぎます。AppShell では SSE バッファを 100 件スケールでゲージ表示し、90 件以上でロングポーリングフェールオーバー案内モーダルを出す UI を追加。2025-11-29T105517Z（`docs/server-modernization/phase2/operations/logs/20251129T105517Z-realtime.md`）で動作証跡を収集し、gap 操作と Ops ログのリンクを併記してください。

- Implementation/UX チームには `ChartSyncStatus` コンポーネント（gapSize・sequence・Last-Event-ID・manual resync button・Runbook リンク・Audit トーン）、`ReplayGapContext` の manual resync フロー、`ChartSyncReplayBanner`/`ChartSyncReplayReplayer` などの replayer 表示、AppShell の SSE バッファゲージ＋フェールオーバーモーダルの設計を共有し、レビューのタイムラインと Playwright カバレッジ追加の検討を依頼してください。ドキュメント更新後は `20251129T105517Z` の RUN_ID を DOC_STATUS、該当ドキュメント、ログファイルに刻み、Implementation/UX チームとのレビューと Playwright の追加検討を次ステップとして組み込んでください。
- Stage/Playwright シナリオには AppShell 上の SSE 警告バナー（tone=server）を組み込み、`chart-events.replay-gap` 受信後の warning banner tone=server をトリガに `rest/charts/patientList?clientUUID=<UUID>&sequence=<ID>&gapSize=<N>` への manual resync フローを Stage で検証する coverage を追加しました。結果は本ファイルの該当節（lines 40-51）および `docs/server-modernization/phase2/operations/logs/20251129T105517Z-realtime.md` に記録して、Implementation/UX チームへ共有した設計レビューと合わせて証跡化しています。
- ChartEvent SSE/LP フェールバック SLA: ChartsPage / ReceptionPage は SSE (`GET /chart-events`) を優先し、接続不可時は Legacy ロングポーリング (`GET /chartEvent/subscribe`) へ自動ダウンシフトする。LP のタイムアウトは 55 秒、最大 5 回リトライ（約 5 分）。SSE で `chart-events.replay-gap` を受信した場合は Last-Event-ID を維持した再接続とフルリロードを促すバナーを出す。詳細は `operations/logs/20251120T191203Z-api-stability.md` を参照。

### DocumentTimeline 安定化メモ（2025-11-01、担当: Codex）
- **カテゴリ切替の自動復元**: `DocumentTimelinePanel` は利用可能なカテゴリがゼロになった場合でも直近の有効カテゴリへフォールバックし、常にイベントが 1 件以上選択された状態を維持する。
- **選択状態と詳細ペインの同期**: タイムライン上の選択は `useDocumentDetail` と連動し、カルテ／来院／検査／オーダの各ペイロードに応じて参照パネル・Plan Composer が更新される。連携先の詳細パネルも同トリガで再描画すること。
- **トーン別エラーメッセージ**: 読み込み・空状態・API エラーは `InlineFeedback` の `neutral`/`info`/`warning`/`danger` で表現し、エラー時は `resolveErrorMessage` により例外メッセージをそのまま提示する。想定外の場合のみ既定文言「イベントの取得に失敗しました。」を使用。
- **タイトル編集の即時フィードバック**: ドキュメントイベントにはタイトル編集 UI を常設し、更新成功時は `info`、失敗時は `danger` トーンで結果を表示する。監査ログと整合性を取るため、再取得後のタイトル確認を必須とする。
- **MSW モックでの検証**: `npm run dev` 起動時は MSW が `/api/pvt2/pvtList` `/api/chartEvent/*` `/api/karte/docinfo/*` をスタブする。タイムライン挙動の単体検証はモック環境で実施し、実サーバー確認は `npm run preview`（Service Worker 無効化済み）で行う。

## 5. 実装前チェックリスト
1. 上記ドキュメントを読み、対象領域（レイアウト／タイムライン／補助パネル／オーダリング）の要件を整理する。
2. 既存 UI のスクリーンフローと API 呼び出しを `process/SWING_PARITY_CHECKLIST.md` および `process/API_UI_GAP_ANALYSIS.md` で確認し、Swing 版との整合性を保つ。
3. 監査・品質要件（操作ログ、レスポンス監視）に影響する場合、関連ドキュメントを更新する計画を立てる。
4. タイムラインのエラーメッセージは `danger` トーンで API メッセージを明示すること、読み込み/空状態は `neutral` で統一することを確認する。
5. 実装後はドキュメント更新内容を `docs/web-client/README.md` に追記し、本ファイルの参照リストも最新化する。

---

> **運用メモ**: カルテ UI に関する質問や仕様調整が必要な場合は、該当ドキュメントへコメントを追加し、関係者への確認フローを確保した上で開発を進めてください。

## 備考
- RUN_ID=20251120T191203Z / 証跡: `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md`（ChartEvent SSE/LP フェールバック SLA 追記）
