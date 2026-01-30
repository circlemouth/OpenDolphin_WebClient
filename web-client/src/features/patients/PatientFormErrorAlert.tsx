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
  const hasFieldErrors = fieldErrors.length > 0;

  return (
    <div className="patient-form__alert" role="alert" aria-live={resolveAriaLive('warning')}>
      <p className="patient-form__alert-title">保存できません</p>
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
      {!formErrors.length && !hasFieldErrors ? <p className="patient-form__alert-sub">入力内容を確認してください。</p> : null}
    </div>
  );
}
