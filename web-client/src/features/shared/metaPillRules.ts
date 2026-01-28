import type { StatusPillTone } from './StatusPill';

export const COMMON_META_PILL_ORDER = ['dataSourceTransition', 'missingMaster', 'fallbackUsed', 'cacheHit'] as const;

export const META_PILL_PRIORITY = {
  dataSourceTransition: 40,
  missingMaster: 30,
  fallbackUsed: 20,
  cacheHit: 10,
} as const;

export const resolveMetaFlagTone = (flag?: boolean): StatusPillTone => (flag ? 'warning' : 'success');

export const resolveCacheHitTone = (flag?: boolean): StatusPillTone => (flag ? 'success' : 'warning');

export const resolveTransitionTone = (): StatusPillTone => 'info';
