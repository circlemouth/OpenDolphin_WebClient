# ORCA-02 `/orca/stamp/{setCd,name}` date パラメータ追加（RUN_ID=20251219T131008Z）

## 概要
`/orca/stamp/{setCd,name}` に `date` クエリパラメータを追加し、入力セット/点数マスタの有効期間チェックを診療日指定で行えるようにした。既存の `setCd,stampName,visitDate`（第3要素）指定も後方互換として維持し、`date` が指定された場合は優先する。

## 変更内容
- `OrcaResource#getStamp` に `@QueryParam("date")` を追加。
- `date` が指定された場合は `resolveEffectiveDate` に渡す値として優先。
- `resolveEffectiveDate` は既存ロジック（数字抽出→YYYYMMDD→未指定時は当日）を維持。

## 影響範囲
- `/orca/stamp/{setCd,name}` の取得時に、`date` を明示することで過去/未来診療日の有効期間判定が可能。
- 既存のパスパラメータ第3要素による診療日指定は引き続き有効。

## 実装ファイル
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`

## 証跡
- `docs/server-modernization/phase2/operations/logs/20251219T131008Z-orca-02-stamp-date.md`
