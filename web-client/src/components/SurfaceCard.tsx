import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export type SurfaceTone = 'default' | 'muted' | 'elevated';

export interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingScale: Record<NonNullable<SurfaceCardProps['padding']>, string> = {
  sm: '0.75rem',
  md: '1.25rem',
  lg: '1.75rem',
};

const backgroundScale: Record<SurfaceTone, string> = {
  default: 'surface',
  muted: 'surfaceMuted',
  elevated: 'surfaceStrong',
};

const StyledSurfaceCard = styled.div<Required<Pick<SurfaceCardProps, 'tone' | 'padding'>>>`
  background: ${({ theme, tone }) => theme.palette[backgroundScale[tone]]};
  padding: ${({ padding }) => paddingScale[padding]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme, tone }) =>
    tone === 'muted' ? `inset 0 0 0 1px ${theme.palette.border}` : theme.elevation.level1};
  border: 1px solid ${({ theme, tone }) => (tone === 'muted' ? 'transparent' : theme.palette.border)};
`;

export const SurfaceCard = ({ tone = 'default', padding = 'md', ...props }: SurfaceCardProps) => (
  <StyledSurfaceCard tone={tone} padding={padding} {...props} />
);
