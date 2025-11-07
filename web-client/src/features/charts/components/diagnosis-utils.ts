import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';

export const formatDiagnosisDate = (value?: string | null): string => {
  if (!value) {
    return '---';
  }
  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const diagnosisStatusTone = (status?: string | null): 'info' | 'warning' | 'danger' => {
  if (!status) {
    return 'info';
  }
  const normalized = status.toUpperCase();
  if (normalized === 'F') {
    return 'info';
  }
  if (normalized === 'M') {
    return 'warning';
  }
  if (normalized === 'D') {
    return 'danger';
  }
  return 'info';
};

export const diagnosisStatusLabel = (status?: string | null): string => {
  if (!status) {
    return '状態不明';
  }
  const normalized = status.toUpperCase();
  if (normalized === 'F') {
    return '確定';
  }
  if (normalized === 'M') {
    return '修正';
  }
  if (normalized === 'D') {
    return '終了';
  }
  return status;
};

export const canResolveDiagnosis = (diagnosis: RegisteredDiagnosis): boolean =>
  diagnosis.status?.toUpperCase() === 'F';

export const diagnosisDisplayName = (diagnosis: RegisteredDiagnosis): string => diagnosis.diagnosis?.trim() ?? '不明な病名';

export const diagnosisCodeLabel = (diagnosis: RegisteredDiagnosis): string => diagnosis.diagnosisCode?.trim() || 'コード未設定';
