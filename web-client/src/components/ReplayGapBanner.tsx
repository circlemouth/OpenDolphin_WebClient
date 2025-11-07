import styled from '@emotion/styled';

import { Button } from '@/components/Button';
import type { ReplayGapPhase } from '@/features/replay-gap/useReplayGapController';

type BannerPlacement = 'global' | 'inline';

export interface ReplayGapBannerProps {
  visible: boolean;
  phase: ReplayGapPhase | string;
  resourceLabel: string;
  lastSyncedAt?: Date;
  attempts: number;
  lastErrorCode?: number;
  onRetry: () => Promise<void>;
  retryDisabled?: boolean;
  onDismiss?: () => void;
  showSupportLink?: boolean;
  supportHref?: string;
  runbookHref?: string;
  placement?: BannerPlacement;
}

const BannerWrapper = styled.div<{ $placement: BannerPlacement }>`
  width: 100%;
  padding: ${({ $placement }) => ($placement === 'inline' ? '8px 0' : '0')};
`;

const BannerSurface = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: 100%;
  background: ${({ theme }) => theme.palette.warningMuted};
  border: 1px solid ${({ theme }) => theme.palette.warning};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px 20px;
  color: ${({ theme }) => theme.palette.textPrimary};
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const BannerContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  flex: 1 1 360px;
`;

const MessageLead = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const MessageBody = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`;

const SupportLink = styled.a`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.danger};
  font-weight: 600;
`;

const RunbookLink = styled.a`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
  text-decoration: underline;
`;

const Spinner = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.palette.warning};
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const formatTime = (value?: Date) => {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  } catch {
    return value.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
};

const describePhase = (
  phase: ReplayGapPhase | string,
  resourceLabel: string,
  lastSyncedAt?: Date,
  lastErrorCode?: number,
  attempts?: number,
) => {
  if (phase === 'recovered') {
    const timeLabel = formatTime(lastSyncedAt);
    return timeLabel ? `${resourceLabel}を再同期しました（${timeLabel} 更新）` : `${resourceLabel}を再同期しました。`;
  }
  if (phase === 'retry') {
    return `自動再取得に失敗しました（${attempts ?? 1} 回目 / HTTP ${lastErrorCode ?? '―'}）。「再取得を再試行」で手動実行してください。`;
  }
  if (phase === 'escalated') {
    return `3 回連続で再取得に失敗しています。Ops へ連絡し、SSE 履歴の状況を共有してください。`;
  }
  return `${resourceLabel}の SSE 履歴が欠落しました。自動で再取得を実行中です。`;
};

export const ReplayGapBanner = ({
  visible,
  phase,
  resourceLabel,
  lastSyncedAt,
  lastErrorCode,
  attempts,
  onRetry,
  retryDisabled,
  showSupportLink,
  supportHref,
  runbookHref,
  placement = 'global',
}: ReplayGapBannerProps) => {
  if (!visible) {
    return null;
  }

  const message = describePhase(phase, resourceLabel, lastSyncedAt, lastErrorCode, attempts);
  const showSpinner = phase === 'detected' || phase === 'reloading';

  return (
    <BannerWrapper $placement={placement} role="status" aria-live="polite">
      <BannerSurface>
        {showSpinner ? <Spinner aria-hidden="true" /> : null}
        <BannerContent>
          <MessageLead>{resourceLabel}の同期を監視しています</MessageLead>
          <MessageBody>{message}</MessageBody>
          {runbookHref ? (
            <RunbookLink href={runbookHref} target="_blank" rel="noreferrer">
              Runbook 手順を開く
            </RunbookLink>
          ) : null}
        </BannerContent>
        <Actions>
          <Button type="button" size="sm" onClick={onRetry} disabled={retryDisabled}>
            再取得を再試行
          </Button>
          {showSupportLink && supportHref ? (
            <SupportLink href={supportHref} target="_blank" rel="noreferrer">
              サポートへ連絡
            </SupportLink>
          ) : null}
        </Actions>
      </BannerSurface>
    </BannerWrapper>
  );
};
