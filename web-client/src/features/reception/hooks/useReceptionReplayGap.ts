import { useMemo } from 'react';

import type { ReplayGapDetails } from '@/features/replay-gap/ReplayGapContext';
import { useReplayGapContext } from '@/features/replay-gap/ReplayGapContext';

interface ReplayGapToastBindings {
  visible: boolean;
  phaseLabel: string;
  message: string;
  runbookHref: string;
}

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

export interface ReceptionReplayGapBindings {
  banner: ReplayGapBannerBindings;
  toast: ReplayGapToastBindings;
  dimContent: boolean;
  showSkeletons: boolean;
  ariaBusy: boolean;
  gapDetails: ReplayGapDetails;
  manualResync: () => Promise<void>;
  manualResyncDisabled: boolean;
  clientUuid?: string | null;
  runbookHref: string;
  supportHref: string;
}

const resourceLabel = '受付一覧';

const formatToastMessage = (phase: string) => {
  if (phase === 'recovered') {
    return `${resourceLabel}を再同期しました。15 秒後に通知を閉じます。`;
  }
  return `${resourceLabel}の同期が切断されました。再取得を実行中です。`;
};

export const useReceptionReplayGap = (): ReceptionReplayGapBindings => {
  const {
    state,
    retry,
    dismiss,
    runbookHref,
    supportHref,
    isReloading,
    showSupportLink,
    gapDetails,
    clientUuid,
    manualResync,
  } = useReplayGapContext();

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

  const toast = useMemo<ReplayGapToastBindings>(
    () => ({
      visible: state.isToastVisible,
      phaseLabel: state.phase,
      message: formatToastMessage(state.phase),
      runbookHref,
    }),
    [runbookHref, state.isToastVisible, state.phase],
  );

  return {
    banner,
    toast,
    dimContent: state.phase === 'detected' || state.phase === 'reloading',
    showSkeletons: state.phase === 'reloading',
    ariaBusy: isReloading,
    runbookHref,
    gapDetails,
    manualResync,
    manualResyncDisabled: state.phase === 'reloading',
    clientUuid,
    supportHref,
  };
};
