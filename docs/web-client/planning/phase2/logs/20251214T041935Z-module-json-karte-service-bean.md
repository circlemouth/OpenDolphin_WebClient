# 証跡ログ: KarteServiceBean 組み込み（RUN_ID=`20251214T041935Z`）

- 作業種別: module_json モダナイズ / KarteServiceBean 直列化・復元適用
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/KarteServiceBean組み込み.md`
- 目的: ModuleModel を beanJson 優先で保存し、読込系で ModuleJsonConverter 経由の復元を徹底する。

## 変更概要
- `KarteServiceBean#addDocument/updateDocument/addDocumentAndUpdatePVTState` で保存前に `encodeModulePayloads` を呼び出し、module の `model` から beanJson を生成（beanBytes はフォールバックとして保持）。
- `getDocuments` / `getAllDocument` / `fetchDocumentsWithModules` / `getModules` / `getModulesEntitySearch` など QUERY_MODULE_BY_DOC_ID を経由する読込パスで `decodeModulePayloads` を適用し、beanJson→beanBytes の順で復元して `module.setModel` を補完。
- JSON 復元失敗時は warn ログへ集約し、従来の beanBytes フォールバックを維持。

## 確認
- 単体テスト・ビルド: 未実施（後続で `mvn -pl server-modernized -am test` 予定）。
- 互換性: beanBytes を削除していないため既存データは従来通り復元可能。

## 成果物
- `src/modernization/module_json/KarteServiceBean組み込み.md`
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
