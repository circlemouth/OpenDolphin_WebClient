# 証跡ログ: module_json 設計と手順書アップデート（RUN_ID=`20251214T082236Z`）

- 作業種別: ドキュメント更新（module_json JSON 化手順整理 / server-modernized 開発手順反映）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/docs/modernization/設計と手順書アップデート.md`
- 目的: module_json の JSON 化仕様と開発手順を README / operations へ反映し、RUN_ID と証跡リンクを整理する。

## 実施内容
- `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID=`20251214T082236Z` を追記し、Active 行へ module_json ドキュメント/ログを追加。
- `docs/web-client/README.md` の最新更新サマリを本 RUN に更新し、server-modernized 側 module_json Runbook の導線を追加。
- `docs/server-modernization/phase2/README.md` と `operations/MODULE_JSON_DEVELOPMENT.md` をリンク付けし、JSON 化仕様（beanJson 優先・beanBytes フォールバック、polymorphic typing）と開発手順を明文化。
- `src/docs/modernization/設計と手順書アップデート.md` を新規作成し、本タスクのスコープ・成果物・証跡ログを集約。

## 変更ファイル
- `docs/web-client/planning/phase2/DOC_STATUS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/README.md`
- `docs/server-modernization/phase2/operations/MODULE_JSON_DEVELOPMENT.md`
- `docs/server-modernization/phase2/operations/logs/20251214T082236Z-module-json-docs.md`
- `src/docs/modernization/設計と手順書アップデート.md`

## 残タスク / メモ
- Flyway `V0225` 実行結果の取得と JSON 保存/復元の実測ログが揃い次第、`MODULE_JSON_DEVELOPMENT.md` の検証ステップに追加する。
- ModuleJsonConverter の allow-list拡充や mvn テスト結果が出た場合は、本 RUN_ID の備考を更新し DOC_STATUS へ反映する。
