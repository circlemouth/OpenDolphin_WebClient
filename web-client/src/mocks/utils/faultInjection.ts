import { delay } from 'msw';

export type FaultSpec = {
  tokens: Set<string>;
  delayMs?: number;
};

export const parseFaultSpec = (request: Request): FaultSpec => {
  const raw = request.headers.get('x-msw-fault') ?? '';
  const tokens = new Set(
    raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );
  const delayRaw = request.headers.get('x-msw-delay-ms');
  const parsed = delayRaw ? Number(delayRaw) : undefined;
  const delayMs = typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 60_000) : undefined;
  return { tokens, delayMs };
};

export const applyFaultDelay = async (fault: FaultSpec) => {
  if (!fault.delayMs) return;
  await delay(fault.delayMs);
};

