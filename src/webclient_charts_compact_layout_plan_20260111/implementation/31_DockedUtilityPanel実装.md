# 31 DockedUtilityPanel 実装

- RUN_ID: `20260111T085253Z` / `20260111T092600Z`
- 期間: 2026-01-12 09:00 〜 2026-01-13 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_charts_compact_layout_plan_20260111/implementation/31_DockedUtilityPanel実装.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`
- `src/webclient_charts_compact_layout_plan_20260111/design/21_DockedUtilityPanel設計.md`
- `src/webclient_charts_compact_layout_plan_20260111/design/22_スペーシングとカード規約定義.md`

## 実装概要
- 右固定メニューを DockedUtilityPanel に置換し、compact/expanded の切替を実装した。
- `診療操作/病名/処方/オーダー/文書/画像/検査` をユーティリティドロワーに統合し、編集パネルを右ドロワー内に表示する構成へ変更した。
- 3カラム + ドッキング構成に合わせて `charts-workbench` を再構成し、幅とブレイクポイントを調整した。

## 実装内容

### 1) DockedUtilityPanel UI/状態の置換
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - `charts-workbench__body` を `charts-workbench__columns` ラッパへ分離し、Docked パネルを独立配置。
  - DockedUtilityPanel の compact/expanded 切替、Close/Escape、`Ctrl+Shift+U` / `Ctrl+Shift+1〜6` を実装。
  - 患者切替時に DockedUtilityPanel を閉じ、先頭ボタンへフォーカス復帰。
  - `診療操作/病名/処方/オーダー/文書/画像/検査` をタブ化し、編集パネル/導線をドロワー内に統合。

### 2) 追加ブラッシュアップ（実用性/緻密性）
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - 右列（OrcaSummary列）が 300px 未満の時は expanded を維持せず compact へ自動復帰。
  - 患者未選択時は編集系タブを disabled 化し、理由表示を「患者が未選択のため利用できません」に統一。
  - Escape / Close / トグル再クリック時のフォーカス復帰を補強（キーボード起点も確実に復帰）。

### 3) スタイル更新
- `web-client/src/features/charts/styles.ts`
  - DockedUtilityPanel 用の幅変数、compact/expanded の切替、右パディング調整を追加。
  - 3カラムレイアウトを維持し、<1024px では下部ドロワー型へ切替。
  - DockedUtilityPanel の新規スタイル（ヘッダ/タブ/ドロワー/compact 表示）を実装。
  - 下部ドロワーの高さを `--charts-utility-height` で統一し、`padding-bottom` と連動。

## 動作確認・テスト
- `npm --prefix web-client ci --cache .npm-cache`
- `npm --prefix web-client run test -- chartsAccessibility`
  - 20260111T092600Z: chartsAccessibility を再実行（pass）

## 残課題
- 右ドロワー内の検索/登録 UI（画像/スキャンなど）の本実装は別タスクで対応。
- DockedUtilityPanel のトーン微調整（影/色）と小画面時の最終密度調整はモック確認後に再調整。
