import { resolveAriaLive } from '../../libs/observability/observability';
import type { PatientRecord } from './api';
import type { PatientValidationError } from './patientValidation';

export type PatientFormErrorAlertProps = {
  errors: PatientValidationError[];
  onFocusField?: (field: keyof PatientRecord) => void;
};

export function PatientFormErrorAlert({ errors, onFocusField }: PatientFormErrorAlertProps) {
  if (errors.length === 0) return null;

  const formErrors = errors.filter((e) => e.field === 'form' || !e.field);
  const fieldErrors = errors.filter((e) => e.field && e.field !== 'form') as Array<PatientValidationError & { field: keyof PatientRecord }>;

  return (
    <div className="patient-form__alert" role="alert" aria-live={resolveAriaLive('warning')}>
      <p className="patient-form__alert-title">入力エラーがあります</p>
      {formErrors.length > 0 ? (
        <ul className="patient-form__alert-list">
          {formErrors.map((e, idx) => (
            <li key={`form-${idx}`}>{e.message}</li>
          ))}
        </ul>
      ) : null}
      {fieldErrors.length > 0 ? (
        <ul className="patient-form__alert-list">
          {fieldErrors.map((e, idx) => (
            <li key={`${e.field}-${idx}`}>
              <button
                type="button"
                className="patient-form__alert-link"
                onClick={() => onFocusField?.(e.field)}
              >
                {e.message}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
