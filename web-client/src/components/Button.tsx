import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ForwardedRef,
  MouseEvent,
  ReactNode,
} from 'react';
import { forwardRef } from 'react';

import type { AppTheme, PaletteToken } from '@/styles/theme';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface VariantTokens {
  background?: PaletteToken;
  color?: PaletteToken;
  border?: PaletteToken;
  hover?: PaletteToken;
}

const variantTokens: Record<ButtonVariant, VariantTokens> = {
  primary: {
    background: 'primary',
    color: 'onPrimary',
    border: 'primary',
    hover: 'primaryStrong',
  },
  secondary: {
    background: 'surfaceMuted',
    color: 'text',
    border: 'border',
    hover: 'surfaceStrong',
  },
  ghost: {
    color: 'textMuted',
    hover: 'surfaceMuted',
  },
  danger: {
    background: 'danger',
    color: 'onPrimary',
    border: 'danger',
    hover: 'primaryStrong',
  },
};

const sizeTokens: Record<ButtonSize, { padding: string; fontSize: string }> = {
  md: {
    padding: '0.65rem 1.2rem',
    fontSize: '1rem',
  },
  sm: {
    padding: '0.45rem 0.9rem',
    fontSize: '0.875rem',
  },
};

interface StyledButtonProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}

const resolvePalette = (theme: AppTheme, token: PaletteToken | undefined, fallback: string) =>
  token ? theme.palette[token] : fallback;

const StyledButton = styled.button<StyledButtonProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  padding: ${({ $size }) => sizeTokens[$size].padding};
  font-size: ${({ $size }) => sizeTokens[$size].fontSize};
  font-weight: 600;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $variant }) => resolvePalette(theme, variantTokens[$variant].border, 'transparent')};
  background: ${({ theme, $variant }) =>
    resolvePalette(theme, variantTokens[$variant].background, 'transparent')};
  color: ${({ theme, $variant }) => resolvePalette(theme, variantTokens[$variant].color, theme.palette.text)};
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ $variant }) =>
    $variant === 'ghost' ? 'none' : '0 6px 16px rgba(42, 66, 124, 0.12)'};

  &:hover:not(:disabled):not([aria-disabled='true']) {
    background: ${({ theme, $variant }) =>
      resolvePalette(theme, variantTokens[$variant].hover, theme.palette.surfaceMuted)};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.surfaceStrong};
    outline-offset: 2px;
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  &[aria-disabled='true'] {
    pointer-events: none;
  }
`;

const AnchorStyledButton = StyledButton.withComponent('a');

const Spinner = styled.span`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: ${spin} 0.8s linear infinite;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
}

type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | 'as'> & { as?: 'button' };
type AnchorButtonProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | 'as'> & { as: 'a' };

export type ButtonProps = NativeButtonProps | AnchorButtonProps;

const isAnchorProps = (props: ButtonProps): props is AnchorButtonProps => props.as === 'a';

const renderContent = (
  children: ReactNode,
  isLoading: boolean,
  leftIcon?: ReactNode,
  rightIcon?: ReactNode,
) => (
  <>
    {isLoading ? <Spinner role="status" aria-hidden /> : null}
    {!isLoading && leftIcon ? <IconWrapper>{leftIcon}</IconWrapper> : null}
    <span>{children}</span>
    {!isLoading && rightIcon ? <IconWrapper>{rightIcon}</IconWrapper> : null}
  </>
);

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  if (isAnchorProps(props)) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled = false,
      onClick,
      tabIndex,
      as: _as,
      ...anchorProps
    } = props;

    const shared = {
      $variant: variant,
      $size: size,
      $fullWidth: fullWidth,
    } as const;

    const isDisabled = disabled || isLoading;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      onClick?.(event);
    };

    return (
      <AnchorStyledButton
        {...shared}
        {...anchorProps}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        aria-busy={isLoading}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : tabIndex}
        onClick={handleClick}
      >
        {renderContent(children, isLoading, leftIcon, rightIcon)}
      </AnchorStyledButton>
    );
  }

  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled = false,
    type,
    as: _as,
    ...buttonProps
  } = props;

  const shared = {
    $variant: variant,
    $size: size,
    $fullWidth: fullWidth,
  } as const;

  const isDisabled = disabled || isLoading;

  return (
    <StyledButton
      {...shared}
      {...buttonProps}
      ref={ref as ForwardedRef<HTMLButtonElement>}
      type={type ?? 'button'}
      aria-busy={isLoading}
      disabled={isDisabled}
    >
      {renderContent(children, isLoading, leftIcon, rightIcon)}
    </StyledButton>
  );
});

Button.displayName = 'Button';
