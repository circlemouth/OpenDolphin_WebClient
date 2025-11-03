# Charts 患者ヘッダー診察ボタン disabled 表示調整ノート（2025-11-03）

## 背景
- カルテ画面 `/charts` の患者未選択状態では「診察開始」ボタンが `disabled` となるが、従来は `opacity: 0.55` の半透明処理により背後レイヤーのグリッドが透過し、ラベル左右に灰色の干渉が生じて読みにくかった。
- UX ガイドラインでは患者識別・排他制御の操作子は常に明瞭な単色背景・十分なコントラストで提示することが求められており、現行実装は要件を満たしていなかった。

## 実装概要
- 対象ファイル
  - `web-client/src/components/Button.tsx`
    - `variantTokens` に `disabledBackground` / `disabledColor` / `disabledBorder` を追加し、`primary`/`secondary`/`danger` いずれの無効状態も `surfaceStrong`（#e5ebf4）× `textMuted`（#4f5a6b）の単色描画へ統一。
    - `:disabled` / `[aria-disabled='true']` の `opacity` を撤廃し、明示的に背景・文字色・境界線を設定。`transform` をリセットし、ホバー・アクティブとの視覚差異を保ったまま可読性を確保。
    - Anchor バリアントで `as` プロパティを除外する処理は `void _as;` で lint 対応し、副作用のない形で保持。
  - `web-client/src/features/charts/components/layout/PatientHeaderBar.tsx`
    - 「診察開始 / 診察終了」トグルに `aria-pressed`（排他制御のオン/オフ状態）、`aria-busy`（ロック要求中のビュー通知）、`isLoading={isLockPending}`（スピナー表示）を付与。
    - ボタンは `disabled={!canEdit || isLockPending || isLockedByOther}` を維持し、待機中も新スタイルが反映される。

## 検証状況
- `npm run typecheck`: 正常終了。型レベルでの副作用なし。
- `npm run lint`: 既存の `DocumentTimelinePanel.tsx` / `SafetySummaryCard.tsx` 等の未解消エラーで失敗するが、本差分に起因する警告・エラーは追加されていない。
- カラーコントラスト: Node スクリプトで `surfaceStrong` (#e5ebf4) × `textMuted` (#4f5a6b) の比率 5.83:1 を測定し、WCAG AA（4.5:1 以上）を満たすことを確認。
- キーボード・スクリーンリーダー挙動: コードレビュー時に `aria-pressed` / `aria-busy` の付与と `Tab` フローをロジック上確認。2025-11-04 QA セッションで Chrome 130 / Safari 17 / Edge 130 + VoiceOver/NVDA を用いた実機確認を依頼済み（結果待ち）。

## 影響範囲とフォローアップ
- 基底 `Button` コンポーネントを利用する全画面で `disabled` スタイルが単色化される。主要導線（受付一覧、予約管理、オーダ系フォーム）で視覚確認を行うこと。
- Danger バリアント（削除／キャンセル系）も `surfaceStrong` ベースになるため、後続で危険操作向けの専用トーンが必要か UI チームと協議する。
- Safari 17 / Edge 130 でのフォーカスリング・スピナー表示は QA チームに確認依頼済み（2025-11-04 日次確認で回収予定）。
