import { getObservabilityMeta, updateObservabilityMeta } from '../observability/observability';
import type { DataSourceTransition } from '../observability/types';

export type UiAction = 'tone_change' | 'send' | 'save' | 'config_delivery';

export type UiStateLog = {
  action: UiAction;
  screen?: string;
  controlId?: string;
  tone?: string;
  runId?: string;
  traceId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
};

const uiStateLog: UiStateLog[] = [];

export function logUiState(entry: Omit<UiStateLog, 'timestamp'>) {
  const meta = getObservabilityMeta();
  const record: UiStateLog = {
    ...meta,
    ...entry,
    timestamp: new Date().toISOString(),
  };
  uiStateLog.push(record);
  // 監査の目視突き合わせ用にブラウザコンソールと window へ露出する。
  if (typeof console !== 'undefined') {
    console.info('[audit] UI state', record);
  }
  if (typeof window !== 'undefined') {
    (window as any).__AUDIT_UI_STATE__ = [...uiStateLog];
  }
  // tone 変更や runId 更新の副作用が meta に伝播するよう同期する。
  updateObservabilityMeta({
    runId: record.runId,
    traceId: record.traceId,
    cacheHit: record.cacheHit,
    missingMaster: record.missingMaster,
    dataSourceTransition: record.dataSourceTransition,
    fallbackUsed: record.fallbackUsed,
  });
  return record;
}

export function getUiStateLog() {
  return [...uiStateLog];
}

export function clearUiStateLog() {
  uiStateLog.length = 0;
}
