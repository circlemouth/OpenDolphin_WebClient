# 20251208T124645Z api-gap-implementation

## 参照チェーン / スコープ
- RUN_ID: 20251208T124645Z
- チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/outpatient_ux_modernization/04C4_outpatient_api_gap_implementation.md`
- 対象: `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` の modernized 実装／telemetry + audit 整合、Web クライアント契約モック更新、DOC_STATUS 反映。

## 実施内容
- `OutpatientFlagResponse` を共通 DTO として整理し、`runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned/auditEvent` を返却可能にした。
- `server-modernized`:
  - `OutpatientClaimResource` に RUN_ID=20251208T124645Z を設定し、`recordsReturned`/`telemetryFunnelStage=resolve_master` を含む audit details を追加。`SessionAuditDispatcher` で `ORCA_CLAIM_OUTPATIENT` を SUCCESS として送出し、`traceId`/`requestId`/`actorId` を付与。
  - `OrcaMedicalModV2Resource` に RUN_ID=20251208T124645Z を設定し、`recordsReturned`/`telemetryFunnelStage=charts_orchestration` を details に追加。`AbstractOrcaRestResource#recordAudit` で `traceId`/`requestId` を補完するよう強化。
- Web クライアント:
  - `OutpatientMockPage` の fallback RUN_ID を 20251208T124645Z に更新し、サーバー stub の telemetry flags をそのまま funnel へ流す。
- 契約モック: `artifacts/api-stability/20251208T124645Z/outpatient/` に claim/medical のレスポンスサンプルを配置（`recordsReturned` と `telemetryFunnelStage` を反映）。
- ドキュメント: `docs/web-client/architecture/web-client-api-mapping.md` / `docs/web-client/planning/phase2/DOC_STATUS.md` / `src/outpatient_ux_modernization/04C4_outpatient_api_gap_implementation.md` を本 RUN_ID で更新。

## テスト / 検証
- 単体: `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=OutpatientClaimResourceTest,OrcaMedicalModV2ResourceTest test`（PASS）。両エンドポイントが `traceId`/`requestId`/`recordsReturned` を含む audit 付きレスポンスを返すことを確認。
- テレメトリ確認: OutpatientMockPage で `resolve_master → charts_orchestration` の順に funnel ログが生成され、`dataSourceTransition=server` / `cacheHit` / `missingMaster` が reception→charts に carry over されることをコードベースで確認（MSW 無効時想定）。

## エビデンス
- 契約モック: `artifacts/api-stability/20251208T124645Z/outpatient/claim-outpatient-mock.json`, `.../medicalmodv2-outpatient.json`
- テストログ: `server-modernized/target/surefire-reports/*Outpatient*`（上記コマンド実行結果）
- 変更差分: `server-modernized/src/main/java/open/dolphin/rest/OutpatientClaimResource.java`, `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalModV2Resource.java`, `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java`, `web-client/src/features/outpatient/OutpatientMockPage.tsx`

## TODO / フォローアップ
- Stage/Preview で MSW OFF + dev proxy 経路の実レスポンスを観測し、`resolveMasterSource` の降格パス（missingMaster/cacheHit 変化）を確認する。
- `ORCA_API_STATUS.md` と manager checklist の外来セクションに本 RUN_ID 反映が必要かを確認。

## 2025-12-09 ドキュメント反映（Stage/Preview dev proxy timeout）
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` の外来行（`/api21/medicalmodv2`）へ RUN_ID=`20251208T124645Z` の Stage/Preview dev proxy 結果（TCP timeout, audit/runId 未取得, 証跡=`docs/server-modernization/phase2/operations/logs/20251208T124645Z-dev-proxy-validation.md`）を追記。
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の外来セクションに同内容とスクリーンショットパス（`artifacts/webclient/e2e/20251208T124645Z-stage/outpatient-stage.png`）を展開。
- `docs/web-client/planning/phase2/DOC_STATUS.md` に本 RUN_ID の反映行を追加し、ORCA_API_STATUS/チェックリスト更新済みであることを明記。
