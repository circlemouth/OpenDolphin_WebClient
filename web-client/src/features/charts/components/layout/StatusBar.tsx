import styled from '@emotion/styled';

import { Button } from '@/components';

interface StatusBarProps {
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  unsentTaskCount: number;
  lastSavedAt?: string;
  onSaveDraft: () => void;
  onCallNextPatient: () => void;
  isLockedByMe: boolean;
}

const Footer = styled.footer`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: ${({ theme }) => theme.palette.surface};
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  z-index: 95;
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
`;

const StatusIndicator = styled.span<{ $tone: 'neutral' | 'positive' | 'warning' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme, $tone }) =>
    $tone === 'positive'
      ? 'rgba(26, 143, 106, 0.18)'
      : $tone === 'warning'
      ? 'rgba(240, 180, 41, 0.18)'
      : $tone === 'danger'
      ? 'rgba(214, 69, 80, 0.18)'
      : theme.palette.surfaceMuted};
  color: ${({ theme, $tone }) =>
    $tone === 'positive'
      ? theme.palette.success
      : $tone === 'warning'
      ? theme.palette.warning
      : $tone === 'danger'
      ? theme.palette.danger
      : theme.palette.textMuted};
`;

export const StatusBar = ({
  saveState,
  unsentTaskCount,
  lastSavedAt,
  onSaveDraft,
  onCallNextPatient,
  isLockedByMe,
}: StatusBarProps) => {
  const saveTone: 'neutral' | 'positive' | 'warning' | 'danger' =
    saveState === 'saved' ? 'positive' : saveState === 'error' ? 'danger' : saveState === 'saving' ? 'warning' : 'neutral';

  const saveLabel = (() => {
    switch (saveState) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return lastSavedAt ? `保存済み (${lastSavedAt})` : '保存済み';
      case 'error':
        return '保存エラー';
      default:
        return '未保存';
    }
  })();

  return (
    <Footer aria-label="ステータスバー">
      <StatusGroup>
        <StatusIndicator $tone={saveTone}>{saveLabel}</StatusIndicator>
        <StatusIndicator $tone={unsentTaskCount > 0 ? 'warning' : 'neutral'}>
          未完タスク: {unsentTaskCount}
        </StatusIndicator>
      </StatusGroup>
      <StatusGroup>
        <Button type="button" variant="secondary" size="sm" onClick={onSaveDraft} disabled={!isLockedByMe}>
          Ctrl/Cmd+Enter 保存
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onCallNextPatient}>
          次患者を呼び出し
        </Button>
      </StatusGroup>
    </Footer>
  );
};
