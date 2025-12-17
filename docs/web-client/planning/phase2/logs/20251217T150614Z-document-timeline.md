# 20251217T150614Z DocumentTimeline 商用仕上げログ

## 対応範囲
- YAML: `src/charts_production_outpatient/ux/23_DocumentTimeline商用レベル仕上げ.md`
- 実装: `web-client/src/features/charts/DocumentTimeline.tsx`, `web-client/src/features/charts/styles.ts`

## 変更概要
- キュー段階を `ok/retrying/pending/holding/error` に正規化し、ステップバーで 受付→診療→ORCA を可視化。
- missingMaster / claimError / fallbackUsed / cacheMiss を判定し、ToneBanner nextAction を分岐。行に badge を追加。
- 32件仮想ウィンドウ＋前後/先頭/選択/全件コントロール、ステータス別折りたたみ、ウィンドウサイズ入力を追加。表示件数/総件数をヘッダに併記。
- 行ごとに「次にやること」を状態×キュー段階から生成。

## 影響ファイル
- `web-client/src/features/charts/DocumentTimeline.tsx`
- `web-client/src/features/charts/styles.ts`
- `src/charts_production_outpatient/ux/23_DocumentTimeline商用レベル仕上げ.md`

## メモ
- 大量データ時は slice のみでレンダリングを抑制。将来 API offset が入る場合は windowStart を offset へ合わせる改修を別タスクとする。
- Python 実行なし。サーバー側変更なし。
