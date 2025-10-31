import styled from '@emotion/styled';
import type { ComponentPropsWithoutRef } from 'react';

import type { PaletteToken } from '@/styles/theme';

export type SurfaceTone = 'default' | 'muted' | 'elevated';
export type SurfaceCardPadding = 'sm' | 'md' | 'lg';

type StyledSurfaceCardProps = {
  $tone: SurfaceTone;
  $padding: SurfaceCardPadding;
};

const paddingScale: Record<SurfaceCardPadding, string> = {
  sm: '0.75rem',
  md: '1.25rem',
  lg: '1.75rem',
};

const backgroundScale: Record<SurfaceTone, PaletteToken> = {
  default: 'surface',
  muted: 'surfaceMuted',
  elevated: 'surfaceStrong',
};

const StyledSurfaceCard = styled.div<StyledSurfaceCardProps>`
  background: ${({ theme, $tone }) => theme.palette[backgroundScale[$tone]]};
  padding: ${({ $padding }) => paddingScale[$padding]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme, $tone }) =>
    $tone === 'muted'
      ? `inset 0 0 0 1px ${theme.palette.border}`
      : $tone === 'elevated'
        ? theme.elevation.level2
        : theme.elevation.level1};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'muted' ? 'transparent' : theme.palette.border)};
`;

type StyledSurfaceCardBaseProps = ComponentPropsWithoutRef<typeof StyledSurfaceCard>;

export type SurfaceCardProps = Omit<StyledSurfaceCardBaseProps, '$tone' | '$padding'> & {
  tone?: SurfaceTone;
  padding?: SurfaceCardPadding;
};

export const SurfaceCard = ({ tone = 'default', padding = 'md', ...props }: SurfaceCardProps) => (
  <StyledSurfaceCard $tone={tone} $padding={padding} {...props} />
);
