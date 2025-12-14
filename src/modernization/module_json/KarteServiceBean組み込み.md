# KarteServiceBean 組み込み（module_json）

- RUN_ID: `20251214T041935Z`
- 期間: 2025-12-18 09:00 〜 2025-12-20 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: codex
- 親 RUN_ID: `20251214T022944Z`（module_json ガント起点）
- YAML ID: `src/modernization/module_json/KarteServiceBean組み込み.md`

## 目的
- ModuleModel を保存する際に beanJson へ直列化し、beanBytes をフォールバックとして維持する経路を KarteServiceBean で統一する。
- getDocuments などの読込系で ModuleJsonConverter による復元を必ず実行し、全モジュールで JSON 経路を検証できるようにする。
- QUERY_MODULE_BY_DOC_ID を利用する API/サービスを網羅し、beanJson/beanBytes どちらでも破損しないことを確認する。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. `src/modernization/module_json/キックオフ_RUN_ID採番.md`
6. 本ドキュメント

## 作業項目
- add/updateDocument の保存前に ModuleJsonConverter で serialize を適用し、beanJson を優先保存する。
- QUERY_MODULE_BY_DOC_ID を使う読込経路で deserialize を全モジュールへ適用し、`module.setModel` を復元済みにする。
- JSON 経路の例外を warn ログに集約し、beanBytes フォールバックが確実に残ることを確認する。

## 証跡
- `docs/web-client/planning/phase2/logs/20251214T041935Z-module-json-karte-service-bean.md`
