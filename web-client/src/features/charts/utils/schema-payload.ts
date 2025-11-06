import type { DocumentModelPayload } from '@/features/charts/types/doc';
import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';
import { generateDocumentId } from '@/features/charts/utils/document-id';

const ensureNonEmptyString = (value: string | null | undefined, label: string): string => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length === 0) {
    throw new Error(`${label} が未設定です。`);
  }
  return normalized;
};

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export interface SchemaSaveContext {
  karteId: number;
  patientId: string;
  patientPk: number;
  patientName: string;
  patientGender?: string;
  facilityName?: string;
  licenseName?: string;
  departmentName?: string;
  departmentCode?: string;
  userModelId: number;
  userId: string;
  userCommonName?: string | null;
  jpegBase64: string;
  title: string;
  medicalRole: string;
  fileName?: string;
  now?: Date;
}

export const buildSchemaDocumentPayload = (context: SchemaSaveContext): DocumentModelPayload => {
  const {
    karteId,
    patientId,
    patientPk,
    patientName,
    patientGender,
    facilityName,
    licenseName,
    departmentCode,
    departmentName,
    userModelId,
    userId,
    userCommonName,
    jpegBase64,
    title,
    medicalRole,
    fileName,
    now = new Date(),
  } = context;

  const timestamp = formatRestTimestamp(now);
  const docId = generateDocumentId();
  const normalizedPatientId = ensureNonEmptyString(patientId, '患者 ID');
  const normalizedPatientName = ensureNonEmptyString(patientName, '患者氏名');
  const normalizedMedicalRole = ensureNonEmptyString(medicalRole, 'シェーマ medicalRole');
  const normalizedTitle = ensureNonEmptyString(title, 'シェーマタイトル');
  const normalizedJpeg = ensureNonEmptyString(jpegBase64, 'シェーマ画像データ');
  const normalizedUserId = ensureNonEmptyString(userId, 'ユーザー ID');
  const normalizedCommonName = normalizeOptionalString(userCommonName);
  const normalizedDepartmentName = normalizeOptionalString(departmentName);
  const normalizedDepartmentCode = normalizeOptionalString(departmentCode);
  const normalizedFacilityName = normalizeOptionalString(facilityName);
  const normalizedLicenseName = normalizeOptionalString(licenseName);
  const normalizedPatientGender = normalizeOptionalString(patientGender);
  const normalizedFileName = normalizeOptionalString(fileName) ?? `${docId}-schema.jpg`;
  const href = normalizedFileName;
  const IMAGE_MIME_TYPE = 'image/jpeg';

  const baseEntry = {
    id: 0,
    confirmed: timestamp,
    started: timestamp,
    recorded: timestamp,
    ended: null,
    linkId: null as number | null,
    linkRelation: null,
    status: 'F',
    userModel: {
      id: userModelId,
      userId: normalizedUserId,
      commonName: normalizedCommonName,
    },
    karteBean: {
      id: karteId,
      patientModel: {
        id: patientPk,
      },
    },
  } as const;

  const departmentDescriptor = [
    normalizedDepartmentName ?? '',
    normalizedDepartmentCode ?? '',
    normalizedCommonName ?? normalizedUserId,
  ].join(',');

  return {
    ...baseEntry,
    docInfoModel: {
      docPk: 0,
      parentPk: 0,
      docId,
      docType: 'karte',
      title: `${normalizedPatientName} シェーマ`,
      purpose: 'schema',
      purposeDesc: 'hand drawing',
      confirmDate: timestamp,
      firstConfirmDate: timestamp,
      department: normalizedDepartmentCode ?? '',
      departmentDesc: departmentDescriptor,
      healthInsurance: '',
      healthInsuranceDesc: '',
      healthInsuranceGUID: '',
      hasMark: false,
      hasImage: true,
      hasRp: false,
      hasTreatment: false,
      hasLaboTest: false,
      versionNumber: '1',
      versionNotes: null,
      status: 'F',
      parentId: null,
      parentIdRelation: null,
      sendClaim: false,
      sendLabtest: false,
      sendMml: false,
      claimDate: null,
      labtestOrderNumber: null,
      issuanceDate: null,
      institutionNumber: null,
      admFlag: 'V',
      useGeneralName: false,
      priscriptionOutput: false,
      chkPatientInfo: false,
      chkUseDrugInfo: false,
      chkHomeMedical: false,
      pVTHealthInsuranceModel: null,
      patientId: normalizedPatientId,
      patientName: normalizedPatientName,
      patientGender: normalizedPatientGender,
      facilityName: normalizedFacilityName,
      creatorLicense: normalizedLicenseName,
      createrLisence: normalizedLicenseName,
    },
    karteBean: {
      id: karteId,
      patientModel: {
        id: patientPk,
      },
    },
    modules: [],
    schema: [
      {
        ...baseEntry,
        contentType: IMAGE_MIME_TYPE,
        fileName: href,
        extRefModel: {
          contentType: IMAGE_MIME_TYPE,
          medicalRole: normalizedMedicalRole,
          title: normalizedTitle,
          href,
        },
        patientId: normalizedPatientId,
        memo: null,
        jpegByte: normalizedJpeg,
        url: href,
      },
    ],
    attachment: [],
    memo: null,
  };
};
