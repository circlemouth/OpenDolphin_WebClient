# テーマトークン/コンポーネント更新メモ (2026-05-06)

## 対応概要
- palette に `onPrimary` / `textPrimary` / `dangerMuted` / `dangerSubtle` / `warningMuted` / `radius.xs` を追加し、`PaletteToken` で参照先を型安全化。
- `Button` は `variant` ごとのパレット定義を `keyof Palette` に整理し、`as="a"` 時の `disabled` と `ref` ずれを Anchor 用ラッパーで解消。
- `StatusBadge` に `size` (`md`/`sm`) を追加し、`tone` 定義をパレットトークンに統一。
- `SurfaceCard` を Emotion の `as` 指定に対応させ、`tone`/`padding` を `$` 接頭辞で DOM へリークしないよう整理。

## Storybook / ビルド確認
- `npm run build`: 既存の charts/reception 等の型未整備でビルド全体は失敗するが、Button/StatusBadge/SurfaceCard/Theme 起因のエラーは解消済み。
- UI 実機確認: Storybook 起動は上記型未整備が解消され次第に再実施予定。`Design System/Button` の Anchor バリアントについてはコードレビューで `aria-disabled` とホバー制御を再確認。

## フォローアップ
- charts / reception モジュールの型修正が完了した段階で Storybook を起動し、`StatusBadge size="sm"` と `SurfaceCard as="section"` の見た目チェックを記録する。
- `design-system/ALPHA_COMPONENTS.md` の表を最新 props に合わせて英数表記へ整理するタスクを backlog へ登録。
