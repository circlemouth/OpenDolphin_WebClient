import { CHART_EVENT_TYPES, type RawChartEvent } from '@/features/charts/types/chart-event';

export const chartEventLongPollPayload: RawChartEvent = {
  eventType: CHART_EVENT_TYPES.PVT_STATE,
  pvtPk: 501,
  state: 1,
  ownerUUID: null,
  facilityId: 'OPD-DEMO-01',
  memo: 'lp-only fallback event',
  ptPk: 50001,
  patientModel: {
    id: 50001,
    patientId: '000001',
    fullName: '佐藤 花子',
    kanaName: 'サトウ ハナコ',
    gender: 'F',
    birthday: '1983-02-14',
    appMemo: 'MRI 禁忌。造影剤アレルギーあり。',
    reserve1: '緊急連絡先: 090-1234-5678',
    reserve2: '薬剤アレルギー: ペニシリン',
    memo: 'lp-only fallback patient memo',
    ownerUUID: null,
    healthInsurances: [],
  },
  patientVisitModel: {
    id: 72001,
    facilityId: 'OPD-DEMO-01',
    pvtDate: '2025-11-23T00:01:00+09:00',
    state: 1,
    memo: 'LP poll sample',
    insuranceUid: 'INS-0000001',
    deptCode: '01',
    deptName: '内科',
    doctorId: 'dr001',
    doctorName: '山田 太郎',
    jmariNumber: '2A1234567',
    patientModel: {
      id: 50001,
      patientId: '000001',
      fullName: '佐藤 花子',
      kanaName: 'サトウ ハナコ',
      gender: 'F',
      birthday: '1983-02-14',
      appMemo: 'MRI 禁忌。造影剤アレルギーあり。',
      reserve1: '緊急連絡先: 090-1234-5678',
      reserve2: '薬剤アレルギー: ペニシリン',
      memo: 'lp-only fallback patient memo',
      ownerUUID: null,
      healthInsurances: [],
    },
  },
};

export const chartEventSseData = {
  id: 501,
  chartId: 'chart-001',
  category: 'stamp',
  status: 'deleted',
  updatedAt: '2025-11-23T00:01:23Z',
};

export const imagesPlaceholderResponse = {
  list: [] as unknown[],
  page: 1,
  total: 0,
  meta: {
    placeholder: true,
    maxSizeBytes: 0,
  },
};

export const modulesPlaceholderResponse = {
  list: [] as unknown[],
  chartId: 'chart-001',
  syncedAt: '2025-11-23T00:00:00Z',
};

export const stampTreeSyncResponseText = '9001,2025-11-23T00:00:00Z';

export const retryAfterPayload = {
  retryAfter: 3,
};
