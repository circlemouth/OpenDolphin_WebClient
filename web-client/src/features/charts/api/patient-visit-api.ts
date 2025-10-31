import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';
import { httpClient } from '@/libs/http';

import type {
  PatientVisitListResponse,
  PatientVisitSummary,
  RawPatientModel,
  RawPatientVisit,
} from '@/features/charts/types/patient-visit';

export const normalizePatientVisit = (resource: RawPatientVisit): PatientVisitSummary | null => {
  const visitId = resource.id ?? 0;
  const patientModel: RawPatientModel | null | undefined = resource.patientModel;
  const patientPk = patientModel?.id ?? 0;
  const patientId = patientModel?.patientId?.trim();
  const fullName = patientModel?.fullName?.trim();

  if (!visitId || !patientPk || !patientId || !fullName) {
    return null;
  }

  const safetyNotes = buildSafetyNotes([
    patientModel?.appMemo,
    patientModel?.reserve1,
    patientModel?.reserve2,
    patientModel?.reserve3,
    patientModel?.reserve4,
    patientModel?.reserve5,
    patientModel?.reserve6,
    resource.memo,
  ]);

  return {
    visitId,
    facilityId: resource.facilityId ?? undefined,
    visitDate: resource.pvtDate ?? undefined,
    state: resource.state ?? 0,
    memo: resource.memo ?? undefined,
    insuranceUid: resource.insuranceUid ?? undefined,
    departmentCode: resource.deptCode ?? resource.department ?? undefined,
    departmentName: resource.deptName ?? undefined,
    doctorId: resource.doctorId ?? undefined,
    doctorName: resource.doctorName ?? undefined,
    jmariNumber: resource.jmariNumber ?? undefined,
    patientPk,
    patientId,
    fullName,
    kanaName: patientModel?.kanaName ?? undefined,
    gender: patientModel?.gender ?? undefined,
    birthday: patientModel?.birthday ?? undefined,
    ownerUuid: patientModel?.ownerUUID ?? null,
    safetyNotes,
    raw: resource,
  };
};

export const fetchPatientVisits = async (): Promise<PatientVisitSummary[]> => {
  const response = await httpClient.get<PatientVisitListResponse>('/pvt2/pvtList');
  const list = response.data?.list ?? [];

  return list
    .map(normalizePatientVisit)
    .filter((visit): visit is PatientVisitSummary => Boolean(visit));
};
