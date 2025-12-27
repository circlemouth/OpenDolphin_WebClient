import type { BannerTone } from '../reception/components/ToneBanner';
import { buildApiFailureBanner } from '../shared/apiError';
import type { ReceptionEntry } from './types';

export type AppointmentDataBanner = {
  tone: BannerTone;
  message: string;
};

type AppointmentDataBannerInput = {
  entries: ReceptionEntry[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  date?: string;
};

export function getAppointmentDataBanner({
  entries,
  isLoading,
  isError,
  error,
  date,
}: AppointmentDataBannerInput): AppointmentDataBanner | null {
  if (isLoading && entries.length === 0) {
    return { tone: 'info', message: `予約/来院データを取得中…${date ? `（${date}）` : ''}` };
  }

  if (isError) {
    const banner = buildApiFailureBanner('予約/来院データ', { error }, '取得');
    return { tone: banner.tone, message: banner.message };
  }

  if (entries.length === 0) {
    return { tone: 'info', message: `予約/来院データがありません。${date ? `（${date}）` : ''}` };
  }

  const missingPatientId = entries.filter((entry) => !entry.patientId).length;
  const missingAppointmentId = entries.filter((entry) => !entry.appointmentId).length;
  const missingReceptionId = entries.filter((entry) => entry.source === 'visits' && !entry.receptionId).length;

  if (missingPatientId === 0 && missingAppointmentId === 0 && missingReceptionId === 0) return null;

  const parts = [
    missingPatientId > 0 ? `患者ID欠損: ${missingPatientId}` : undefined,
    missingAppointmentId > 0 ? `予約ID欠損: ${missingAppointmentId}` : undefined,
    missingReceptionId > 0 ? `受付ID欠損: ${missingReceptionId}` : undefined,
  ].filter((value): value is string => typeof value === 'string');

  return { tone: 'warning', message: `予約/来院データに不整合があります（${parts.join(' / ')}）` };
}
