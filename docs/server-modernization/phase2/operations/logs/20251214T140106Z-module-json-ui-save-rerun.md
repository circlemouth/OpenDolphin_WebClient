# RUNログ: module_json UI保存復元再確認（RUN_ID=`20251214T140106Z`）

- 目的: modernized サーバーで addDocument→updateDocument→GET を UI 経路で再検証し、docPk 正数化と beanJson 復元時の WARN 抑止を確認する。
- 環境: docker compose (server-modernized-dev + postgres + minio), `WEB_CLIENT_MODE=npm`, `VITE_DISABLE_MSW=1`, dev proxy `http://localhost:9080/openDolphin/resources`。

## 手順
1. `docker compose build server-modernized-dev` で最新ソースを WAR 化（tests skipped）。`KarteServiceBeanDocPkTest` を DummyModel に修正しビルド成功。
2. コンテナ再作成後、認証ヘッダーで `/api/user/<facility:user>` を GET しログイン。
3. POST `/api/karte/document` （payload: artifacts/webclient/e2e/20251214T140106Z/module-json-ui/add_request.json）。応答 `docPk=9024`、traceId=`2733539c-7a16-4bc0-8752-0a76fb8d8721`。
4. GET `/api/karte/documents/9024` で beanJson 保存を確認（WARN/ERROR なし）。
5. PUT `/api/karte/document` で beanJson 更新、応答 `docPk=9024`。GET 再確認で更新反映。
6. DB: d_document.id=9024 正数、d_module.bean_json=34266（beanbytes NULL）。

## 成果物
- `artifacts/webclient/e2e/20251214T140106Z/module-json-ui/`（リクエスト・レスポンス・DB 抜粋・ログ）。
- サーバーアクセスログ抜粋: `server_log_snippet.txt`。

## 観測/課題
- addDocument は正のシーケンス採番に揃い、docPk/DocInfo が正数で整合した。
- ModuleJsonConverter WARN は発生せず beanJson のみで復元可能。
- 旧 RUN で作成した負の docPk エントリは残存。必要に応じてクリーニング手順を別 RUN で検討する。
