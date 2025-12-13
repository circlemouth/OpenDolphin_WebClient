import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';

export type ReceptionStatus = '受付中' | '診療中' | '会計待ち' | '会計済み' | '予約';

export type ReceptionEntry = {
  id: string;
  appointmentId?: string;
  patientId?: string;
  name?: string;
  kana?: string;
  birthDate?: string;
  sex?: string;
  department?: string;
  physician?: string;
  appointmentTime?: string;
  visitDate?: string;
  status: ReceptionStatus;
  insurance?: string;
  note?: string;
  source: 'slots' | 'reservations' | 'visits' | 'unknown';
};

export type OutpatientMeta = {
  runId?: string;
  traceId?: string;
  dataSourceTransition?: DataSourceTransition;
  resolveMasterSource?: ResolveMasterSource;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  fetchedAt?: string;
  recordsReturned?: number;
  fromCache?: boolean;
  retryCount?: number;
  sourcePath?: string;
  httpStatus?: number;
  auditEvent?: Record<string, unknown>;
};

export type OutpatientFlagResponse = OutpatientMeta;

export type AppointmentPayload = OutpatientMeta & {
  entries: ReceptionEntry[];
  raw: unknown;
  apiResult?: string;
  apiResultMessage?: string;
};

export type OrcaOutpatientSummary = OutpatientMeta & {
  note?: string;
  payload?: Record<string, unknown>;
};
