import styled from '@emotion/styled';
import type { MouseEvent } from 'react';

import { Button, Stack, StatusBadge, SurfaceCard } from '@/components';
import type { ReplayGapDetails } from '@/features/replay-gap/ReplayGapContext';

const Card = styled(SurfaceCard)`
  border-left: 4px solid ${({ theme }) => theme.palette.primary};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
  font-size: 0.85rem;
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.palette.text};
  font-weight: 600;
  word-break: break-word;
`;

const Snippet = styled.code`
  display: block;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  font-size: 0.8rem;
  font-family: ${({ theme }) => theme.typography.fontFamily.code};
  overflow-x: auto;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const LinkStack = styled(Stack)`
  align-items: flex-start;
  gap: 6px;
`;

const LinkAnchor = styled.a`
  color: ${({ theme }) => theme.palette.primary};
  font-size: 0.82rem;
  text-decoration: underline;
`;

const HintText = styled.p`
  margin: 0;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

export interface ChartSyncStatusProps {
  gapDetails: ReplayGapDetails;
  manualResync: () => Promise<void>;
  manualResyncDisabled: boolean;
  clientUuid?: string | null;
  runbookHref: string;
  supportHref: string;
}

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return '未検出';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('ja-JP', { hour12: false });
};

export const ChartSyncStatus = ({
  gapDetails,
  manualResync,
  manualResyncDisabled,
  clientUuid,
  runbookHref,
  supportHref,
}: ChartSyncStatusProps) => {
  const gapSize = gapDetails.gapSize ?? 0;
  const tone = gapSize >= 85 ? 'danger' : gapSize >= 60 ? 'warning' : 'info';
  const sequenceParam = gapDetails.sequence ?? '—';
  const eventId = gapDetails.lastEventId ?? '—';
  const detectedAtLabel = formatTimestamp(gapDetails.detectedAt);
  const requestSnippet = `GET /charts/patientList?clientUUID=${clientUuid ?? '—'}&sequence=${sequenceParam}&gapSize=${gapSize}`;
  const handleManual = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void manualResync();
  };

  return (
    <Card elevation="level2">
      <Stack gap="8px">
        <HeaderRow>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>リアルタイム同期ステータス</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              gapSize と sequence を表示し、手動再取得ボタンを常設。
            </p>
          </div>
          <StatusBadge tone={tone} size="sm">
            gap {gapSize} 件
          </StatusBadge>
        </HeaderRow>
        <InfoGrid>
          <InfoLabel>gap 検出時刻</InfoLabel>
          <InfoValue>{detectedAtLabel}</InfoValue>

          <InfoLabel>sequence (最新イベント)</InfoLabel>
          <InfoValue>{sequenceParam}</InfoValue>

          <InfoLabel>Last-Event-ID</InfoLabel>
          <InfoValue>{eventId}</InfoValue>

          <InfoLabel>Client UUID</InfoLabel>
          <InfoValue>{clientUuid ?? '未ログイン'}</InfoValue>
        </InfoGrid>
        <Snippet>{requestSnippet}</Snippet>
        <HintText>手動再取得は audit.logReplayGapState(action="manual-resync") として記録されます。</HintText>
        <ActionRow>
          <Button
            type="button"
            variant="primary"
            onClick={handleManual}
            disabled={manualResyncDisabled}
          >
            {manualResyncDisabled ? '同期中…' : 'gap を手動再取得'}
          </Button>
          <LinkStack>
            <LinkAnchor href={runbookHref} target="_blank" rel="noreferrer">
              Runbook を参照
            </LinkAnchor>
            <LinkAnchor href={supportHref} target="_blank" rel="noreferrer">
              ops へ連絡
            </LinkAnchor>
          </LinkStack>
        </ActionRow>
      </Stack>
    </Card>
  );
};
