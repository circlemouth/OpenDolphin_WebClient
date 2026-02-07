# STAMP-001 最小MVP (StampLibraryPanel) 検証メモ

RUN_ID: 20260207T065531Z-cmd_20260207_08_sub_1-stamp-001-mvp

## 目的
- STAMP-001 の最小MVP（ツリー閲覧=treeName分類 / 検索 / Chartsからの横断導線 / 選択時プレビュー）を Web クライアントに追加し、feature flag で段階導入できることを確認する。

## Feature flag
- Phase1: `VITE_STAMPBOX_MVP=1` (閲覧/検索/プレビュー)
- Phase2: `VITE_STAMPBOX_MVP=2` (Phase1 + クリップボードコピー + "オーダー編集を開く" 導線)

## 実装位置
- Charts ユーティリティに `スタンプ` タブを追加（OrderBundleEditPanel 以外から開ける入口）
- パネル本体: `StampLibraryPanel`

## 自己検証（unit）
- `web-client/src/features/charts/__tests__/stampLibraryPanel.test.tsx`
- 実行コマンド:
  - `pnpm -C web-client exec vitest run src/features/charts/__tests__/stampLibraryPanel.test.tsx --reporter=dot`

## 自己検証（UI/スクショ）
- `VITE_STAMPBOX_MVP=2` + `VITE_DISABLE_MSW=0` で Vite を起動し、Playwright でスクリーンショット採取。
- スクリーンショット:
  - `charts-before-open-stamps.png`
  - `charts-stamp-library-phase2.png`
  - `charts-stamp-library-preview.png`
- Network 抜粋:
  - `network-stamp-endpoints.json`

## Network メモ
- MSW 有効時は以下が mock 応答（handlers/stampTree.ts）
  - `GET /user/:userName`
  - `GET /touch/stampTree/:userPk`
  - `GET /touch/stamp/:stampId`
