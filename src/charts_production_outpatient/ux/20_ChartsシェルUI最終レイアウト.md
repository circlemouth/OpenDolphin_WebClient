# 20 Charts シェル UI 最終レイアウト（webclient charts production outpatient plan）

- RUN_ID: `20251217T060504Z`
- 期間: 2026-01-02 09:00 〜 2026-01-05 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: claude code
- YAML ID: `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`

## 0. 目的とアウトカム
- `charts-claim-ui-policy.md` のレイアウト比率・トーンを本番用に固定し、ヘッダー/アクションバー/左右ペイン/本文の最終レイアウトを確定する。
- “重要情報（患者・受付ID・保険/自費・runId・dataSourceTransition）” を常時視認できる配置に統一する。
- 狭い画面/大きい画面それぞれで折りたたみ・固定の振る舞いを定義し、主要操作のクリック/タップ回数を最小化する。

## 1. 参照チェーン・インプット
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`
- UX ポリシー: `docs/web-client/ux/charts-claim-ui-policy.md`（RUN_ID=20251202T090000Z）
- 基盤方針: `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`, `12_エラーハンドリングとリトライ規約.md`, `13_データ取得レイヤの統一_fetchWithResolver.md`
- 現状ギャップ: `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md`

## 2. 最終レイアウト（グリッド・比率・固定位置）
- **トップバー（高さ 72px 固定）**: 左から順に `患者基本情報` → `受付ID/診療科/日時` → `保険/自費トグル` → `アラートピル群 (runId / dataSourceTransition / missingMaster / fallbackUsed / cacheHit)` → 右端に `手動更新`。トーンは chart-claim ポリシー準拠で、warning/error バナーが出ていてもピルは残す。
- **アクションバー（高さ 64px、トップバー直下に sticky）**: ボタン順固定 `[診察開始][保存/下書き][診療終了][署名・送信][再送][閉じる]`、右端に `保険/自費切替の即時反映状態` をタグ表示。`missingMaster=true`/`fallbackUsed=true` では送信系を非活性＋理由ツールチップ（10/12 章と同一文言）。
- **コンテンツ 2 ペイン（通常幅 1366〜1920px）**: `左 30% / 右 70%` を基準。左は常時表示でスクロール独立（sticky header 48px を重ねて患者メモ/チェック項目が隠れないよう padding 付与）。
  - 左上「重要情報ストリップ」(48px): `患者名・ID・受付番号・保険/自費・role` を一行表示し、クリックで患者タブへ。ヘッダーに載らない補足（アレルギー等）はここにピル化して常時表示。
  - 左ペイン本体: 上から「患者メモ(折りたたみ)」→「今日のチェック項目(未紐付/ORCA 警告ミラー)」→「病名パネル（要約・追加）」→「履歴パネル（過去カルテ/処方歴/サマリー/定期診療のサブタブ）」。
  - 右ペイン本体: デフォルトタブ=診療録（SOAP 縦積み）。他タブ（病名/オーダー/結果・履歴/画像/文書/サマリ）はフルハイトで右ペインに展開し、左ペインは常時残す（狭幅のみ折りたたみ）。
- **バナー位置**: missingMaster/fallbackUsed/dataSourceTransition の ToneBanner を **トップバーとアクションバーの間** に全幅で固定。ARIA `assertive`/`polite` は 12 章の規約に従い、左ペインの「今日のチェック項目」に同内容をミラー表示。
- **フッター無し**: 操作密度を上げるためフッターは廃止。タブ内部で必要な補助ボタンは右ペイン上部に集約する。

## 3. 画面幅別の挙動
- **≥1920px (wide)**: 左 28% / 右 72% に広げ、左ペインは 2 列カード（病名/履歴を横並び）を許可。アクションバーはボタンをフルラベル表示。患者メモはデフォルト展開。
- **1366〜1919px (default)**: 左 30% / 右 70%（基準）。病名/履歴は縦積み。患者メモは折りたたみ初期状態。
- **1024〜1365px (medium)**: 左 32% / 右 68%、アクションバーの二次操作（再送/閉じる）は 3 点メニューへまとめ、トグルとピルは 2 行表示に折り返し。左ペインはスクロール長が 60% を超えたら「左ペイン固定解除」ボタンでドロワー化できる。
- **<1024px (narrow)**: デフォルトは **スタックレイアウト**。トップバーとアクションバーは sticky のまま、左ペインは折りたたみドロワー（スワイプ/ハンバーガー）で開閉し、右ペイン（診療録）が全幅表示。重要情報ストリップはトップバー内に統合し、ピルは 1 行にまとめた小型版を表示。

## 4. 重要情報の常時視認配置（クリック最小化）
- 患者・受付 ID・保険/自費トグルは **トップバー + 左ストリップ** の二重配置。片方を閉じてももう一方が見える構成にし、スクロール位置に依存させない。
- `runId / dataSourceTransition / missingMaster / fallbackUsed / cacheHit` は **トップバー右側のピル群** に集約し、折返し時も隠さない（narrow では 2 行化）。ピルクリックで `OrcaSummary` を右ペインにジャンプ。
- `dataSourceTransition` が `server→snapshot` 等に変わった瞬間はピルを `tone=warning` へ 6 秒間ハイライトし、バナーにも同値を表示して監査・読み上げを共通化する。
- チェック項目（未紐付病名/ORCA エラー）は左ペイン上部で常時表示し、バナーと同じリンクで対象タブにフォーカス移動。クリック回数は最大全 2 回（ドロワー開 → 目的タブ）。

## 5. 操作バー/タブの最小操作設計
- アクションバーは **主要 4 操作をファーストクラス**（開始/保存/診療終了/署名送信）、二次操作（再送/閉じる）は右詰め。ショートカット: `Shift+Enter`=保存、`Alt+S`=署名送信、`Alt+E`=診療終了、`Esc`=閉じる確認。
- タブ初期表示は「診療録」。病名・オーダー・文書・結果・サマリは **前回タブを記憶**、戻る時は直前のスクロール位置を保持。carry-forward（引き継ぎコピー）は履歴プレビュー右上のボタンを 1 クリックで開く。
- 手動更新はトップバー右端の単一ボタンに集約し、`manualRefresh=true` を監査/telemetry に送る。ポーリング（30s）は維持しつつ 3 連続失敗でボタンにバッジを付ける（12 章の規約）。

## 6. 権限・ガード・トーン連動（配置依存の決定）
- `missingMaster=true` または `fallbackUsed=true`: トップバー直下の ToneBanner で警告、アクションバーの送信系を disable、右ペインの署名/オーダー/文書タブで空状態＋再取得ボタンを表示。左ペインは閲覧のみ可能。
- セッション無効/施設不一致: 10 章フローに沿ってトップバーとアクションバーをグレーアウト、全体を ErrorBoundary でブロックし Reception へ戻る導線だけ残す。
- `dataSourceTransition` 変更時はピルとバナーを同期し、左ペイン「今日のチェック項目」にも反映。aria-live は warning/polite、エラー系は assertive を維持（charts-claim ポリシー）。

## 7. 実装メモ（コンポーネント割り当て）
- Topbar: 既存 `ChartsHeader` を拡張し、患者情報・受付番号・保険トグル・ピル群を一列グリッド化。ピルは `DataSourceBanner` で共通レンダリング。
- ActionBar: `ChartsActionBar` を 2 行対応レイアウトにし、再送/閉じるを dropdown へ逃がすブレークポイントを props で指定。
- Left Pane: `DiagnosisPanel`（要約版）と `HistoryPanel`（DocumentTimeline/処方/サマリ/定期診療）を stack。`ImportantStrip` コンポーネントを新設し、患者/受付/保険/role を常時表示。
- Right Pane: 既存タブ群（診療録/病名/オーダー/結果・履歴/画像/文書/サマリ）を保持し、狭幅時は left drawer を閉じた状態で開く。
- Narrow Drawer: 左ペインを `SideDrawer` 化し、ハンバーガーとスワイプで開閉。開閉状態とスクロール位置を URL/state に保持して戻る導線のクリックを 1 回に抑える。

## 8. 次アクション
1. `ChartsHeader/ChartsActionBar` のレスポンシブレイアウト実装（ピル折返しと dropdown 化）— RUN_ID=`20251217T060504Z-A` を派生予定。
2. 左ペイン drawer 化と「重要情報ストリップ」コンポーネント実装。carry-forward ボタンの位置決めとハイライト動線をあわせて設計。
3. テレメトリ/監査: manualRefresh・drawer 開閉・ピルクリックのイベント名を `charts-claim-ui-policy.md` の命名規約に追加。
