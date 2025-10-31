import type { DocumentModelPayload } from '@/features/charts/types/doc';
import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';
import { generateDocumentId } from '@/features/charts/utils/document-id';

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
  const href = fileName ?? `${docId}-schema.jpg`;

  const baseEntry = {
    id: 0,
    confirmed: timestamp,
    started: timestamp,
    recorded: timestamp,
    ended: null,
    linkId: 0,
    linkRelation: null,
    status: 'F',
    userModel: {
      id: userModelId,
      userId,
      commonName: userCommonName ?? null,
    },
    karteBean: {
      id: karteId,
    },
  } as const;

  const departmentDescriptor = [departmentName ?? '', departmentCode ?? '', userCommonName ?? userId].join(',');

  return {
    ...baseEntry,
    docInfoModel: {
      docPk: 0,
      parentPk: 0,
      docId,
      docType: 'karte',
      title: `${patientName} シェーマ`,
      purpose: 'schema',
      purposeDesc: 'hand drawing',
      confirmDate: timestamp,
      firstConfirmDate: timestamp,
      department: departmentCode ?? '',
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
      status: 'F',
      parentId: null,
      parentIdRelation: null,
      sendClaim: false,
      patientId,
      patientName,
      patientGender: patientGender ?? '',
      facilityName: facilityName ?? '',
      creatorLicense: licenseName ?? '',
      createrLisence: licenseName ?? '',
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
        fileName: href,
        extRefModel: {
          contentType: 'image/jpeg',
          medicalRole,
          title,
          href,
        },
        jpegByte: jpegBase64,
      },
    ],
    attachment: [],
    memo: null,
  };
};
