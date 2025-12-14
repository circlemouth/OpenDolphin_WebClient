# 証跡ログ: module_json UI保存復元再確認（RUN_ID=`20251214T140106Z`）

- 作業種別: module_json モダナイズ / UI 経路 add→update→GET の再確認（docPk 正数化・WARN 抑止の検証）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/UI保存復元確認.md`

## 実施ログ
1. モダナイズ版サーバーを最新ソースで再ビルド (`docker compose build server-modernized-dev`) し、WildFly を再作成。テスト側の `KarteServiceBeanDocPkTest` を DummyModel 実装で修正後、WAR ビルド成功。
2. 環境: `WEB_CLIENT_MODE=npm` / `VITE_DISABLE_MSW=1` / dev proxy `http://localhost:9080/openDolphin/resources`。ログイン: facilityId=`1.3.6.1.4.1.9414.10.1` / userId=`dolphindev` / pass=`dolphindev`。
3. addDocument（UI ヘッダー認証）
   - POST `/api/karte/document` payload=`artifacts/.../add_request.json`（beanJson のみ送信、model 省略）。
   - 応答: `200 OK`, `docPk=9024`（正の PK）。サーバーログ traceId=`2733539c-7a16-4bc0-8752-0a76fb8d8721`。
4. GET 再読込 / deserialize 確認
   - GET `/api/karte/documents/9024` → modules[0].beanJson=`{"text":"bean json ui payload R2 20251214T140106Z"}` を確認。ModuleJsonConverter の WARN/ERROR なし。
5. updateDocument
   - PUT `/api/karte/document` payload=`update_request.json`（docPk=9024 / module id=9025 / beanJson 更新）。
   - 応答: `200 OK`, `docPk=9024`。再GET で beanJson が `bean json ui updated ...` に更新されていることを確認。
6. DB 確認
   - `d_document.id=9024` / `docid=UIBJPOS20251214T140106Z-R2` / karte_id=91012 / creator_id=91003。
   - `d_module.doc_id=9024` の `bean_json=34266`（LOB 格納） / `beanbytes`=NULL。beanJson が保存されていることを確認。

## 成果物
- リクエスト/レスポンス・DB 抜粋: `artifacts/webclient/e2e/20251214T140106Z/module-json-ui/`
  - `add_request.json`, `update_request.json`, `get_after_update.json`, `responses.txt`, `db_check.txt`, `server_log_snippet.txt`
- サーバーログ抜粋（POST/PUT/GET traceId）: `server_log_snippet.txt`

## 観測
- `KarteServiceBean#addDocument` が正のシーケンス採番を返し、レスポンス/DocInfo docPk も正数で揃うことを UI 経路で確認。
- beanJson は WARN なしで保存・復元され、`beanbytes` には触れず NULL のままでも動作する。
- 旧検証で作成された負の docPk レコード（-41/-42/-43/-45）は DB に残存するが、新規作成では再発しない。クリーンアップは別途タスクで検討。

## 次アクション
- UI 側で docPk を POST 応答から再利用する運用をドキュメントへ明記し、負の PK を送らないようフォーム側バリデーションを検討。
- Stage/Preview 実 API でも add→update→GET を実施し、RUN_ID 同期で DOC_STATUS/証跡に反映。
