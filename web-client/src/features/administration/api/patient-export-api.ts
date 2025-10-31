import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import type { PatientListResponse, RawPatientResource } from '@/features/patients/types/patient';

const extractPatientList = (response: PatientListResponse | null | undefined): RawPatientResource[] =>
  response?.list ?? [];

export const fetchAllPatients = async (): Promise<RawPatientResource[]> => {
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.patientExport.fetchAll,
    'GET /patient/all',
    async () => httpClient.get<PatientListResponse>('/patient/all'),
  );
  const list = extractPatientList(response.data);
  recordOperationEvent('administration', 'info', 'patient_export_all', '患者全件データを取得しました', {
    count: list.length,
  });
  return list;
};

export const fetchCustomPatients = async (condition: string): Promise<RawPatientResource[]> => {
  const trimmed = condition.trim();
  const endpoint = `/patient/custom/${encodeURIComponent(trimmed)}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.patientExport.fetchCustom,
    `GET ${endpoint}`,
    async () => httpClient.get<PatientListResponse>(endpoint),
    { condition: trimmed },
  );
  const list = extractPatientList(response.data);
  recordOperationEvent('administration', 'info', 'patient_export_custom', '患者カスタム条件データを取得しました', {
    count: list.length,
    condition: trimmed,
  });
  return list;
};

export const fetchPatientCountByPrefix = async (prefix: string): Promise<number> => {
  const trimmed = prefix.trim();
  const endpoint = `/patient/count/${encodeURIComponent(trimmed)}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.patientExport.countByPrefix,
    `GET ${endpoint}`,
    async () => httpClient.get<string>(endpoint),
    { prefix: trimmed },
  );
  const count = Number.parseInt((response.data ?? '0').trim(), 10);
  recordOperationEvent('administration', 'info', 'patient_export_count', '患者件数を取得しました', {
    prefix: trimmed,
    count,
  });
  return Number.isFinite(count) ? count : 0;
};
