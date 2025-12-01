import { applyHeaderFlagsToInit } from './header-flags';

export function httpFetch(input: RequestInfo | URL, init?: RequestInit) {
  // Header flags are applied here to propagate Playwright extraHTTPHeaders.
  // 新しいフラグを追加する場合は header-flags.ts に追記し、この呼び出しで一括適用される前提。
  const initWithFlags = applyHeaderFlagsToInit(init);
  return fetch(input, initWithFlags);
}
