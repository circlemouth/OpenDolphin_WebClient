import { getCurrentRunId } from '@/libs/runId';

export interface DataSourceTransition {
  from?: string;
  to?: string;
  reason?: string;
}

export interface TooltipFields {
  progress?: string;
  status?: string;
  runId?: string;
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  details?: string;
}

export interface DataSourceStatus {
  status: string;
  runId?: string;
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
}

const isTruthyFlag = (value?: string) => value === '1' || value?.toLowerCase() === 'true';

export const getDataSourceStatus = (): DataSourceStatus => {
  const mswDisabled = isTruthyFlag(import.meta.env.VITE_DISABLE_MSW);
  const proxyTarget = Boolean(import.meta.env.VITE_DEV_PROXY_TARGET);
  const runId = getCurrentRunId();

  if (mswDisabled) {
    return {
      status: 'server',
      runId,
      dataSourceTransition: { from: 'msw', to: 'server', reason: 'msw_disabled' },
    };
  }

  if (proxyTarget) {
    return {
      status: 'proxy',
      runId,
      dataSourceTransition: { from: 'msw', to: 'proxy', reason: 'dev_proxy' },
    };
  }

  return {
    status: 'msw',
    runId,
  };
};

export const formatDataSourceTransition = (transition?: DataSourceTransition): string | undefined => {
  if (!transition) {
    return undefined;
  }
  const from = transition.from ?? 'unknown';
  const to = transition.to ?? 'unknown';
  const reason = transition.reason ? ` (${transition.reason})` : '';
  return `${from}→${to}${reason}`;
};

export const describeTooltipFields = (fields?: TooltipFields): string | undefined => {
  if (!fields) {
    return undefined;
  }
  const parts: string[] = [];
  if (fields.progress) {
    parts.push(`progress=${fields.progress}`);
  }
  if (fields.status) {
    parts.push(`status=${fields.status}`);
  }
  if (fields.runId) {
    parts.push(`runId=${fields.runId}`);
  }
  if (fields.dataSourceTransition) {
    const transition = formatDataSourceTransition(fields.dataSourceTransition);
    if (transition) {
      parts.push(`dataSourceTransition=${transition}`);
    }
  }
  if (fields.cacheHit !== undefined) {
    parts.push(`cacheHit=${fields.cacheHit}`);
  }
  if (fields.missingMaster !== undefined) {
    parts.push(`missingMaster=${fields.missingMaster}`);
  }
  if (fields.fallbackUsed !== undefined) {
    parts.push(`fallbackUsed=${fields.fallbackUsed}`);
  }
  if (fields.details) {
    parts.push(fields.details);
  }
  return parts.length ? parts.join(' | ') : undefined;
};
