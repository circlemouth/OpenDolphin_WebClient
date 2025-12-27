import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';

export type DiseaseEntry = {
  diagnosisId?: number;
  diagnosisName?: string;
  diagnosisCode?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  startDate?: string;
  endDate?: string;
  outcome?: string;
  category?: string;
  suspectedFlag?: string;
};

export type DiseaseImportResponse = {
  patientId?: string;
  baseDate?: string;
  apiResult?: string;
  apiResultMessage?: string;
  runId?: string;
  diseases?: DiseaseEntry[];
};

export type DiseaseMutationOperation = {
  operation: 'create' | 'update' | 'delete';
  diagnosisId?: number;
  diagnosisName?: string;
  diagnosisCode?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  startDate?: string;
  endDate?: string;
  outcome?: string;
  category?: string;
  suspectedFlag?: string;
  note?: string;
};

export type DiseaseMutationResult = {
  ok: boolean;
  runId?: string;
  message?: string;
  createdDiagnosisIds?: number[];
  updatedDiagnosisIds?: number[];
  removedDiagnosisIds?: number[];
  raw?: unknown;
};

export async function fetchDiseases(params: {
  patientId: string;
  from?: string;
  to?: string;
  activeOnly?: boolean;
}): Promise<DiseaseImportResponse> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.activeOnly) query.set('activeOnly', 'true');
  const queryString = query.toString();
  const response = await httpFetch(`/orca/disease/import/${encodeURIComponent(params.patientId)}${queryString ? `?${queryString}` : ''}`);
  const json = (await response.json().catch(() => ({}))) as DiseaseImportResponse;
  return json;
}

export async function mutateDiseases(params: {
  patientId: string;
  operations: DiseaseMutationOperation[];
}): Promise<DiseaseMutationResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const response = await httpFetch('/orca/disease', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: params.patientId, operations: params.operations }),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    runId: typeof json.runId === 'string' ? (json.runId as string) : runId,
    message: typeof json.apiResultMessage === 'string' ? (json.apiResultMessage as string) : undefined,
    createdDiagnosisIds: Array.isArray(json.createdDiagnosisIds) ? (json.createdDiagnosisIds as number[]) : undefined,
    updatedDiagnosisIds: Array.isArray(json.updatedDiagnosisIds) ? (json.updatedDiagnosisIds as number[]) : undefined,
    removedDiagnosisIds: Array.isArray(json.removedDiagnosisIds) ? (json.removedDiagnosisIds as number[]) : undefined,
    raw: json,
  };
}
