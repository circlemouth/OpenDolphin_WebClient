import type { DataSourceTransition } from '../../libs/telemetry/telemetryClient';
import type { ReceptionEntry } from '../../features/reception/api';
import type { PatientRecord } from '../../features/patients/api';

export type OutpatientFlagSet = {
  runId: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  recordsReturned?: number;
};

export type OutpatientScenarioId = 'snapshot-missing-master' | 'cache-hit' | 'server-handoff' | 'fallback';

export type OutpatientScenario = {
  id: OutpatientScenarioId | 'custom';
  label: string;
  description: string;
  flags: OutpatientFlagSet;
};

export const OUTPATIENT_FALLBACK_RUN_ID = '20251208T124645Z';

export const OUTPATIENT_RECEPTION_ENTRIES: ReceptionEntry[] = [
  {
    id: 'SAMPLE-01',
    appointmentId: 'APT-2401',
    patientId: '000001',
    name: '山田 花子',
    kana: 'ヤマダ ハナコ',
    birthDate: '1985-04-12',
    sex: 'F',
    department: '内科',
    physician: '藤井',
    appointmentTime: '09:10',
    status: '受付中',
    insurance: '社保 12',
    note: '血圧フォロー',
    source: 'slots',
  },
  {
    id: 'SAMPLE-02',
    appointmentId: 'APT-2402',
    patientId: '000002',
    name: '佐藤 太郎',
    kana: 'サトウ タロウ',
    birthDate: '1978-11-30',
    sex: 'M',
    department: '整形',
    physician: '鈴木',
    appointmentTime: '09:25',
    status: '診療中',
    insurance: '国保 34',
    note: '膝痛・レントゲン待ち',
    source: 'visits',
  },
  {
    id: 'SAMPLE-03',
    appointmentId: 'APT-2403',
    patientId: '000003',
    name: '高橋 光',
    kana: 'タカハシ ヒカリ',
    birthDate: '1992-02-01',
    sex: 'F',
    department: '小児',
    physician: '山口',
    appointmentTime: '10:05',
    status: '予約',
    insurance: '自費',
    note: '健診',
    source: 'reservations',
  },
];

export const OUTPATIENT_PATIENTS: PatientRecord[] = [
  {
    patientId: '000001',
    name: '山田 花子',
    kana: 'ヤマダ ハナコ',
    birthDate: '1985-04-12',
    sex: 'F',
    phone: '03-1234-5678',
    insurance: '社保12',
    memo: '高血圧フォロー',
    lastVisit: '2025-12-08',
  },
  {
    patientId: '000002',
    name: '佐藤 太郎',
    kana: 'サトウ タロウ',
    birthDate: '1978-11-30',
    sex: 'M',
    phone: '03-9876-5432',
    insurance: '国保34',
    memo: '膝関節痛',
    lastVisit: '2025-12-04',
  },
  {
    patientId: '000003',
    name: '高橋 光',
    kana: 'タカハシ ヒカリ',
    birthDate: '1992-02-01',
    sex: 'F',
    phone: '080-1234-4444',
    insurance: '自費',
    memo: '健診',
    lastVisit: '2025-11-30',
  },
];

const SCENARIOS: OutpatientScenario[] = [
  {
    id: 'snapshot-missing-master',
    label: 'snapshot: missingMaster',
    description: 'デフォルトの MSW スナップショット。missingMaster=true, cacheHit=false。',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: true,
      dataSourceTransition: 'snapshot',
      fallbackUsed: false,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
    },
  },
  {
    id: 'cache-hit',
    label: 'server cacheHit',
    description: 'resolveMasterSource=server のキャッシュヒット。missingMaster=false, cacheHit=true。',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: true,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
    },
  },
  {
    id: 'server-handoff',
    label: 'server handoff',
    description: 'missingMaster=false で dataSourceTransition=server を強制。',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
    },
  },
  {
    id: 'fallback',
    label: 'fallback route',
    description: 'サーバー到達不可を模擬し fallbackUsed + missingMaster=true。',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: true,
      dataSourceTransition: 'fallback',
      fallbackUsed: true,
      recordsReturned: 0,
    },
  },
];

let activeScenario: OutpatientScenario = { ...SCENARIOS[0] };

const cloneFlags = (flags: OutpatientFlagSet): OutpatientFlagSet => ({ ...flags });
const toScenario = (base: OutpatientScenario): OutpatientScenario => ({ ...base, flags: cloneFlags(base.flags) });

const matchScenario = (flags: OutpatientFlagSet) =>
  SCENARIOS.find((scenario) =>
    scenario.flags.cacheHit === flags.cacheHit &&
    scenario.flags.missingMaster === flags.missingMaster &&
    scenario.flags.dataSourceTransition === flags.dataSourceTransition &&
    scenario.flags.fallbackUsed === flags.fallbackUsed,
  );

export function getOutpatientScenario(): OutpatientScenario {
  return toScenario(activeScenario);
}

export function listOutpatientScenarios() {
  return SCENARIOS.map(toScenario);
}

export function selectOutpatientScenario(id: OutpatientScenarioId) {
  const next = SCENARIOS.find((scenario) => scenario.id === id);
  if (next) {
    activeScenario = toScenario(next);
  }
  return getOutpatientScenario();
}

export function updateOutpatientScenarioFlags(partial: Partial<OutpatientFlagSet>) {
  activeScenario = {
    id: 'custom',
    label: 'custom',
    description: 'UI から編集されたシナリオ',
    flags: { ...activeScenario.flags, ...partial },
  };
  const matched = matchScenario(activeScenario.flags);
  if (matched) {
    activeScenario = toScenario({ ...matched, id: matched.id });
  }
  return getOutpatientScenario();
}

export function resetOutpatientScenario() {
  activeScenario = toScenario(SCENARIOS[0]);
  return getOutpatientScenario();
}

export function buildClaimFixture(flags: OutpatientFlagSet) {
  return {
    runId: flags.runId,
    traceId: flags.traceId ?? `trace-${flags.runId}`,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    recordsReturned: flags.recordsReturned ?? OUTPATIENT_RECEPTION_ENTRIES.length,
    auditEvent: {
      endpoint: '/api01rv2/claim/outpatient/mock',
      recordedAt: new Date().toISOString(),
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
    },
  };
}

export function buildAppointmentFixture(flags: OutpatientFlagSet) {
  return {
    appointmentDate: new Date().toISOString().slice(0, 10),
    slots: OUTPATIENT_RECEPTION_ENTRIES.filter((entry) => entry.source === 'slots').map((entry) => ({
      appointmentId: entry.appointmentId,
      appointmentTime: entry.appointmentTime?.replace(':', ''),
      departmentName: entry.department,
      physicianName: entry.physician,
      patient: {
        patientId: entry.patientId,
        wholeName: entry.name,
        wholeNameKana: entry.kana,
        birthDate: entry.birthDate,
        sex: entry.sex,
      },
      visitInformation: entry.note,
      medicalInformation: entry.note,
    })),
    reservations: OUTPATIENT_RECEPTION_ENTRIES.filter((entry) => entry.source === 'reservations').map((entry) => ({
      appointmentId: entry.appointmentId,
      appointmentDate: new Date().toISOString().slice(0, 10),
      appointmentTime: (entry.appointmentTime ?? '').replace(':', ''),
      visitInformation: entry.note,
      departmentName: entry.department,
      physicianName: entry.physician,
    })),
    visits: OUTPATIENT_RECEPTION_ENTRIES.filter((entry) => entry.source === 'visits').map((entry) => ({
      voucherNumber: entry.id,
      sequentialNumber: entry.appointmentId,
      appointmentTime: entry.appointmentTime?.replace(':', ''),
      updateTime: entry.appointmentTime?.replace(':', ''),
      departmentName: entry.department,
      physicianName: entry.physician,
      patient: {
        patientId: entry.patientId,
        wholeName: entry.name,
        wholeNameKana: entry.kana,
        birthDate: entry.birthDate,
        sex: entry.sex,
      },
      insuranceCombinationNumber: entry.insurance,
      visitInformation: entry.note,
    })),
    runId: flags.runId,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    fetchedAt: new Date().toISOString(),
  };
}

export function buildPatientListFixture(flags: OutpatientFlagSet) {
  return {
    patients: OUTPATIENT_PATIENTS,
    runId: flags.runId,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    auditEvent: {
      runId: flags.runId,
      endpoint: '/orca12/patientmodv2/outpatient',
      recordedAt: new Date().toISOString(),
    },
  };
}

export function buildMedicalSummaryFixture(flags: OutpatientFlagSet) {
  return {
    runId: flags.runId,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    fetchedAt: new Date().toISOString(),
    recordsReturned: flags.recordsReturned ?? OUTPATIENT_RECEPTION_ENTRIES.length,
    outpatientList: OUTPATIENT_RECEPTION_ENTRIES.map((entry) => ({
      voucherNumber: entry.id,
      patient: {
        patientId: entry.patientId,
        wholeName: entry.name,
        wholeNameKana: entry.kana,
        birthDate: entry.birthDate,
        sex: entry.sex,
      },
      department: entry.department,
      physician: entry.physician,
      appointmentId: entry.appointmentId,
      source: entry.source,
    })),
  };
}

export function exposeOutpatientScenarioControls() {
  if (typeof window === 'undefined') return;
  const api = {
    get: getOutpatientScenario,
    list: listOutpatientScenarios,
    select: selectOutpatientScenario,
    update: updateOutpatientScenarioFlags,
    reset: resetOutpatientScenario,
  };
  (window as any).__OUTPATIENT_SCENARIO__ = api;
}
