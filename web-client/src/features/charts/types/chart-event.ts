import type { RawPatientModel, RawPatientVisit } from '@/features/charts/types/patient-visit';

export const CHART_EVENT_TYPES = {
  PVT_STATE: 0,
  PVT_ADD: 1,
  PVT_DELETE: 2,
  PVT_RENEW: 3,
  PVT_MERGE: 4,
  PM_MERGE: 5,
  PVT_MEMO: 6,
} as const;

export type ChartEventType = (typeof CHART_EVENT_TYPES)[keyof typeof CHART_EVENT_TYPES];

export interface RawChartEvent {
  eventType?: ChartEventType;
  pvtPk?: number;
  state?: number;
  byomeiCount?: number;
  byomeiCountToday?: number;
  issuerUUID?: string;
  ownerUUID?: string | null;
  facilityId?: string;
  memo?: string;
  ptPk?: number;
  patientModel?: RawPatientModel | null;
  patientVisitModel?: RawPatientVisit | null;
}
