import styled from '@emotion/styled';

interface ReplayGapToastProps {
  visible: boolean;
  message: string;
  phaseLabel: string;
  runbookHref?: string;
}

const ToastWrapper = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  width: min(360px, calc(100vw - 32px));
`;

const ToastSurface = styled.div`
  background: ${({ theme }) => theme.palette.warningMuted};
  border: 1px solid ${({ theme }) => theme.palette.warning};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 16px;
  box-shadow: ${({ theme }) => theme.elevation.level2};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ToastHeading = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textPrimary};
`;

const ToastBody = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ToastLink = styled.a`
  font-size: 0.8rem;
  text-decoration: underline;
  color: ${({ theme }) => theme.palette.textPrimary};
`;

export const ReplayGapToast = ({ visible, message, phaseLabel, runbookHref }: ReplayGapToastProps) => {
  if (!visible) {
    return null;
  }

  return (
    <ToastWrapper role="status" aria-live="assertive">
      <ToastSurface>
        <ToastHeading>{phaseLabel === 'recovered' ? '同期が復旧しました' : '受付一覧の同期が停止しました'}</ToastHeading>
        <ToastBody>{message}</ToastBody>
        {runbookHref ? (
          <ToastLink href={runbookHref} target="_blank" rel="noreferrer">
            Runbook 手順 8 を確認する
          </ToastLink>
        ) : null}
      </ToastSurface>
    </ToastWrapper>
  );
};
