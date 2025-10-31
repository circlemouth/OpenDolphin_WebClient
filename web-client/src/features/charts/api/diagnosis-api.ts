import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';
import { recordOperationEvent } from '@/libs/audit';

import type {
  RegisteredDiagnosis,
  RegisteredDiagnosisListResponse,
} from '@/features/charts/types/diagnosis';

const encodeParam = (value: string) => encodeURIComponent(value);

export const fetchDiagnoses = async (
  karteId: number,
  fromDate: string,
  activeOnly = false,
): Promise<RegisteredDiagnosis[]> => {
  const param = [karteId, fromDate, activeOnly].join(',');
  const endpoint = `/karte/diagnosis/${encodeParam(param)}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.diagnosis.fetch,
    `GET ${endpoint}`,
    async () => httpClient.get<RegisteredDiagnosisListResponse>(endpoint),
    { karteId, fromDate, activeOnly },
  );
  return response.data?.list ?? [];
};

const wrapDiagnosisList = (list: RegisteredDiagnosis[]) => ({
  list,
});

export const createDiagnoses = async (
  diagnoses: RegisteredDiagnosis[],
): Promise<number[]> => {
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.diagnosis.create,
    'POST /karte/diagnosis',
    async () => httpClient.post<string>('/karte/diagnosis', wrapDiagnosisList(diagnoses)),
    { count: diagnoses.length },
  );
  const payload = response.data ?? '';
  const ids = payload
    .split(',')
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  recordOperationEvent('chart', 'info', 'diagnosis_create', '病名を登録しました', {
    count: ids.length,
  });
  return ids;
};

export const updateDiagnoses = async (diagnoses: RegisteredDiagnosis[]): Promise<number> => {
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.diagnosis.update,
    'PUT /karte/diagnosis',
    async () => httpClient.put<string>('/karte/diagnosis', wrapDiagnosisList(diagnoses)),
    { count: diagnoses.length },
  );
  const updated = Number.parseInt(response.data ?? '0', 10);
  recordOperationEvent('chart', 'info', 'diagnosis_update', '病名を更新しました', {
    count: diagnoses.length,
  });
  return updated;
};

export const deleteDiagnoses = async (ids: number[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }
  const endpoint = `/karte/diagnosis/${ids.join(',')}`;
  await measureApiPerformance(
    PERFORMANCE_METRICS.charts.diagnosis.delete,
    `DELETE ${endpoint}`,
    async () => httpClient.delete(endpoint),
    { count: ids.length },
  );
  recordOperationEvent('chart', 'warning', 'diagnosis_delete', '病名を削除しました', {
    count: ids.length,
  });
};
