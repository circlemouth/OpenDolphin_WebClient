import { applyHeaderFlagsToInit } from './header-flags';
import { applyObservabilityHeaders, captureObservabilityFromResponse } from '../observability/observability';
import { notifySessionExpired } from '../session/sessionExpiry';
import { readStoredSession } from '../session/storedSession';

export const isLegacyHeaderAuthEnabled = () => import.meta.env.VITE_ENABLE_LEGACY_HEADER_AUTH === '1';
export const isFacilityHeaderEnabled = () => import.meta.env.VITE_ENABLE_FACILITY_HEADER === '1';

type StoredAuth = {
  facilityId: string;
  userId: string;
  passwordMd5?: string;
  clientUuid?: string;
};

function readStoredAuth(): StoredAuth | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const facilityId = localStorage.getItem('devFacilityId');
  const userId = localStorage.getItem('devUserId');
  const passwordMd5 = localStorage.getItem('devPasswordMd5') ?? undefined;
  const clientUuid = localStorage.getItem('devClientUuid') ?? undefined;
  if (!facilityId || !userId) {
    return null;
  }
  return { facilityId, userId, passwordMd5, clientUuid };
}

export function hasStoredAuth(): boolean {
  return readStoredAuth() !== null;
}

function applyAuthHeaders(init?: RequestInit): RequestInit {
  const stored = readStoredAuth();
  if (!stored) {
    return init ?? {};
  }

  const headers = new Headers(init?.headers ?? {});

  if (isLegacyHeaderAuthEnabled()) {
    // 標準認証移行後はヘッダー認証を送らない。開発検証でのみ env で明示的に有効化する。
    if (!headers.has('userName')) {
      headers.set('userName', `${stored.facilityId}:${stored.userId}`);
    }
    if (!headers.has('password') && stored.passwordMd5) {
      headers.set('password', stored.passwordMd5);
    }
    if (!headers.has('clientUUID') && stored.clientUuid) {
      headers.set('clientUUID', stored.clientUuid);
    }
  } else if (stored.passwordMd5 && !headers.has('Authorization')) {
    // Basic 認証は userId + MD5 パスワードで送信（サーバ側で plain/MD5 両対応）。
    const token = btoa(unescape(encodeURIComponent(`${stored.userId}:${stored.passwordMd5}`)));
    headers.set('Authorization', `Basic ${token}`);
  }

  if (isFacilityHeaderEnabled() && !headers.has('X-Facility-Id')) {
    headers.set('X-Facility-Id', stored.facilityId);
  }

  return { ...(init ?? {}), headers };
}

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
    path: '/orca/claim/outpatient/*',
    purpose: '外来請求バンドル（`claim:information`/`claim:bundle`）を受付・診療向けに取得し、請求バナーと `missingMaster`/`fallbackUsed` を制御する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt'],
    sourceDocs: ['docs/server-modernization/api-architecture-consolidation-plan.md'],
  },
  {
    id: 'appointmentOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca/appointments/*',
    purpose: '予約一覧・患者／請求試算・来院状況を取得して ORCA バナーの `runId`/`dataSource` を連携する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt'],
    sourceDocs: ['docs/server-modernization/api-architecture-consolidation-plan.md'],
  },
  {
    id: 'medicalOutpatient',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca21/medicalmodv2/outpatient',
    purpose: 'Charts/DocumentTimeline が表示する外来の Medical record を取得し、`auditEvent` に `recordsReturned`/`outcome` を記録する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'recordsReturned'],
    sourceDocs: [
      'docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md',
      'docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md',
      'docs/web-client/architecture/web-client-api-mapping.md',
      'docs/server-modernization/phase2/operations/logs/20251205T090000Z-integration-implementation.md',
      'docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md',
    ],
  },
  {
    id: 'diseaseMutation',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca/disease',
    purpose: 'Charts の病名編集で傷病名を登録・更新・削除し、主/疑い/開始/転帰を監査ログへ連携する。',
    auditMetadata: ['runId', 'operation', 'patientId'],
    sourceDocs: ['docs/web-client/ux/charts-claim-ui-policy.md'],
  },
  {
    id: 'orderBundleMutation',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca/order/bundles',
    purpose: 'Charts の処方（RP）/オーダー束編集でバンドルを登録・更新・削除し、監査イベントへ反映する。',
    auditMetadata: ['runId', 'operation', 'patientId', 'entity'],
    sourceDocs: ['docs/web-client/ux/charts-claim-ui-policy.md'],
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
      'docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md',
    ],
  },
  {
    id: 'patientOutpatientInfo',
    group: 'outpatient',
    method: 'ANY',
    path: '/orca/patients/local-search/*',
    purpose: 'Reception/Patients 用にローカル患者検索を実行し、`missingMaster`/`cacheHit` を含めた `audit` を生成する。',
    auditMetadata: ['runId', 'dataSource', 'cacheHit', 'missingMaster', 'fallbackUsed', 'dataSourceTransition', 'fetchedAt', 'recordsReturned'],
    sourceDocs: ['docs/server-modernization/api-architecture-consolidation-plan.md'],
  },
];

// `resolveMasterSource` が `dataSourceTransition=server` を返す経路ではこの `outpatient` グループを使い、`cacheHit`/`missingMaster` を `telemetryClient` に継承します。
// RUN_ID=20251205T150000Z の統合実装ではこのパス一覧を経由し、`docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` へ telemetry funnel を記録しています。

export type HttpFetchInit = RequestInit & {
  /**
   * 403（権限不足）をセッション失効扱いとして通知する場合に明示的に有効化する。
   * デフォルトでは 403 では失効通知を行わず、UI 側のエラーバナー/トーストで吸収する。
   */
  notifyForbiddenAsSessionExpiry?: boolean;
};

export const shouldNotifySessionExpired = (status: number, init?: HttpFetchInit) => {
  if (status === 403 && !init?.notifyForbiddenAsSessionExpiry) return false;
  if (status !== 401 && status !== 403 && status !== 419 && status !== 440) return false;
  const session = readStoredSession();
  return Boolean(session);
};

export async function httpFetch(input: RequestInfo | URL, init?: HttpFetchInit) {
  // Header flags are applied here to propagate Playwright extraHTTPHeaders.
  // 新しいフラグを追加する場合は header-flags.ts に追記し、この呼び出しで一括適用される前提。
  const initWithFlags = applyHeaderFlagsToInit(applyAuthHeaders(init));
  const initWithObservability = applyObservabilityHeaders(initWithFlags);
  // 認証クッキー（JSESSIONID 等）を常に送るため、デフォルトで include を付与する。
  const credentials = initWithObservability.credentials ?? 'include';
  const response = await fetch(input, { ...initWithObservability, credentials });
  captureObservabilityFromResponse(response);
  if (shouldNotifySessionExpired(response.status, init)) {
    const reason =
      response.status === 403
        ? 'forbidden'
        : response.status === 419 || response.status === 440
          ? 'timeout'
          : 'unauthorized';
    notifySessionExpired(reason, response.status);
  }
  return response;
}
