import type { RawPatientResource } from '@/features/patients/types/patient';

export interface RawPatientModel extends RawPatientResource {
  id?: number;
  ownerUUID?: string | null;
  pvtDate?: string;
  memo?: string;
  healthInsurances?: Array<{
    id?: number;
    beanBytes?: string;
  }> | null;
}

export interface RawPatientVisit {
  id?: number;
  facilityId?: string;
  pvtDate?: string;
  appointment?: string;
  department?: string;
  state?: number;
  memo?: string;
  insuranceUid?: string;
  deptCode?: string;
  deptName?: string;
  doctorId?: string;
  doctorName?: string;
  jmariNumber?: string;
  patientModel?: RawPatientModel | null;
}

export interface PatientVisitSummary {
  visitId: number;
  facilityId?: string;
  visitDate?: string;
  state: number;
  memo?: string;
  insuranceUid?: string;
  departmentCode?: string;
  departmentName?: string;
  doctorId?: string;
  doctorName?: string;
  jmariNumber?: string;
  patientPk: number;
  patientId: string;
  fullName: string;
  kanaName?: string;
  gender?: string;
  birthday?: string;
  ownerUuid?: string | null;
  safetyNotes: string[];
  raw: RawPatientVisit;
}

export interface PatientVisitListResponse {
  list?: RawPatientVisit[] | null;
}
