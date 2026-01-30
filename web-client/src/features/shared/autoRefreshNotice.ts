import { useEffect, useState } from 'react';

import type { BannerTone } from '../reception/components/ToneBanner';

export const OUTPATIENT_AUTO_REFRESH_INTERVAL_MS = 90_000;
const STALE_MULTIPLIER = 2;

export type AutoRefreshNotice = {
  tone: BannerTone;
  message: string;
  nextAction: string;
};

type AutoRefreshNoticeInput = {
  subject: string;
  dataUpdatedAt?: number;
  isFetching?: boolean;
  isError?: boolean;
  intervalMs?: number;
};

export const formatAutoRefreshTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);
  return date.toLocaleString('ja-JP', { hour12: false });
};

const formatTimestamp = formatAutoRefreshTimestamp;

export const resolveAutoRefreshIntervalMs = (intervalMs = OUTPATIENT_AUTO_REFRESH_INTERVAL_MS) => {
  if (typeof window === 'undefined') return intervalMs;
  const override = (window as any).__AUTO_REFRESH_INTERVAL_MS__;
  if (import.meta.env.DEV && typeof override === 'number' && Number.isFinite(override) && override > 0) {
    return override;
  }
  return intervalMs;
};

export function useAutoRefreshNotice({
  subject,
  dataUpdatedAt,
  isFetching,
  isError,
  intervalMs = OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
}: AutoRefreshNoticeInput): AutoRefreshNotice | null {
  const resolvedIntervalMs = resolveAutoRefreshIntervalMs(intervalMs);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Number.isFinite(resolvedIntervalMs) || resolvedIntervalMs <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), resolvedIntervalMs);
    return () => window.clearInterval(id);
  }, [resolvedIntervalMs]);

  if (!dataUpdatedAt || dataUpdatedAt <= 0) return null;
  if (isFetching || isError) return null;

  const staleThresholdMs = resolvedIntervalMs * STALE_MULTIPLIER;
  if (now - dataUpdatedAt < staleThresholdMs) return null;

  const lastUpdated = formatTimestamp(dataUpdatedAt);
  return {
    tone: 'warning',
    message: `${subject}の自動更新が止まっています。最終更新: ${lastUpdated}。再取得してください。`,
    nextAction: '再取得',
  };
}
