# ORCA-01 `/orca/inputset` SQL 修正（RUN_ID=20251219T113948Z）

## 概要
- ORCA-01 の `/orca/inputset` における `inputcd` フィルタが `hospnum` を常に適用するよう、WHERE 句の括弧を明示。
- SQL 文字列の単体検証テストを追加。

## 変更内容
- 対象: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`
- 変更:
  - SQL 生成を `buildInputSetSql(...)` に切り出し。
  - WHERE 句を `hospnum` と `inputcd` 条件を括弧で束ねる形に修正。
- テスト:
  - `server-modernized/src/test/java/open/orca/rest/OrcaResourceInputsetSqlTest.java`

## 影響範囲
- `/orca/inputset` の SQL フィルタが `hospnum` 条件を必ず満たすようになる（他施設の `S%` セット混入を防止）。

## テスト
- `mvn -pl server-modernized -am test`
- 結果: 失敗（既存の既知失敗）。詳細は証跡ログを参照。

## 証跡
- `docs/server-modernization/phase2/operations/logs/20251219T113948Z-orca-01-inputset-sql.md`

