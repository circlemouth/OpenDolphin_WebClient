# Webクライアント互換 API ブラッシュアップ検証（RUN_ID=20260110T212643Z）

## 目的
- 404 対象 5 ルートの実装を本番運用想定のレスポンス整合に引き上げ、ヘッダ/監査/運用情報を記録する。

## 環境
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- HTTP Base: `http://localhost:9280/openDolphin/resources`
- 認証ヘッダー: `userName: dolphindev` / `password: 1cc2f4c06fd32d0a6e2fa33f6e1c9164` / `X-Facility-Id: 1.3.6.1.4.1.9414.10.1`
- Observability: `X-Run-Id: 20260110T212643Z`, `X-Trace-Id: trace-20260110T212643Z`, `X-Request-Id: req-20260110T212643Z`

## 仕様・運用メモ
- ルーティングは `web.xml` の `resteasy.servlet.mapping.prefix=/resources` が基点。
  - 外部 URL では `/openDolphin/resources/...` に統一して疎通する。
- `/orca12/patientmodv2/outpatient` の facilityId は以下の優先順で解決。
  1. `request.getRemoteUser()` から `facilityId` を抽出
  2. `X-Facility-Id` ヘッダー
  3. 互換ヘッダー `facilityId`
- `/api/orca/queue` の `retry` は仕様未実装のため **受理のみ**。
  - `retryRequested=false|true` をレスポンスに含め、`retryReason` に理由を返す。

## 成功レスポンス（HTTP 200）
- `GET /api/admin/config`
  - Headers: `x-admin-delivery-verification`, `x-orca-queue-mode`, `etag`, `x-delivery-etag`, `x-environment`
  - Body: `deliveryId/deliveryVersion/deliveredAt/verified` を付与
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/admin-config.{headers,json}`
- `PUT /api/admin/config`
  - Headers: `x-admin-delivery-verification=enabled`, `x-orca-queue-mode=mock`, `etag`
  - Body: `deliveryVersion=20260110T212643Z`, `verified=true`, `source=mock`
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/admin-config.put.{headers,response.json}`
- `GET /api/admin/delivery`
  - Body: config と同一の delivery メタを返却
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/admin-delivery.{headers,json}`
- `GET /api/orca/queue`
  - Body: `runId/traceId/source/queue[]/retryRequested` を返却
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/orca-queue.{headers,json}`
- `GET /api/orca/queue?patientId=MOCK-001&retry=1`
  - Body: `retryRequested=true`, `retryApplied=false`, `retryReason=mock_noop`
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/orca-queue-retry.{headers,json}`
- `DELETE /api/orca/queue?patientId=MOCK-001`
  - Body: `retryRequested=false` を返却
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/orca-queue-delete.{headers,json}`
- `POST /orca/appointments/mock`
  - Body: `runId/traceId/requestId/dataSourceTransition/fetchedAt/auditEvent` を返却
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/appointment-mock.{headers,json}`
- `POST /orca12/patientmodv2/outpatient/mock`
  - Body: `runId/traceId/requestId/dataSourceTransition/operation/status/auditEvent` を返却
  - Headers: `x-run-id/x-trace-id/x-datasource-transition` を付与
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/patientmodv2-mock.{headers,json}`

## 失敗レスポンス（HTTP 400）
- `POST /orca/appointments/list`（appointmentDate 未指定）
  - Body: `error/code/status/path/traceId` を返却
  - Artifacts: `artifacts/web-client-compat/20260110T212643Z/appointment-error.{headers,json}`

## 備考
- `retry=1` は現時点で実処理を行わず、ログに「未適用」情報を出力する。
- `delete` 操作は Trial 制限のため `HTTP 403 + Api_Result=79` を返す（Web クライアントは失敗扱い）。
