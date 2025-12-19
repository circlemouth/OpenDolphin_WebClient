# ORCA-01 `/orca/inputset` SQL 修正（RUN_ID=20251219T112155Z）

## 概要
- ORCA-01 の `/orca/inputset` における `inputcd` フィルタが `hospnum` を常に適用するよう、WHERE 句の括弧を明示。
- 既存テストを再実行し、結果を証跡ログに記録。

## 変更内容
- 対象: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`
- 変更: `tbl_inputcd` の WHERE 句を `hospnum` と `inputcd` 条件を括弧で束ねる形に修正。

## 影響範囲
- `/orca/inputset` の SQL フィルタが `hospnum` 条件を必ず満たすようになる（他施設の `S%` セット混入を防止）。

## テスト
- `mvn -pl server-modernized test`
- 結果: 失敗（既存の既知失敗）。詳細は証跡ログを参照。

## 証跡
- `docs/server-modernization/phase2/operations/logs/20251219T112155Z-orca01-inputset-sql.md`

