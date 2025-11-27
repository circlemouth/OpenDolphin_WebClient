import type { OrcaMasterAuditMeta, OrcaMasterSource } from '@/types/orca';

type OrcaMasterType = 'ORCA05' | 'ORCA06' | 'ORCA08' | string;

export interface OrcaSourceResolverResult extends OrcaMasterAuditMeta {
  dataSource: OrcaMasterSource;
  attemptOrder: OrcaMasterSource[];
}

const ORCA_MASTER_ENV_RUN_ID =
  import.meta.env.VITE_ORCA_MASTER_BRIDGE_RUN_ID ??
  import.meta.env.VITE_ORCA_MASTER_RUN_ID ??
  import.meta.env.VITE_RUN_ID ??
  '20251124T073245Z';
const ORCA_MASTER_ENV_SNAPSHOT_VERSION = import.meta.env.VITE_ORCA_MASTER_SNAPSHOT_VERSION;

export const ORCA_MASTER_RUN_ID = ORCA_MASTER_ENV_RUN_ID;
export const ORCA_MASTER_SNAPSHOT_VERSION = ORCA_MASTER_ENV_SNAPSHOT_VERSION;

const isTruthyFlag = (value?: string) => value === '1' || value?.toLowerCase() === 'true';

const normalizeSource = (value?: string | null): OrcaMasterSource | null => {
  if (!value) return null;
  const lowered = value.toLowerCase();
  if (lowered === 'msw' || lowered === 'mock') return 'mock';
  if (lowered === 'snapshot') return 'snapshot';
  if (lowered === 'server') return 'server';
  if (lowered === 'fallback') return 'fallback';
  return null;
};

const readSessionOverride = (): OrcaMasterSource | null => {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem('orcaMasterSource');
  return normalizeSource(raw);
};

const DEFAULT_ORCA_SOURCE: OrcaMasterSource = 'mock';
const FALLBACK_SOURCE: OrcaMasterSource = 'fallback';

const resolveRequestedSource = (hint?: OrcaMasterSource | null): OrcaMasterSource => {
  const sessionOverride = readSessionOverride();
  const envSource = normalizeSource(import.meta.env.WEB_ORCA_MASTER_SOURCE) ?? DEFAULT_ORCA_SOURCE;
  return hint ?? sessionOverride ?? envSource;
};

export const ORCA_MASTER_FETCH_TTL_MS = 1000 * 60 * 5;
export const ORCA_MASTER_SNAPSHOT_TTL_MS = 1000 * 60 * 60 * 24;
export const ORCA_MASTER_ADDRESS_SNAPSHOT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const getOrcaMasterBridgeBaseUrl = () =>
  import.meta.env.VITE_ORCA_MASTER_BRIDGE ?? import.meta.env.VITE_API_BASE_URL ?? '/api';

export const resolveOrcaMasterSource = (
  _masterType: OrcaMasterType,
  options?: { sourceHint?: OrcaMasterSource | null; previousSource?: OrcaMasterSource | null; runId?: string },
): OrcaSourceResolverResult => {
  const runId = options?.runId ?? ORCA_MASTER_ENV_RUN_ID;
  const mswEnabled = !isTruthyFlag(import.meta.env.VITE_DISABLE_MSW);
  const baseOrder: OrcaMasterSource[] = mswEnabled ? ['mock', 'snapshot', 'server'] : ['snapshot', 'server'];
  const requested = resolveRequestedSource(options?.sourceHint);
  const initialSource = baseOrder.includes(requested) ? requested : baseOrder[0];

  const fallbackOrder: OrcaMasterSource[] =
    initialSource === 'server' && mswEnabled
      ? ['snapshot', 'mock']
      : baseOrder.filter((src) => src !== initialSource);
  const attemptOrder: OrcaMasterSource[] = [initialSource, ...fallbackOrder, FALLBACK_SOURCE];
  const result: OrcaSourceResolverResult = {
    dataSource: initialSource,
    attemptOrder,
    dataSourceTransition: undefined,
    cacheHit: false,
    fallbackUsed: false,
    missingMaster: false,
    runId,
    snapshotVersion: ORCA_MASTER_ENV_SNAPSHOT_VERSION,
  };

  if (!mswEnabled && initialSource === 'mock') {
    result.dataSource = 'snapshot';
    result.attemptOrder = ['snapshot', ...baseOrder.filter((src) => src !== 'snapshot'), FALLBACK_SOURCE];
    result.fallbackUsed = true;
    result.dataSourceTransition = { from: 'mock', to: 'snapshot', reason: 'msw_disabled' };
  }

  if (options?.previousSource && options.previousSource !== result.dataSource) {
    result.dataSourceTransition = {
      from: options.previousSource,
      to: result.dataSource,
      reason: options.sourceHint ? 'hint_applied' : 'auto',
    };
  }

  return result;
};
