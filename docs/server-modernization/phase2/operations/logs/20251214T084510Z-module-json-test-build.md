# RUN_ID: 20251214T084510Z（module_json テストとビルド検証）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/テストとビルド検証.md`
- スコープ: module_json JSON 保存/復元の単体確認とモダナイズ版サーバーのビルド検証、msw/modernized smoke 試行。

## 実施
- 単体: `mvn -pl common test` 実行。`ModuleJsonConverterTest`（beanJson serialize/decode 正常系）を含め全テスト成功。
- コンパイル: `mvn -pl server-modernized -am -DskipTests compile` 実行。モダナイズ版サーバーまでコンパイル成功。
- smoke: `npm --prefix web-client run dev -- --host --port 4173 --strictPort` で Vite dev（msw ON）起動。`RUN_ID=20251214T084510Z npm run e2e:smoke -- --reporter=line --workers=1 --timeout=60000` を 2 回実施（再試行）。  
- DevTools hook 例外対策: `web-client/public/perf-env-boot.js` の無効化処理を setter/no-op 方式に変更し、Headless Chrome での read-only 例外を抑止。

## 結果
- 単体/コンパイルは成功。JSON 保存・復元の正常系を beanJson 経路で確認。
- smoke 1回目は `__REACT_DEVTOOLS_GLOBAL_HOOK__` 再定義エラーで失敗。perf-env-boot.js 修正後の 2 回目は 1/1 passed (3.2s)。アーティファクト: `artifacts/webclient/e2e/20251214T084510Z/msw-on/har/tests_e2e_orca-master-bridge.smoke.spec.ts___master-bridge_ORCA_master_audit_smoke.har` / `screenshots/...-0.png`。

## 備考 / フォローアップ
- MSW OFF（`VITE_DISABLE_MSW=1`）でも軽く再実行し、hook 無効化変更の副作用がないか確認する。  
- 成功後は beanJson 経路の UI 保存/復元まで smoke で観測する。
