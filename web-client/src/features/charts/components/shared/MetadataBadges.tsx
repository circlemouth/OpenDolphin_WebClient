import styled from '@emotion/styled';

export type MetadataBadgeTone = 'neutral' | 'info' | 'warning' | 'danger';

const toneStyles = {
  info: (theme: any) => ({
    background: theme.palette.surfaceStrong,
    border: `1px solid ${theme.palette.primary}`,
    color: theme.palette.primary,
  }),
  warning: (theme: any) => ({
    background: theme.palette.warningMuted ?? '#fef3c7',
    border: `1px solid ${theme.palette.warning ?? '#f59e0b'}`,
    color: theme.palette.warning ?? '#b45309',
  }),
  danger: (theme: any) => ({
    background: theme.palette.dangerMuted ?? '#fee2e2',
    border: `1px solid ${theme.palette.danger ?? '#dc2626'}`,
    color: theme.palette.danger ?? '#b91c1c',
  }),
  neutral: (theme: any) => ({
    background: theme.palette.surfaceMuted,
    border: `1px solid ${theme.palette.border}`,
    color: theme.palette.textMuted,
  }),
};

export const MetadataBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

export const MetadataBadge = styled.span<{ $tone?: MetadataBadgeTone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 0.85rem;
  white-space: nowrap;
  ${({ theme, $tone = 'neutral' }) => {
    const { background, border, color } = toneStyles[$tone](theme);
    return `background: ${background}; border: ${border}; color: ${color};`;
  }}
`;
