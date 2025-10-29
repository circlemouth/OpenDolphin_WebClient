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

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

const variantTokens: Record<ButtonVariant, { background: string; color: string; border: string; hover: string }> = {
  primary: {
    background: 'primary',
    color: 'surface',
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
    background: 'transparent',
    color: 'textMuted',
    border: 'transparent',
    hover: 'surfaceMuted',
  },
  danger: {
    background: 'danger',
    color: 'surface',
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
  $isLoading: boolean;
}

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
  border: 1px solid ${({ theme, $variant }) => theme.palette[variantTokens[$variant].border] ?? 'transparent'};
  background: ${({ theme, $variant }) => theme.palette[variantTokens[$variant].background] ?? 'transparent'};
  color: ${({ theme, $variant }) => theme.palette[variantTokens[$variant].color] ?? theme.palette.text};
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ $variant }) =>
    $variant === 'ghost' ? 'none' : '0 6px 16px rgba(42, 66, 124, 0.12)'};

  &:hover:not(:disabled) {
    background: ${({ theme, $variant }) => theme.palette[variantTokens[$variant].hover] ?? 'transparent'};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.surfaceStrong};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

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
}

type NativeButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };
type AnchorButtonProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' };

export type ButtonProps = NativeButtonProps | AnchorButtonProps;

const renderContent = (children: ReactNode, isLoading: boolean, leftIcon?: ReactNode, rightIcon?: ReactNode) => (
  <>
    {isLoading && <Spinner role="status" aria-hidden />}
    {!isLoading && leftIcon ? <IconWrapper>{leftIcon}</IconWrapper> : null}
    <span>{children}</span>
    {!isLoading && rightIcon ? <IconWrapper>{rightIcon}</IconWrapper> : null}
  </>
);

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      ...rest
    } = props;

    const shared = {
      $variant: variant,
      $size: size,
      $fullWidth: fullWidth,
      $isLoading: isLoading,
    } as const;

    if (rest.as === 'a') {
      const { onClick, tabIndex, disabled, ...anchorProps } = rest;
      const isDisabled = Boolean(disabled ?? anchorProps['aria-disabled'] ?? isLoading);
      const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      };

      return (
        <StyledButton
          {...shared}
          {...anchorProps}
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          as="a"
          aria-busy={isLoading}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : tabIndex}
          onClick={handleClick}
        >
          {renderContent(children, isLoading, leftIcon, rightIcon)}
        </StyledButton>
      );
    }

    const buttonProps = rest as NativeButtonProps;
    const { type, disabled, ...native } = buttonProps;
    const isDisabled = Boolean(disabled || isLoading);

    return (
      <StyledButton
        {...shared}
        {...native}
        ref={ref as ForwardedRef<HTMLButtonElement>}
        type={type ?? 'button'}
        aria-busy={isLoading}
        disabled={isDisabled}
      >
        {renderContent(children, isLoading, leftIcon, rightIcon)}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';
