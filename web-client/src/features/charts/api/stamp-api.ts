import { httpClient } from '@/libs/http';

import type { StampDefinition, StampTreeHolderResponse } from '@/features/charts/types/stamp';
import type { StampModelPayload } from '@/features/charts/types/module';
import { extractStampDefinitions } from '@/features/charts/utils/stamp-tree';

export interface StampTreeModelRequest {
  id?: number | null;
  userModel: {
    id: number;
  };
  name: string;
  category?: string | null;
  publishType?: string | null;
  partyName?: string | null;
  url?: string | null;
  description?: string | null;
  publishedDate?: string | null;
  lastUpdated?: string | null;
  published?: string | null;
  treeBytes: string;
  versionNumber?: string | null;
}

export interface StampTreeSyncResponse {
  id: number;
  versionNumber: string | null;
}

export interface StampModelRequest {
  id: string;
  userId: number;
  entity: string;
  stampBytes: string;
}

export const fetchStampLibrary = async (userPk: number): Promise<StampDefinition[]> => {
  const endpoint = `/stamp/tree/${userPk}`;
  const response = await httpClient.get<StampTreeHolderResponse>(endpoint);
  const payload = response.data;
  if (!payload) {
    return [];
  }
  return extractStampDefinitions(payload.personalTree, payload.subscribedList);
};

export const fetchStampModule = async (stampId: string): Promise<StampModelPayload> => {
  const endpoint = `/stamp/id/${encodeURIComponent(stampId)}`;
  const response = await httpClient.get<StampModelPayload>(endpoint);
  if (!response.data || !response.data.stampBytes) {
    throw new Error('スタンプ定義の取得に失敗しました。スタンプを再同期してください。');
  }
  return response.data;
};

export const fetchStampTreeHolder = async (userPk: number) => {
  const endpoint = `/stamp/tree/${userPk}`;
  const response = await httpClient.get<StampTreeHolderResponse>(endpoint);
  return response.data;
};

const buildTreePayload = (input: StampTreeModelRequest) => {
  const payload: StampTreeModelRequest = {
    ...input,
    id: input.id ?? undefined,
    category: input.category ?? undefined,
    publishType: input.publishType ?? undefined,
    partyName: input.partyName ?? undefined,
    url: input.url ?? undefined,
    description: input.description ?? undefined,
    publishedDate: input.publishedDate ?? undefined,
    lastUpdated: input.lastUpdated ?? undefined,
    published: input.published ?? undefined,
    versionNumber: input.versionNumber ?? undefined,
  };
  return payload;
};

export const createStampTree = async (input: StampTreeModelRequest) => {
  const endpoint = '/stamp/tree';
  const payload = buildTreePayload(input);
  const response = await httpClient.put<string>(endpoint, payload);
  const id = Number.parseInt(response.data, 10);
  if (Number.isNaN(id)) {
    throw new Error('スタンプツリーの作成結果を解釈できませんでした。');
  }
  return id;
};

export const syncStampTree = async (input: StampTreeModelRequest): Promise<StampTreeSyncResponse> => {
  const endpoint = '/stamp/tree/sync';
  const payload = buildTreePayload(input);
  const response = await httpClient.put<string>(endpoint, payload);
  const [idStr, version] = response.data.split(',');
  const id = Number.parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    throw new Error('スタンプツリー同期の応答が不正です。');
  }
  return {
    id,
    versionNumber: version ?? null,
  };
};

export const saveStampModel = async (input: StampModelRequest) => {
  const endpoint = '/stamp/id';
  const response = await httpClient.put<string>(endpoint, input);
  return response.data;
};

export const deleteStampModels = async (ids: string[]) => {
  if (!ids.length) {
    return;
  }
  const encoded = ids.map((value) => encodeURIComponent(value)).join(',');
  const endpoint = `/stamp/list/${encoded}`;
  await httpClient.delete(endpoint);
};
