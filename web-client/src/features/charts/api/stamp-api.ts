import { httpClient } from '@/libs/http';

import type { StampDefinition, StampTreeHolderResponse } from '@/features/charts/types/stamp';
import type { StampModelPayload } from '@/features/charts/types/module';
import { extractStampDefinitions } from '@/features/charts/utils/stamp-tree';

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
