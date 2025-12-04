import { applyHeaderFlagsToInit } from './header-flags';

export type HttpEndpointDefinition = {
  id: string;
  group?: 'outpatient';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'ANY';
  path: string;
  purpose: string;
  auditMetadata: readonly string[];
  sourceDocs: readonly string[];
};

export const OUTPATIENT_API_ENDPOINTS: readonly HttpEndpointDefinition[] = [
  {
    id: 'claimOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/api01rv2/claim/outpatient/*',
    purpose: '外来請求バンドル（`claim:information`/`claim:bundle`）を受付・診療向けに取得し、請求バナーと `missingMaster`/`fallbackUsed` を制御する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt'],
    sourceDocs: [
      'docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md',
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
    ],
  },
  {
    id: 'appointmentOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/api01rv2/appointment/outpatient/*',
    purpose: '予約一覧・患者／請求試算・来院状況を取得して ORCA バナーの `runId`/`dataSource` を連携する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt'],
    sourceDocs: [
      'docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md',
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
    ],
  },
  {
    id: 'medicalOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca21/medicalmodv2/outpatient',
    purpose: 'Charts/DocumentTimeline が表示する外来の Medical record を取得し、`auditEvent` に `recordsReturned`/`outcome` を記録する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'recordsReturned'],
    sourceDocs: [
      'docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md',
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
    ],
  },
  {
    id: 'patientOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca12/patientmodv2/outpatient',
    purpose: 'Patients/Administration で患者基本・保険情報を更新し、新規追加・削除・保険変更の `action=ORCA_PATIENT_MUTATION` を生成する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'operation'],
    sourceDocs: [
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
    ],
  },
  {
    id: 'patientOutpatientInfo',
    group: 'outpatient',
    method: 'ANY',
    path: '/api01rv2/patient/outpatient/*',
    purpose: 'Reception/Patients 用に患者基本・保険・来院履歴を取得し、`missingMaster`/`cacheHit` を含めた `audit` を生成する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt'],
    sourceDocs: [
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
    ],
  },
];

// `resolveMasterSource` が `dataSourceTransition=server` を返す経路ではこの `outpatient` グループを使い、`cacheHit`/`missingMaster` を `telemetryClient` に継承します。

export function httpFetch(input: RequestInfo | URL, init?: RequestInit) {
  // Header flags are applied here to propagate Playwright extraHTTPHeaders.
  // 新しいフラグを追加する場合は header-flags.ts に追記し、この呼び出しで一括適用される前提。
  const initWithFlags = applyHeaderFlagsToInit(init);
  return fetch(input, initWithFlags);
}
