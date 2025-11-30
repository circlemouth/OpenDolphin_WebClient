import { useMemo } from 'react';

import {
  type ReplayGapDetails,
  useReplayGapContext,
} from '@/features/replay-gap/ReplayGapContext';

interface ReplayGapBannerBindings {
  visible: boolean;
  phase: string;
  resourceLabel: string;
  lastSyncedAt?: Date;
  attempts: number;
  lastErrorCode?: number;
  onRetry: () => Promise<void>;
  retryDisabled: boolean;
  onDismiss: () => void;
  showSupportLink: boolean;
  supportHref: string;
  runbookHref: string;
}

export interface ChartsReplayGapBindings {
  banner: ReplayGapBannerBindings;
  lockEditing: boolean;
  ariaBusy: boolean;
  gapDetails: ReplayGapDetails;
  manualResync: () => Promise<void>;
  manualResyncDisabled: boolean;
  clientUuid?: string | null;
  runbookHref: string;
  supportHref: string;
}

const resourceLabel = 'カルテ患者一覧';

export const useChartsReplayGap = (): ChartsReplayGapBindings => {
  const { state, retry, dismiss, runbookHref, supportHref, isReloading, showSupportLink } = useReplayGapContext();

  const banner = useMemo<ReplayGapBannerBindings>(
    () => ({
      visible: state.isBannerVisible,
      phase: state.phase,
      resourceLabel,
      lastSyncedAt: state.lastSuccessfulReloadAt ? new Date(state.lastSuccessfulReloadAt) : undefined,
      attempts: state.attempts,
      lastErrorCode: state.lastErrorCode,
      onRetry: retry,
      retryDisabled: state.phase === 'reloading',
      onDismiss: dismiss,
      showSupportLink,
      supportHref,
      runbookHref,
    }),
    [
      dismiss,
      retry,
      runbookHref,
      showSupportLink,
      state.attempts,
      state.isBannerVisible,
      state.lastErrorCode,
      state.lastSuccessfulReloadAt,
      state.phase,
      supportHref,
    ],
  );

  return {
    banner,
    lockEditing: state.phase === 'reloading' || state.phase === 'retry' || state.phase === 'escalated',
    ariaBusy: isReloading,
    gapDetails,
    manualResync,
    manualResyncDisabled: state.phase === 'reloading',
    clientUuid,
    runbookHref,
    supportHref,
  };
};
