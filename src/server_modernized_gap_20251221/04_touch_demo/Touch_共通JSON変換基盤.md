# Touch 共通 JSON 変換基盤

## 目的
- Touch/Demo 系の XML/Legacy DTO を JSON に統一し、クライアントが依存できる共通レスポンス形へ揃える。
- 監査 ID / TraceId の引き回しを統一する。

## スコープ
- Touch 系 API の JSON 変換レイヤ（Legacy DTO → JSON）
- 監査 ID/TraceId の統一（ヘッダー/レスポンスメタ）

## 非スコープ
- Touch P0/P1 API の個別機能実装（別タスク）
- ORCA 実測や外部接続の検証

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

## 参照
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
