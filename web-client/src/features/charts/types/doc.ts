import type { AttachmentSummary } from '@/features/charts/types/attachment';
import type { ModuleModelPayload } from '@/features/charts/types/module';

const sanitizeString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toIsoStringOrNull = (value: string | null | undefined): string | null => {
  const text = sanitizeString(value);
  if (!text) {
    return null;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
};

const coerceBoolean = (value: unknown): boolean => Boolean(value);

export interface PVTHealthInsuranceModel {
  uuid: string | null;
  insuranceClass: string;
  insuranceClassCode: string;
  insuranceNumber: string;
  clientGroup: string;
  clientNumber: string | null;
  startDate: string | null;
  expiredDate: string | null;
}

export interface RawPVTHealthInsuranceModel {
  uuid?: string | null;
  insuranceClass?: string | null;
  insuranceClassCode?: string | null;
  insuranceNumber?: string | null;
  clientGroup?: string | null;
  clientNumber?: string | null;
  startDate?: string | null;
  expiredDate?: string | null;
}

export interface RawDocInfoModel {
  docPk?: number;
  parentPk?: number | null;
  docId?: string | null;
  docType?: string | null;
  title?: string | null;
  purpose?: string | null;
  purposeDesc?: string | null;
  confirmDate?: string | null;
  firstConfirmDate?: string | null;
  department?: string | null;
  departmentDesc?: string | null;
  healthInsurance?: string | null;
  healthInsuranceDesc?: string | null;
  healthInsuranceGUID?: string | null;
  patientName?: string | null;
  patientId?: string | null;
  patientGender?: string | null;
  facilityName?: string | null;
  createrLisence?: string | null;
  creatorLicense?: string | null;
  status?: string | null;
  hasMark?: boolean | null;
  hasImage?: boolean | null;
  hasRp?: boolean | null;
  hasTreatment?: boolean | null;
  hasLaboTest?: boolean | null;
  sendClaim?: boolean | null;
  sendLabtest?: boolean | null;
  sendMml?: boolean | null;
  claimDate?: string | null;
  versionNumber?: string | null;
  versionNotes?: string | null;
  parentId?: number | null;
  parentIdRelation?: string | null;
  pVTHealthInsuranceModel?: RawPVTHealthInsuranceModel | null;
}

export interface SchemaModelPayload {
  id: number;
  confirmed?: string | null;
  started?: string | null;
  status?: string | null;
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  patientId?: string | null;
  memo?: string | null;
  extRefModel?: {
    contentType?: string | null;
    medicalRole?: string | null;
    title?: string | null;
    href?: string | null;
  } | null;
  jpegByte?: string | null;
}

export interface RawSchemaModelPayload {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  status?: string | null;
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  patientId?: string | null;
  memo?: string | null;
  extRefModel?: {
    contentType?: string | null;
    medicalRole?: string | null;
    title?: string | null;
    href?: string | null;
  } | null;
  jpegByte?: string | null;
}

export interface RawDocumentModelPayload {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  status?: string | null;
  docInfoModel?: RawDocInfoModel | null;
  karteBean?: {
    id?: number;
    patientModel?: {
      id?: number;
    } | null;
  } | null;
  userModel?: {
    id?: number;
    userId?: string | null;
    commonName?: string | null;
  } | null;
  modules?: (ModuleModelPayload | null | undefined)[] | null;
  schema?: (RawSchemaModelPayload | null | undefined)[] | null;
  attachment?: (AttachmentSummary | null | undefined)[] | null;
  memo?: string | null;
}

const mapHealthInsurance = (raw: RawPVTHealthInsuranceModel | null | undefined): PVTHealthInsuranceModel | null => {
  if (!raw) {
    return null;
  }
  return {
    uuid: raw.uuid ?? null,
    insuranceClass: sanitizeString(raw.insuranceClass) ?? '',
    insuranceClassCode: sanitizeString(raw.insuranceClassCode) ?? '',
    insuranceNumber: sanitizeString(raw.insuranceNumber) ?? '',
    clientGroup: sanitizeString(raw.clientGroup) ?? '',
    clientNumber: sanitizeString(raw.clientNumber),
    startDate: sanitizeString(raw.startDate),
    expiredDate: sanitizeString(raw.expiredDate),
  };
};

const ensureTitle = (title: string | null): string => title ?? '無題のカルテ';

export interface DocInfoSummary {
  docPk: number;
  parentPk: number | null;
  docId: string | null;
  docType: string;
  title: string;
  purpose: string | null;
  purposeDesc: string | null;
  confirmDate: string | null;
  firstConfirmDate: string | null;
  department: string | null;
  departmentDesc: string | null;
  healthInsurance: string | null;
  healthInsuranceDesc: string | null;
  healthInsuranceGUID: string | null;
  patientName: string | null;
  patientId: string | null;
  patientGender: string | null;
  facilityName: string | null;
  creatorLicense: string | null;
  /**
   * サーバー互換用の誤記フィールド。値は常に `creatorLicense` と同期させる。
   */
  createrLisence?: string | null;
  status: string;
  hasMark: boolean;
  hasImage: boolean;
  hasRp: boolean;
  hasTreatment: boolean;
  hasLaboTest: boolean;
  sendClaim: boolean;
  sendLabtest: boolean;
  sendMml: boolean;
  claimDate: string | null;
  versionNumber: string | null;
  versionNotes: string | null;
  parentId: number | null;
  parentIdRelation: string | null;
  pVTHealthInsuranceModel: PVTHealthInsuranceModel | null;
}

export const toDocInfoSummary = (raw: RawDocInfoModel | null | undefined): DocInfoSummary | null => {
  if (!raw || typeof raw.docPk !== 'number') {
    return null;
  }

  const creatorLicense = sanitizeString(raw.creatorLicense ?? raw.createrLisence);

  return {
    docPk: raw.docPk,
    parentPk: raw.parentPk ?? null,
    docId: sanitizeString(raw.docId),
    docType: sanitizeString(raw.docType) ?? 'karte',
    title: ensureTitle(sanitizeString(raw.title)),
    purpose: sanitizeString(raw.purpose),
    purposeDesc: sanitizeString(raw.purposeDesc),
    confirmDate: toIsoStringOrNull(raw.confirmDate),
    firstConfirmDate: toIsoStringOrNull(raw.firstConfirmDate),
    department: sanitizeString(raw.department),
    departmentDesc: sanitizeString(raw.departmentDesc),
    healthInsurance: sanitizeString(raw.healthInsurance),
    healthInsuranceDesc: sanitizeString(raw.healthInsuranceDesc),
    healthInsuranceGUID: sanitizeString(raw.healthInsuranceGUID),
    patientName: sanitizeString(raw.patientName),
    patientId: sanitizeString(raw.patientId),
    patientGender: sanitizeString(raw.patientGender),
    facilityName: sanitizeString(raw.facilityName),
    creatorLicense,
    createrLisence: creatorLicense,
    status: sanitizeString(raw.status) ?? 'F',
    hasMark: coerceBoolean(raw.hasMark),
    hasImage: coerceBoolean(raw.hasImage),
    hasRp: coerceBoolean(raw.hasRp),
    hasTreatment: coerceBoolean(raw.hasTreatment),
    hasLaboTest: coerceBoolean(raw.hasLaboTest),
    sendClaim: coerceBoolean(raw.sendClaim),
    sendLabtest: coerceBoolean(raw.sendLabtest),
    sendMml: coerceBoolean(raw.sendMml),
    claimDate: toIsoStringOrNull(raw.claimDate),
    versionNumber: sanitizeString(raw.versionNumber),
    versionNotes: sanitizeString(raw.versionNotes),
    parentId: raw.parentId ?? null,
    parentIdRelation: sanitizeString(raw.parentIdRelation),
    pVTHealthInsuranceModel: mapHealthInsurance(raw.pVTHealthInsuranceModel),
  };
};

const normalizeSchema = (schema: RawSchemaModelPayload[] | null | undefined): SchemaModelPayload[] =>
  (schema ?? [])
    .filter((entry): entry is RawSchemaModelPayload => Boolean(entry))
    .map((entry) => ({
      id: entry.id ?? 0,
      confirmed: entry.confirmed ?? null,
      started: entry.started ?? null,
      status: entry.status ?? null,
      url: entry.url ?? null,
      fileName: entry.fileName ?? null,
      contentType: entry.contentType ?? null,
      patientId: entry.patientId ?? null,
      memo: entry.memo ?? null,
      extRefModel: entry.extRefModel ?? null,
      jpegByte: entry.jpegByte ?? null,
    }));

export interface DocumentModelPayload {
  id: number;
  confirmed: string | null;
  started: string | null;
  ended: string | null;
  recorded: string | null;
  status: string;
  docInfoModel: DocInfoSummary;
  karteBean: {
    id: number;
    patientModel?: {
      id: number;
    } | null;
  } | null;
  userModel: {
    id: number;
    userId?: string | null;
    commonName?: string | null;
  } | null;
  modules: ModuleModelPayload[];
  schema: SchemaModelPayload[];
  attachment: AttachmentSummary[];
  memo: string | null;
}

export const fromRawDocumentModel = (raw: RawDocumentModelPayload | null | undefined): DocumentModelPayload | null => {
  if (!raw) {
    return null;
  }

  const docInfo = toDocInfoSummary(raw.docInfoModel);
  const docPkFallback = docInfo?.docPk ?? raw.id;
  if (docPkFallback == null) {
    return null;
  }

  const normalizedDocInfo =
    docInfo ??
    (toDocInfoSummary({
      docPk: docPkFallback,
      docType: 'karte',
      title: null,
    }) as DocInfoSummary);

  return {
    id: raw.id ?? normalizedDocInfo.docPk,
    confirmed: raw.confirmed ?? null,
    started: raw.started ?? null,
    ended: raw.ended ?? null,
    recorded: raw.recorded ?? null,
    status: raw.status ?? normalizedDocInfo.status ?? 'F',
    docInfoModel: normalizedDocInfo,
    karteBean: raw.karteBean?.id
      ? {
          id: raw.karteBean.id,
          patientModel: raw.karteBean.patientModel?.id
            ? { id: raw.karteBean.patientModel.id }
            : raw.karteBean.patientModel ?? null,
        }
      : raw.karteBean ?? null,
    userModel: raw.userModel?.id
      ? {
          id: raw.userModel.id,
          userId: raw.userModel.userId ?? null,
          commonName: raw.userModel.commonName ?? null,
        }
      : raw.userModel ?? null,
    modules: (raw.modules ?? []).filter((entry): entry is ModuleModelPayload => Boolean(entry)),
    schema: normalizeSchema(raw.schema),
    attachment: (raw.attachment ?? []).filter((entry): entry is AttachmentSummary => Boolean(entry)),
    memo: raw.memo ?? null,
  };
};

export const toRawDocInfoModel = (summary: DocInfoSummary): RawDocInfoModel => {
  const healthInsurance =
    summary.pVTHealthInsuranceModel && Object.values(summary.pVTHealthInsuranceModel).some((value) => value)
      ? {
          uuid: summary.pVTHealthInsuranceModel.uuid,
          insuranceClass: summary.pVTHealthInsuranceModel.insuranceClass,
          insuranceClassCode: summary.pVTHealthInsuranceModel.insuranceClassCode,
          insuranceNumber: summary.pVTHealthInsuranceModel.insuranceNumber,
          clientGroup: summary.pVTHealthInsuranceModel.clientGroup,
          clientNumber: summary.pVTHealthInsuranceModel.clientNumber ?? undefined,
          startDate: summary.pVTHealthInsuranceModel.startDate ?? undefined,
          expiredDate: summary.pVTHealthInsuranceModel.expiredDate ?? undefined,
        }
      : null;

  return {
    docPk: summary.docPk,
    parentPk: summary.parentPk ?? undefined,
    docId: summary.docId ?? undefined,
    docType: summary.docType,
    title: summary.title,
    purpose: summary.purpose ?? undefined,
    purposeDesc: summary.purposeDesc ?? undefined,
    confirmDate: summary.confirmDate ?? undefined,
    firstConfirmDate: summary.firstConfirmDate ?? undefined,
    department: summary.department ?? undefined,
    departmentDesc: summary.departmentDesc ?? undefined,
    healthInsurance: summary.healthInsurance ?? undefined,
    healthInsuranceDesc: summary.healthInsuranceDesc ?? undefined,
    healthInsuranceGUID: summary.healthInsuranceGUID ?? undefined,
    patientName: summary.patientName ?? undefined,
    patientId: summary.patientId ?? undefined,
    patientGender: summary.patientGender ?? undefined,
    facilityName: summary.facilityName ?? undefined,
    createrLisence: summary.creatorLicense ?? summary.createrLisence ?? undefined,
    status: summary.status,
    hasMark: summary.hasMark,
    hasImage: summary.hasImage,
    hasRp: summary.hasRp,
    hasTreatment: summary.hasTreatment,
    hasLaboTest: summary.hasLaboTest,
    sendClaim: summary.sendClaim,
    sendLabtest: summary.sendLabtest,
    sendMml: summary.sendMml,
    claimDate: summary.claimDate ?? undefined,
    versionNumber: summary.versionNumber ?? undefined,
    versionNotes: summary.versionNotes ?? undefined,
    parentId: summary.parentId ?? undefined,
    parentIdRelation: summary.parentIdRelation ?? undefined,
    pVTHealthInsuranceModel: healthInsurance ?? undefined,
  };
};

export const toRawDocumentModel = (payload: DocumentModelPayload): RawDocumentModelPayload => ({
  id: payload.id,
  confirmed: payload.confirmed ?? undefined,
  started: payload.started ?? undefined,
  ended: payload.ended ?? undefined,
  recorded: payload.recorded ?? undefined,
  status: payload.status ?? undefined,
  docInfoModel: toRawDocInfoModel(payload.docInfoModel),
  karteBean: payload.karteBean ?? undefined,
  userModel: payload.userModel ?? undefined,
  modules: payload.modules.length ? payload.modules : undefined,
  schema: payload.schema.length
    ? payload.schema.map((entry) => ({
        id: entry.id,
        confirmed: entry.confirmed ?? undefined,
        started: entry.started ?? undefined,
        status: entry.status ?? undefined,
        url: entry.url ?? undefined,
        fileName: entry.fileName ?? undefined,
        contentType: entry.contentType ?? undefined,
        patientId: entry.patientId ?? undefined,
        memo: entry.memo ?? undefined,
        extRefModel: entry.extRefModel ?? undefined,
        jpegByte: entry.jpegByte ?? undefined,
      }))
    : undefined,
  attachment: payload.attachment.length ? payload.attachment : undefined,
  memo: payload.memo ?? undefined,
});

export interface DocInfoListResponse {
  list?: RawDocInfoModel[] | null;
}

export interface DocumentListResponse {
  list?: RawDocumentModelPayload[] | null;
}
