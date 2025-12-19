# ORCA-01 `/orca/inputset` SQL 修正 実施ログ（RUN_ID=20251219T112155Z）

## 実施概要
- 対象: `/orca/inputset` の `inputcd` フィルタに括弧を追加し、`hospnum` 条件を常に適用。
- 変更ファイル: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`

## 実行コマンド
```bash
mvn -pl server-modernized test
```

## 実行結果
- 結果: 失敗（既存テストの既知エラーが継続）
- 失敗概要（抜粋）:
  - `open.dolphin.touch.DolphinResourceDocumentTest` で `NoSuchFieldException: objectMapper`
  - `open.dolphin.session.KarteServiceBeanDocPkTest` で Mockito 検証回数不一致
  - `open.dolphin.session.MmlSenderBeanSmokeTest` で fixture 未検出
  - `open.dolphin.rest.LetterResourceTest` / `StampResourceTest` で Strict stubbing mismatch
  - `open.dolphin.rest.SystemResourceTest` で例外型不一致
  - `open.dolphin.touch.TouchModuleResourceTest` で 400 想定が 500
  - `open.dolphin.rest.AdmissionResourceFactor2Test` で `NoSuchField` 系

## 補足
- 本変更に起因する失敗は確認できず、既存の失敗が再現したため「既存テストの再実行」証跡として記録。
- 詳細ログ: `server-modernized/target/surefire-reports/`

