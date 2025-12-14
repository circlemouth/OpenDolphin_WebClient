# 証跡ログ: module_json UI保存復元確認（RUN_ID=`20251214T123042Z`）

- 作業種別: module_json モダナイズ / UI 経由の beanJson 保存・復元確認
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/UI保存復元確認.md`

## 実施ログ
1. 環境起動（MSW OFF）  
   - `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（dev proxy: `http://localhost:9080/openDolphin/resources`）。  
   - ログイン: `facilityId=1.3.6.1.4.1.9414.10.1 / userId=dolphindev / pass=dolphindev`。
2. addDocument（UI / Playwright headless）  
   - `/login` で認証後、同セッションで `/api/karte/document` へ POST。payload: karte_id=91012, user_id=91003, module.beanJson=`{"text":"bean json ui payload 20251214T123042Z"}`、docId=`UIBJ20251214123042`。  
   - 応答: 200 OK, `docPk=-43`。trace: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/trace.zip`、リクエスト/レスポンス: `ui-add-*.json`。
3. 再読込・deserialize 確認  
   - `/api/karte/documents/-43` を GET。modules 配下に `beanJson: {"text":"bean json ui payload 20251214T123042Z"}` を確認。サーバーログに ModuleJsonConverter WARN なし。  
   - DB: `opendolphin.d_module` doc_id=-43 の `bean_json` が NOT NULL、`beanbytes` NULL（`db-check.txt`）。
4. updateDocument 試行  
   - `/api/karte/document` へ PUT（docPk=-43, beanJson 更新版）→ 500 `Document id is required for update`。負の PK を updateDocument が拒否する挙動を確認。`ui-update-*.json` / `server.log` に詳細。
5. docId 長さ 32 文字制約を遵守するよう docId を短縮。以降の addDocument は成功、deserialize WARN なし。

## 成果物
- Playwright trace / screenshots: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/trace.zip`
- リクエスト・レスポンス: `ui-add-request.json` / `ui-add-response.json` / `ui-get-response.json` / `ui-update-request.json` / `ui-update-response.json` / `ui-update-get.json`
- サーバーログ抜粋: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/server.log`
- DB 抜粋: `db-check.txt`

## 観測
- addDocument→GET→DB で beanJson が保存され、deserialize WARN は発生しない。
- 新規 docPk が負数で発行されるケースでは updateDocument が 500 になる。正の PK を得る運用 or updateDocument のガード改善が必要。

## TODO / Next
- 正の PK で add→update→GET を再確認し、DOC_STATUS に追記。
- updateDocument の前提条件（docPk>0）を module_json ガントで共有し、UI から負の PK を出さないよう採番方針を整理。
