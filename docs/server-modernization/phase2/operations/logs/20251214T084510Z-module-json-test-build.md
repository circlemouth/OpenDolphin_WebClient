# RUN_ID: 20251214T084510Z（module_json テストとビルド検証）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/テストとビルド検証.md`
- スコープ: module_json JSON 保存/復元の単体確認とモダナイズ版サーバーのビルド検証、msw/modernized smoke 試行。

## 実施
- 単体: `mvn -pl common test` 実行。`ModuleJsonConverterTest`（beanJson serialize/decode 正常系）を含め全テスト成功。
- コンパイル: `mvn -pl server-modernized -am -DskipTests compile` 実行。モダナイズ版サーバーまでコンパイル成功。
- smoke: `npm --prefix web-client run dev -- --host --port 4173 --strictPort` で Vite dev（msw ON）起動。`RUN_ID=20251214T084510Z npm run e2e:smoke -- --reporter=line --workers=1 --timeout=60000` を実施。

## 結果
- 単体/コンパイルは成功。JSON 保存・復元の正常系を beanJson 経路で確認。
- smoke は Playwright フィクスチャで runtime error: `Cannot assign to read only property '__REACT_DEVTOOLS_GLOBAL_HOOK__' of object '#<Window>'` が発生し失敗。MSW stub 応答ログは取得済み。アーティファクト: `test-results/tests-e2e-orca-master-brid-bc038-dge-ORCA-master-audit-smoke/{test-failed-1.png,trace.zip}`。

## 備考 / フォローアップ
- フィクスチャ初期化の devtools hook 取り扱いを緩和したうえで再試行すること。成功後は beanJson 経路の UI 保存/復元まで smoke で観測する。
