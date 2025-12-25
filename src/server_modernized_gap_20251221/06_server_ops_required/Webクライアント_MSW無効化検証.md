# Web クライアント MSW 無効化検証

## 目的
- MSW を無効化して Charts/受付/ORCA の実 API を通す。
- Web/Server の同期ポイント（TraceId/監査）を確認（証跡は最終段階で取得）。

## 検証タスクの禁止事項
- 検証タスクは証跡・ログのみ（コード変更禁止）。
- 対象外: server-modernized / client / server の編集。
- 変更対象は artifacts/ と本ファイルのみ。

## 実施結果（RUN_ID=20251225T231456Z / 2025-12-25）
- 実施日時: 2025-12-25 23:15Z-23:30Z
- 方式: 既存のローカル modernized コンテナ（`localhost:9080`）を使用し、Web クライアントは Vite dev server を手動起動。
- MSW 無効化: `VITE_DISABLE_MSW=1`（Service Worker 登録数=0）。
- Vite 起動: `VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources` / `VITE_DEV_USE_HTTPS=0` / `VITE_API_BASE_URL=/api` / port `5174`。
- ログイン: `doctor1`（facility `1.3.6.1.4.1.9414.72.103`）で成功。`dolphindev` は 401（`artifacts/.../logs/login-headers.txt`）。

### 実 API 疎通（MSW OFF）
- 受付（Reception）: `/api01rv2/claim/outpatient` が 200。
  - `dataSourceTransition=server` / `cacheHit=false` / `missingMaster=false` / `auditEvent.action=ORCA_CLAIM_OUTPATIENT` を確認。
  - TraceId: `5c6886b6-6cb5-438b-9308-88cfff7d25a5`。
- ORCA（Charts 経路相当）: `/orca21/medicalmodv2/outpatient` が 200。
  - `dataSourceTransition=server` / `cacheHit=false` / `missingMaster=false` / `auditEvent.action=ORCA_MEDICAL_GET` を確認。
  - `recordsReturned=0`（ローカルデータ無し）。
  - TraceId: `199b063b-a874-4b88-bff5-17ad7c5a6372`。
- 予約（appointment/outpatient）: `/api01rv2/appointment/outpatient/list` が 404（server 側未実装）。

### Web/Server 同期ポイント（TraceId/監査）
- TraceId はレスポンスヘッダ `X-Trace-Id` とボディ `traceId` が一致。
- `auditEvent` に `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned` が含まれることを確認。

### 証跡
- Vite ログ: `artifacts/webclient/msw-off/20251225T231456Z/logs/vite-dev.log`
- Playwright 結果: `artifacts/webclient/msw-off/20251225T231456Z/playwright-results.json`
- スクリーンショット: `artifacts/webclient/msw-off/20251225T231456Z/screenshots/01-reception.png`, `.../02-charts-patients.png`
- API 応答ログ:
  - ログイン 200: `artifacts/webclient/msw-off/20251225T231456Z/logs/login-response-doctor1.json`
  - Claim 200: `artifacts/webclient/msw-off/20251225T231456Z/logs/claim-response.json`
  - ORCA 200: `artifacts/webclient/msw-off/20251225T231456Z/logs/orca21-response.json`
  - Appointment 404: `artifacts/webclient/msw-off/20251225T231456Z/logs/appointment-headers.txt`

### 補足
- `dolphindev` では `/user/{facilityId:userId}` が 401 となるため、UI ログインは `doctor1` を使用した。
