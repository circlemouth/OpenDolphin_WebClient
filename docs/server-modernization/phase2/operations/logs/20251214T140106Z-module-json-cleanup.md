# module-json 負の docPk クリーニング (RUN_ID=20251214T140106Z)

## サマリ
- 対象 DB: opendolphin_modern (コンテナ opendolphin-postgres-modernized)
- 事象: module_json UI 検証時に発生した負の docPk レコード (d_document/d_module) が 5 件ずつ残存。
- 方針: 外部参照がないことを確認した上で削除。バックアップとして該当レコードを CSV で採取。

## 手順詳細
1. 事前採取
   - クエリ: `SELECT ... FROM d_document WHERE id<0` / `SELECT ... FROM d_module WHERE doc_id<0`
   - 証跡: artifacts/webclient/e2e/20251214T140106Z/module-json-cleanup/negative_doc_records.txt, negative_doc_records.csv, negative_doc_references.txt
2. 外部参照確認
   - d_image / d_attachment で doc_id<0 が 0 件であることを確認。
3. 削除実行
   - コマンド: `DELETE FROM d_module WHERE doc_id < 0; DELETE FROM d_document WHERE id < 0;`
   - 実行結果: d_module 5 件削除, d_document 5 件削除。
   - 証跡: artifacts/.../delete_negative_docpk.sqlout
4. 事後確認
   - doc_id<0 / id<0 の件数いずれも 0 件。
   - 証跡: artifacts/.../post_cleanup_check.txt

## 所要時間・影響
- 所要: 約 3 分
- 影響: d_document/d_module の負 id レコードのみ削除。外部参照なし、通常の docPk 正数発行に影響なし。

## 今後の運用提案
- module_json UI/自動テストでは addDocument 応答の docPk を再利用し、負数／null docPk を送出しないガードを徹底。
- 万一負の docPk が再発した場合、本ログの手順で削除しつつ発生経路を記録すること。
