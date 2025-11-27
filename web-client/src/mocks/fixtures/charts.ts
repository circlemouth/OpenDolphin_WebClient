import { CHART_EVENT_TYPES } from '@/features/charts/types/chart-event';
import type { RawChartEvent } from '@/features/charts/types/chart-event';
import type { DocInfoListResponse, RawDocInfoModel } from '@/features/charts/types/doc';
import type { PatientVisitListResponse, RawPatientVisit } from '@/features/charts/types/patient-visit';
import type { RawKarteBean } from '@/features/patients/types/karte';
import type { RawPatientResource } from '@/features/patients/types/patient';
import type { RawFreeDocumentResource } from '@/features/charts/api/free-document-api';
import type { RawLaboModuleListResponse } from '@/features/charts/types/labo';

const samplePatientVisit: RawPatientVisit = {
  id: 72001,
  facilityId: 'OPD-DEMO-01',
  pvtDate: '2025-11-01T09:15:00+09:00',
  state: 1,
  memo: '胸部違和感を訴え。バイタル確認済み。',
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
    memo: '定期的に胸部圧迫感あり。',
    ownerUUID: 'e2e-playwright',
    healthInsurances: [
      {
        id: 93001,
        beanBytes:
          'PFBWVEhlYWx0aEluc3VyYW5jZU1vZGVsPjx1dWlkPmMzYWYwNDkxLThlM2UtNGEwMS1hYWNmLTRiYzI5ZDBhMWQ5YzwvdXVpZD48aW5zdXJhbmNlQ2xhc3M+56S+5L+d5pys5Lq6PC9pbnN1cmFuY2VDbGFzcz48aW5zdXJhbmNlQ2xhc3NDb2RlPjAxPC9pbnN1cmFuY2VDbGFzc0NvZGU+PGluc3VyYW5jZU51bWJlcj4xMjM0NTY3PC9pbnN1cmFuY2VOdW1iZXI+PGNsaWVudEdyb3VwPjEyPC9jbGllbnRHcm91cD48Y2xpZW50TnVtYmVyPjM0NTY8L2NsaWVudE51bWJlcj48c3RhcnREYXRlPjIwMjQtMDQtMDE8L3N0YXJ0RGF0ZT48L1BWVEhlYWx0aEluc3VyYW5jZU1vZGVsPg==',
      },
    ],
  },
};

const sampleDocInfos: RawDocInfoModel[] = [
  {
    docPk: 88001,
    docId: 'DOC-20251101-001',
    docType: 'karte',
    title: '2025/11/01 診察記録',
    purpose: '再診',
    confirmDate: '2025-11-01T10:05:00+09:00',
    firstConfirmDate: '2025-11-01T10:05:00+09:00',
    department: '内科',
    departmentDesc: '内科',
    healthInsurance: '社保本人',
    healthInsuranceDesc: '社会保険本人 (01)',
    healthInsuranceGUID: 'c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c',
    patientName: samplePatientVisit.patientModel?.fullName ?? null,
    patientId: samplePatientVisit.patientModel?.patientId ?? null,
    patientGender: samplePatientVisit.patientModel?.gender ?? null,
    facilityName: 'オープンドルフィン診療所',
    creatorLicense: '医師',
    status: 'F',
    hasMark: true,
    hasImage: false,
    hasRp: true,
    hasTreatment: false,
    hasLaboTest: true,
    sendClaim: true,
    sendLabtest: false,
    sendMml: false,
    claimDate: '2025-11-01T11:00:00+09:00',
    versionNumber: '1',
    parentId: null,
    parentIdRelation: null,
    pVTHealthInsuranceModel: {
      uuid: 'c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c',
      insuranceClass: '社保本人',
      insuranceClassCode: '01',
      insuranceNumber: '1234567',
      clientGroup: '12',
      clientNumber: '3456',
      startDate: '2024-04-01',
      expiredDate: null,
    },
  },
  {
    docPk: 88000,
    docId: 'DOC-20241015-002',
    docType: 'karte',
    title: '2024/10/15 定期フォロー',
    purpose: '定期受診',
    confirmDate: '2024-10-15T09:45:00+09:00',
    firstConfirmDate: '2024-10-15T09:45:00+09:00',
    department: '内科',
    departmentDesc: '内科',
    healthInsurance: '社保本人',
    healthInsuranceDesc: '社会保険本人 (01)',
    healthInsuranceGUID: 'c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c',
    patientName: samplePatientVisit.patientModel?.fullName ?? null,
    patientId: samplePatientVisit.patientModel?.patientId ?? null,
    patientGender: samplePatientVisit.patientModel?.gender ?? null,
    facilityName: 'オープンドルフィン診療所',
    creatorLicense: '医師',
    status: 'F',
    hasMark: false,
    hasImage: false,
    hasRp: true,
    hasTreatment: false,
    hasLaboTest: false,
    sendClaim: true,
    sendLabtest: false,
    sendMml: false,
    claimDate: '2024-10-16T08:30:00+09:00',
    versionNumber: '2',
    parentId: null,
    parentIdRelation: null,
    pVTHealthInsuranceModel: {
      uuid: 'c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c',
      insuranceClass: '社保本人',
      insuranceClassCode: '01',
      insuranceNumber: '1234567',
      clientGroup: '12',
      clientNumber: '3456',
      startDate: '2024-04-01',
      expiredDate: null,
    },
  },
];

export const patientVisitListFixture: PatientVisitListResponse = {
  list: [samplePatientVisit],
};

export const chartsPatientListFixture = {
  list: [samplePatientVisit],
  sequence: '1700000000000',
  gapSize: 42,
};

export const docInfoListFixture: DocInfoListResponse = {
  list: sampleDocInfos,
};

export const chartEventFixture: RawChartEvent = {
  eventType: CHART_EVENT_TYPES.PVT_STATE,
  pvtPk: samplePatientVisit.id ?? undefined,
  state: samplePatientVisit.state,
  ownerUUID: samplePatientVisit.patientModel?.ownerUUID ?? null,
  facilityId: samplePatientVisit.facilityId,
  memo: samplePatientVisit.memo,
  ptPk: samplePatientVisit.patientModel?.id,
  patientModel: samplePatientVisit.patientModel,
  patientVisitModel: samplePatientVisit,
};

export const patientDetailFixture: RawPatientResource = {
  id: samplePatientVisit.patientModel?.id,
  patientId: samplePatientVisit.patientModel?.patientId,
  fullName: samplePatientVisit.patientModel?.fullName,
  kanaName: samplePatientVisit.patientModel?.kanaName,
  gender: samplePatientVisit.patientModel?.gender,
  birthday: samplePatientVisit.patientModel?.birthday,
  appMemo: samplePatientVisit.patientModel?.appMemo,
  reserve1: samplePatientVisit.patientModel?.reserve1,
  reserve2: samplePatientVisit.patientModel?.reserve2,
  memo: samplePatientVisit.patientModel?.memo,
  pvtDate: samplePatientVisit.pvtDate ?? undefined,
  simpleAddressModel: {
    zipCode: '1000001',
    address: '東京都千代田区千代田1-1',
  },
  healthInsurances: samplePatientVisit.patientModel?.healthInsurances ?? [],
};

export const karteSummaryFixture: RawKarteBean = {
  id: samplePatientVisit.patientModel?.id,
  created: '2023-12-01T00:00:00+09:00',
  allergies: [
    { factor: '造影剤アレルギー', severity: '中等度', memo: '事前にプレメディケーション検討' },
  ],
  docInfoList: sampleDocInfos.slice(0, 2).map((entry) => ({
    docPk: entry.docPk,
    title: entry.title ?? undefined,
    confirmDate: entry.confirmDate,
    firstConfirmDate: entry.firstConfirmDate,
    departmentDesc: entry.departmentDesc,
    hasMark: entry.hasMark ?? undefined,
    status: entry.status ?? undefined,
  })),
  memoList: [{ id: 31001, memo: '定期フォロー中', confirmed: '2025-11-01T09:00:00+09:00' }],
  lastDocDate: sampleDocInfos[0]?.confirmDate ?? null,
};

export const freeDocumentFixture: RawFreeDocumentResource = {
  id: 91001,
  facilityPatId: samplePatientVisit.patientModel?.patientId,
  confirmed: '2025-11-01T09:30:00+09:00',
  comment: '経過観察のため来週再診予定です。',
};

export const labModuleListFixture: RawLaboModuleListResponse = {
  list: [
    {
      id: 61001,
      patientId: samplePatientVisit.patientModel?.patientId,
      patientName: samplePatientVisit.patientModel?.fullName,
      patientSex: samplePatientVisit.patientModel?.gender,
      sampleDate: '2025-10-30T08:15:00+09:00',
      numOfItems: '2',
      moduleKey: 'LAB-20251030-01',
      reportFormat: 'standard',
      items: [
        {
          id: 1,
          itemCode: 'HB',
          itemName: 'ヘモグロビン',
          value: '13.2',
          unit: 'g/dL',
          abnormalFlg: 'N',
          normalValue: '11.6-14.8',
          sampleDate: '2025-10-30T08:15:00+09:00',
        },
        {
          id: 2,
          itemCode: 'WBC',
          itemName: '白血球数',
          value: '5600',
          unit: '/µL',
          abnormalFlg: 'N',
          normalValue: '3300-8600',
          sampleDate: '2025-10-30T08:15:00+09:00',
        },
      ],
    },
  ],
};
