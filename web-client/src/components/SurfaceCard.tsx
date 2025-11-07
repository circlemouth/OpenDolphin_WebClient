import styled from '@emotion/styled';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import type { PaletteToken } from '@/styles/theme';

export type SurfaceTone = 'default' | 'muted' | 'elevated' | 'warning' | 'danger';
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
  warning: 'warningMuted',
  danger: 'dangerMuted',
};

const StyledSurfaceCard = styled.div<StyledSurfaceCardProps>`
  background: ${({ theme, $tone }) => theme.palette[backgroundScale[$tone]]};
  padding: ${({ $padding }) => paddingScale[$padding]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'muted':
        return `inset 0 0 0 1px ${theme.palette.border}`;
      case 'elevated':
        return theme.elevation.level2;
      case 'warning':
        return `0 0 0 1px ${theme.palette.warning}`;
      case 'danger':
        return `0 0 0 1px ${theme.palette.danger}`;
      default:
        return theme.elevation.level1;
    }
  }};
  border: 1px solid
    ${({ theme, $tone }) => {
      switch ($tone) {
        case 'muted':
          return 'transparent';
        case 'warning':
          return theme.palette.warning;
        case 'danger':
          return theme.palette.danger;
        default:
          return theme.palette.border;
      }
    }};
`;

type StyledSurfaceCardBaseProps = ComponentPropsWithoutRef<typeof StyledSurfaceCard>;

export type SurfaceCardProps = Omit<StyledSurfaceCardBaseProps, '$tone' | '$padding'> & {
  tone?: SurfaceTone;
  padding?: SurfaceCardPadding;
};

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ tone = 'default', padding = 'md', ...props }, ref) => (
    <StyledSurfaceCard ref={ref} $tone={tone} $padding={padding} {...props} />
  ),
);

SurfaceCard.displayName = 'SurfaceCard';
