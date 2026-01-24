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

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);
  return date.toLocaleString('ja-JP', { hour12: false });
};

export function useAutoRefreshNotice({
  subject,
  dataUpdatedAt,
  isFetching,
  isError,
  intervalMs = OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
}: AutoRefreshNoticeInput): AutoRefreshNotice | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  if (!dataUpdatedAt || dataUpdatedAt <= 0) return null;
  if (isFetching || isError) return null;

  const staleThresholdMs = intervalMs * STALE_MULTIPLIER;
  if (now - dataUpdatedAt < staleThresholdMs) return null;

  const lastUpdated = formatTimestamp(dataUpdatedAt);
  return {
    tone: 'warning',
    message: `${subject}の自動更新が遅れています（最終更新: ${lastUpdated}）。`,
    nextAction: '再取得',
  };
}
