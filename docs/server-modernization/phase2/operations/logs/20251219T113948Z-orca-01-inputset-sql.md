# ORCA-01 `/orca/inputset` SQL 修正 実施ログ（RUN_ID=20251219T113948Z）

## 実施概要
- 対象: `/orca/inputset` の `inputcd` フィルタに括弧を付け、`hospnum` 条件とセットで評価されるように明示。
- 追加: SQL 生成の最小ユニットテストを追加し、意図した SQL 文字列を検証。

## 変更内容
- SQL 生成を `buildInputSetSql(...)` に切り出し、テスト可能にした。
- 新規テスト: `OrcaResourceInputsetSqlTest` で SQL 文字列を検証。

## 実行コマンド
```bash
mvn -pl server-modernized -am test
```

## 実行結果
- 結果: 失敗（既存テストの既知失敗が継続）。
- 本変更に関連する新規テストは成功（`open.orca.rest.OrcaResourceInputsetSqlTest`）。
- 既知失敗例:
  - `open.dolphin.session.KarteServiceBeanDocPkTest` の Mockito 検証回数不一致
  - `open.dolphin.session.MmlSenderBeanSmokeTest` の fixture 未検出
  - `open.dolphin.rest.LetterResourceTest` / `StampResourceTest` の Strict stubbing mismatch
  - `open.dolphin.touch.DolphinResourceDocumentTest` の `NoSuchFieldException: objectMapper`
  - `open.dolphin.rest.SystemResourceTest` の例外型不一致
  - `open.dolphin.touch.TouchModuleResourceTest` の 400/500 不一致
  - `open.dolphin.rest.AdmissionResourceFactor2Test` の `NoSuchField` 系

## 補足
- 今回の変更は SQL 文字列生成の括弧配置を明確化するもので、テストは SQL 文字列で検証。
- 詳細ログは `server-modernized/target/surefire-reports/` を参照。

