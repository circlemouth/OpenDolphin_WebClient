import type {
  LetterSummary,
  MedicalCertificateDetail,
  RawLetterItemResource,
  RawLetterModuleListResource,
  RawLetterModuleResource,
  RawLetterTextResource,
} from '@/features/charts/types/letter';
import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

const LETTER_VIEWER_HANDLE_CLASS = 'open.dolphin.letter.MedicalCertificateViewer';
const MEDICAL_CERTIFICATE_TYPE = 'medicalCertificate';

const toRestTimestampOrNull = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withZone = /([+-]\d{2}:?\d{2}|Z)$/i.test(normalized) ? normalized : `${normalized}+09:00`;
  const parsed = new Date(withZone);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }
  return formatRestTimestamp(parsed);
};

const findItemValue = (items: RawLetterItemResource[] | null | undefined, key: string) => {
  if (!items) {
    return '';
  }
  const match = items.find((item) => item.name === key);
  return match?.value?.trim() ?? '';
};

const findTextValue = (texts: RawLetterTextResource[] | null | undefined, key: string) => {
  if (!texts) {
    return '';
  }
  const match = texts.find((text) => text.name === key);
  return match?.textValue?.trim() ?? '';
};

export const transformLetterSummary = (raw: RawLetterModuleResource): LetterSummary => ({
  id: raw.id ?? 0,
  title: raw.title?.trim() || '診断書',
  confirmedAt: toRestTimestampOrNull(raw.confirmed ?? raw.started ?? null),
  status: raw.status ?? 'F',
  letterType: raw.letterType ?? null,
});

export const transformMedicalCertificate = (raw: RawLetterModuleResource): MedicalCertificateDetail => ({
  id: raw.id ?? null,
  linkId: raw.linkId ?? null,
  confirmedAt: toRestTimestampOrNull(raw.confirmed ?? raw.started ?? null),
  title: raw.title?.trim() || '診断書',
  disease: findItemValue(raw.letterItems ?? null, 'disease'),
  informedContent: findTextValue(raw.letterTexts ?? null, 'informedContent'),
  consultantHospital: raw.consultantHospital?.trim() ?? '',
  consultantDept: raw.consultantDept?.trim() ?? '',
  consultantDoctor: raw.consultantDoctor?.trim() ?? '',
  consultantZipCode: raw.consultantZipCode?.trim() ?? '',
  consultantAddress: raw.consultantAddress?.trim() ?? '',
  consultantTelephone: raw.consultantTelephone?.trim() ?? '',
  consultantFax: raw.consultantFax?.trim() ?? '',
  patientId: raw.patientId?.trim() ?? '',
  patientName: raw.patientName?.trim() ?? '',
  patientKana: raw.patientKana?.trim() ?? '',
  patientGender: raw.patientGender?.trim() ?? '',
  patientBirthday: raw.patientBirthday?.trim() ?? '',
  patientAge: raw.patientAge?.trim() ?? '',
  patientAddress: raw.patientAddress?.trim() ?? '',
  patientZipCode: raw.patientZipCode?.trim() ?? '',
  patientTelephone: raw.patientTelephone?.trim() ?? '',
  patientMobilePhone: raw.patientMobilePhone?.trim() ?? '',
});

const isMedicalCertificate = (raw: RawLetterModuleResource) =>
  (raw.handleClass ?? '') === LETTER_VIEWER_HANDLE_CLASS || (raw.letterType ?? '') === MEDICAL_CERTIFICATE_TYPE;

export const fetchLetterSummaries = async (karteId: number): Promise<LetterSummary[]> => {
  const endpoint = `/odletter/list/${karteId}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.letters.fetchList,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawLetterModuleListResource>(endpoint);
      const list = response.data.list ?? [];
      return list.map(transformLetterSummary);
    },
    { karteId },
  );
};

export const fetchMedicalCertificate = async (letterId: number): Promise<MedicalCertificateDetail> => {
  const endpoint = `/odletter/letter/${letterId}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.letters.fetchDetail,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawLetterModuleResource>(endpoint);
      return transformMedicalCertificate(response.data);
    },
    { letterId },
  );
};

export interface MedicalCertificatePayload {
  id: number;
  linkId: number;
  confirmed: string;
  started: string;
  recorded: string;
  status: string;
  letterType: string;
  handleClass: string;
  title: string;
  consultantHospital: string;
  consultantDept: string;
  consultantDoctor: string;
  consultantZipCode: string;
  consultantAddress: string;
  consultantTelephone: string;
  consultantFax: string;
  patientId: string;
  patientName: string;
  patientKana: string;
  patientGender: string;
  patientBirthday: string;
  patientAge: string;
  patientAddress: string;
  patientZipCode: string;
  patientTelephone: string;
  patientMobilePhone: string;
  letterItems: RawLetterItemResource[];
  letterTexts: RawLetterTextResource[];
  karteBean: { id: number };
  userModel: { id: number; userId?: string; commonName?: string | null };
}

export const saveMedicalCertificate = async (
  payload: MedicalCertificatePayload,
): Promise<number> => {
  const endpoint = '/odletter/letter';
  const enriched = {
    ...payload,
    letterType: MEDICAL_CERTIFICATE_TYPE,
    handleClass: LETTER_VIEWER_HANDLE_CLASS,
  };
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.letters.save,
    `PUT ${endpoint}`,
    async () => {
      const response = await httpClient.put<string>(endpoint, enriched);
      return Number.parseInt(response.data, 10);
    },
    { patientId: payload.patientId },
  );
};

export const deleteLetter = async (letterId: number) => {
  const endpoint = `/odletter/letter/${letterId}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.letters.delete,
    `DELETE ${endpoint}`,
    async () => {
      await httpClient.delete(endpoint);
    },
    { letterId },
  );
};

export const buildMedicalCertificatePayload = (
  detail: MedicalCertificateDetail,
  options: {
    karteId: number;
    userModelId: number;
    userId?: string;
    commonName?: string | null;
    now?: Date;
  },
): MedicalCertificatePayload => {
  const timestamp = formatRestTimestamp(options.now ?? new Date());
  return {
    id: 0,
    linkId: detail.id ?? detail.linkId ?? 0,
    confirmed: timestamp,
    started: timestamp,
    recorded: timestamp,
    status: 'F',
    letterType: MEDICAL_CERTIFICATE_TYPE,
    handleClass: LETTER_VIEWER_HANDLE_CLASS,
    title: detail.title,
    consultantHospital: detail.consultantHospital,
    consultantDept: detail.consultantDept,
    consultantDoctor: detail.consultantDoctor,
    consultantZipCode: detail.consultantZipCode,
    consultantAddress: detail.consultantAddress,
    consultantTelephone: detail.consultantTelephone,
    consultantFax: detail.consultantFax,
    patientId: detail.patientId,
    patientName: detail.patientName,
    patientKana: detail.patientKana,
    patientGender: detail.patientGender,
    patientBirthday: detail.patientBirthday,
    patientAge: detail.patientAge,
    patientAddress: detail.patientAddress,
    patientZipCode: detail.patientZipCode,
    patientTelephone: detail.patientTelephone,
    patientMobilePhone: detail.patientMobilePhone,
    letterItems: [
      { name: 'disease', value: detail.disease },
    ],
    letterTexts: [
      { name: 'informedContent', textValue: detail.informedContent },
    ],
    karteBean: { id: options.karteId },
    userModel: { id: options.userModelId, userId: options.userId, commonName: options.commonName ?? null },
  };
};

export const filterMedicalCertificates = (summaries: LetterSummary[]) =>
  summaries.filter((summary) => summary.letterType === MEDICAL_CERTIFICATE_TYPE || summary.title.includes('診断書'));

export const isMedicalCertificateSummary = (summary: LetterSummary) =>
  summary.letterType === MEDICAL_CERTIFICATE_TYPE || summary.title.includes('診断書');

export const __testables = {
  toRestTimestampOrNull,
  findItemValue,
  findTextValue,
  isMedicalCertificate,
};
