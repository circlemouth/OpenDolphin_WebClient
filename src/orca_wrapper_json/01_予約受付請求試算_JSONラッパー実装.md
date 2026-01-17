# 01 予約・受付・請求試算（Webクライアント接続）

- RUN_ID: `20251217T234312Z`
- YAML ID: `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
- 状態: 完了

## 対象API
- `/orca/appointments/list`
- `/orca/appointments/list`
- `/orca/appointments/mock`

## 実装内容
- `web-client/src/features/reception/api.ts` で予約/来院の取得フローを実装。
- `web-client/src/features/outpatient/transformers.ts` で slots/reservations/visits を正規化。
- `web-client/src/features/reception/pages/ReceptionPage.tsx` / `web-client/src/features/charts/pages/ChartsPage.tsx` に反映。
- `web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS` で監査メタを透過。

## 受け入れ条件（達成済み）
- runId/traceId/requestId と cacheHit/missingMaster/fallbackUsed/dataSourceTransition が UI/Audit/Telemetry に反映。
- 予約一覧/患者別予約/来院中リストを同一データ構造で表示。
- MSW で normal/不整合/timeout を再現可能。

## 参照
- `docs/web-client/README.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/ux/reception-schedule-ui-policy.md`
