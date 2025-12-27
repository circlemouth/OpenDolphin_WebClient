# 監査ログ / テレメトリ呼び出し棚卸し
RUN_ID=20251227T081740Z

## logUiState 呼び出し
- `web-client/src/features/administration/AdministrationPage.tsx` : config_delivery 保存
  - meta: runId / dataSourceTransition
  - 業務キー: なし（設定画面）
- `web-client/src/features/charts/AuthServiceControls.tsx` : トーン/フラグ操作
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: なし（設定操作）
- `web-client/src/features/charts/authService.tsx` : auth flags 変更
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: なし（トーン操作）
- `web-client/src/features/charts/PatientInfoEditDialog.tsx` : 患者編集 open
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: details 内 `patientId/appointmentId/receptionId/visitDate`
- `web-client/src/features/charts/ChartsActionBar.tsx` : action開始/blocked/print
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: details 内 `patientId/appointmentId/requestId`
- `web-client/src/features/charts/OrcaSummary.tsx` : 画面遷移/手動更新/表示
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: なし（summary操作）
- `web-client/src/features/charts/pages/ChartsPage.tsx` : ORCA queue / claim retry
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: `patientId/appointmentId/claimId` を明示
- `web-client/src/features/charts/api.ts` : medical summary fetch
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: 取得応答に依存（現状未付与）
- `web-client/src/features/charts/PatientsTab.tsx` : charts->patients deeplink
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: details 内 `patientId`
- `web-client/src/features/patients/api.ts` : patient fetch/save
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: details 内 `patientId/appointmentId`
- `web-client/src/features/patients/PatientsPage.tsx` : 患者選択/保存
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: details 内 `patientId`
- `web-client/src/features/reception/api.ts` : appointment/claim fetch
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: claim fetch で `patientId/appointmentId/claimId` を明示
- `web-client/src/features/reception/pages/ReceptionPage.tsx` : 検索/トーン/遷移
  - meta: runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed
  - 業務キー: navigate で `patientId/appointmentId` を明示
- `web-client/src/features/outpatient/OutpatientMockPage.tsx` : mock 操作
  - meta: runId / traceId / dataSourceTransition / cacheHit / missingMaster
  - 業務キー: なし（検証用画面）

## logAuditEvent 呼び出し
- `web-client/src/features/administration/AdministrationPage.tsx`
  - config 保存: payload に actor/role/flags、facilityId は actor から補完
  - queue 操作: `patientId` をトップレベルへ明示
- `web-client/src/features/reception/pages/ReceptionPage.tsx`
  - master source 変更/マスタ欠損メモなど: meta は observability 補完、必要なら payload/details に患者IDを追加
- `web-client/src/features/reception/api.ts`
  - claim fetch: details に `patientId/appointmentId/claimId` を注入
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - claim retry: `patientId/appointmentId` を明示
- `web-client/src/features/charts/api.ts`
  - medical summary fetch: details に `traceId/requestId` などを保持
- `web-client/src/features/charts/PatientInfoEditDialog.tsx`
  - 保存失敗: details に `patientId/appointmentId/receptionId` を保持
- `web-client/src/features/charts/audit.ts` (recordChartsAuditEvent)
  - details に `facilityId/patientId/appointmentId` を許可
- `web-client/src/features/patients/api.ts`
  - fetch/save: details に `patientId/appointmentId` を保持

## recordOutpatientFunnel 呼び出し
- `web-client/src/features/charts/ChartsActionBar.tsx`
  - action blocked/error で `reason` 明示（blockedReason/composedDetail）
- `web-client/src/features/charts/PatientInfoEditDialog.tsx`
  - open blocked: `reason` 明示 / save error: `reason` 明示
- `web-client/src/features/charts/api.ts`
  - medical fetch error: `reason=result.error` を明示
- `web-client/src/features/reception/api.ts`
  - appointment/claim fetch error: `reason=result.error|apiResultMessage` を明示
- `web-client/src/features/patients/api.ts`
  - fetch/save error: `reason=meta.error|result.message` を明示
- `web-client/src/features/charts/OrcaSummary.tsx`
  - manual_refresh error: `reason=error.message` を明示
- `web-client/src/features/charts/authService.tsx` / `charts/orchestration.ts` / `PatientsTab.tsx` / `OutpatientMockPage.tsx`
  - success/started のみ（reason 不要）

## 期待条件チェック結果
- meta(runId/traceId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed)
  - logUiState/logAuditEvent/recordOutpatientFunnel で observability 補完 + 未指定は false/補完
- 業務キー(facilityId/patientId/appointmentId/claimId)
  - 取得可能な画面（Reception/Charts action/claim retry/queue）は明示付与
  - facilityId は `resolveAuditActor()` で補完
- telemetry reason 必須
  - outcome=error/blocked の全箇所で reason 明示済み
