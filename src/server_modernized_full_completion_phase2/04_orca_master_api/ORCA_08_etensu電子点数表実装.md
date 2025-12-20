# ORCA-08 電子点数表（/orca/tensu/etensu）実装

最終更新: 2025-12-20

## 概要
- 対象: モダナイズ版サーバーの ORCA-08 電子点数表検索
- エンドポイント: `GET /orca/tensu/etensu`
- 目的: 告示日/適用日/区分/点数を返却し、既存のフィクスチャ/スナップショットに追従

## 実装内容
- `OrcaTensuEntry` に以下の項目を追加
  - `noticeDate`（告示日）
  - `effectiveDate`（適用日）
  - `points`（点数）
- `OrcaMasterResource#toEtensuEntry` で上記項目をセット
  - `noticeDate`: `entry.noticeDate` → `entry.version` → `fixture.version` → `entry.snapshotVersion` の順に補完
  - `effectiveDate`: `entry.effectiveDate` → `entry.startDate` → `entry.validFrom` → `DEFAULT_VALID_FROM` の順に補完
  - `points`: `entry.points` → `entry.tanka` の順に補完

## 契約/エラーハンドリング
- 既存仕様に準拠
  - 404: `TENSU_NOT_FOUND`
  - 503: `ETENSU_UNAVAILABLE`

## テスト
- `OrcaMasterResourceTest` に成功系テストを追加
  - `noticeDate` / `effectiveDate` / `kubun` / `points` が返却されることを確認
- 404/503 テストは既存のまま保持

## 補足
- 本ファイルはタスク指示の YAML ID に基づく成果物整理用のドキュメント。
- RUN_ID の指定がないため未記載。
