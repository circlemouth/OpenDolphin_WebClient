import type { DocumentModelPayload, PVTHealthInsuranceModel } from '@/features/charts/types/doc';
import type { ModuleInfoBeanPayload, ModuleModelPayload } from '@/features/charts/types/module';
import { hasSerializedModuleBean } from '@/features/charts/types/module';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { AuthSession } from '@/libs/auth/auth-types';

export interface ProgressNoteDraft {
  title: string;
  subjective: string;
  objective: string;
  ros: string;
  physicalExam: string;
  assessment: string;
  plan: string;
}

export type BillingMode = 'insurance' | 'self-pay';

export interface InsuranceBillingDetails {
  mode: 'insurance';
  classCode?: string;
  description?: string;
  guid?: string;
}

export interface SelfPayBillingDetails {
  mode: 'self-pay';
  receiptCode: string;
  label: string;
  quantity?: string;
  performer?: string;
  lotNumber?: string;
  memo?: string;
}

export type ProgressNoteBilling = InsuranceBillingDetails | SelfPayBillingDetails;

export interface ProgressNoteContext {
  draft: ProgressNoteDraft;
  visit: PatientVisitSummary;
  karteId: number;
  session: AuthSession;
  visitMemo?: string | null;
  facilityName?: string;
  userDisplayName?: string;
  userModelId?: number;
  licenseName?: string;
  departmentCode?: string;
  departmentName?: string;
  billing: ProgressNoteBilling;
  orderModules?: ModuleModelPayload[];
}

const decodeBase64 = (input: string) => {
  const bufferLike = (globalThis as {
    Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(input, 'base64').toString('utf-8');
  }

  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }

  throw new Error('Base64 デコードに対応していない環境です。');
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\r?\n/g, '&#10;');

const toBase64 = (input: string) => {
  const bufferLike = (globalThis as {
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(input, 'utf-8').toString('base64');
  }

  if (typeof globalThis.btoa === 'function') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return globalThis.btoa(binary);
  }

  throw new Error('Base64 エンコードに対応していない環境です。');
};

const buildProgressCourseXml = (text: string) => `<?xml version="1.0" encoding="UTF-8"?>\n<java version="1.8.0_202" class="java.beans.XMLDecoder">\n <object class="open.dolphin.infomodel.ProgressCourse">\n  <void property="freeText">\n   <string>${escapeXml(text)}</string>\n  </void>\n </object>\n</java>`;

const generateDocId = () => (globalThis.crypto?.randomUUID?.() ?? cryptoRandomUuid()).replace(/-/g, '').slice(0, 32);

const cryptoRandomUuid = () => {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0;
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatTimestamp = (date: Date) => {
  const iso = date.toISOString();
  return iso.slice(0, 19);
};

const buildSelfPayDescription = (billing: SelfPayBillingDetails) => {
  const quantity = billing.quantity?.trim();
  const performer = billing.performer?.trim();
  const lotNumber = billing.lotNumber?.trim();
  const memo = billing.memo?.trim();

  const parts = [
    billing.label,
    quantity ? `数量: ${quantity}` : null,
    performer ? `実施者: ${performer}` : null,
    lotNumber ? `ロット: ${lotNumber}` : null,
    memo ? `備考: ${memo}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  return parts.join(' / ');
};

const ORDER_ENTITY_TREATMENT_FLAGS = new Set([
  'injectionOrder',
  'treatmentOrder',
  'surgeryOrder',
  'baseChargeOrder',
  'instractionChargeOrder',
  'otherOrder',
  'generalOrder',
]);

const ORDER_ENTITY_LABO_FLAGS = new Set([
  'testOrder',
  'physiologyOrder',
  'bacteriaOrder',
  'radiologyOrder',
]);

const ensureClaimItems = (modules: readonly (ModuleModelPayload & { beanBytes: string; moduleInfoBean: ModuleInfoBeanPayload })[]) => {
  modules.forEach((module) => {
    const xml = decodeBase64(module.beanBytes);
    if (!/ClaimItem/i.test(xml)) {
      const stampName = module.moduleInfoBean.stampName ?? '不明なスタンプ';
      throw new Error(`${stampName} に ClaimItem 情報が含まれていません。ORCA 連携設定を確認してください。`);
    }
  });
};

export const buildObjectiveNarrative = (input: Pick<ProgressNoteDraft, 'objective' | 'ros' | 'physicalExam'>) => {
  const segments: string[] = [];
  const primary = input.objective.trim();
  const ros = input.ros.trim();
  const pe = input.physicalExam.trim();

  if (primary) {
    segments.push(primary);
  }
  if (ros) {
    segments.push(`ROS:\n${ros}`);
  }
  if (pe) {
    segments.push(`PE:\n${pe}`);
  }

  return segments.join('\n\n');
};

export const createProgressNoteDocument = (context: ProgressNoteContext): DocumentModelPayload => {
  const {
    draft,
    visit,
    karteId,
    session,
    facilityName,
    visitMemo,
    userDisplayName,
    userModelId,
    licenseName,
    departmentCode,
    departmentName,
    billing,
    orderModules = [],
  } = context;

  const { credentials, userProfile } = session;
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const docId = generateDocId();

  const serializedOrderModules = orderModules.filter(
    (module): module is ModuleModelPayload & { beanBytes: string; moduleInfoBean: ModuleInfoBeanPayload } => {
      if (!hasSerializedModuleBean(module)) {
        const stampName = module?.moduleInfoBean?.stampName ?? '不明なスタンプ';
        throw new Error(`${stampName} のスタンプ情報が不完全です。スタンプを再登録してください。`);
      }
      return true;
    },
  );

  if (serializedOrderModules.length > 0) {
    ensureClaimItems(serializedOrderModules);
  }

  const objectiveNarrative = buildObjectiveNarrative(draft);
  const soaText = [
    draft.subjective ? `S: ${draft.subjective}` : null,
    objectiveNarrative ? `O: ${objectiveNarrative}` : null,
    draft.assessment ? `A: ${draft.assessment}` : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join('\n\n');

  const planText = draft.plan ? `P: ${draft.plan}` : '';
  const soaXml = buildProgressCourseXml(soaText);
  const planXml = buildProgressCourseXml(planText);

  const soaBeanBytes = toBase64(soaXml);
  const planBeanBytes = toBase64(planXml);

  const userPk = userModelId ?? (userProfile as { userModelId?: number } | undefined)?.userModelId ?? 0;
  const userName = userDisplayName ?? userProfile?.displayName ?? userProfile?.userId ?? `${credentials.facilityId}:${credentials.userId}`;

  const departmentDescriptor = [
    departmentName ?? visit.departmentName ?? '',
    departmentCode ?? visit.departmentCode ?? '',
    userName,
    visit.doctorId ?? credentials.userId,
    visit.jmariNumber ?? '',
  ].join(',');

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
      id: userPk,
      userId: `${credentials.facilityId}:${credentials.userId}`,
      commonName: userName,
    },
    karteBean: {
      id: karteId,
    },
  } as const;

  const billingInfo = (() => {
    if (billing.mode === 'insurance') {
      const insuranceModel = {
        uuid: billing.guid ?? visit.insuranceUid ?? null,
        insuranceClass: billing.description ?? '',
        insuranceClassCode: billing.classCode ?? '',
        insuranceNumber: '',
        clientGroup: '',
        clientNumber: null,
        startDate: null,
        expiredDate: null,
      } satisfies PVTHealthInsuranceModel;
      return {
        healthInsurance: billing.classCode ?? '',
        healthInsuranceDesc: billing.description ?? '',
        healthInsuranceGUID: billing.guid ?? visit.insuranceUid ?? '',
        sendClaim: Boolean(billing.classCode),
        insuranceModel,
      };
    }

    const description = buildSelfPayDescription(billing);

    return {
      healthInsurance: billing.receiptCode,
      healthInsuranceDesc: description,
      healthInsuranceGUID: '',
      sendClaim: false,
      insuranceModel: null,
    };
  })();

  const claimDate = billingInfo.sendClaim ? timestamp : null;

  const treatmentEntities = serializedOrderModules
    .map((module) => module.moduleInfoBean?.entity)
    .filter((entity): entity is string => Boolean(entity));

  const hasMedication = treatmentEntities.some((entity) => entity === 'medOrder');
  const hasTreatment = treatmentEntities.some((entity) => ORDER_ENTITY_TREATMENT_FLAGS.has(entity));
  const hasLabo = treatmentEntities.some((entity) => ORDER_ENTITY_LABO_FLAGS.has(entity));

  const mergedModules = (() => {
    if (serializedOrderModules.length === 0) {
      return undefined;
    }
    const baseStampOffset = 2;
    return serializedOrderModules.map((module, index) => ({
      ...baseEntry,
      moduleInfoBean: {
        stampName: module.moduleInfoBean.stampName,
        stampRole: module.moduleInfoBean.stampRole,
        stampNumber: baseStampOffset + index,
        entity: module.moduleInfoBean.entity,
        stampId: module.moduleInfoBean.stampId ?? undefined,
        memo: module.moduleInfoBean.memo ?? undefined,
      },
      beanBytes: module.beanBytes,
      memo: module.memo ?? undefined,
    }));
  })();

  return {
    ...baseEntry,
    docInfoModel: {
      docPk: 0,
      parentPk: 0,
      docId,
      docType: 'karte',
      title: draft.title || `${visit.fullName} ${timestamp}`,
      purpose: 'recode',
      purposeDesc: 'progress note',
      confirmDate: timestamp,
      firstConfirmDate: timestamp,
      recordedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      department: visit.departmentCode ?? departmentCode ?? '',
      departmentDesc: departmentDescriptor,
      healthInsurance: billingInfo.healthInsurance,
      healthInsuranceDesc: billingInfo.healthInsuranceDesc,
      healthInsuranceGUID: billingInfo.healthInsuranceGUID,
      patientId: visit.patientId,
      patientName: visit.fullName,
      patientGender: visit.gender ?? null,
      facilityName: facilityName ?? credentials.facilityId ?? null,
      creatorLicense: licenseName ?? null,
      createrLisence: licenseName ?? null,
      hasMark: false,
      hasImage: false,
      hasRp: hasMedication,
      hasTreatment: hasTreatment,
      hasLaboTest: hasLabo,
      versionNumber: '1',
      versionNotes: null,
      status: 'F',
      parentId: null,
      parentIdRelation: null,
      sendClaim: billingInfo.sendClaim,
      sendLabtest: hasLabo,
      sendMml: false,
      claimDate,
      labtestOrderNumber: null,
      issuanceDate: null,
      institutionNumber: null,
      admFlag: 'V',
      useGeneralName: false,
      priscriptionOutput: hasMedication,
      chkPatientInfo: false,
      chkUseDrugInfo: false,
      chkHomeMedical: false,
      pVTHealthInsuranceModel: billingInfo.insuranceModel,
    },
    karteBean: {
      id: karteId,
      patientModel: { id: visit.patientPk },
    },
    modules: [
      {
        ...baseEntry,
        moduleInfoBean: {
          stampName: 'progressCourse',
          stampRole: 'soaSpec',
          stampNumber: 0,
          entity: 'progressCourse',
        },
        beanBytes: soaBeanBytes,
      },
      {
        ...baseEntry,
        moduleInfoBean: {
          stampName: 'progressCourse',
          stampRole: 'pSpec',
          stampNumber: 1,
          entity: 'progressCourse',
        },
        beanBytes: planBeanBytes,
      },
      ...(mergedModules ?? []),
    ],
    schema: [],
    attachment: [],
    memo: visitMemo ?? visit.memo ?? null,
  };
};
