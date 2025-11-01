# Web カルテ UI リファレンス集約

最終更新日: 2025-11-01（DocumentTimeline 安定化・エラーメッセージ改善、担当: Codex）

Web クライアントのカルテ UI（`ChartsPage` 配下）の仕様・構成案は複数の資料に分散しています。本ファイルは UI 改修や新規実装を行うエージェントが参照すべき一次資料を整理し、着手前に確認すべき観点をまとめたものです。**カルテ UI に関する変更を提案・実装する前に、必ず以下の資料を読み、記載された要件・レイアウト・フローを満たすようにしてください。**

## 1. レイアウトと UX の基準
- [`ux/ONE_SCREEN_LAYOUT_GUIDE.md`](ONE_SCREEN_LAYOUT_GUIDE.md)
  - カルテ主画面の三カラム構成（左: 病名・既往歴・タイムライン、中: SOAP 編集、右: オーダ/結果ペイン）と、過去カルテのスプリット表示ルールを定義しています。
  - 「過去カルテスナップ」「分割ビュー」「ナースステーション導線」など、カルテ UI が遵守すべき業務フロー別レイアウト要件が整理されています。
  - 2025-11-01: 左レールの SafetySummaryCard（アレルギー/既往/内服サマリ）とドラッグ/コピー操作を追記。
  - 2025-11-01 (追記): 23インチ(1920px)を標準幅とした列比率・右レール折りたたみ条件を `ux/ONE_SCREEN_LAYOUT_GUIDE.md` に追加し、ChartsPage のブレークポイントと一致させた。
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
