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
6. 正の PK 再試行（Playwright API / ヘッダー認証）  
   - payload から `id` を外しシーケンス採番を狙い、docId=`UIBJPOS20251214T123042Z`（22 文字）で POST。サーバーログでは `addDocument assigned seq id=9021` が出力されるが、応答/DB の docPk は `-42`（負のまま）で、`/api/karte/documents/-42` GET では ModuleJsonConverter が `@class` 欠如で WARN。  
   - `/api/karte/document` PUT は `Session layer failure ... updateDocument`（id<=0 ガード）で失敗し beanJson 更新を確認できず。  
   - 成果物: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/positive-pk/` 配下に add/update リクエスト/レスポンス、GET 後データ、HAR/trace、server.log、DB 抜粋を保存。

## 成果物
- Playwright trace / screenshots: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/trace.zip`
- リクエスト・レスポンス: `ui-add-request.json` / `ui-add-response.json` / `ui-get-response.json` / `ui-update-request.json` / `ui-update-response.json` / `ui-update-get.json`
- サーバーログ抜粋: `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/server.log`
- DB 抜粋: `db-check.txt`

## 観測
- addDocument→GET→DB で beanJson が保存され、deserialize WARN は発生しない。
- 新規 docPk が負数で発行されるケースでは updateDocument が 500 になる。正の PK を得る運用 or updateDocument のガード改善が必要。
- docId を 32 文字以下に抑えても docPk は依然として負の値で発行される（seq=9021 割当ログ有り）。ModuleJsonConverter は `@class` のない beanJson を WARN として扱うため、UI 側で polymorphic 型情報付き JSON を送るか、サーバー側フォールバック/ガード整備が必要。

## TODO / Next
- 正の PK を発行できるまで add→update→GET を再確認し、原因（seq 割当後に負へ変換される経路）を特定。
- updateDocument の前提条件（docPk>0）を module_json ガントで共有し、UI 側の採番/beanJson 生成方針（@class 付与含む）を整理。
