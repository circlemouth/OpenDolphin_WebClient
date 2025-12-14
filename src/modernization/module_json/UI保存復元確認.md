# module_json UI保存復元確認

- RUN_ID: `20251214T140106Z`
- 期間: 2025-12-14 21:30 〜 2025-12-16 21:30 (JST) / 優先度: medium / 緊急度: high / エージェント: codex
- 親 RUN_ID: `20251214T022944Z`（module_json ガント起点）
- YAML ID: `src/modernization/module_json/UI保存復元確認.md`

## 目的
- UI 経由で addDocument を実行し、beanJson が自動保存されることを確認する。
- 保存済みレコードの再読込で ModuleJsonConverter の deserialize が WARN なく完了することを確認する。
- 成果を証跡ログと DOC_STATUS 備考へ同期し、今後の UI 巡回ケースの土台にする。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. `src/modernization/module_json/キックオフ_RUN_ID採番.md`
6. 本ドキュメント

## 実施項目
- modernized サーバーを最新ソースで再ビルド（`docker compose build server-modernized-dev`、tests skipped）し、`WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で dev 環境を起動（MSW OFF）。
- `/api/user/1.3.6.1.4.1.9414.10.1:dolphindev` をヘッダー認証で GET し、同セッションで `/api/karte/document` へ POST（karte_id=91012, user_id=91003, beanJson のみ送信）。
- 応答 docPk=9024（正数）を `/api/karte/documents/9024` で再取得し、beanJson を確認。ModuleJsonConverter の WARN/ERROR 無し。
- `/api/karte/document` へ PUT（docPk=9024, module id=9025, beanJson 更新）し、再GET で更新内容を確認。
- DB 確認: `d_document.id=9024`、`d_module.doc_id=9024` の `bean_json` 保存を確認（`beanbytes` は NULL 維持）。

## 成果
- addDocument: 200 OK, docPk=9024（正数）。GET 応答で beanJson を確認し、サーバーログに ModuleJsonConverter WARN なし。
- updateDocument: 200 OK, docPk=9024。再GET で beanJson 更新が反映。
- DB: `d_document.id=9024 / docid=UIBJPOS20251214T140106Z-R2`、`d_module.doc_id=9024` の `bean_json` 保存・`beanbytes` NULL を確認。
- 証跡: `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-save-rerun.md`、`docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-ui-save-rerun.md`、`artifacts/webclient/e2e/20251214T140106Z/module-json-ui/`。

## フォローアップ
- UI 側で addDocument 応答 docPk を再利用する実装・UX ドキュメントへ反映（負数 PK を送らないガードを検討）。
- 旧 RUN で作成した負の docPk レコードのクリーニング方針を別 RUN で整理する。
- Stage/Preview 実 API での再検証時は本 RUN_ID を派生させ、証跡ログと DOC_STATUS へ同期する。
