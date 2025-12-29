import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';

export type UserProfileResult = {
  ok: boolean;
  runId?: string;
  id?: number;
  userId?: string;
  message?: string;
};

export type StampTreeEntry = {
  name: string;
  role?: string;
  entity: string;
  memo?: string;
  stampId: string;
};

export type StampTree = {
  treeName?: string;
  entity: string;
  treeOrder?: string;
  stampList: StampTreeEntry[];
};

export type StampTreeResult = {
  ok: boolean;
  runId?: string;
  trees: StampTree[];
  message?: string;
};

export type StampBundleItemJson = {
  name?: string;
  number?: string;
  unit?: string;
  memo?: string;
};

export type StampBundleJson = {
  className?: string;
  classCode?: string;
  classCodeSystem?: string;
  admin?: string;
  adminCode?: string;
  adminCodeSystem?: string;
  adminMemo?: string;
  bundleNumber?: string;
  memo?: string;
  insurance?: string;
  orderName?: string;
  claimItem?: StampBundleItemJson[];
};

export type StampDetailResult = {
  ok: boolean;
  runId?: string;
  stampId: string;
  stamp?: StampBundleJson;
  message?: string;
};

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
};

export async function fetchUserProfile(userName: string): Promise<UserProfileResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const response = await httpFetch(`/user/${encodeURIComponent(userName)}`);
  const json = (await parseJson(response)) as Record<string, unknown>;
  return {
    ok: response.ok,
    runId,
    id: typeof json.id === 'number' ? (json.id as number) : undefined,
    userId: typeof json.userId === 'string' ? (json.userId as string) : undefined,
    message: response.ok ? undefined : (json.message as string | undefined),
  };
}

export async function fetchStampTree(userPk: number): Promise<StampTreeResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const response = await httpFetch(`/touch/stampTree/${encodeURIComponent(String(userPk))}`);
  const json = (await parseJson(response)) as Record<string, unknown>;
  const treeList = Array.isArray(json.stampTreeList) ? (json.stampTreeList as StampTree[]) : [];
  return {
    ok: response.ok,
    runId,
    trees: treeList,
    message: response.ok ? undefined : (json.message as string | undefined),
  };
}

export async function fetchStampDetail(stampId: string): Promise<StampDetailResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const response = await httpFetch(`/touch/stamp/${encodeURIComponent(stampId)}`);
  const json = (await parseJson(response)) as Record<string, unknown>;
  return {
    ok: response.ok,
    runId,
    stampId,
    stamp: response.ok ? (json as StampBundleJson) : undefined,
    message: response.ok ? undefined : (json.message as string | undefined),
  };
}
