import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';

export type OrderBundleItem = {
  name: string;
  quantity?: string;
  unit?: string;
  memo?: string;
};

export type OrderBundle = {
  documentId?: number;
  moduleId?: number;
  entity?: string;
  bundleName?: string;
  bundleNumber?: string;
  admin?: string;
  adminMemo?: string;
  memo?: string;
  started?: string;
  items: OrderBundleItem[];
};

export type OrderBundleFetchResult = {
  ok: boolean;
  runId?: string;
  patientId?: string;
  recordsReturned?: number;
  bundles: OrderBundle[];
  message?: string;
};

export type OrderBundleOperation = {
  operation: 'create' | 'update' | 'delete';
  documentId?: number;
  moduleId?: number;
  entity?: string;
  bundleName?: string;
  bundleNumber?: string;
  admin?: string;
  adminMemo?: string;
  memo?: string;
  startDate?: string;
  endDate?: string;
  items?: OrderBundleItem[];
};

export type OrderBundleMutationResult = {
  ok: boolean;
  runId?: string;
  createdDocumentIds?: number[];
  updatedDocumentIds?: number[];
  deletedDocumentIds?: number[];
  message?: string;
  raw?: unknown;
};

export async function fetchOrderBundles(params: {
  patientId: string;
  entity?: string;
  from?: string;
}): Promise<OrderBundleFetchResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const query = new URLSearchParams();
  if (params.entity) query.set('entity', params.entity);
  if (params.from) query.set('from', params.from);
  const response = await httpFetch(`/orca/order/bundles?patientId=${encodeURIComponent(params.patientId)}${query.toString() ? `&${query.toString()}` : ''}`);
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    runId: typeof json.runId === 'string' ? (json.runId as string) : runId,
    patientId: typeof json.patientId === 'string' ? (json.patientId as string) : params.patientId,
    recordsReturned: typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : undefined,
    bundles: Array.isArray(json.bundles) ? (json.bundles as OrderBundle[]) : [],
    message: typeof json.apiResultMessage === 'string' ? (json.apiResultMessage as string) : undefined,
  };
}

export async function mutateOrderBundles(params: {
  patientId: string;
  operations: OrderBundleOperation[];
}): Promise<OrderBundleMutationResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const response = await httpFetch('/orca/order/bundles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: params.patientId, operations: params.operations }),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    runId: typeof json.runId === 'string' ? (json.runId as string) : runId,
    createdDocumentIds: Array.isArray(json.createdDocumentIds) ? (json.createdDocumentIds as number[]) : undefined,
    updatedDocumentIds: Array.isArray(json.updatedDocumentIds) ? (json.updatedDocumentIds as number[]) : undefined,
    deletedDocumentIds: Array.isArray(json.deletedDocumentIds) ? (json.deletedDocumentIds as number[]) : undefined,
    message: typeof json.apiResultMessage === 'string' ? (json.apiResultMessage as string) : undefined,
    raw: json,
  };
}
