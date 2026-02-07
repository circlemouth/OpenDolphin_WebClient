export const MSW_QUERY_PARAM = 'msw';
export const MOCK_RUNTIME_EVENT = 'opendolphin:mock-runtime:update';

export type MockGateDecision = {
  allowed: boolean;
  reasons: string[];
  isDevBuild: boolean;
  urlEnabled: boolean;
  envEnabled: boolean;
  envDisabled: boolean;
};

export type MockRuntimeState = {
  version: 1;
  decision: MockGateDecision;
  mswStarted: boolean;
  mswStartError?: string;
};

declare global {
  interface Window {
    __OD_MOCK_RUNTIME__?: MockRuntimeState;
  }
}

const safeParseUrlParam = (href: string, key: string) => {
  try {
    const url = new URL(href);
    return url.searchParams.get(key);
  } catch {
    return null;
  }
};

export const resolveMockGateDecision = (href?: string): MockGateDecision => {
  const isDevBuild = import.meta.env.DEV;
  const envDisabled = import.meta.env.VITE_DISABLE_MSW === '1';
  const envEnabled = import.meta.env.VITE_ENABLE_MSW === '1';
  const urlEnabled =
    typeof window !== 'undefined' &&
    safeParseUrlParam(href ?? window.location.href, MSW_QUERY_PARAM) === '1';

  const reasons: string[] = [];
  if (!isDevBuild) reasons.push('not DEV build (import.meta.env.DEV=false)');
  if (envDisabled) reasons.push('VITE_DISABLE_MSW=1');
  if (!envEnabled) reasons.push('VITE_ENABLE_MSW!=1');
  if (!urlEnabled) reasons.push(`missing ?${MSW_QUERY_PARAM}=1`);

  return {
    allowed: isDevBuild && !envDisabled && envEnabled && urlEnabled,
    reasons,
    isDevBuild,
    urlEnabled,
    envEnabled,
    envDisabled,
  };
};

export const writeMockRuntimeState = (next: MockRuntimeState) => {
  if (typeof window === 'undefined') return;
  window.__OD_MOCK_RUNTIME__ = next;
  window.dispatchEvent(new Event(MOCK_RUNTIME_EVENT));
};

export const patchMockRuntimeState = (partial: Partial<MockRuntimeState>) => {
  if (typeof window === 'undefined') return;
  const current = window.__OD_MOCK_RUNTIME__;
  if (!current) return;
  window.__OD_MOCK_RUNTIME__ = { ...current, ...partial };
  window.dispatchEvent(new Event(MOCK_RUNTIME_EVENT));
};

export const readMockRuntimeState = (): MockRuntimeState | null => {
  if (typeof window === 'undefined') return null;
  return window.__OD_MOCK_RUNTIME__ ?? null;
};
