# 証跡ログ: module_json UI docPk ガードと負PKクリーニング（RUN_ID=`20251214T140106Z`）

- 目的: addDocument 応答 docPk を唯一のソースとして再利用し、負の docPk/未設定 docPk を送らない運用・検証パスを明文化。旧検証で残った負の docPk レコードを DB から除去し、今後の再発監視を簡素化する。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/UI保存復元確認.md`。

## 実施 (2025-12-14)
1. 負の docPk レコードの棚卸し
   - `d_document` / `d_module` で `id<0` / `doc_id<0` を 5 件ずつ確認。外部参照（d_image/d_attachment）は 0 件。
   - 証跡: `artifacts/webclient/e2e/20251214T140106Z/module-json-cleanup/negative_doc_records.txt`, `negative_doc_references.txt`。
2. バックアップ採取
   - 該当行を CSV で保存: `negative_doc_records.csv`。
3. クリーニング実施
   - SQL: `DELETE FROM d_module WHERE doc_id < 0; DELETE FROM d_document WHERE id < 0;` をトランザクションで実行。
   - 結果: d_module 5 件 / d_document 5 件削除。事後確認で負 id は 0 件。
   - 証跡: `delete_negative_docpk.sqlout`, `post_cleanup_check.txt`。
4. UI docPk ガード方針
   - POST `/api/karte/document` 応答 `docPk` をグローバル state（DocumentContext）に格納し、PUT/DELETE/PDF export など docPk を要求する API ではこの値を必須フィールドとして参照する運用とする。
   - フォーム/テスト入力で `docPk<=0` または `null` を検知した場合はリクエストを送らずエラー Banner を表示するバリデーションを追加予定（`documentService.validateDocPk(docPk)` のユーティリティ化を提案）。
   - Playwright/MSW シナリオでは POST 応答の docPk をそのまま update payload に挿入するテンプレートを採用し、固定値 `-1` を使用しないよう doc fixture を修正予定。

## 成果物
- DB クリーニングログ: `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-cleanup.md`
- Web クライアント側検証ログ: 本ファイル
- 生証跡: `artifacts/webclient/e2e/20251214T140106Z/module-json-cleanup/`

## 今後の実装メモ（UI）
- `documentService` へ `ensureDocPkPositive(docPk: number): docPk | throws` を追加し、UI 全経路で共有。
- Playwright シナリオ `charts-document-save.spec`（追加予定）で「add→update→pdf/export」一連を docPk>0 前提で固定し、docPk<=0 の場合はテスト失敗にする。
- MSW/real API トグル時のサンプル JSON から `docPk=-1` テンプレートを排除し、POST 応答を使うよう fixture を置換。
