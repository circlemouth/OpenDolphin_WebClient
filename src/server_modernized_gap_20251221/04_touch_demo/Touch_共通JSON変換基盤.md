# Touch 共通 JSON 変換基盤
- 期間: 2025-12-24 15:00 - 2025-12-27 15:00 / 優先度: high / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Touch_共通JSON変換基盤.md`

## 目的
- Touch/Demo 系の XML/Legacy DTO を **JSON へ統一** し、クライアントが依存できる共通レスポンス形へ揃える。
- 監査 ID / TraceId の引き回しを標準化し、JSON 変換処理でも監査整合性を維持する。

## スコープ
- Touch/Demo 系 API の JSON 変換レイヤ（Legacy DTO → JSON）
- 監査 ID/TraceId の統一（ヘッダー/レスポンスメタ）

## 対応内容
- 共通 JSON 変換レイヤ
  - XML/Legacy DTO → JSON の変換 API を共通化し、Touch 個別の変換ロジックを排除する。
  - 変換失敗時はエラー種別と対象 DTO を監査へ記録し、入力データは監査ログに出さない。
- 監査 ID / TraceId 標準化
  - 変換レイヤの入口で `X-Trace-Id` を必須化し、未設定時は新規採番して下流へ伝搬。
  - 既存の監査 ID と TraceId を **同一リクエスト内で整合**させ、重複採番を避ける。
- 互換維持
  - 既存の JSON レスポンス形式は維持し、フィールド名の破壊的変更は行わない。
  - Legacy DTO の欠損フィールドは null/空配列のいずれかに正規化（用途別の基準を明文化）。

## 作業内容
1. 変換レイヤ設計
   - 変換対象 DTO 一覧化（Touch/Demo）
   - JSON レスポンスの共通フォーマット定義（metadata / items / errors）
2. 監査/TraceId 連携の統一
   - 監査イベント名/失敗分類の整理
   - TraceId 受け渡しの共通化
3. 実装方針の確定
   - 既存 API での影響範囲を整理
   - P0/P1 実装タスクへの受け渡し項目を整理

## 実装（初期基盤）
- `open.dolphin.touch.transform` に共通 JSON 変換レイヤを新設。
  - `TouchJsonTransformer` が Legacy DTO 変換・traceId/requestId の正規化・監査失敗ログを集約。
  - `TouchJsonResponse` / `TouchJsonMetadata` / `TouchJsonError` で `metadata/items/errors` の共通フォーマットを提供。
  - `TouchJsonListPolicy` で null/空配列の正規化ポリシーを明示。
- 変換失敗時は `TOUCH_JSON_CONVERSION_FAILURE` で監査イベントを記録し、入力ペイロードはログに含めない。
- 既存 API への組み込みは次タスクで行い、互換性確認と段階的移行を前提とする。

## 非スコープ
- Touch P0/P1 API の個別機能実装（別タスク）
- ORCA 実測や外部接続の検証

## 変更ファイル（予定）
- `server-modernized/src/main/java/open/dolphin/` 配下の Touch 変換層（新規パッケージ）
- `server-modernized/src/test/java/open/dolphin/` 配下の Touch 変換テスト
- `docs/server-modernization/` の Touch 仕様メモ（更新が必要な場合のみ）

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。

## 参照
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
