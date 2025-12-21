# ORCA-08 ETENSU API 連携

- 期間: 2025-12-27 09:00 - 2025-12-30 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`

## 目的
- `/orca/tensu/etensu` の実装をフィクスチャ依存から ORCA DB 実装へ切り替える。
- `asOf` / `tensuVersion` / `category` のバリデーションを明確化し、契約の一貫性を保つ。

## 実装概要
- `OrcaMasterResource#getEtensu` を ORCA DB 経由に統一し、フィクスチャ読み込み分岐を撤去。
- DB 取得不可時は 503 (`ETENSU_UNAVAILABLE`) を返却。
- `category` (1-2桁数字), `asOf` (YYYYMMDD), `tensuVersion` (YYYYMM) の入力チェックを明示。
- テストは DB 返却値をスタブして検証し、バリデーション/503/404 をカバー。

## 変更箇所
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
  - `/orca/tensu/etensu` を DB 専用フローに切替
  - DB 未取得時の 503 応答と監査ログ記録を追加
  - `EtensuDao` を注入可能なコンストラクタを追加
- `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`
  - DB スタブ経由の ORCA-08 テストへ更新
  - `category` / `asOf` / `tensuVersion` バリデーションテスト追加

## 非対象
- Legacy/Phase2 ドキュメントの更新
- ORCA 実環境接続や Stage/Preview 検証

