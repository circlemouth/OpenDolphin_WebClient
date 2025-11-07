import styled from '@emotion/styled';
import type { TextareaHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  errorMessage?: string;
}

const FieldWrapper = styled.label`
  display: grid;
  gap: 0.4rem;
`;

const LabelRow = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const Description = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const StyledTextarea = styled.textarea<{ $hasError: boolean }>`
  width: 100%;
  min-height: 120px;
  padding: 0.65rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, $hasError }) => ($hasError ? theme.palette.danger : theme.palette.border)};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.palette.text};
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) => ($hasError ? theme.palette.danger : theme.palette.primary)};
    box-shadow: 0 0 0 3px rgba(58, 122, 254, 0.15);
  }

  &::placeholder {
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const AssistiveText = styled.span<{ $tone: 'muted' | 'error' }>`
  font-size: 0.8rem;
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.palette.danger : theme.palette.textMuted)};
`;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, id, description, errorMessage, required, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const descriptionId = description ? `${textareaId}-desc` : undefined;
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
    const hasError = Boolean(errorMessage);

    return (
      <FieldWrapper htmlFor={textareaId}>
        <LabelRow>{label}</LabelRow>
        {description ? <Description id={descriptionId}>{description}</Description> : null}
        <StyledTextarea
          id={textareaId}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          required={required}
          $hasError={hasError}
          {...props}
        />
        {hasError ? (
          <AssistiveText role="alert" $tone="error" id={errorId}>
            {errorMessage}
          </AssistiveText>
        ) : null}
      </FieldWrapper>
    );
  },
);

TextArea.displayName = 'TextArea';
