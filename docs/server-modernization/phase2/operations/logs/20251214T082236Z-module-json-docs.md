# RUN_ID: 20251214T082236Z（module_json 設計・手順書アップデート）

## 目的
- module_json の JSON 化仕様と開発手順を server-modernized 側ドキュメント（README/operations）に反映し、証跡リンクを整理する。

## 参照チェーン
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md`

## 更新内容
1) `docs/server-modernization/phase2/operations/MODULE_JSON_DEVELOPMENT.md` を新規作成し、beanJson 優先保存・beanBytes フォールバック、polymorphic typing 設定、Flyway `V0225` 前提、`setup-modernized-env.sh` を使った検証手順を明文化。
2) `docs/server-modernization/phase2/README.md` の Operations セクションに module_json 手順への導線を追加。
3) Web クライアント側 README / DOC_STATUS / 計画ログと本ログを RUN_ID で同期。

## 成果物
- `docs/server-modernization/phase2/operations/MODULE_JSON_DEVELOPMENT.md`
- `docs/server-modernization/phase2/README.md`（Operations 節追記）
- `docs/web-client/planning/phase2/logs/20251214T082236Z-module-json-docs.md`
- `src/docs/modernization/設計と手順書アップデート.md`

## フォローアップ
- Flyway `V0225` の実行結果や ModuleJsonConverter allow-list 拡充が発生した場合は、本ログへ追記し、`DOC_STATUS.md` 備考を更新する。
