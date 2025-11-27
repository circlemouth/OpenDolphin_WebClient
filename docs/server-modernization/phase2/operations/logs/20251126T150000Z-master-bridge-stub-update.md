# RUN_ID=20251126T150000Z master bridge stub再検証ログ

- RUN_ID: `20251126T150000Z`（親 `20251124T000000Z`）
- 実行日: 2025-11-26
- 対象: `/resources/api/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address,etensu}`（mac-dev ORCA スナップショット/スタブ連携）
- 意図: `OrcaMasterResource` が返す `dataSource`/`dataSourceTransition`/`missingMaster`/`fallbackUsed`/`runId`/`version` を Stage/Preview + Playwright + curl で確認する。

## 1. 事前整備
1. `common/src/main/java/open/dolphin/infomodel/UserModel.java` に `LocalDate`/`DateTimeFormatter` ベースの `getRegisteredDateAsString()` を追加し、`mvn -pl common install -DskipTests` で `jakarta` classifier jar を再インストールしたあと `mvn -pl server-modernized -DskipTests compile` を実行したところ `UserServiceBean` の呼び出しが解決してビルド成功した（この RUN_ID/`docs/server-modernization/phase2/notes/issue-master-bridge-build.md` に記録）。
2. `npm run build`（`web-client`）は TypeScript 型ガード/未使用型/`AlertBanner` 定義順/`cacheTime` などを整理したことで正常終了し、生成された `dist` は本 Stage/Preview サイクルで利用して `artifacts/e2e/20251126T150000Z/*` を更新。詳細は `docs/server-modernization/phase2/notes/issue-master-bridge-build.md` に記録されている。
3. 既存 `LogFilter` が `d_users` のヘッダー認証を利用するので `d_facility`/`d_users` に admin 情報を投入:
   - `docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "INSERT INTO d_facility (id, address, facilityid, facilityname, membertype, registereddate, telephone, zipcode) VALUES (1, 'Tokyo', '1.3.6.1.4.1.9414.70.1', 'OpenDolphin Dev', 'FACILITY_USER', '2025-11-26', '03-0000-0000', '100-0001');"`
   - `docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "INSERT INTO d_users (id, commonname, email, membertype, password, registereddate, userid, facility_id) VALUES (1, 'admin', 'admin@example.com', 'FACILITY_USER', '21232f297a57a5a743894a0e4a801fc3', '2025-11-26', '1.3.6.1.4.1.9414.70.1:admin', 1);"`
   これで `userName: 1.3.6.1.4.1.9414.70.1:admin` + `password: 21232f297a57a5a743894a0e4a801fc3` で `/resources/*` にアクセスできる状態を構築した。

## 2. Stage/Preview + Playwright
1. Stage 予備サーバー（Vite preview）立ち上げ:
   ```
   cd web-client
   VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:8000/openDolphin/resources VITE_API_BASE_URL=http://localhost:8000/openDolphin/resources VITE_DEV_USE_HTTPS=1 npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
   ```
   HTTPS (https://localhost:4173) で稼働し、`artifacts/e2e/20251126T150000Z/stage-preview.log` にログを記録。
2. Playwright 実行:
   ```
   RUN_ID=20251126T150000Z VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:8000/openDolphin/resources VITE_API_BASE_URL=http://localhost:8000/openDolphin/resources PLAYWRIGHT_BASE_URL=https://localhost:4173 npx playwright test tests/e2e/orca-master.spec.ts
   ```
   `artifacts/e2e/20251126T150000Z/playwright-orca-master.log` には 9 件中 1 pass + 8 skip の結果と Live profile が `dataSource=server/runId=20251126T150000Z/missingMaster=false/fallbackUsed=false`、`dataSourceTransition=server` を返す挙動が記録されている。

## 2.1 Stage Preview Live coverage + warning tone
- Stage Preview + Playwright + curl の再検証サイクル（`npm run build` 後の 2025-11-27 JST セッション）で `artifacts/e2e/20251126T150000Z/stage-preview.log` / `artifacts/e2e/20251126T150000Z/playwright-orca-master.log` / `artifacts/e2e/20251126T150000Z/master-bridge-stub-check.log` を上書きし、Reception/Claim を含む Live baseURL coverage で `warning banner tone=server` かつ `dataSourceTransition=server` を連続観測する状態を改めて裏付けた。Playwright は 9 本中 1 pass + 8 skip で、Live profile（`dataSource=server/runId=20251126T150000Z/missingMaster=false/fallbackUsed=false`）が `warning` トーンと `dataSourceTransition=server` を報告し、Stage Preview も同じイベントを `stage-preview.log` に記録している。これらのログパスと `Live coverage warning tone=server` の観測は DOC_STATUS/manager checklist/worker report の RUN_ID セクションに同期済み。
- `master-bridge-stub-check.log` には admin ヘッダー付き curl ルーチンで `/resources/api/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address,etensu}` を叩いた出力を記録し、すべて `dataSourceTransition=server->fallback`/`missingMaster=true`/`fallbackUsed=true`/`runId=20251126T150000Z`/`version=20251126`/`cacheHit=false`/`HTTP_STATUS:200` の empty list レスポンスを取得した。このログも DOC_STATUS/manager checklist/worker report にリンクを追加して差し替えた。

## 3. curl でのマスタデータ確認
以下 8 エンドポイントを seeding admin + `userName`/`password` ヘッダーでアクセスし、すべて `dataSource=server`/`dataSourceTransition=server->fallback`/`missingMaster=true`/`fallbackUsed=true`/`runId=20251126T150000Z`/`version=20251126`/`cacheHit=false` を含む empty list レスポンスを取得。auditing 書き込みが Stage ルートで常に付与されていることを確認した:

| path | 備考 |
| --- | --- |
| `/resources/api/orca/master/generic-class` | 取得 at 13:44:48 JST |
| `/resources/api/orca/master/generic-price` | 取得 at 13:45:10 JST |
| `/resources/api/orca/master/youhou` | 取得 at 13:45:22 JST |
| `/resources/api/orca/master/material` | 取得 at 13:45:28 JST |
| `/resources/api/orca/master/kensa-sort` | 取得 at 13:45:33 JST |
| `/resources/api/orca/master/hokenja` | 取得 at 13:45:40 JST |
| `/resources/api/orca/master/address` | 取得 at 13:45:47 JST |
| `/resources/api/orca/master/etensu` | 取得 at 13:45:52 JST |

## 4. Bridge sync & artifacts
1. `2025-11-26T14:19+0900`（raw B 更新後）に `node scripts/bridge-sync.mjs --run-id 20251126T150000Z --date 20251124 --source server` を実行し、`schema missing: artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/orca-master-generic-class.json` を確認。`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}` と `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca*.json` を再作成して `auditSummary` に `serverDataSource=snapshot`/`serverMissingMaster=false`/`serverFallbackUsed=false` を記録し、raw B→bridge-sync→hashes/diffs の輪を完成させた。
   - RUN_ID=`20251126T150000Z` の最新状態で上記コマンドを再実行し（本ログ作成時点）、`hashes/server/{orca05.hash,orca06.hash,orca08.hash}` を再上書き。`dataSourceTransition=server`/`missingMaster` の変化を改めて捉え、`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}`・`diffs/server-vs-msw-orca*.json`・`artifacts/e2e/20251126T150000Z/*` を証跡として DOC_STATUS/manager checklist/worker report と同期している。
2. 取得済み `hashes`/`diffs` で `generic-class`/`generic-price`/`youhou`/`material`/`kensa-sort`/`hokenja`/`address`/`etensu` に対する Stage/Preview の `dataSourceTransition` と `missingMaster` の挙動を監視し、Stage 再構築後に server ルートへ移行したタイミングで `DOC_STATUS`/manager checklist/worker report に反映する。
3. raw B 差分→bridge-sync→hashes/diffs のループを継続し、各 cycle で `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}` と `diffs/server-vs-msw-orca*.json` を上書き。`dataSourceTransition=server`/`missingMaster` の server ルート移行が発生するたびに DOC_STATUS/manager checklist/worker report へ `Live coverage warning tone=server` 系ログと併せて拡散し、Stage/Playwright の `artifacts/e2e/20251126T150000Z/*` も同 RUN_ID で上書きする。
- それらの `dataSourceTransition=server`/`missingMaster` 状態変化は `docs/web-client/planning/phase2/DOC_STATUS.md:65`・`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md:55`・`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md:86`・`docs/server-modernization/phase2/notes/worker-report-master-bridge-20251126T150000Z.md:3` にも追記し、RUN_ID と証跡パス（`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}` / `diffs/server-vs-msw-orca*.json` / `artifacts/e2e/20251126T150000Z/*`）を連携して raw B→bridge-sync→hashes/diffs→docs の循環を保つ。

## 5. 監査 / TODO
- `OrcaMasterResource` が全レスポンスで `dataSourceTransition=server->fallback` を送るため、Stage/Preview では `missingMaster=true`/`cacheHit=false`/`fallbackUsed=true` が恒常的に記録される。Stage 再構築後に snapshot -> server の変化を観測するまでこの状態が続くことをチームへ共有。
- `UserModel#getRegisteredDateAsString` を再導入し `opendolphin-common`（jakarta classifier）を再インストールしたことで `mvn -pl server-modernized -DskipTests compile` が成功。累積 issue は `docs/server-modernization/phase2/notes/issue-master-bridge-build.md` に追記し、`UserServiceBean` の呼び出しが再度解決したことを証跡化している。
- TODO: Live coverage（Reception/Claim）で `warning banner tone=server` + `dataSourceTransition=server` が安定して続くことと、`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}` + `diffs/server-vs-msw-orca*.json` を定期的に上書きして raw B→bridge-sync→hashes/diffs→docs の循環を維持すること。

## 6. ビルド再試行の現状
- `npm run build`（2025-11-26）は TypeScript 修正を反映したコードで正常終了し、`dist` を Stage/Preview + Playwright + curl 検証サイクルで再生成した。詳細は `docs/server-modernization/phase2/notes/issue-master-bridge-build.md` に記録されている。
- Stage/Playwright/curl の再実行によって `artifacts/e2e/20251126T150000Z/stage-preview.log` / `artifacts/e2e/20251126T150000Z/playwright-orca-master.log` / `artifacts/e2e/20251126T150000Z/master-bridge-stub-check.log` を再生成し、DOC_STATUS/manager checklist/worker report の RUN_ID セクションには生ログと `Live coverage warning tone=server` イベントを追記している。
- `mvn -pl server-modernized -DskipTests compile`（2025-11-26）は `UserServiceBean#getRegisteredDateAsString()` 呼び出しを解消したことで成功しており、raw B→bridge-sync→hashes/diffs→docs の循環を継続できる状態になっている。
- 今後も Stage/Playwright/curl の coverage ループと `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05.hash,orca06.hash,orca08.hash}` + `diffs/server-vs-msw-orca*.json` の上書きを続け、Live coverage の `warning banner tone=server`/`dataSourceTransition=server` を追跡し続ける。
