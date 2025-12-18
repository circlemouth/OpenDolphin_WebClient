import { describe, expect, it } from 'vitest';

import { validatePatientMutation } from './patientValidation';

describe('validatePatientMutation', () => {
  it('requires name for create/update', () => {
    const errors = validatePatientMutation({
      patient: { patientId: '000001', name: '' },
      operation: 'update',
      context: { masterOk: true },
    });
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('blocks when masterOk is false', () => {
    const errors = validatePatientMutation({
      patient: { patientId: '000001', name: '山田 花子' },
      operation: 'update',
      context: { masterOk: false },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('form');
  });

  it('validates kana/zip/phone formats', () => {
    const errors = validatePatientMutation({
      patient: {
        patientId: '000001',
        name: '山田 花子',
        kana: 'yamada',
        zip: '100-000',
        phone: 'abc',
      },
      operation: 'update',
      context: { masterOk: true },
    });
    expect(errors.some((e) => e.field === 'kana')).toBe(true);
    expect(errors.some((e) => e.field === 'zip')).toBe(true);
    expect(errors.some((e) => e.field === 'phone')).toBe(true);
  });

  it('requires patientId for delete', () => {
    const errors = validatePatientMutation({
      patient: { patientId: '', name: '山田 花子' },
      operation: 'delete',
      context: { masterOk: true },
    });
    expect(errors.some((e) => e.field === 'patientId')).toBe(true);
  });
});

