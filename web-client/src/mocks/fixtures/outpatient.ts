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
  status?: number;
};

export type OutpatientScenarioId =
  | 'snapshot-missing-master'
  | 'cache-hit'
  | 'server-handoff'
  | 'fallback'
  | 'patient-normal'
  | 'patient-missing-master'
  | 'patient-fallback'
  | 'patient-timeout';

export type OutpatientScenario = {
  id: OutpatientScenarioId | 'custom';
  label: string;
  description: string;
  flags: OutpatientFlagSet;
};

export const OUTPATIENT_FALLBACK_RUN_ID = '20251212T143720Z';

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
    receptionId: 'RCPT-2402',
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
    id: 'patient-normal',
    label: 'patient fetch: normal',
    description: '患者取得 正常系。dataSourceTransition=server / cacheHit=true / missingMaster=false',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: true,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
      status: 200,
    },
  },
  {
    id: 'patient-missing-master',
    label: 'patient fetch: missingMaster',
    description: '患者取得 missingMaster=true（編集不可）',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: true,
      dataSourceTransition: 'server',
      fallbackUsed: false,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
      status: 200,
    },
  },
  {
    id: 'patient-fallback',
    label: 'patient fetch: fallbackUsed',
    description: '患者取得 fallbackUsed=true（snapshot handoff）',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: true,
      dataSourceTransition: 'fallback',
      fallbackUsed: true,
      recordsReturned: OUTPATIENT_RECEPTION_ENTRIES.length,
      status: 200,
    },
  },
  {
    id: 'patient-timeout',
    label: 'patient fetch: timeout/5xx',
    description: '患者取得 504/タイムアウトを模擬。再取得導線検証用。',
    flags: {
      runId: OUTPATIENT_FALLBACK_RUN_ID,
      cacheHit: false,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
      recordsReturned: 0,
      status: 504,
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
  const claimBundles = [
    {
      bundleNumber: 'BND-001',
      classCode: '110',
      patientId: OUTPATIENT_RECEPTION_ENTRIES[0]?.patientId,
      appointmentId: OUTPATIENT_RECEPTION_ENTRIES[0]?.appointmentId,
      performTime: `${new Date().toISOString().slice(0, 10)}T09:10:00`,
      claimStatus: flags.missingMaster ? '会計待ち' : '会計済み',
      claimStatusText: flags.missingMaster ? '会計待ち (master missing)' : '会計済み',
      totalClaimAmount: 1320,
      items: [
        { code: '110001', name: '再診料', number: 1, unit: '回', claimRate: 1, amount: 72 },
        { code: '110015', name: '明細書発行体制等加算', number: 1, unit: '回', claimRate: 1, amount: 10 },
      ],
    },
    {
      bundleNumber: 'BND-002',
      classCode: '120',
      patientId: OUTPATIENT_RECEPTION_ENTRIES[1]?.patientId,
      appointmentId: OUTPATIENT_RECEPTION_ENTRIES[1]?.appointmentId,
      performTime: `${new Date().toISOString().slice(0, 10)}T09:25:00`,
      claimStatus: '会計待ち',
      claimStatusText: '会計待ち',
      totalClaimAmount: 2640,
      items: [{ code: '120001', name: '処置料', number: 1, unit: '回', claimRate: 1, amount: 2640 }],
    },
  ];
  return {
    runId: flags.runId,
    traceId: flags.traceId ?? `trace-${flags.runId}`,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    recordsReturned: flags.recordsReturned ?? claimBundles.length,
    claimStatus: flags.missingMaster ? '会計待ち' : '会計済み',
    claimStatusText: flags.missingMaster ? '会計待ち' : '会計済み',
    claimBundles,
    status: flags.status ?? 200,
    apiResult: flags.status && flags.status >= 400 ? 'error' : 'ok',
    apiResultMessage:
      flags.status && flags.status >= 400 ? 'mock claim fetch failure (msw scenario)' : 'mock claim fetch success',
    auditEvent: {
      endpoint: '/api01rv2/claim/outpatient/mock',
      recordedAt: new Date().toISOString(),
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
      details: {
        runId: flags.runId,
        dataSourceTransition: flags.dataSourceTransition,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        fallbackUsed: flags.fallbackUsed,
        fetchedAt: new Date().toISOString(),
        recordsReturned: flags.recordsReturned ?? claimBundles.length,
        claimBundles: claimBundles.length,
      },
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
      voucherNumber: entry.receptionId ?? entry.id,
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

export function buildPatientListFixture(flags: OutpatientFlagSet, endpoint = '/api01rv2/patient/outpatient/mock') {
  return {
    patients: OUTPATIENT_PATIENTS,
    runId: flags.runId,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    fetchedAt: new Date().toISOString(),
    recordsReturned: flags.recordsReturned ?? OUTPATIENT_PATIENTS.length,
    status: flags.status ?? 200,
    auditEvent: {
      runId: flags.runId,
      endpoint,
      recordedAt: new Date().toISOString(),
      details: {
        runId: flags.runId,
        dataSourceTransition: flags.dataSourceTransition,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        fallbackUsed: flags.fallbackUsed,
        fetchedAt: new Date().toISOString(),
        recordsReturned: flags.recordsReturned ?? OUTPATIENT_PATIENTS.length,
      },
    },
  };
}

export function buildMedicalSummaryFixture(flags: OutpatientFlagSet) {
  const isError = typeof flags.status === 'number' && flags.status >= 400;
  const defaultOutcome = isError ? 'ERROR' : flags.fallbackUsed ? 'PARTIAL' : flags.missingMaster ? 'PARTIAL' : 'SUCCESS';
  const fetchedAt = new Date().toISOString();
  return {
    runId: flags.runId,
    traceId: flags.traceId ?? `trace-${flags.runId}`,
    requestId: `req-${flags.runId}`,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
    fetchedAt,
    recordsReturned: flags.recordsReturned ?? OUTPATIENT_RECEPTION_ENTRIES.length,
    outcome: defaultOutcome,
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
      outcome: defaultOutcome,
      sections: {
        diagnosis: {
          outcome: 'SUCCESS',
          recordsReturned: 2,
          items: [
            { name: '高血圧症', code: 'I10', date: fetchedAt.slice(0, 10), status: '確定' },
            { name: '脂質異常症', code: 'E78', date: fetchedAt.slice(0, 10), status: '疑い' },
          ],
        },
        prescription:
          flags.fallbackUsed || flags.missingMaster
            ? { outcome: 'MISSING', recordsReturned: 0, message: 'マスタ未取得/フォールバック中のため未展開' }
            : {
                outcome: 'SUCCESS',
                recordsReturned: 2,
                items: [
                  { name: 'アムロジピン錠 5mg', dose: '1錠', frequency: '1日1回 朝', days: 28 },
                  { name: 'ロスバスタチン錠 2.5mg', dose: '1錠', frequency: '1日1回 夕', days: 28 },
                ],
              },
        lab: flags.fallbackUsed
          ? { outcome: 'ERROR', recordsReturned: 0, message: '検査結果の取得に失敗（timeout）' }
          : {
              outcome: 'SUCCESS',
              recordsReturned: 1,
              items: [{ name: 'HbA1c', value: '5.8', unit: '%', date: fetchedAt.slice(0, 10) }],
            },
        procedure: {
          outcome: 'SUCCESS',
          recordsReturned: 1,
          items: [{ name: '血圧測定', result: '132/78', date: fetchedAt.slice(0, 10) }],
        },
        memo: {
          outcome: 'SUCCESS',
          recordsReturned: 1,
          items: [{ text: '自覚症状は落ち着いている。次回は採血結果を確認。', date: fetchedAt.slice(0, 10) }],
        },
      },
    })),
    status: flags.status ?? 200,
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
