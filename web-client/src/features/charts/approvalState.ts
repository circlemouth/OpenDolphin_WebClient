export type ChartsApprovalTarget = {
  facilityId?: string;
  patientId?: string;
  receptionId?: string;
  appointmentId?: string;
};

export type ChartsApprovalRecord = {
  version: 1;
  key: string;
  approvedAt: string;
  runId?: string;
  actor?: string;
  action?: 'send';
};

const APPROVAL_PREFIX = 'opendolphin:web-client:charts:approval:v1:';

const parseIsoDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function buildChartsApprovalStorageKey(target: ChartsApprovalTarget): string | null {
  const patientId = (target.patientId ?? '').trim();
  if (!patientId) return null;
  const facility = (target.facilityId ?? '').trim();
  const receptionId = (target.receptionId ?? '').trim();
  const appointmentId = (target.appointmentId ?? '').trim();
  const scope = receptionId
    ? `reception:${receptionId}`
    : appointmentId
      ? `appointment:${appointmentId}`
      : `patient:${patientId}`;
  const facilityPart = facility ? `facility:${facility}` : 'facility:unknown';
  return `${APPROVAL_PREFIX}${facilityPart}:${patientId}:${scope}`;
}

export function readChartsApprovalRecord(storageKey: string): ChartsApprovalRecord | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ChartsApprovalRecord> | null;
    if (!parsed || parsed.version !== 1) return null;
    if (parsed.key !== storageKey) return null;
    if (typeof parsed.approvedAt !== 'string' || !parseIsoDate(parsed.approvedAt)) return null;
    return {
      version: 1,
      key: storageKey,
      approvedAt: parsed.approvedAt,
      runId: typeof parsed.runId === 'string' ? parsed.runId : undefined,
      actor: typeof parsed.actor === 'string' ? parsed.actor : undefined,
      action: parsed.action === 'send' ? 'send' : undefined,
    };
  } catch {
    return null;
  }
}

export function writeChartsApprovalRecord(record: ChartsApprovalRecord) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(record.key, JSON.stringify(record));
  } catch {
    // storage が使えない環境ではスキップ
  }
}

export function clearChartsApprovalRecord(storageKey: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
