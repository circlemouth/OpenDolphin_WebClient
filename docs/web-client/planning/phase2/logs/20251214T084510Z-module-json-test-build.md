# 証跡ログ: module_json テストとビルド検証（RUN_ID=`20251214T084510Z`）

- 作業種別: module_json モダナイズ / 単体テスト・ビルド検証・smoke 試行
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/テストとビルド検証.md`

## 実施ログ
1. RUN_ID 採番: `20251214T084510Z`（UTC）。  
2. 単体テスト追加: `common/src/test/java/open/dolphin/infomodel/ModuleJsonConverterTest.java` を追加し、beanJson 経路の serialize/decode 正常系を Map payload で確認。  
3. `mvn -pl common test` を実行。全 3 テスト成功（converter 正常系確認含む）。  
4. `mvn -pl server-modernized -am -DskipTests compile` を実行。モダナイズ版サーバーまでコンパイル成功。  
5. smoke 試行: `npm --prefix web-client run dev -- --host --port 4173 --strictPort` で Vite dev（msw ON）起動後、`RUN_ID=20251214T084510Z npm run e2e:smoke -- --reporter=line --workers=1 --timeout=60000` を実行。  
6. smoke 結果: ランタイムエラー `Cannot assign to read only property '__REACT_DEVTOOLS_GLOBAL_HOOK__' of object '#<Window>'` により失敗（Playwright fixture が runtime-errors を検出）。MSW stub 応答は取得済み。アーティファクト: `test-results/tests-e2e-orca-master-brid-bc038-dge-ORCA-master-audit-smoke/{test-failed-1.png,trace.zip}`。  

## 観測/課題
- dev サーバー起動時に HTTPS 設定が自動付与されるが、Playwright は `ignoreHTTPSErrors: true` のため問題なし。  
- smoke 失敗は React DevTools hook への書き込みが原因。フィクスチャ初期化（tests/playwright/fixtures.ts）の hook 周りか dev サーバーの devtools 設定見直しが必要。  

## 次アクション候補
- `__REACT_DEVTOOLS_GLOBAL_HOOK__` を扱うガードをフィクスチャへ追加して再実行。  
- smoke 成功後に MSW ON/OFF 両パスで beanJson 保存/復元の UI 経路確認を追加する。  

## 成果物
- `src/modernization/module_json/テストとビルド検証.md`
- `common/src/test/java/open/dolphin/infomodel/ModuleJsonConverterTest.java`
