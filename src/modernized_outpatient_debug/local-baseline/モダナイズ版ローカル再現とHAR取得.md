# モダナイズ版ローカル再現と HAR 取得

- RUN_ID: 20251209T192814Z（外来デバッグ系タスク共通）
- YAML ID: `src/modernized_outpatient_debug/local-baseline/モダナイズ版ローカル再現とHAR取得.md`
- 実施日時: 2025-12-09T11:26Z（UTC）
- 環境: `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources ./setup-modernized-env.sh`
  - 既存コンテナの競合 (`opendolphin-minio` など) があったため一度 `docker rm -f` でクリーンアップ後に再起動。
  - `userName=dolphindev` / `password=MD5(dolphindev)` / `X-Facility-Id=1.3.6.1.4.1.9414.10.1` を使用。

## 実施内容 / 結果
1. curl POST（ローカル modernized, MSW OFF, dev proxy 経由）
   - `/orca/claim/outpatient/mock` → HTTP 200, traceId=58a30e9f-6ce1-40a7-be5d-a8931bcb2073, runId=20251208T124645Z, cacheHit=false, missingMaster=false, dataSourceTransition=server。
   - `/orca21/medicalmodv2/outpatient` → HTTP 200, traceId=95a18c24-2adf-4177-bbe2-bde9323989b5, runId=20251208T124645Z, cacheHit=true, missingMaster=false, dataSourceTransition=server。
   - 参考: `userName` を `1.3.6.1.4.1.9414.10.1:dolphindev` にした場合は 401（REST_UNAUTHORIZED_GUARD）。

2. HAR / Network ログ取得
   - Playwright (headless) の `recordHar` で `/orca/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` を POST。`artifacts/webclient/debug/20251209T150000Z-bugs/outpatient.har` に保存。

3. SessionAuditDispatcher 確認
   - `docker logs opendolphin-server-modernized-dev` に `ORCA_CLAIM_OUTPATIENT` / `ORCA_MEDICAL_GET` とも `outcome=SUCCESS` で記録（traceId: 58a30e9f-... / 95a18c24-... および HAR 取得時の d6745099-... / 72e8f12f-...）。

## 証跡ファイル
- `artifacts/webclient/debug/20251209T150000Z-bugs/claim-response.json`
- `artifacts/webclient/debug/20251209T150000Z-bugs/medical-response.json`
- `artifacts/webclient/debug/20251209T150000Z-bugs/outpatient.har`
- `artifacts/webclient/debug/20251209T150000Z-bugs/claim-response.headers` / `medical-response.headers`
- `artifacts/webclient/debug/20251209T150000Z-bugs/claim-response.stderr` / `medical-response.stderr`

## メモ
- dev server ログ: `tmp/web-client-dev.log`（必要に応じて tail で確認）。
- DOC_STATUS 未更新。RUN_ID 行へ追記する場合は本メモと同じ RUN_ID を利用すること。
