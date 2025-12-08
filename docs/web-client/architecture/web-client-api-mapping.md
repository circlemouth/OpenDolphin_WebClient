# Web クライアント API マッピング（RUN_ID=20251208T124645Z）

- Phase2 foundation の優先領域（`docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md`）を踏まえ、外来/ORCA マスタ連携の接点を `httpClient` 層で一覧化します。
- `web-client/src/libs/http/httpClient.ts` に新設した `OUTPATIENT_API_ENDPOINTS` 定義は本書のテーブルと同期させ、今後の `resolveMasterSource`/監査メタ・フロー設計で共通参照源として使います。
- RUN_ID=`20251208T124645Z` で `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` を server-modernized に stub 実装し、`runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` を含む telemetry 応答と `artifacts/api-stability/20251208T124645Z/outpatient/` のフィクスチャを揃えました（証跡: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md`）。

## 1. 外来オペレーションで使う主要エンドポイント

| 概要 | エンドポイント | メソッド | 役割 | 渡すべき監査メタ | 参照ログ |
| --- | --- | --- | --- | --- | --- |
| 請求バンドル取得 | `/api01rv2/claim/outpatient/*` | ANY | 受付・診療で処理済みオーダーを取得し、請求バナーと `missingMaster`/`fallbackUsed` 監査フラグを更新する。 | `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt/recordsReturned` | `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md` |
| 予約/請求試算/来院 | `/api01rv2/appointment/outpatient/*` | ANY | 予約一覧、患者別予約、請求試算、来院中リストなどを返却し、`ORCA_APPOINTMENT_OUTPATIENT` 相当の `details` を構成する。 | `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt` | 同上 |
| カルテの外来医療記録 | `/orca21/medicalmodv2/outpatient` | ANY | Charts の DocumentTimeline/Search が使う medicalrecord を取得し、`recordsReturned`/`outcome` に対応する `auditEvent` を発行する。 | `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/recordsReturned` | `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md` |
| 患者情報・保険登録 | `/orca12/patientmodv2/outpatient` | ANY | Patients/Administration で患者基本・保険情報を `create/update/delete` し、`action=ORCA_PATIENT_MUTATION` と `operation`/`facilityId` を監査ログに伝える。 | `runId/dataSource/cacheHit/missingMaster/fallbackUsed/operation` | 同上 |

## 2. `resolveMasterSource` と `dataSourceTransition=server` の実装前提

1. `resolveMasterSource(masterType)` は `WEB_ORCA_MASTER_SOURCE` / `VITE_DISABLE_MSW` / ランタイムでの `cmsHealth` などの reachability 判定を総合して `mock` → `snapshot` → `server` → `fallback` の順で `dataSource` を返す。
2. `server` に移行した際（`dataSourceTransition=server`）は `fetchWithResolver` により `runId/dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` を `auditEvent`/`audit.logUiState` に必ず書き出す。`cacheHit` は React Query の `isCached`/`isStale` で判定し、キャッシュ命中時は `true`、強制リフェッチ時は `false` を送信する。
3. フローの概念図：

```
[MSW fixtures] --(障害/FLAGS)--> [snapshot artifacts] --(WEB_ORCA_MASTER_SOURCE=server + 可用性確認)--> [server ORCA-05/06/08] --(schema mismatch / timeout)--> [fallback constants]
                           |                                    |                                                    |
                    `cacheHit=true`                     `dataSourceTransition=server`                               `fallbackUsed=true`
```

この図は `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md` の設計を参照し、`resolveMasterSource` が `server` を返すタイミングで Playwright/Stage が `warning banner tone=server` を再現できるよう誘導します。

## 3. `auditEvent` は `runId` を軸に metadata を透過

- `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` で定義されている共通 metadata（`runId`, `dataSource`, `snapshotVersion`, `cacheHit`, `missingMaster`, `fallbackUsed`, `dataSourceTransition`, `fetchedAt`）をすべて `details` に入れ、UI は `audit.logUiState` で `tone`/`aria-live` などと紐づける。`claim`/`appointment` では `facilityId`/`patientId`/`appointmentId`/`claimBundles` を追加。
- `medicalmodv2/outpatient`では `recordsReturned`/`outcome=SUCCESS` 明示と `traceId`/`requestId` の伝播、`patientmodv2/outpatient` では `operation=create|update|delete` を `details` に記録し `ORCA_PATIENT_MUTATION` の audit を完成させる。
- `httpClient` 側では上記エンドポイントの定義を `OUTPATIENT_API_ENDPOINTS` に集約し、追跡や Playwright の `extraHTTPHeaders` にも同じ `runId` を透過できるようにします。

## 4. バナーとの連携ポイント

- Reception/Charts の ORCA バナーは `missingMaster=true` を受け取った際に `tone=warning`/`aria-live=assertive` を発火し、`cacheHit=false` であれば `retry` ボタンを表示する。`resolveMasterSource` で `server` に移行したら `dataSourceTransition=server` を `AuditSummary` に反映し、ヘッダーの `data-run-id` を更新する。
- Patients/Administration では `ORCA_PATIENT_MUTATION` の `details.operation` を権限ガードと同期させ、`fallbackUsed=true` が設定された場合は `warning` トーストを表示し保存をブロックする。

## 参照資料
- `docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md`
- `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`
- `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md`
- `docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md`
