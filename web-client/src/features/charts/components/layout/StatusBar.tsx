import { forwardRef } from 'react';
import styled from '@emotion/styled';

import { Button } from '@/components';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

interface StatusBarProps {
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  signatureState: 'idle' | 'signing' | 'signed' | 'blocked' | 'error';
  claimState: 'idle' | 'sending' | 'sent' | 'error';
  lastSavedAt?: string;
  lastSignedAt?: string | null;
  lastClaimSentAt?: string | null;
  onSaveDraft: () => void;
  onSignDocument: () => void;
  onSendClaim: () => void;
  onOpenShortcuts: () => void;
  onCallNextPatient: () => void;
  isLockedByMe: boolean;
  signatureDisabled: boolean;
  claimDisabled: boolean;
  signatureDisabledReason?: string | null;
  claimDisabledReason?: string | null;
  signatureError?: string | null;
  claimError?: string | null;
}

const Footer = styled.footer`
  min-height: var(--charts-footer-height, 56px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 32px;
  background: ${({ theme }) => theme.palette.surface};
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  box-shadow: 0 -2px 12px rgba(20, 31, 44, 0.06);
  flex-wrap: wrap;
`;

const StatusColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
  flex-wrap: wrap;
`;

const StatusIndicator = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
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

const InlineNotice = styled.span<{ $tone: 'danger' | 'warning' }>`
  font-size: 0.8rem;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.warning)};
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const formatLabelWithTimestamp = (label: string, timestamp?: string | null) =>
  timestamp ? `${label} (${timestamp})` : label;

const resolveTone = (state: string, successValue: string, processingValue: string): Tone => {
  if (state === successValue) {
    return 'positive';
  }
  if (state === 'error') {
    return 'danger';
  }
  if (state === processingValue) {
    return 'warning';
  }
  return 'neutral';
};

export const StatusBar = forwardRef<HTMLElement, StatusBarProps>(({
  saveState,
  signatureState,
  claimState,
  lastSavedAt,
  lastSignedAt,
  lastClaimSentAt,
  onSaveDraft,
  onSignDocument,
  onSendClaim,
  onOpenShortcuts,
  onCallNextPatient,
  isLockedByMe,
  signatureDisabled,
  claimDisabled,
  signatureDisabledReason,
  claimDisabledReason,
  signatureError,
  claimError,
}, ref) => {
  const saveTone = resolveTone(saveState, 'saved', 'saving');
  const saveLabel = (() => {
    switch (saveState) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return formatLabelWithTimestamp('保存済み', lastSavedAt);
      case 'error':
        return '保存エラー';
      default:
        return '未保存';
    }
  })();

  const signatureTone: Tone = (() => {
    if (signatureState === 'blocked') {
      return 'warning';
    }
    return resolveTone(signatureState, 'signed', 'signing');
  })();

  const signatureLabel = (() => {
    switch (signatureState) {
      case 'signing':
        return '署名処理中...';
      case 'signed':
        return formatLabelWithTimestamp('署名済み', lastSignedAt ?? undefined);
      case 'error':
        return '署名エラー';
      case 'blocked':
        return '署名待機';
      default:
        return '未署名';
    }
  })();

  const claimTone = resolveTone(claimState, 'sent', 'sending');
  const claimLabel = (() => {
    switch (claimState) {
      case 'sending':
        return '会計連携中...';
      case 'sent':
        return formatLabelWithTimestamp('会計連携済み', lastClaimSentAt ?? undefined);
      case 'error':
        return '会計連携エラー';
      default:
        return '未送信';
    }
  })();

  const signatureTooltip = signatureError ?? signatureDisabledReason ?? undefined;
  const claimTooltip = claimError ?? claimDisabledReason ?? undefined;

  return (
    <Footer ref={ref} aria-label="ステータスバー">
      <StatusColumn>
        <StatusRow>
          <StatusIndicator $tone={saveTone} title={saveState === 'error' ? '保存に失敗しました。再試行してください。' : undefined}>
            {saveLabel}
          </StatusIndicator>
          <StatusIndicator $tone={signatureTone} title={signatureTooltip ?? undefined}>
            {signatureLabel}
          </StatusIndicator>
          <StatusIndicator $tone={claimTone} title={claimTooltip ?? undefined}>
            {claimLabel}
          </StatusIndicator>
        </StatusRow>
        {signatureError ? <InlineNotice $tone="danger">署名エラー: {signatureError}</InlineNotice> : null}
        {claimError ? <InlineNotice $tone="danger">会計連携エラー: {claimError}</InlineNotice> : null}
        {!signatureError && !claimError && signatureDisabledReason ? (
          <InlineNotice $tone="warning">{signatureDisabledReason}</InlineNotice>
        ) : null}
      </StatusColumn>
      <ActionGroup>
        <ButtonGroup>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSaveDraft}
            disabled={!isLockedByMe || saveState === 'saving'}
            isLoading={saveState === 'saving'}
          >
            保存 (Ctrl/Cmd+Enter)
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSignDocument}
            disabled={signatureDisabled || signatureState === 'signing'}
            isLoading={signatureState === 'signing'}
          >
            署名して確定
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSendClaim}
            disabled={claimDisabled || claimState === 'sending'}
            isLoading={claimState === 'sending'}
          >
            会計連携
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onOpenShortcuts}>
            ショートカット
          </Button>
        </ButtonGroup>
        <Button type="button" variant="primary" size="sm" onClick={onCallNextPatient}>
          次患者を呼び出し
        </Button>
      </ActionGroup>
    </Footer>
  );
});

StatusBar.displayName = 'StatusBar';
