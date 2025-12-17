# 21 キーボード操作と ARIA 監査（webclient charts production outpatient plan）

- RUN_ID: `20251217T113616Z`
- 期間: 2026-01-06 09:00 〜 2026-01-09 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: codex
- YAML ID: `src/charts_production_outpatient/ux/21_キーボード操作とARIA監査.md`
- 参照: `docs/web-client/ux/charts-claim-ui-policy.md`（RUN_ID=20251202T090000Z）、`src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`、`src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md`、`src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md`、`src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`、`12_エラーハンドリングとリトライ規約.md`

---

## 0. 結論（決めたこと）
- Charts の主要操作（患者切替 / タブ移動 / 検索 / 送信 / 印刷）を **Tab/Shift+Tab + Enter/Space + Esc** のみで完走できるようフォーカス順・ショートカット・戻り先を規定し、ポインタ不要で DoD（1.3 アクセシビリティ）を満たす。
- 通知の `role` と `aria-live` を **過不足なし・重複なし** で統一: ToneBanner=alert/assertive(or polite by tone)、トースト=status/polite（送信成功のみ assertive 例外なし）、インラインエラー=alertまたはaria-describedby、成功/情報ピル=aria-live=off（22 章に準拠）。`aria-atomic=false` を既定とし、同一 runId では 1 回だけ読み上げる。
- モーダル/ダイアログは **フォーカストラップ + Esc クローズ + 呼び元へ焦点復元** を必須。印刷/送信確認/警告モーダルすべてで同じ Trap コンポーネントを使い、Backdrop クリックでは閉じず Esc のみ許可。
- キーボード操作で起動した場合も **Topbar の `runId` / `dataSourceTransition` / `missingMaster` / `fallbackUsed` / `cacheHit` を再宣言・初期化しない**。Context の値を read-only で表示し、ショートカット処理は値の再計算を禁止する。manualRefresh/再送などのキー操作後もピル表示を維持することを QA で確認する。
- QA/Playwright では **読み上げ 1 回ルール + フォーカス遷移 + runId 不変性** を assertions 化し、MSW ON/OFF 両方で「主要導線をキーボードのみで踏破できる」ことを証跡に残す。

## 1. 参照チェーンと適用範囲
- 遵守: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`。
- 適用範囲: Charts 全ページ（Topbar/ActionBar/左ペイン/右ペインタブ/OrcaSummary/DocumentTimeline/OrderConsole/PatientsTab/印刷・送信ダイアログ/トースト/トースト代替のバナー）。Reception で定義済みコンポーネントを再利用する前提。

## 2. フォーカス順とキーボードのみで完走する導線
- **全体の基本順**: 1) スキップリンク（`#skip-to-main`）→ 2) Topbar（患者基本→受付ID→保険/自費→ピル群→手動更新）→ 3) ActionBar 主ボタン（診察開始→保存→診療終了→署名・送信→再送→閉じる）→ 4) 左ペイン（重要情報ストリップ→患者メモ→今日のチェック項目→病名→履歴）→ 5) 右ペインタブヘッダー（診療録→病名→オーダー→結果/履歴→画像→文書→サマリ）→ 6) 各タブ内フォーム → 7) フッタートースト/ダイアログ（存在時）。
- **主要ショートカット**（ハード依存なし、既存 20 章のキーと矛盾しないよう統一）  
  - 患者切替: `Alt+P` で患者検索フィールドにフォーカス、`Enter` で選択。検索結果一覧は上下キーで移動し、`Esc` で閉じて元の要素へ戻る。  
  - タブ移動: `Ctrl+Shift+Right/Left` で右ペインタブを循環、現在のタブボタンに `aria-selected=true` + `tabindex=0` を保証。  
  - 検索（文書/病名/処方共通フィルタ）: `Ctrl+F` で右ペインの検索バーへ。検索結果リストは上下キーで移動し、`Enter` で適用。  
  - 送信: `Alt+S`（署名・送信）、保存: `Shift+Enter`、診療終了: `Alt+E`、印刷: `Alt+I`（印刷モーダルを開く）。いずれも disabled 時は `aria-disabled=true` と理由ツールチップを表示。  
  - Escape: 現在のモーダル/サブパネルのみ閉じ、フォーカスを直前の呼び元へ戻す。ActionBar の閉じるボタンは `Esc` と同じハンドラを呼ぶ。
- **フォーカス保持**: タブ切替時は直前のスクロール位置とフォーカス対象を保持し、戻ると同じ要素へ。ドロワー（narrow 幅）を開閉しても Topbar→ActionBar の順番が崩れないよう `tabindex` を再計算する。

## 3. 通知コンポーネントの `role` / `aria-live` 規約
- **ToneBanner**: role=`alert`、tone=error/warning は `aria-live=assertive`、tone=info/success は `polite`。`aria-atomic=false` で差分のみ読み上げ。22 章に従いバナーが読み上げた場合、同 runId のピルは `aria-live=off`。
- **StatusBadge / ピル**: role=`status`、`aria-live=off`（初回のみ polite）。`data-run-id`/`data-source-transition`/`data-missing-master`/`data-fallback-used`/`data-cache-hit` を必須属性とする（22 章の順序を踏襲）。Topbar/OrcaSummary/DocumentTimeline/PatientsTab/OrderConsole で同一順に表示。
- **トースト**: role=`status`、`aria-live=polite`。エラー系はトーストではなく ToneBanner を優先し、成功（送信/保存完了）のみトーストを許可。トースト出現時もフォーカスを動かさず、Close ボタンへ `tabindex=0` を付与。
- **インラインエラー**: フォーム入力の隣に `aria-describedby` で結び、`role=alert` を付けない（重複読み上げ防止）。必須フィールドの未入力は `aria-invalid=true` をセット。
- **ロード中**: 主要ボタンは `aria-busy=true`、スケルトンは `role=status aria-live=polite` で一度だけ読ませる。重複を避けるため複数スケルトンの aria-live は 1 つに限定。

## 4. モーダル/ダイアログの統一仕様
- **フォーカストラップ**: 開くと最初のアクション（例: 署名実行ボタン）にフォーカスし、Tab/Shift+Tab はモーダル内を循環。`aria-modal=true` + `role=dialog|alertdialog` を用途で切替え、`aria-labelledby`/`aria-describedby` を必須化。
- **Escape と戻り先**: Esc で必ず閉じ、呼び出し元のボタンへフォーカスを戻す。Backdrop クリックでは閉じない（誤操作防止）。印刷モーダルは Esc→閉じる→フォーカスを印刷ボタンへ。
- **トラップ解除条件**: fatal エラーでモーダルが強制クローズされた場合も、Topbar/ActionBar へフォーカスを復元し、再度モーダルを開くまでフォーカス喪失が続かないようにする。
- **スクリーンリーダー説明**: `runId` と `dataSourceTransition` を dialog 内本文に含め、送信/印刷対象が現在の患者・受付であることをテキストで明示する。

## 5. Topbar `runId` / dataSource 表示の保全
- **再宣言禁止**: キーボードショートカットやフォーカス移動の handler で `runId` を新規発行・初期化しない。`manualRefresh` やタブ切替後も Context の値をそのまま表示し、ピルの `data-run-id` を書き換えない。
- **非同期取得中の維持**: fetchWithResolver の pending 状態でも既存 `runId` を表示し続ける。再取得で `runId` が変わる場合は **明示的な`manualRefresh`/送信完了時のみ** とし、読み上げは 1 回（ToneBanner）に限定。
- **検証観点**: (1) `Alt+S`→送信ダイアログ→Esc で戻ったあとも Topbar ピルが同じ runId を保持、(2) `Ctrl+Shift+Right/Left` でタブを往復しても dataSourceTransition が変化しない、(3) 手動更新ボタンの Enter 押下後も missingMaster/fallbackUsed ピルが書き換わらない（値が変わったときだけ ToneBanner が読み上げる）。

## 6. QA / Playwright 追加観点
- **キーボード完走シナリオ**: Reception→Charts でマウスを使わず、Tab 操作のみで「患者切替→診療録タブ入力→署名・送信モーダル開閉→印刷モーダル開閉→患者履歴タブ切替」を通す。各ステップでフォーカス位置と role/aria-live を録画し、HAR/trace を `artifacts/webclient/e2e/<RUN_ID>-keyboard-aria/` に保存。
- **ARIA 読み上げ 1 回ルール**: missingMaster/fallbackUsed/dataSourceTransition/cacheHit の変化ごとに ToneBanner だけが読み上げ、ピルは無言であることを assertion。トースト出現時に ToneBanner が重複しないことも確認。
- **モーダル Trap**: 送信・印刷モーダルで Tab/Shift+Tab が内部を循環し、Esc で閉じて呼び元へ戻ることを Playwright で検証。Backdrop クリックでは閉じないことも含める。
- **runId 不変性**: キーボードショートカット実行後の Topbar ピル `data-run-id` が開始時と一致することを snapshot 取得し、手動更新で変わるケースのみ差分が出ることを確認。

## 7. 導線別チェックリスト（実装タスクメモ）
1. `web-client/src/features/charts/layout/ChartsHeader.tsx` / `ChartsActionBar.tsx` にスキップリンクとキーボード順を実装（`tabIndex`/`aria-controls`/`data-focus-order` で順序を固定）。  
2. 共通 FocusTrap を `web-client/src/components/modals/FocusTrapDialog.tsx` として新設（または既存 `Dialog` 拡張）。`role`/`aria-modal`/`aria-labelledby`/`aria-describedby`/Esc ハンドラを含め、`trapStackId` で多重モーダルを検知し二重読み上げを抑制。  
3. 送信/再送/印刷/警告モーダルを `web-client/src/features/charts/modals/*` で段階的に差し替え: 送信→印刷→警告の順で PR を分割し、既存 `ConfirmDialog` 呼び出しを FocusTrapDialog に置換。差し替え後はBackdropクリック無効化を確認。  
4. ToneBanner/トースト/StatusBadge の `role`/`aria-live`/`data-*` 属性を 22 章の順序に合わせ、Reception 由来の `StatusBadge.tsx` を `web-client/src/features/shared/StatusBadge.tsx` に集約し Charts からも同一実装を import。  
5. fetchWithResolver / manualRefresh / tab change のハンドラで `runId` を再生成しないよう `web-client/src/features/charts/hooks/useChartsRunIdGuard.ts`（新設）で guard し、`audit.logUiState` には既存 runId を透過するユーティリティを `web-client/src/libs/audit/logUiState.ts` に追加。  
6. Playwright: キーボード完走・読み上げ 1 回・FocusTrap・runId 不変性の 4 ケースを `tests/e2e/charts-keyboard-aria.spec.ts`（新規）に追加し、MSW ON/OFF 両方で実行。多重モーダル（送信→印刷プレビュー）の Trap 循環と読み上げ抑止も含める。

## 9. エッジケースと抑制ルール
- **多重モーダル**（送信後に印刷プレビューを開く等）: `trapStackId` を付与し、内部モーダルだけ `aria-live` を有効、外側は `aria-live=off`。Esc は最内層から順に閉じ、最後に呼び元へフォーカスを戻す。  
- **印刷プレビュー中の読み上げ抑制**: ブラウザ印刷ダイアログ起動時はアプリ側の `aria-live` を一時 `off` にし、戻り後に Topbar の `runId` を再読上げしない。`window.matchMedia('print')` の start/end イベントで制御。  
- **トーストとバナーの競合**: 同一 runId でバナーが出ている間はトーストを queue し、バナー消滅後に `polite` で 1 回だけ表示する。  
- **フォーカス喪失時の復旧**: ウィンドウ切替や印刷プレビューから戻ったときは最後に記録した `data-focus-order` を参照し、Topbar→ActionBar→直前タブの順で復旧する。

## 8. 証跡・同期
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251217T113616Z-charts-keyboard-aria.md`
- DOC_STATUS と README の Active リストに本ドキュメントを追加（RUN_ID を併記）。RUN_ID の派生が必要な場合は親 `20251217T113616Z` を備考に記載する。
