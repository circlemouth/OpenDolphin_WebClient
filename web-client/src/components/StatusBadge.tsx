import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

import type { PaletteToken } from '@/styles/theme';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type StatusBadgeSize = 'sm' | 'md';

const toneScale: Record<StatusTone, { background: PaletteToken; color: PaletteToken; border: PaletteToken }> = {
  info: { background: 'surfaceStrong', color: 'primaryStrong', border: 'primary' },
  success: { background: 'surfaceMuted', color: 'success', border: 'success' },
  warning: { background: 'warningMuted', color: 'warning', border: 'warning' },
  danger: { background: 'dangerMuted', color: 'danger', border: 'danger' },
  neutral: { background: 'surfaceMuted', color: 'textMuted', border: 'border' },
};

const sizeScale: Record<StatusBadgeSize, { padding: string; fontSize: string; gap: string }> = {
  md: { padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' },
  sm: { padding: '0.2rem 0.5rem', fontSize: '0.6875rem', gap: '0.25rem' },
};

const StyledBadge = styled.span<{ $tone: StatusTone; $size: StatusBadgeSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $size }) => sizeScale[$size].gap};
  padding: ${({ $size }) => sizeScale[$size].padding};
  font-size: ${({ $size }) => sizeScale[$size].fontSize};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: ${({ theme }) => theme.radius.xs};
  background: ${({ theme, $tone }) => theme.palette[toneScale[$tone].background]};
  color: ${({ theme, $tone }) => theme.palette[toneScale[$tone].color]};
  border: 1px solid ${({ theme, $tone }) => theme.palette[toneScale[$tone].border]};
  line-height: 1;
`;

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  size?: StatusBadgeSize;
}

export const StatusBadge = ({ tone = 'neutral', size = 'md', ...props }: StatusBadgeProps) => (
  <StyledBadge $tone={tone} $size={size} {...props} />
);
