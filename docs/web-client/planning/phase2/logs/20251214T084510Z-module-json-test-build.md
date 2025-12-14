# 証跡ログ: module_json テストとビルド検証（RUN_ID=`20251214T084510Z`）

- 作業種別: module_json モダナイズ / 単体テスト・ビルド検証・smoke 試行
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/テストとビルド検証.md`

## 実施ログ
1. RUN_ID 採番: `20251214T084510Z`（UTC）。  
2. 単体テスト追加: `common/src/test/java/open/dolphin/infomodel/ModuleJsonConverterTest.java` を追加し、beanJson 経路の serialize/decode 正常系を Map payload で確認。  
3. `mvn -pl common test` を実行。全 3 テスト成功（converter 正常系確認含む）。  
4. `mvn -pl server-modernized -am -DskipTests compile` を実行。モダナイズ版サーバーまでコンパイル成功。  
5. smoke 試行 (1回目): `npm --prefix web-client run dev -- --host --port 4173 --strictPort` で Vite dev（msw ON）起動後、`RUN_ID=20251214T084510Z npm run e2e:smoke -- --reporter=line --workers=1 --timeout=60000` を実行。`__REACT_DEVTOOLS_GLOBAL_HOOK__` 再定義エラーで失敗。  
6. 対応: `web-client/public/perf-env-boot.js` の DevTools 無効化処理を setter/no-op 方式に変更し、read-only 例外を防止。  
7. smoke 再試行 (2回目): 同コマンドで再実行し、1/1 passed (3.2s)。アーティファクト: `artifacts/webclient/e2e/20251214T084510Z/msw-on/har/tests_e2e_orca-master-bridge.smoke.spec.ts___master-bridge_ORCA_master_audit_smoke.har` / `.../screenshots/tests_e2e_orca-master-bridge.smoke.spec.ts___master-bridge_ORCA_master_audit_smoke-0.png`。  

## 観測/課題
- dev サーバー起動時に HTTPS 設定が自動付与されるが、Playwright は `ignoreHTTPSErrors: true` のため問題なし。  
- React DevTools hook 無効化は perf-env-boot.js 側の setter/no-op で吸収。現行の msw ON パスでは再発なし。  

## 次アクション候補
- MSW OFF（`VITE_DISABLE_MSW=1`）で軽量スモークを追加実行し、hook 修正の副作用がないか確認する。  
- smoke 成功後に beanJson 保存/復元の UI 経路確認を追加する。  

## 成果物
- `src/modernization/module_json/テストとビルド検証.md`
- `common/src/test/java/open/dolphin/infomodel/ModuleJsonConverterTest.java`
