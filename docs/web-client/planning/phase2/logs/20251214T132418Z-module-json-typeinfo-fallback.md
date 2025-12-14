# 証跡ログ: module_json 型情報フォールバック（RUN_ID=`20251214T132418Z`）

- 作業種別: module_json モダナイズ / ModuleJsonConverter 型情報フォールバック
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/ModuleJsonConverter型情報フォールバック.md`

## 実施ログ
1. RUN_ID 採番: `20251214T132418Z`（UTC）。
2. WARN 抑止のため、ModuleJsonConverter に non-typed fallback mapper を追加し、`@class` 無し beanJson を Map として復元できるように変更。primary 失敗時は debug ログのみ、両方失敗時のみ warn を出すようにしきい値を調整。
3. 回帰テスト追加: `ModuleJsonConverterTest` に `decode_plainJsonWithoutClass_usesFallbackMapper` を追加し、`@class` なし JSON が decode できることを確認。
4. ビルド/テスト: `mvn -pl common test` を実行し、4 テストすべて成功（converter フォールバック経路を含む）。

## 観測/課題
- SLF4J provider が見つからないためテスト中のログは NOP バインディング（現状 WARN 無しを確認済み）。必要なら logback テストバインディング追加を検討。
- UI 側で polymorphic 型情報を付与する案と、サーバー側フォールバックの役割分担は本ドキュメントに追記（UI が型情報を送らなくても decode 成功するが、型付き JSON のほうが安全）。

## 成果物
- `common/src/main/java/open/dolphin/infomodel/ModuleJsonConverter.java`
- `common/src/test/java/open/dolphin/infomodel/ModuleJsonConverterTest.java`
- `src/modernization/module_json/ModuleJsonConverter型情報フォールバック.md`
