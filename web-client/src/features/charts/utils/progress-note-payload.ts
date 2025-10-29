import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { AuthSession } from '@/libs/auth/auth-types';

export interface ProgressNoteDraft {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ProgressNoteContext {
  draft: ProgressNoteDraft;
  visit: PatientVisitSummary;
  karteId: number;
  session: AuthSession;
  facilityName?: string;
  userDisplayName?: string;
  userModelId?: number;
  licenseName?: string;
  departmentCode?: string;
  departmentName?: string;
}

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

export const createProgressNoteDocument = (context: ProgressNoteContext) => {
  const { draft, visit, karteId, session, facilityName, userDisplayName, userModelId, licenseName, departmentCode, departmentName } = context;

  const { credentials, userProfile } = session;
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const docId = generateDocId();

  const soaText = [
    draft.subjective ? `S: ${draft.subjective}` : null,
    draft.objective ? `O: ${draft.objective}` : null,
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
    linkId: 0,
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
      department: visit.departmentCode ?? departmentCode ?? '',
      departmentDesc: departmentDescriptor,
      healthInsurance: '',
      healthInsuranceDesc: '',
      healthInsuranceGUID: visit.insuranceUid ?? '',
      hasMark: false,
      hasImage: false,
      hasRp: false,
      hasTreatment: false,
      hasLaboTest: false,
      versionNumber: '1',
      status: 'F',
      parentId: null,
      parentIdRelation: null,
      sendClaim: false,
      patientId: visit.patientId,
      patientName: visit.fullName,
      patientGender: visit.gender ?? '',
      facilityName: facilityName ?? credentials.facilityId,
      createrLisence: licenseName ?? '',
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
    ],
    memo: visit.memo ?? undefined,
  };
};
