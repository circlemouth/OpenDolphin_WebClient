import type { PatientGender } from '@/features/patients/types/patient';

const GENDER_VALUES: readonly PatientGender[] = ['M', 'F', 'U', 'O'];

export const normalizeGender = (value: string | null | undefined): PatientGender => {
  const normalized = value?.trim().toUpperCase();
  if (normalized && (GENDER_VALUES as readonly string[]).includes(normalized)) {
    return normalized as PatientGender;
  }
  return 'U';
};
