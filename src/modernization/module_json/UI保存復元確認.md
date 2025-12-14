# module_json UI保存復元確認

- RUN_ID: `20251214T123042Z`
- 期間: 2025-12-15 10:00 〜 2025-12-16 10:00 (JST) / 優先度: medium / 緊急度: high / エージェント: codex
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
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で modernized サーバーと Vite(dev, MSW OFF) を起動。
- Playwright(headless) で `/login` から `dolphindev/dolphindev` へログインし、同セッションで `/api/karte/document` へ POST（karte_id=91012, user_id=91003, beanJson=`{"text":"bean json ui payload 20251214T123042Z"}`）。
- 生成された docPk=-43 を `/api/karte/documents/-43` で再取得し、beanJson がレスポンスに含まれることを確認。
- DB 確認: `opendolphin.d_module`(doc_id=-43) の `bean_json` が NOT NULL、`beanbytes` が NULL。
- updateDocument を同レコードへ PUT したが、docPk が負数のため `IllegalArgumentException: Document id is required for update` で失敗（現行ガードの挙動を要確認）。

## 成果
- addDocument: 200 OK, docPk=-43。GET 応答で beanJson を確認し、サーバーログに ModuleJsonConverter の WARN なし。
- DB: `opendolphin.d_module.doc_id=-43` の `bean_json` が保存され、`beanbytes` は未設定。`d_document` 行は `docid=UIBJ20251214123042` / `karte_id=91012` / `creator_id=91003`。
- 証跡: `docs/web-client/planning/phase2/logs/20251214T123042Z-module-json-ui-save.md`（UI 手順・HAR/trace・DB 抜粋）、サーバーログと psql 抜粋は `artifacts/webclient/e2e/20251214T123042Z/module-json-ui/` に保存。
- 課題: updateDocument が負の docPk を拒否し 500 となる。正の PK 採番方針または updateDocument のガード改善を module_json ガントで追跡する。

## フォローアップ
- docPk を正数で採番した add→update→GET の UI 巡回を再実施し、WARN/ERROR が消えることを確認する。
- updateDocument の事前条件を `ModuleJsonConverter` / `KarteServiceBean` 側で整理し、UI 側の負数 PK を抑制する案を検討する。
- Stage/Preview 実 API で同経路を再検証する際は RUN_ID を同期し、証跡ログと DOC_STATUS へ反映する。
