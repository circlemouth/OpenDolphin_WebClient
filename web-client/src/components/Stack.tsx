import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export type StackDirection = 'row' | 'column';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  direction?: StackDirection;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

const StyledStack = styled('div', {
  shouldForwardProp: (prop) => !['gap', 'direction', 'align', 'justify', 'wrap'].includes(prop as string),
})<Required<Pick<StackProps, 'gap' | 'direction' | 'align' | 'justify' | 'wrap'>>>`
  display: flex;
  flex-direction: ${({ direction }) => direction};
  gap: ${({ gap }) => `${gap / 16}rem`};
  align-items: ${({ align }) =>
    align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align === 'center' ? 'center' : 'stretch'};
  justify-content: ${({ justify }) =>
    justify === 'between' ? 'space-between' : justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : 'center'};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
`;

export const Stack = ({
  gap = 16,
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  ...props
}: StackProps) => (
  <StyledStack gap={gap} direction={direction} align={align} justify={justify} wrap={wrap} {...props} />
);
