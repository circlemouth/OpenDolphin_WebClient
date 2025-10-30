import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

export interface CreateScheduleDocumentParams {
  visitId: number;
  patientPk: number;
  scheduleDate: string;
  providerId: number;
  sendClaim: boolean;
}

export interface DeleteScheduleEntryParams {
  visitId: number;
  patientPk: number;
  scheduleDate: string;
}

const toStartOfDayEpoch = (date: string): number => {
  const [year, month, day] = date.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month || !day) {
    throw new Error(`予約日の形式が不正です: ${date}`);
  }
  const epoch = new Date(year, month - 1, day).getTime();
  if (Number.isNaN(epoch)) {
    throw new Error(`予約日の解析に失敗しました: ${date}`);
  }
  return epoch;
};

const buildDeletionEndpoint = ({ visitId, patientPk, scheduleDate }: DeleteScheduleEntryParams) =>
  `/schedule/pvt/${visitId},${patientPk},${scheduleDate}`;

export const createScheduleDocument = async ({
  visitId,
  patientPk,
  scheduleDate,
  providerId,
  sendClaim,
}: CreateScheduleDocumentParams): Promise<number> =>
  measureApiPerformance(
    'schedule.document.create',
    'POST /schedule/document',
    async () => {
      const payload = {
        pvtPK: visitId,
        ptPK: patientPk,
        scheduleDate: toStartOfDayEpoch(scheduleDate),
        phPK: providerId,
        sendClaim,
      } satisfies {
        pvtPK: number;
        ptPK: number;
        scheduleDate: number;
        phPK: number;
        sendClaim: boolean;
      };

      const response = await httpClient.post<string>('/schedule/document', payload);
      const count = response.data ? Number.parseInt(response.data, 10) : 0;
      return Number.isNaN(count) ? 0 : count;
    },
    { visitId, patientPk, scheduleDate, providerId, sendClaim },
  );

export const deleteScheduledVisit = async (params: DeleteScheduleEntryParams): Promise<void> =>
  measureApiPerformance(
    'schedule.document.delete',
    'DELETE /schedule/pvt/{param}',
    async () => {
      const endpoint = buildDeletionEndpoint(params);
      await httpClient.delete(endpoint);
    },
    params,
  );
