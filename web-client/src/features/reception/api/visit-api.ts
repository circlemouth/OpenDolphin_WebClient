import { httpClient } from '@/libs/http';
import type { PatientDetail, PatientDetailAddress } from '@/features/patients/types/patient';

export interface VisitRegistrationOptions {
  memo?: string;
  doctorId?: string;
  doctorName?: string;
  departmentCode?: string;
  departmentName?: string;
  insuranceUid?: string;
  appointment?: string;
  checkInAt?: Date;
  source?: 'barcode' | 'manual' | 'schedule';
}

interface VisitRegistrationPayload {
  pvtDate: string;
  state: number;
  memo?: string;
  doctorId?: string;
  doctorName?: string;
  deptCode?: string;
  deptName?: string;
  insuranceUid?: string;
  appointment?: string;
  facilityId?: string;
  department?: string;
  patientModel: Record<string, unknown>;
}

const STORAGE_SAFE_KEYS: Array<keyof VisitRegistrationPayload> = [
  'pvtDate',
  'state',
  'memo',
  'doctorId',
  'doctorName',
  'deptCode',
  'deptName',
  'insuranceUid',
  'appointment',
  'facilityId',
  'department',
  'patientModel',
];

const sanitizeString = (value: string | undefined | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildSimpleAddress = (address?: PatientDetailAddress | null) => {
  if (!address) {
    return undefined;
  }
  const zipCode = sanitizeString(address.zipCode);
  const addr = sanitizeString(address.address);
  if (!zipCode && !addr) {
    return undefined;
  }
  return {
    zipCode,
    address: addr,
  };
};

const mergePatientModel = (patient: PatientDetail): Record<string, unknown> => {
  const raw = patient.raw ?? {};

  const payload: Record<string, unknown> = {
    ...raw,
    id: patient.id,
    patientId: sanitizeString(patient.patientId),
    fullName: sanitizeString(patient.fullName),
    kanaName: sanitizeString(patient.kanaName),
    gender: sanitizeString(patient.gender),
    genderDesc: sanitizeString(patient.genderDesc),
    birthday: sanitizeString(patient.birthday),
    memo: sanitizeString(patient.memo),
    appMemo: sanitizeString(patient.appMemo),
    relations: sanitizeString(patient.relations),
    telephone: sanitizeString(patient.telephone),
    mobilePhone: sanitizeString(patient.mobilePhone),
    email: sanitizeString(patient.email),
    reserve1: sanitizeString(patient.reserve1),
    reserve2: sanitizeString(patient.reserve2),
    reserve3: sanitizeString(patient.reserve3),
    reserve4: sanitizeString(patient.reserve4),
    reserve5: sanitizeString(patient.reserve5),
    reserve6: sanitizeString(patient.reserve6),
    simpleAddressModel: buildSimpleAddress(patient.address),
    healthInsurances:
      patient.healthInsurances.length > 0
        ? patient.healthInsurances.map((entry) => ({
            id: entry.id,
            beanBytes: entry.beanBytes,
          }))
        : raw.healthInsurances,
  };

  // Remove undefined entries explicitly to avoid sending empty keys
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
};

export const buildVisitRegistrationPayload = (
  patient: PatientDetail,
  options: VisitRegistrationOptions = {},
): VisitRegistrationPayload => {
  const checkInAt = options.checkInAt ?? new Date();
  const timestamp = checkInAt.toISOString();
  const departmentName = sanitizeString(options.departmentName);
  const departmentCode = sanitizeString(options.departmentCode);
  const doctorName = sanitizeString(options.doctorName);
  const doctorId = sanitizeString(options.doctorId);
  const insuranceUid = sanitizeString(options.insuranceUid);
  const memo = sanitizeString(options.memo);
  const appointment = sanitizeString(options.appointment);

  const departmentAggregate = [departmentName, departmentCode, doctorName, doctorId]
    .map((value) => value ?? '')
    .join(',');

  return {
    pvtDate: timestamp,
    state: 0,
    memo,
    doctorId: doctorId,
    doctorName: doctorName,
    deptCode: departmentCode,
    deptName: departmentName,
    insuranceUid,
    appointment,
    department: departmentAggregate,
    patientModel: mergePatientModel(patient),
  } satisfies VisitRegistrationPayload;
};

export const registerVisit = async (
  patient: PatientDetail,
  options: VisitRegistrationOptions = {},
) => {
  const payload = buildVisitRegistrationPayload(patient, options);
  const requestBody = Object.fromEntries(
    STORAGE_SAFE_KEYS.map((key) => {
      const value = payload[key];
      return value === undefined ? null : [key, value];
    }).filter(Boolean) as Array<[keyof VisitRegistrationPayload, unknown]>,
  );

  await httpClient.post('/pvt2', requestBody);
};

export const updateVisitState = async (visitId: number, state: number) => {
  const endpoint = `/pvt/${visitId},${state}`;
  await httpClient.put<string>(endpoint);
};

export const deleteVisit = async (visitId: number) => {
  await httpClient.delete(`/pvt2/${visitId}`);
};
