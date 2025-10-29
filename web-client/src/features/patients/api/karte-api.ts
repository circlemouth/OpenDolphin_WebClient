import { httpClient } from '@/libs/http';

import type {
  AllergySummary,
  DocInfoSummary,
  KarteSummary,
  PatientMemoSummary,
  RawAllergyResource,
  RawDocInfoResource,
  RawKarteBean,
  RawMemoResource,
} from '@/features/patients/types/karte';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const transformAllergy = (raw: RawAllergyResource): AllergySummary | null => {
  if (!isNonEmptyString(raw.factor)) {
    return null;
  }

  return {
    factor: raw.factor.trim(),
    severity: raw.severity?.trim(),
    memo: raw.memo?.trim(),
    identifiedDate: raw.identifiedDate?.trim(),
  };
};

const transformDocInfo = (raw: RawDocInfoResource): DocInfoSummary | null => {
  if (!raw.docPk || !isNonEmptyString(raw.title)) {
    return null;
  }

  return {
    docPk: raw.docPk,
    title: raw.title.trim(),
    confirmDate: raw.confirmDate ?? raw.firstConfirmDate ?? null,
    departmentDesc: raw.departmentDesc ?? null,
    hasMark: raw.hasMark ?? false,
    status: raw.status ?? undefined,
  };
};

const transformMemo = (raw: RawMemoResource): PatientMemoSummary | null => {
  if (!raw.id) {
    return null;
  }

  return {
    id: raw.id,
    memo: raw.memo?.trim(),
    confirmed: raw.confirmed ?? raw.started ?? null,
    status: raw.status ?? undefined,
  };
};

export const buildKartePidPath = (patientId: string, fromDate: string): string =>
  `/karte/pid/${encodeURIComponent(`${patientId},${fromDate}`)}`;

export const fetchKarteByPatientId = async (
  patientId: string,
  fromDate: string,
): Promise<KarteSummary | null> => {
  const trimmedId = patientId.trim();
  if (!trimmedId) {
    return null;
  }

  const endpoint = buildKartePidPath(trimmedId, fromDate.trim());
  const response = await httpClient.get<RawKarteBean>(endpoint);
  const raw = response.data;

  if (!raw || !raw.id) {
    return null;
  }

  const allergies = (raw.allergies ?? [])
    .map(transformAllergy)
    .filter((entry): entry is AllergySummary => Boolean(entry));
  const documents = (raw.docInfoList ?? [])
    .map(transformDocInfo)
    .filter((entry): entry is DocInfoSummary => Boolean(entry));
  const memos = (raw.memoList ?? [])
    .map(transformMemo)
    .filter((entry): entry is PatientMemoSummary => Boolean(entry));

  return {
    id: raw.id,
    created: raw.created,
    allergies,
    documents,
    memos,
    lastDocDate: raw.lastDocDate ?? null,
  };
};
