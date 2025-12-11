// RUN_ID=20251202T090000Z
// Playwright の extraHTTPHeaders から渡されるフラグを、フロント側で API リクエストに伝播させるためのユーティリティ。
// httpClient.ts の共通 fetch ラッパーで applyHeaderFlagsToInit を呼び出し、全リクエスト共通ヘッダーとして適用する。

export type HeaderFlags = {
  useMockOrcaQueue: boolean;
  verifyAdminDelivery: boolean;
};

export function readHeaderFlagsFromEnv(): HeaderFlags {
  return {
    useMockOrcaQueue: import.meta.env.VITE_USE_MOCK_ORCA_QUEUE === '1',
    verifyAdminDelivery: import.meta.env.VITE_VERIFY_ADMIN_DELIVERY === '1',
  };
}

export function buildHeaderOverrides(flags: HeaderFlags) {
  return {
    'x-use-mock-orca-queue': flags.useMockOrcaQueue ? '1' : '0',
    'x-verify-admin-delivery': flags.verifyAdminDelivery ? '1' : '0',
  };
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  return { ...headers };
}

export function resolveHeaderFlags(): HeaderFlags {
  // 優先度: env > localStorage > デフォルト false
  const envFlags = readHeaderFlagsFromEnv();
  const storedMock = localStorage.getItem('useMockOrcaQueue');
  const storedVerify = localStorage.getItem('verifyAdminDelivery');

  return {
    useMockOrcaQueue:
      envFlags.useMockOrcaQueue ||
      (storedMock === '1' ? true : storedMock === '0' ? false : false),
    verifyAdminDelivery:
      envFlags.verifyAdminDelivery ||
      (storedVerify === '1' ? true : storedVerify === '0' ? false : false),
  };
}

export function persistHeaderFlags(partial: Partial<HeaderFlags>) {
  if (typeof localStorage === 'undefined') return;
  if (partial.useMockOrcaQueue !== undefined) {
    localStorage.setItem('useMockOrcaQueue', partial.useMockOrcaQueue ? '1' : '0');
  }
  if (partial.verifyAdminDelivery !== undefined) {
    localStorage.setItem('verifyAdminDelivery', partial.verifyAdminDelivery ? '1' : '0');
  }
}

export function applyHeaderFlagsToInit(init?: RequestInit): RequestInit {
  const flags = resolveHeaderFlags();
  const overrides = buildHeaderOverrides(flags);
  // init 側で明示的に指定されたヘッダーは優先し、フラグは不足分を埋めるだけにする。
  const mergedHeaders = {
    ...overrides,
    ...normalizeHeaders(init?.headers),
  } as Record<string, string>;
  return { ...(init ?? {}), headers: mergedHeaders };
}
