import type { Location } from 'react-router-dom';

import { parseFacilityPath } from '../../routes/facilityRoutes';

export type LoginFromState = { from?: string | Location };

export const normalizeFromState = (state: unknown): LoginFromState | undefined => {
  if (!state) return undefined;
  if (typeof state === 'object' && state !== null && 'from' in state) {
    return state as LoginFromState;
  }
  return undefined;
};

export const resolveFromState = (state: unknown): string | Location | undefined =>
  normalizeFromState(state)?.from;

export const isLegacyFrom = (from?: string | Location) => {
  if (!from) return false;
  const pathname = typeof from === 'string' ? from.split('?')[0] ?? '' : from.pathname ?? '';
  if (!pathname || pathname === '/login') return false;
  return parseFacilityPath(pathname) === null;
};
