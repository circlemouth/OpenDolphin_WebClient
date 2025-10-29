import { httpClient } from '@/libs/http';

import type { StampDefinition, StampTreeHolderResponse } from '@/features/charts/types/stamp';
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
