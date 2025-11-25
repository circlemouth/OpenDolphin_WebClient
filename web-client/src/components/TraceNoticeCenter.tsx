import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

import { dismissTraceNotice, subscribeTraceNotices, type TraceNotice } from '@/observability/traceNotifications';

const Panel = styled.div`
  position: fixed;
  top: 88px;
  right: 20px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(420px, calc(100vw - 32px));
`;

const NoticeCard = styled.div<{ $severity: TraceNotice['severity'] }>`
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $severity }) =>
      $severity === 'error' ? theme.palette.danger : $severity === 'warning' ? theme.palette.warning : theme.palette.primary};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  padding: 12px 14px;
  display: grid;
  gap: 6px;
`;

const NoticeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  font-weight: 600;
`;

const MetaList = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  margin: 0;
`;

const MetaLabel = styled.dt`
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const MetaValue = styled.dd`
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85rem;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.palette.textMuted};
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.palette.text};
  }
`;

const NoticeActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionButton = styled.button`
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.palette.surfaceStrong};
  }
`;

export const TraceNoticeCenter = () => {
  const [notices, setNotices] = useState<TraceNotice[]>([]);

  useEffect(() => subscribeTraceNotices(setNotices), []);

  if (notices.length === 0) {
    return null;
  }

  return (
    <Panel aria-live="assertive" aria-label="診断用通知">
      {notices.map((notice) => (
        <NoticeCard key={notice.id} $severity={notice.severity}>
          <NoticeHeader>
            <span>{notice.message}</span>
            <CloseButton type="button" onClick={() => dismissTraceNotice(notice.id)} aria-label="通知を閉じる">
              x
            </CloseButton>
          </NoticeHeader>
          <MetaList>
            {notice.traceId ? (
              <>
                <MetaLabel>TraceId</MetaLabel>
                <MetaValue>{notice.traceId}</MetaValue>
              </>
            ) : null}
            {notice.requestId ? (
              <>
                <MetaLabel>RequestId</MetaLabel>
                <MetaValue>{notice.requestId}</MetaValue>
              </>
            ) : null}
            {notice.statusCode ? (
              <>
                <MetaLabel>Status</MetaLabel>
                <MetaValue>{notice.statusCode}</MetaValue>
              </>
            ) : null}
            {notice.url ? (
              <>
                <MetaLabel>URL</MetaLabel>
                <MetaValue>{notice.url}</MetaValue>
              </>
            ) : null}
          </MetaList>
          {notice.traceId || notice.requestId ? (
            <NoticeActions>
              <ActionButton
                type="button"
                onClick={() => {
                  const payload = [
                    notice.traceId ? `TraceId: ${notice.traceId}` : null,
                    notice.requestId ? `RequestId: ${notice.requestId}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n');

                  if (!payload) {
                    return;
                  }

                  if (navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(payload).catch((error) => {
                      console.warn('[TraceNotice] クリップボードへのコピーに失敗しました。', error);
                    });
                  }
                }}
                aria-label="TraceId と RequestId をコピー"
              >
                TraceId/RequestId をコピー
              </ActionButton>
            </NoticeActions>
          ) : null}
        </NoticeCard>
      ))}
    </Panel>
  );
};
