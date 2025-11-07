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

const hasPvtInsurancePayload = (model: PVTHealthInsuranceModel | null | undefined): model is PVTHealthInsuranceModel => {
  if (!model) {
    return false;
  }

  return Boolean(
    (typeof model.uuid === 'string' && model.uuid.trim().length > 0) ||
      model.insuranceClass.trim().length > 0 ||
      model.insuranceClassCode.trim().length > 0 ||
      model.insuranceNumber.trim().length > 0 ||
      model.clientGroup.trim().length > 0 ||
      (typeof model.clientNumber === 'string' && model.clientNumber.trim().length > 0) ||
      (typeof model.startDate === 'string' && model.startDate.trim().length > 0) ||
      (typeof model.expiredDate === 'string' && model.expiredDate.trim().length > 0),
  );
};

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
  recordedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  parentId?: string | null;
  parentIdRelation?: string | null;
  labtestOrderNumber?: string | null;
  issuanceDate?: string | null;
  institutionNumber?: string | null;
  admFlag?: string | null;
  useGeneralName?: boolean | null;
  priscriptionOutput?: boolean | null;
  chkPatientInfo?: boolean | null;
  chkUseDrugInfo?: boolean | null;
  chkHomeMedical?: boolean | null;
  pVTHealthInsuranceModel?: RawPVTHealthInsuranceModel | null;
}

export interface SchemaModelUserPayload {
  id: number;
  userId: string | null;
  commonName: string | null;
}

export interface SchemaModelKartePayload {
  id: number;
  patientModel: {
    id: number;
  } | null;
}

export interface SchemaExtRefModelPayload {
  contentType: string;
  medicalRole: string;
  title: string;
  href: string;
}

export interface SchemaModelPayload {
  id: number;
  confirmed: string;
  started: string;
  recorded: string;
  ended: string | null;
  status: string;
  linkId: number | null;
  linkRelation: string | null;
  userModel: SchemaModelUserPayload;
  karteBean: SchemaModelKartePayload;
  url: string;
  fileName: string;
  contentType: string;
  patientId: string | null;
  memo: string | null;
  extRefModel: SchemaExtRefModelPayload;
  jpegByte: string;
}

export interface RawSchemaModelUserPayload {
  id?: number | null;
  userId?: string | null;
  commonName?: string | null;
}

export interface RawSchemaModelKartePayload {
  id?: number | null;
  patientModel?: {
    id?: number | null;
  } | null;
}

export interface RawSchemaExtRefModelPayload {
  contentType?: string | null;
  medicalRole?: string | null;
  title?: string | null;
  href?: string | null;
}

export interface RawSchemaModelPayload {
  id?: number | null;
  confirmed?: string | null;
  started?: string | null;
  recorded?: string | null;
  ended?: string | null;
  status?: string | null;
  linkId?: number | null;
  linkRelation?: string | null;
  userModel?: RawSchemaModelUserPayload | null;
  karteBean?: RawSchemaModelKartePayload | null;
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  patientId?: string | null;
  memo?: string | null;
  extRefModel?: RawSchemaExtRefModelPayload | null;
  jpegByte?: string | null;
}

export interface RawDocumentModelPayload {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  status?: string | null;
  linkId?: number | null;
  linkRelation?: string | null;
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

  const uuid = sanitizeString(raw.uuid);
  const insuranceClass = sanitizeString(raw.insuranceClass) ?? '';
  const insuranceClassCode = sanitizeString(raw.insuranceClassCode) ?? '';
  const insuranceNumber = sanitizeString(raw.insuranceNumber) ?? '';
  const clientGroup = sanitizeString(raw.clientGroup) ?? '';
  const clientNumber = sanitizeString(raw.clientNumber);
  const startDate = sanitizeString(raw.startDate);
  const expiredDate = sanitizeString(raw.expiredDate);

  const mapped: PVTHealthInsuranceModel = {
    uuid: uuid ?? null,
    insuranceClass,
    insuranceClassCode,
    insuranceNumber,
    clientGroup,
    clientNumber,
    startDate,
    expiredDate,
  };

  return hasPvtInsurancePayload(mapped) ? mapped : null;
};

const ensureDocId = (rawDocId: string | null | undefined, fallback: number): string => {
  const normalized = sanitizeString(rawDocId);
  if (normalized) {
    return normalized;
  }
  if (Number.isFinite(fallback) && fallback > 0) {
    return `DOC-${fallback}`;
  }
  return 'DOC-UNKNOWN';
};

const ensureTitle = (title: string | null): string => title ?? '無題のカルテ';

export interface DocInfoSummary {
  docPk: number;
  parentPk: number | null;
  docId: string;
  docType: string;
  title: string;
  purpose: string;
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
  recordedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  versionNumber: string | null;
  versionNotes: string | null;
  parentId: string | null;
  parentIdRelation: string | null;
  labtestOrderNumber: string | null;
  issuanceDate: string | null;
  institutionNumber: string | null;
  admFlag: string | null;
  useGeneralName: boolean;
  priscriptionOutput: boolean;
  chkPatientInfo: boolean;
  chkUseDrugInfo: boolean;
  chkHomeMedical: boolean;
  pVTHealthInsuranceModel: PVTHealthInsuranceModel | null;
}

export const toDocInfoSummary = (raw: RawDocInfoModel | null | undefined): DocInfoSummary | null => {
  if (!raw || typeof raw.docPk !== 'number') {
    return null;
  }

  const creatorLicense = sanitizeString(raw.creatorLicense ?? raw.createrLisence);
  const confirmDate = toIsoStringOrNull(raw.confirmDate);
  const firstConfirmDate = toIsoStringOrNull(raw.firstConfirmDate);
  const recordedAt = toIsoStringOrNull(raw.recordedAt) ?? confirmDate ?? firstConfirmDate;
  const createdAt = toIsoStringOrNull(raw.createdAt) ?? firstConfirmDate ?? confirmDate;
  const updatedAt = toIsoStringOrNull(raw.updatedAt) ?? confirmDate ?? recordedAt ?? createdAt;
  const labtestOrderNumber = sanitizeString(raw.labtestOrderNumber);
  const pvtModel = mapHealthInsurance(raw.pVTHealthInsuranceModel);
  const sendClaim = coerceBoolean(raw.sendClaim) && hasPvtInsurancePayload(pvtModel);

  return {
    docPk: raw.docPk,
    parentPk: raw.parentPk ?? null,
    docId: ensureDocId(raw.docId, raw.docPk),
    docType: sanitizeString(raw.docType) ?? 'karte',
    title: ensureTitle(sanitizeString(raw.title)),
    purpose: sanitizeString(raw.purpose) ?? '',
    purposeDesc: sanitizeString(raw.purposeDesc),
    confirmDate,
    firstConfirmDate,
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
    sendClaim,
    sendLabtest: coerceBoolean(raw.sendLabtest),
    sendMml: coerceBoolean(raw.sendMml),
    claimDate: toIsoStringOrNull(raw.claimDate),
    recordedAt,
    createdAt,
    updatedAt,
    versionNumber: sanitizeString(raw.versionNumber),
    versionNotes: sanitizeString(raw.versionNotes),
    parentId: sanitizeString(raw.parentId),
    parentIdRelation: sanitizeString(raw.parentIdRelation),
    labtestOrderNumber,
    issuanceDate: toIsoStringOrNull(raw.issuanceDate),
    institutionNumber: sanitizeString(raw.institutionNumber),
    admFlag: sanitizeString(raw.admFlag),
    useGeneralName: coerceBoolean(raw.useGeneralName),
    priscriptionOutput: coerceBoolean(raw.priscriptionOutput),
    chkPatientInfo: coerceBoolean(raw.chkPatientInfo),
    chkUseDrugInfo: coerceBoolean(raw.chkUseDrugInfo),
    chkHomeMedical: coerceBoolean(raw.chkHomeMedical),
    pVTHealthInsuranceModel: pvtModel,
  };
};

const SCHEMA_TIMESTAMP_FALLBACK = new Date(0).toISOString();

const resolveSchemaTimestamp = (...candidates: (string | null | undefined)[]): string => {
  for (const candidate of candidates) {
    const normalized = toIsoStringOrNull(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return SCHEMA_TIMESTAMP_FALLBACK;
};

const resolveSchemaUserModel = (
  raw: RawSchemaModelUserPayload | null | undefined,
): SchemaModelUserPayload | null => {
  if (!raw || typeof raw.id !== 'number') {
    return null;
  }
  return {
    id: raw.id,
    userId: sanitizeString(raw.userId),
    commonName: sanitizeString(raw.commonName),
  };
};

const resolveSchemaKarteBean = (
  raw: RawSchemaModelKartePayload | null | undefined,
): SchemaModelKartePayload | null => {
  if (!raw || typeof raw.id !== 'number') {
    return null;
  }
  const patientModel =
    raw.patientModel && typeof raw.patientModel.id === 'number'
      ? { id: raw.patientModel.id }
      : null;
  return {
    id: raw.id,
    patientModel,
  };
};

const resolveSchemaExtRefModel = (
  raw: RawSchemaExtRefModelPayload | null | undefined,
): SchemaExtRefModelPayload | null => {
  if (!raw) {
    return null;
  }
  const contentType = sanitizeString(raw.contentType);
  const medicalRole = sanitizeString(raw.medicalRole);
  const title = sanitizeString(raw.title);
  const href = sanitizeString(raw.href);
  if (!contentType || !medicalRole || !title || !href) {
    return null;
  }
  return {
    contentType,
    medicalRole,
    title,
    href,
  };
};

const resolveSchemaImageBytes = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  return value.trim().length > 0 ? value : null;
};

const resolveSchemaFileName = (fileName: string | null | undefined, href: string): string => {
  const sanitized = sanitizeString(fileName);
  if (sanitized) {
    return sanitized;
  }
  const segments = href.split('/').filter((segment) => segment.length > 0);
  const lastSegment = segments[segments.length - 1];
  return lastSegment ?? href;
};

const resolveSchemaUrl = (url: string | null | undefined, href: string): string => {
  const sanitized = sanitizeString(url);
  return sanitized ?? href;
};

const normalizeSchema = (schema: (RawSchemaModelPayload | null | undefined)[] | null | undefined): SchemaModelPayload[] =>
  (schema ?? [])
    .filter((entry): entry is RawSchemaModelPayload => Boolean(entry))
    .map((entry) => {
      const extRefModel = resolveSchemaExtRefModel(entry.extRefModel);
      const userModel = resolveSchemaUserModel(entry.userModel);
      const karteBean = resolveSchemaKarteBean(entry.karteBean);
      const jpegByte = resolveSchemaImageBytes(entry.jpegByte ?? null);

      if (!extRefModel || !userModel || !karteBean || !jpegByte) {
        return null;
      }

      const confirmed = resolveSchemaTimestamp(entry.confirmed, entry.recorded, entry.started);
      const started = resolveSchemaTimestamp(entry.started, entry.confirmed, entry.recorded);
      const recorded = resolveSchemaTimestamp(entry.recorded, entry.confirmed, entry.started);
      const ended = toIsoStringOrNull(entry.ended);
      const linkId = typeof entry.linkId === 'number' ? entry.linkId : null;
      const linkRelation = sanitizeString(entry.linkRelation);
      const url = resolveSchemaUrl(entry.url, extRefModel.href);
      const fileName = resolveSchemaFileName(entry.fileName, extRefModel.href);
      const patientId = sanitizeString(entry.patientId);
      const memo = sanitizeString(entry.memo);

      return {
        id: typeof entry.id === 'number' ? entry.id : 0,
        confirmed,
        started,
        recorded,
        ended,
        status: sanitizeString(entry.status) ?? 'F',
        linkId,
        linkRelation,
        userModel,
        karteBean,
        url,
        fileName,
        contentType: sanitizeString(entry.contentType) ?? extRefModel.contentType,
        patientId,
        memo,
        extRefModel,
        jpegByte,
      } satisfies SchemaModelPayload;
    })
    .filter((entry): entry is SchemaModelPayload => Boolean(entry));

const normalizeModules = (modules: (ModuleModelPayload | null | undefined)[] | null | undefined): ModuleModelPayload[] =>
  (modules ?? [])
    .filter((entry): entry is ModuleModelPayload => Boolean(entry))
    .map((entry) => {
      const userModel =
        entry.userModel && typeof entry.userModel.id === 'number'
          ? {
              id: entry.userModel.id,
              userId: sanitizeString(entry.userModel.userId),
              commonName: sanitizeString(entry.userModel.commonName),
            }
          : null;

      const karteBean =
        entry.karteBean && typeof entry.karteBean.id === 'number'
          ? {
              id: entry.karteBean.id,
              patientModel:
                entry.karteBean.patientModel && typeof entry.karteBean.patientModel.id === 'number'
                  ? { id: entry.karteBean.patientModel.id }
                  : null,
            }
          : null;

      const moduleInfoBean = entry.moduleInfoBean
        ? {
            stampName: sanitizeString(entry.moduleInfoBean.stampName) ?? '',
            stampRole: sanitizeString(entry.moduleInfoBean.stampRole) ?? '',
            stampNumber: entry.moduleInfoBean.stampNumber ?? 0,
            entity: sanitizeString(entry.moduleInfoBean.entity) ?? '',
            stampId: sanitizeString(entry.moduleInfoBean.stampId),
            memo: sanitizeString(entry.moduleInfoBean.memo),
          }
        : null;

      return {
        id: entry.id ?? 0,
        confirmed: entry.confirmed ?? null,
        started: entry.started ?? null,
        recorded: entry.recorded ?? null,
        ended: entry.ended ?? null,
        status: entry.status ?? null,
        linkId: typeof entry.linkId === 'number' ? entry.linkId : null,
        linkRelation: sanitizeString(entry.linkRelation),
        userModel,
        karteBean,
        moduleInfoBean,
        beanBytes: typeof entry.beanBytes === 'string' ? entry.beanBytes : null,
        memo: sanitizeString(entry.memo),
      } satisfies ModuleModelPayload;
    });

export interface DocumentModelPayload {
  id: number;
  confirmed: string | null;
  started: string | null;
  ended: string | null;
  recorded: string | null;
  status: string;
  linkId: number | null;
  linkRelation: string | null;
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

  const confirmed = toIsoStringOrNull(raw.confirmed);
  const started = toIsoStringOrNull(raw.started);
  const ended = toIsoStringOrNull(raw.ended);
  const recorded = toIsoStringOrNull(raw.recorded);

  const normalizedDocInfo =
    docInfo ??
    (toDocInfoSummary({
      docPk: docPkFallback,
      docType: 'karte',
      title: null,
    }) as DocInfoSummary);

  normalizedDocInfo.confirmDate = normalizedDocInfo.confirmDate ?? confirmed;
  normalizedDocInfo.firstConfirmDate = normalizedDocInfo.firstConfirmDate ?? started ?? confirmed;
  normalizedDocInfo.recordedAt = normalizedDocInfo.recordedAt ?? recorded ?? confirmed ?? started ?? null;
  normalizedDocInfo.createdAt = normalizedDocInfo.createdAt ?? started ?? normalizedDocInfo.firstConfirmDate ?? normalizedDocInfo.confirmDate;
  normalizedDocInfo.updatedAt = normalizedDocInfo.updatedAt ?? confirmed ?? recorded ?? normalizedDocInfo.recordedAt ?? normalizedDocInfo.createdAt;

  return {
    id: raw.id ?? normalizedDocInfo.docPk,
    confirmed: confirmed,
    started: started,
    ended: ended,
    recorded: recorded,
    status: raw.status ?? normalizedDocInfo.status ?? 'F',
    linkId: typeof raw.linkId === 'number' ? raw.linkId : null,
    linkRelation: sanitizeString(raw.linkRelation),
    docInfoModel: normalizedDocInfo,
    karteBean:
      raw.karteBean && typeof raw.karteBean.id === 'number'
        ? {
            id: raw.karteBean.id,
            patientModel:
              raw.karteBean.patientModel && typeof raw.karteBean.patientModel.id === 'number'
                ? { id: raw.karteBean.patientModel.id }
                : null,
          }
        : null,
    userModel:
      raw.userModel && typeof raw.userModel.id === 'number'
        ? {
            id: raw.userModel.id,
            userId: sanitizeString(raw.userModel.userId),
            commonName: sanitizeString(raw.userModel.commonName),
          }
        : null,
    modules: normalizeModules(raw.modules),
    schema: normalizeSchema(raw.schema),
    attachment: (raw.attachment ?? []).filter((entry): entry is AttachmentSummary => Boolean(entry)),
    memo: raw.memo ?? null,
  };
};

export const toRawDocInfoModel = (summary: DocInfoSummary): RawDocInfoModel => {
  const labtestOrderNumber = sanitizeString(summary.labtestOrderNumber);
  const hasInsurance = hasPvtInsurancePayload(summary.pVTHealthInsuranceModel);
  const rawHealthInsurance = hasInsurance
    ? {
        uuid: summary.pVTHealthInsuranceModel?.uuid ?? null,
        insuranceClass: summary.pVTHealthInsuranceModel?.insuranceClass ?? '',
        insuranceClassCode: summary.pVTHealthInsuranceModel?.insuranceClassCode ?? '',
        insuranceNumber: summary.pVTHealthInsuranceModel?.insuranceNumber ?? '',
        clientGroup: summary.pVTHealthInsuranceModel?.clientGroup ?? '',
        clientNumber: summary.pVTHealthInsuranceModel?.clientNumber ?? undefined,
        startDate: summary.pVTHealthInsuranceModel?.startDate ?? undefined,
        expiredDate: summary.pVTHealthInsuranceModel?.expiredDate ?? undefined,
      }
    : undefined;
  const normalizedSendClaim = summary.sendClaim && hasInsurance;

  return {
    docPk: summary.docPk,
    parentPk: summary.parentPk ?? undefined,
    docId: summary.docId,
    docType: summary.docType || 'karte',
    title: summary.title,
    purpose: summary.purpose,
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
    sendClaim: normalizedSendClaim,
    sendLabtest: summary.sendLabtest,
    sendMml: summary.sendMml,
    claimDate: summary.claimDate ?? undefined,
    versionNumber: summary.versionNumber ?? undefined,
    versionNotes: summary.versionNotes ?? undefined,
    parentId: summary.parentId ?? undefined,
    parentIdRelation: summary.parentIdRelation ?? undefined,
    labtestOrderNumber: labtestOrderNumber ?? undefined,
    issuanceDate: summary.issuanceDate ?? undefined,
    institutionNumber: summary.institutionNumber ?? undefined,
    admFlag: summary.admFlag ?? undefined,
    useGeneralName: summary.useGeneralName,
    priscriptionOutput: summary.priscriptionOutput,
    chkPatientInfo: summary.chkPatientInfo,
    chkUseDrugInfo: summary.chkUseDrugInfo,
    chkHomeMedical: summary.chkHomeMedical,
    pVTHealthInsuranceModel: rawHealthInsurance ?? undefined,
    recordedAt: summary.recordedAt ?? undefined,
    createdAt: summary.createdAt ?? undefined,
    updatedAt: summary.updatedAt ?? undefined,
  };
};

export const toRawDocumentModel = (payload: DocumentModelPayload): RawDocumentModelPayload => ({
  id: payload.id,
  confirmed: payload.confirmed ?? undefined,
  started: payload.started ?? undefined,
  ended: payload.ended ?? undefined,
  recorded: payload.recorded ?? undefined,
  status: payload.status ?? undefined,
  linkId: payload.linkId ?? undefined,
  linkRelation: payload.linkRelation ?? undefined,
  docInfoModel: toRawDocInfoModel(payload.docInfoModel),
  karteBean: payload.karteBean ?? undefined,
  userModel: payload.userModel ?? undefined,
  modules: payload.modules.length
    ? payload.modules.map((entry) => ({
        id: entry.id ?? undefined,
        confirmed: entry.confirmed ?? undefined,
        started: entry.started ?? undefined,
        recorded: entry.recorded ?? undefined,
        ended: entry.ended ?? undefined,
        status: entry.status ?? undefined,
        linkId: entry.linkId ?? undefined,
        linkRelation: entry.linkRelation ?? undefined,
        userModel: entry.userModel ?? undefined,
        karteBean: entry.karteBean ?? undefined,
        moduleInfoBean: entry.moduleInfoBean
          ? {
              stampName: entry.moduleInfoBean.stampName,
              stampRole: entry.moduleInfoBean.stampRole,
              stampNumber: entry.moduleInfoBean.stampNumber,
              entity: entry.moduleInfoBean.entity,
              stampId: entry.moduleInfoBean.stampId ?? undefined,
              memo: entry.moduleInfoBean.memo ?? undefined,
            }
          : undefined,
        beanBytes: entry.beanBytes ?? undefined,
        memo: entry.memo ?? undefined,
      }))
    : undefined,
  schema: payload.schema.length
    ? payload.schema.map((entry) => ({
        id: entry.id,
        confirmed: entry.confirmed,
        started: entry.started,
        recorded: entry.recorded,
        ended: entry.ended ?? null,
        status: entry.status,
        linkId: entry.linkId ?? null,
        linkRelation: entry.linkRelation ?? null,
        userModel: entry.userModel,
        karteBean: entry.karteBean,
        url: entry.url,
        fileName: entry.fileName,
        contentType: entry.contentType,
        patientId: entry.patientId ?? null,
        memo: entry.memo ?? null,
        extRefModel: entry.extRefModel,
        jpegByte: entry.jpegByte,
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
