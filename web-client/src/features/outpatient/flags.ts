import type { DataSourceTransition } from '../../libs/observability/types';

export type OutpatientFlagSource = {
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  fallbackFlagMissing?: boolean;
  dataSourceTransition?: DataSourceTransition;
};

const pickFirst = <T>(values: Array<T | undefined>): T | undefined => values.find((value) => value !== undefined);

export const resolveOutpatientFlags = (...sources: Array<OutpatientFlagSource | undefined>) => {
  const runId = pickFirst(sources.map((s) => s?.runId));
  const cacheHit = pickFirst(sources.map((s) => s?.cacheHit));
  const missingMaster = pickFirst(sources.map((s) => s?.missingMaster));
  const fallbackUsed = pickFirst(sources.map((s) => s?.fallbackUsed));
  const dataSourceTransition = pickFirst(sources.map((s) => s?.dataSourceTransition));
  const fallbackFlagMissing = pickFirst(sources.map((s) => s?.fallbackFlagMissing));
  return {
    runId,
    cacheHit,
    missingMaster,
    fallbackUsed,
    fallbackFlagMissing,
    dataSourceTransition,
  };
};
