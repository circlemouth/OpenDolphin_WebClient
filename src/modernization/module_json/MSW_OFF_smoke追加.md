# MSW OFF スモーク追加

- RUN_ID: `20251214T091846Z`
- 期間: 2025-12-15 09:00 〜 2025-12-16 09:00 (JST) / 優先度: medium / 緊急度: high / エージェント: codex
- YAML ID: `src/modernization/module_json/MSW_OFF_smoke追加.md`

## 目的
- `VITE_DISABLE_MSW=1` で dev サーバーを起動し、msw OFF 状態でも軽量スモークが通ることを確認する。
- `perf-env-boot.js` の DevTools 無効化修正に副作用がないことを検証する。
- beanJson 保存/復元経路に到達可能な UI 流れ（軽量）を今後の追跡用に記録する。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. `src/modernization/module_json/キックオフ_RUN_ID採番.md`
6. 本ドキュメント

## 実施手順 (実績)
1. 環境起動: `RUN_ID=20251214T091846Z WEB_CLIENT_MODE=npm WEB_CLIENT_DEV_PORT=4173 VITE_DISABLE_MSW=1 VITE_DEV_USE_HTTPS=1 WEB_CLIENT_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources ./setup-modernized-env.sh`
   - modernized サーバー + npm dev サーバー（MSW OFF, HTTPS）を起動。ログ: `tmp/web-client-dev-mswoff.log`。
2. スモーク実行: `RUN_ID=20251214T091846Z VITE_DISABLE_MSW=1 PLAYWRIGHT_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources PLAYWRIGHT_BASE_URL=https://localhost:4173 npm run e2e:smoke -- --reporter=line --workers=1 --timeout=60000`
   - テスト: `tests/e2e/orca-master-bridge.smoke.spec.ts` 1/1 passed (3.5s)。
   - route stub（`MASTER_BRIDGE_STUB` 既定=1）で primary/fallback いずれも `runId=20251214T091846Z` / `dataSource=mock` / `cacheHit=false` / `missingMaster=false|true` / `fallbackUsed=false|true` を取得。
3. 成果物: `artifacts/webclient/e2e/20251214T091846Z/msw-off/har/tests_e2e_orca-master-bridge.smoke.spec.ts___master-bridge_ORCA_master_audit_smoke.har` / 同 screenshots。

## 観測・メモ
- `perf-env-boot.js` の DevTools 無効化（setter/no-op）後も MSW OFF で React DevTools 例外は再発せず。
- modernized DB は seed 最小構成（d_document 1 件のみ）。beanJson UI までの深い経路は未到達（今後の巡回タスクで補う）。

## 次アクション
- beanJson 保存/復元の UI 経路（文書保存→再読込）を MSW OFF で踏む軽量ケースを追加し、RUN_ID 継続で証跡取得。
- Stage/Preview 実 API ルートが復旧したら同 RUN_ID で再実行し、`dataSourceTransition`/tone/telemetry を比較する。
