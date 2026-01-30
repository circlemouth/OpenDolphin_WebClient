import { resolveAriaLive } from '../../libs/observability/observability';
import type { PatientRecord } from './api';
import type { PatientValidationError } from './patientValidation';

export type PatientFormErrorAlertProps = {
  errors: PatientValidationError[];
  onFocusField?: (field: keyof PatientRecord) => void;
};

export function PatientFormErrorAlert({ errors, onFocusField }: PatientFormErrorAlertProps) {
  if (errors.length === 0) return null;

  const formErrors = errors.filter((e) => e.field === 'form' || !e.field || e.kind === 'blocked');
  const fieldErrors = errors.filter((e) => e.field && e.field !== 'form') as Array<PatientValidationError & { field: keyof PatientRecord }>;
  const missingFieldErrors = fieldErrors.filter((e) => e.kind === 'missing');
  const formatFieldErrors = fieldErrors.filter((e) => e.kind === 'format');
  const otherFieldErrors = fieldErrors.filter((e) => !e.kind);
  const summaryParts = [
    missingFieldErrors.length > 0 ? `不足${missingFieldErrors.length}件` : null,
    formatFieldErrors.length > 0 ? `形式${formatFieldErrors.length}件` : null,
    formErrors.length > 0 ? `ブロック${formErrors.length}件` : null,
  ].filter((value): value is string => Boolean(value));
  const topPriority =
    missingFieldErrors[0] ?? formatFieldErrors[0] ?? otherFieldErrors[0] ?? formErrors[0] ?? null;

  return (
    <div className="patient-form__alert" role="alert" aria-live={resolveAriaLive('warning')}>
      <p className="patient-form__alert-title">保存できません</p>
      {summaryParts.length > 0 ? (
        <p className="patient-form__alert-summary">{summaryParts.join(' / ')}</p>
      ) : null}
      {topPriority ? (
        <p className="patient-form__alert-priority">最優先修正: {topPriority.message}</p>
      ) : null}
      {formErrors.length > 0 ? (
        <div className="patient-form__alert-section">
          <p className="patient-form__alert-sub">編集ブロック理由</p>
          <ul className="patient-form__alert-list">
            {formErrors.map((e, idx) => (
              <li key={`form-${idx}`}>{e.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {missingFieldErrors.length > 0 ? (
        <div className="patient-form__alert-section">
          <p className="patient-form__alert-sub">不足項目</p>
          <ul className="patient-form__alert-list">
            {missingFieldErrors.map((e, idx) => (
              <li key={`${e.field}-missing-${idx}`}>
                <button type="button" className="patient-form__alert-link" onClick={() => onFocusField?.(e.field)}>
                  {e.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {formatFieldErrors.length > 0 ? (
        <div className="patient-form__alert-section">
          <p className="patient-form__alert-sub">形式チェック</p>
          <ul className="patient-form__alert-list">
            {formatFieldErrors.map((e, idx) => (
              <li key={`${e.field}-format-${idx}`}>
                <button type="button" className="patient-form__alert-link" onClick={() => onFocusField?.(e.field)}>
                  {e.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {otherFieldErrors.length > 0 ? (
        <div className="patient-form__alert-section">
          <p className="patient-form__alert-sub">入力エラー</p>
          <ul className="patient-form__alert-list">
            {otherFieldErrors.map((e, idx) => (
              <li key={`${e.field}-other-${idx}`}>
                <button type="button" className="patient-form__alert-link" onClick={() => onFocusField?.(e.field)}>
                  {e.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
