# 21 P1 改修：DnD 並べ替え / 全クリア / 行削除補助

RUN_ID: 20251229T081044Z

- 目的: OrderBundleEditPanel の操作補助 UI を追加する。
- 対象: Charts 右パネル（OrderBundleEditPanel）。
- 実装観点:
  - 行ドラッグで並べ替え可能にする。
  - 「全クリア」操作と確認導線を追加。
  - 行削除の明示アクションを追加。
- 依存/前提: DnD ライブラリ選定と既存テーブル構造の整理。
- テスト: 保存順序の反映、readOnly/missingMaster/fallbackUsed 時の無効化。
