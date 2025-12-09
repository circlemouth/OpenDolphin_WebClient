# 外来 API デバッグ記録（RUN_ID=20251209T094600Z）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- 起点: 04C5 ローカル再検証（RUN_ID=`20251209T150000Z`, parent=`20251209T071955Z`）で得たギャップ/ログを整理し、Web クライアント実装中に遭遇した外来 API のバグ・差分・再現手順を集約する。
- 証跡: `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`（ローカル 200 / Stage・Preview TCP timeout）、`artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`（curl 応答・タイムアウトログ）。

## 1. 最新サマリ
- ローカル modernized サーバー（MSW OFF, dev proxy = localhost）:  
  - `/api01rv2/claim/outpatient/mock` **200**（runId=20251208T124645Z, dataSourceTransition=server, cacheHit=false, missingMaster=false, traceId=96e647c3-a8a2-4726-9829-d32edc06f883）。  
  - `/orca21/medicalmodv2/outpatient` **200**（runId=20251208T124645Z, dataSourceTransition=server, cacheHit=true, missingMaster=false, traceId=deb71516-4910-4a3d-8831-58e7617e55fb）。
- Stage/Preview dev proxy（100.102.17.40:8000/443/8443）: いずれも TCP timeout（curl exit 28, TLS ハンドシェイク未到達）。UI/HAR 未取得。Stage 復旧待ち。
- 残課題:  
  1) Stage/Preview の疎通再試行と UI tone/telemetry（resolveMasterSource/dataSourceTransition/cacheHit/missingMaster）の確認。  
  2) dev proxy 先での 401/404 再発監視（seed 認証 or `resteasy.resources` 逸脱）。  
  3) 異常系（missingMaster=true, cacheHit=false）を fixture/Playwright で再注入し、ToneBanner/ResolveMasterBadge/telemetry を再撮影。

## 2. 再現手順（ローカル modernized サーバー）
1. `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources ./setup-modernized-env.sh` を実行（既存プロセス流用可、再起動不要）。  
2. 以下を curl で POST。ヘッダ: `userName=1.3.6.1.4.1.9414.10.1:dolphindev`, `password=MD5(dolphindev)=1cc2f4c06fd32d0a6e2fa33f6e1c9164`, `clientUUID=devclient`, `X-Facility-Id=1.3.6.1.4.1.9414.10.1`。  
   - `.../api01rv2/claim/outpatient/mock`（期待: 200, cacheHit=false, missingMaster=false, dataSourceTransition=server, runId=20251208T124645Z）。  
   - `.../orca21/medicalmodv2/outpatient`（期待: 200, cacheHit=true, missingMaster=false, dataSourceTransition=server, runId=20251208T124645Z）。  
3. Network/HAR を保存する場合は `artifacts/webclient/debug/20251209T094600Z-bugs/` 配下へ配置し、Trace-Id と runId をログに残す。  
4. UI 確認: Reception→Charts→Patients の遷移で ToneBanner/ResolveMasterBadge に `tone=server` と `dataSourceTransition=server` が表示され、`telemetryClient.funnels/outpatient` が resolve_master→charts_orchestration で 2 段記録されることを確認。

## 3. 観測ポイント（observability）
- 必須フィールド: `traceId`, `runId`, `dataSourceTransition`, `cacheHit`, `missingMaster`, `recordsReturned`, `fetchedAt`, `auditEvent.details.telemetryFunnelStage`。  
- ログ保存先: `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`（既存）または `artifacts/webclient/debug/20251209T094600Z-bugs/`（本 RUN_ID 用）。  
- Telemetry: `recordOutpatientFunnel('resolve_master'| 'charts_orchestration', flags)` が両 API のレスポンス値を反映すること。  
- 監査: `SessionAuditDispatcher` が `ORCA_CLAIM_OUTPATIENT` を SUCCESS で送出しているか（server-modernized ログ）。

## 4. 未解決バグ・フォローアップ
- Stage/Preview dev proxy が TCP timeout（100.102.17.40:8000/443/8443）。DNS/ACL/証明書復旧後に同 RUN_ID で再試行。  
- 実 API 実行時の 401/404 再発リスクあり（`web.xml` の `resteasy.resources` 未列挙、seed 認証不整合）。レスポンスが 401/404 に戻った場合は `docs/server-modernization/phase2/operations/logs/20251209T094600Z-debug.md` へ追記。  
- 異常系（missingMaster=true）を MSW/fixture で再注入し、ToneBanner/ResolveMasterBadge/telemetry が期待値どおり変化するかを Playwright で記録する必要あり（担当タスク 06 以降へ引き継ぎ）。

## 5. 証跡リンク
- 04C5 ローカル検証ログ: `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`
- ローカル/Stage curl & 応答: `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`
- 本 RUN_ID の証跡ログ: `docs/server-modernization/phase2/operations/logs/20251209T094600Z-debug.md`
- 追加ログ置き場: `artifacts/webclient/debug/20251209T094600Z-bugs/`
