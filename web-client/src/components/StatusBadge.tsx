import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const toneScale: Record<StatusTone, { background: string; color: string; border: string }> = {
  info: { background: 'surfaceStrong', color: 'primaryStrong', border: 'primary' },
  success: { background: 'surfaceMuted', color: 'success', border: 'success' },
  warning: { background: 'surfaceMuted', color: 'warning', border: 'warning' },
  danger: { background: 'surfaceMuted', color: 'danger', border: 'danger' },
  neutral: { background: 'surfaceMuted', color: 'textMuted', border: 'border' },
};

const StyledBadge = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $tone }) => theme.palette[toneScale[$tone].background]};
  color: ${({ theme, $tone }) => theme.palette[toneScale[$tone].color]};
  border: 1px solid ${({ theme, $tone }) => theme.palette[toneScale[$tone].border]};
`;

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export const StatusBadge = ({ tone = 'neutral', ...props }: StatusBadgeProps) => (
  <StyledBadge $tone={tone} {...props} />
);
