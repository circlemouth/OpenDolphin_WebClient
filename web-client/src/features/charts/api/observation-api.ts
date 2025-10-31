import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';
import { recordOperationEvent } from '@/libs/audit';

import type { ObservationListResponse, ObservationModel } from '@/features/charts/types/observation';

const encodeParam = (value: string) => encodeURIComponent(value);

export const fetchObservations = async (
  karteId: number,
  observation: string | null,
  phenomenon: string | null,
  firstConfirmed?: string,
): Promise<ObservationModel[]> => {
  const parts = [karteId, observation ?? '', phenomenon ?? ''];
  if (firstConfirmed) {
    parts.push(firstConfirmed);
  }
  const endpoint = `/karte/observations/${encodeParam(parts.join(','))}`;
  const response = await measureApiPerformance(
    'charts.observations.fetch',
    `GET ${endpoint}`,
    async () => httpClient.get<ObservationListResponse>(endpoint),
    { karteId, observation, phenomenon, firstConfirmed },
  );
  return response.data?.list ?? [];
};

const wrapObservationList = (list: ObservationModel[]) => ({
  list,
});

export const createObservations = async (observations: ObservationModel[]): Promise<number[]> => {
  const response = await measureApiPerformance(
    'charts.observations.create',
    'POST /karte/observations',
    async () => httpClient.post<string>('/karte/observations', wrapObservationList(observations)),
    { count: observations.length },
  );
  const payload = response.data ?? '';
  const ids = payload
    .split(',')
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  recordOperationEvent('chart', 'info', 'observation_create', '観察記録を登録しました', {
    count: ids.length,
  });
  return ids;
};

export const updateObservations = async (observations: ObservationModel[]): Promise<number> => {
  const response = await measureApiPerformance(
    'charts.observations.update',
    'PUT /karte/observations',
    async () => httpClient.put<string>('/karte/observations', wrapObservationList(observations)),
    { count: observations.length },
  );
  recordOperationEvent('chart', 'info', 'observation_update', '観察記録を更新しました', {
    count: observations.length,
  });
  return Number.parseInt(response.data ?? '0', 10);
};

export const deleteObservations = async (ids: number[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }
  const endpoint = `/karte/observations/${ids.join(',')}`;
  await measureApiPerformance(
    'charts.observations.delete',
    `DELETE ${endpoint}`,
    async () => httpClient.delete(endpoint),
    { count: ids.length },
  );
  recordOperationEvent('chart', 'warning', 'observation_delete', '観察記録を削除しました', {
    count: ids.length,
  });
};
