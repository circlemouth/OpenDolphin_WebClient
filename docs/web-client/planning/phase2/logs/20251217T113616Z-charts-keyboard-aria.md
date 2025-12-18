# Charts: キーボード操作と ARIA 監査（RUN_ID=`20251217T113616Z`）

- 対象: `src/charts_production_outpatient/ux/21_キーボード操作とARIA監査.md`
- 目的: Charts の主要操作（患者切替/送信/印刷/検索/セクション移動）をキーボードで完結できるようにし、通知の `role`/`aria-live` とモーダルのフォーカス管理を統一する。あわせて、キーボード操作が Topbar の `runId`/メタ表示を上書きしないことを検証可能にする。

## 実施内容（実装）
### 1) キーボード操作
- Charts ページにスキップリンクを追加（`本文へスキップ` → `#charts-main`）。
- グローバルショートカット（Charts ページ内のみ）を追加:
  - `Alt+P` / `Ctrl+F`: PatientsTab の患者検索へフォーカス
  - `Alt+S`: ORCA送信（確認ダイアログを開く）
  - `Alt+I`: 印刷/エクスポート（確認ダイアログを開く）
  - `Alt+E`: 診療終了
  - `Shift+Enter`: ドラフト保存
  - `Ctrl+Shift+Left/Right`: Topbar/ActionBar/各カードへフォーカス移動（フォーカスアンカー循環）
- PatientsTab の患者一覧で上下/Home/End によるフォーカス移動を追加。

### 2) 通知（ToneBanner/Status/Toast）の ARIA 統一
- Topbar の監査メタ（runId/dataSourceTransition/...）は `aria-live="off"` として表示のみ（読み上げ過多を抑制）。
- StatusBadge のデフォルト `aria-live` を `off` に変更し、Charts 内の Badge/Queue/Preview も原則 `off` に統一。
- ChartsActionBar:
  - ブロック/失敗など “要注意” は `ToneBanner(role=alert)` に寄せる
  - “完了” のみ Toast（`role="status" aria-live="polite"`）を使用（フォーカス移動なし）
  - `aria-describedby` による送信不可理由の参照は維持しつつ、guard 自体は `aria-live="off"` へ（重複抑制）

### 3) モーダル（フォーカストラップ/ESC/復元）の統一
- 共通の `FocusTrapDialog` を新設:
  - フォーカストラップ（Tab/Shift+Tab 循環）
  - `Escape` で閉じる
  - 閉じたら呼び元へフォーカス復元（デフォルト）
  - Backdrop クリックでは閉じない
- 適用:
  - ChartsActionBar の ORCA送信 / 印刷確認ダイアログ
  - PatientsTab の「未保存ドラフトがある状態で患者切替」確認（`window.confirm` を廃止）

## 実施内容（テスト）
- 単体テスト（Vitest）: `npm -C web-client test`
- 型チェック: `npm -C web-client run typecheck`
- Playwright（追加）:
  - `tests/e2e/charts-keyboard-aria.spec.ts`
  - `Alt+P`→患者検索→`Esc` でフォーカス復元
  - `Alt+S`/`Alt+I` でダイアログを開き `Esc` で閉じて呼び元へ戻る
  - ダイアログ開閉後も Topbar の `data-run-id` が不変

## 変更ファイル（抜粋）
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/ChartsActionBar.tsx`
- `web-client/src/features/charts/PatientsTab.tsx`
- `web-client/src/components/modals/FocusTrapDialog.tsx`
- `web-client/src/features/shared/StatusBadge.tsx`
- `tests/e2e/charts-keyboard-aria.spec.ts`

## 備考
- `npm ci` は環境側の npm キャッシュ権限で失敗する場合があるため、ローカルキャッシュ指定（例: `npm -C web-client ci --cache ../tmp/npm-cache`）を使用した。

