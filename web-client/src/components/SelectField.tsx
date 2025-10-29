import styled from '@emotion/styled';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  options: SelectOption[];
  description?: string;
  errorMessage?: string;
  leftAdornment?: ReactNode;
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

  select {
    border: none;
    outline: none;
    width: 100%;
    font-size: 1rem;
    background: transparent;
    color: ${({ theme }) => theme.palette.text};
  }

  &:focus-within {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.palette.danger : theme.palette.primary};
    box-shadow: 0 0 0 3px rgba(58, 122, 254, 0.15);
  }
`;

const Adornment = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const AssistiveText = styled.span<{ $tone: 'muted' | 'error' }>`
  font-size: 0.8rem;
  color: ${({ theme, $tone }) =>
    $tone === 'error' ? theme.palette.danger : theme.palette.textMuted};
`;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      id,
      options,
      description,
      errorMessage,
      leftAdornment,
      required,
      requiredIndicator = <span aria-hidden="true">*</span>,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const descriptionId = description ? `${fieldId}-desc` : undefined;
    const errorId = errorMessage ? `${fieldId}-error` : undefined;
    const hasError = Boolean(errorMessage);

    return (
      <FieldWrapper htmlFor={fieldId}>
        <LabelRow>
          <span>{label}</span>
          {required ? <span>{requiredIndicator}</span> : null}
        </LabelRow>
        {description ? <Description id={descriptionId}>{description}</Description> : null}
        <InputShell $hasError={hasError}>
          {leftAdornment ? <Adornment>{leftAdornment}</Adornment> : null}
          <select
            id={fieldId}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
            required={required}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

SelectField.displayName = 'SelectField';
