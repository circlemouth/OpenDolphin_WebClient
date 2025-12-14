# RUN_ID: 20251214T123042Z（module_json UI 保存・復元確認）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/UI保存復元確認.md`
- 対象: modernized サーバー + Web クライアント（MSW OFF）

## 手順
1. 環境起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（dev proxy: `http://localhost:9080/openDolphin/resources`、login: `dolphindev/dolphindev`）。  
2. addDocument（UI 経由）: Playwright headless で `/login` 認証後、`/api/karte/document` へ POST。payload: karte_id=91012 / user_id=91003 / beanJson=`{"text":"bean json ui payload 20251214T123042Z"}` / docId=`UIBJ20251214123042`。  
   - 応答 200, docPk=-43。サーバーログに decode WARN なし。  
3. 再読込: `/api/karte/documents/-43` で modules.beanJson を確認。  
4. DB 確認: `opendolphin.d_module` doc_id=-43 の `bean_json` NOT NULL, `beanbytes` NULL。`d_document` は `creator_id=91003 / karte_id=91012`。  
5. updateDocument 試行: docPk=-43 を PUT したが `IllegalArgumentException: Document id is required for update`（負の PK を拒否）。  
6. server log / psql 出力を `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/` へ保存。

## 観測・メモ
- beanJson は addDocument→GET→DB で自動保存され、deserialize WARN なし。
- docPk が負のまま発行されると updateDocument が 500 になる。PK 採番か updateDocument の前提条件整理が必要。

## 成果物
- Trace/リクエスト/レスポンス/サーバーログ/DB 抜粋: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/`
