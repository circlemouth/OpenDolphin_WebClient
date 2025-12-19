# ORCA-05 薬剤/器材/検査分類マスタ実装ログ (RUN_ID=20251219T140028Z)

## 実施内容
- `/orca/master/generic-class` / `generic-price` / `youhou` / `material` / `kensa-sort` のレスポンス DTO を OpenAPI (`orca-master-orca05-06-08.yaml`) へ整合。
- 監査メタ `meta`（version/runId/snapshotVersion/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt）を各エントリへ付与。
- `generic-class` に `page`/`size`（1-based, size<=2000）を追加し、`totalCount` はフィルタ前件数を維持。
- `generic-price` の SRYCD 9桁バリデーションと 422 エラーレスポンス（`validationError=true`）を追加。
- 契約テスト（JUnit）で DTO/監査メタ/validation を検証。

## 変更ファイル
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterMeta.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaDrugMasterEntry.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterListResponse.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterErrorResponse.java`
- `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
- `docs/managerdocs/PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_05_master_generic系列実装.md`

## テスト
- 未実施（ローカル実行なし）。
- 追加した契約テスト: `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`

## 補足
- データソースは fixture/snapshot を優先し `dataSource=snapshot` で返却。
- ORCA 実接続やステージング検証は実施していない（証跡なし）。
