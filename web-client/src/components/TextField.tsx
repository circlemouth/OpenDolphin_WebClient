import styled from '@emotion/styled';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  description?: string;
  errorMessage?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  requiredIndicator?: ReactNode;
}

const FieldWrapper = styled.label`
  display: grid;
  gap: 0.4rem;
`;

const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const Description = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InputShell = styled.span<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.palette.danger : theme.palette.border)};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.palette.danger : theme.palette.primary};
    box-shadow: 0 0 0 3px rgba(58, 122, 254, 0.15);
  }
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  background: transparent;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text};

  &::placeholder {
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const AssistiveText = styled.span<{ $tone: 'muted' | 'error' }>`
  font-size: 0.8rem;
  color: ${({ theme, $tone }) =>
    $tone === 'error' ? theme.palette.danger : theme.palette.textMuted};
`;

const Adornment = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.textMuted};
`;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      id,
      description,
      errorMessage,
      leftAdornment,
      rightAdornment,
      required,
      requiredIndicator = <span aria-hidden="true">*</span>,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-desc` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const hasError = Boolean(errorMessage);

    return (
      <FieldWrapper htmlFor={inputId}>
        <LabelRow>
          <span>{label}</span>
          {required ? <span>{requiredIndicator}</span> : null}
        </LabelRow>
        {description ? <Description id={descriptionId}>{description}</Description> : null}
        <InputShell $hasError={hasError}>
          {leftAdornment ? <Adornment>{leftAdornment}</Adornment> : null}
          <StyledInput
            id={inputId}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
            required={required}
            {...props}
          />
          {rightAdornment ? <Adornment>{rightAdornment}</Adornment> : null}
        </InputShell>
        {hasError ? (
          <AssistiveText role="alert" $tone="error" id={errorId}>
            {errorMessage}
          </AssistiveText>
        ) : null}
      </FieldWrapper>
    );
  },
);

TextField.displayName = 'TextField';
