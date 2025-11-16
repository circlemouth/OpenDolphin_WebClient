import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

export interface AppointmentSummary {
  id: number;
  externalId?: string | null;
  dateTime: string;
  name: string;
  memo?: string | null;
  patientId: string;
  karteId: number;
  state: number;
}

interface OrcaAppointmentSlot {
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  appointmentId?: string | null;
  medicalInformation?: string | null;
  appointmentInformation?: string | null;
  appointmentNote?: string | null;
  visitInformation?: string | null;
  departmentName?: string | null;
  patient?: {
    patientId?: string | null;
    wholeName?: string | null;
  };
}

interface OrcaAppointmentListResponse {
  slots?: OrcaAppointmentSlot[] | null;
}

const APPOINTMENT_STATE_NEW = 1;
const APPOINTMENT_STATE_REPLACE = 3;

const buildAppointmentDatePayload = (date: Date): string =>
  formatRestTimestamp(date).slice(0, 10);

const buildAppointmentRangePayload = (from: Date, to: Date) => ({
  fromDate: buildAppointmentDatePayload(from),
  toDate: buildAppointmentDatePayload(to),
  appointmentDate: buildAppointmentDatePayload(from),
});

const composeOrcaDateTime = (date?: string | null, time?: string | null): string | null => {
  if (!date) {
    return null;
  }
  const normalizedDate = date.trim();
  const normalizedTime = (time ?? '').trim() || '00:00:00';
  const isoCandidate =
    normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime.length === 8 ? normalizedTime : '00:00:00';
  const timestamp = `${normalizedDate}T${isoCandidate}+09:00`;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return formatRestTimestamp(parsed);
};

const hashStringId = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const result = Math.abs(hash);
  return result === 0 ? 1 : result;
};

const transformOrcaSlot = (
  slot: OrcaAppointmentSlot,
  karteId: number,
): AppointmentSummary | null => {
  const dateTime = composeOrcaDateTime(slot.appointmentDate ?? null, slot.appointmentTime ?? null);
  const patientId = slot.patient?.patientId?.trim() ?? '';
  if (!dateTime || !patientId) {
    return null;
  }
  const rawId = slot.appointmentId?.trim() || `${patientId}:${dateTime}`;
  return {
    id: hashStringId(rawId),
    externalId: slot.appointmentId ?? null,
    dateTime,
    name:
      slot.medicalInformation?.trim() ||
      slot.appointmentInformation?.trim() ||
      slot.visitInformation?.trim() ||
      slot.departmentName?.trim() ||
      '予約',
    memo: slot.appointmentNote ?? null,
    patientId,
    karteId,
    state: APPOINTMENT_STATE_NEW,
  };
};

export interface FetchAppointmentsParams {
  karteId: number;
  from: Date;
  to: Date;
}

export const fetchAppointments = async (
  params: FetchAppointmentsParams,
): Promise<AppointmentSummary[]> => {
  const { karteId, from, to } = params;
  return measureApiPerformance(
    PERFORMANCE_METRICS.reception.appointments.fetch,
    'POST /orca/appointments/list',
    async () => {
      const payload = buildAppointmentRangePayload(from, to);
      const response = await httpClient.post<OrcaAppointmentListResponse>('/orca/appointments/list', payload);
      const slots = response.data?.slots ?? [];
      return slots
        .map((slot) => transformOrcaSlot(slot, karteId))
        .filter((entry): entry is AppointmentSummary => Boolean(entry))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    },
    { karteId, from: formatRestTimestamp(from), to: formatRestTimestamp(to) },
  );
};

export type AppointmentCommandAction = 'create' | 'update' | 'cancel';

export interface AppointmentCommand {
  id?: number;
  externalId?: string | null;
  scheduledAt: Date;
  name: string | null;
  memo?: string | null;
  patientId: string;
  patientName?: string | null;
  patientKana?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  departmentCode?: string | null;
  physicianCode?: string | null;
  karteId: number;
  userModelId: number;
  userId: string;
  facilityId: string;
  action: AppointmentCommandAction;
}

interface OrcaAppointmentMutationPayload {
  requestNumber: string;
  appointmentId?: string | null;
  appointmentDate: string;
  appointmentTime: string;
  appointmentInformation?: string | null;
  appointmentNote?: string | null;
  medicalInformation?: string | null;
  duplicateMode?: string | null;
  patient: {
    patientId: string;
    wholeName?: string | null;
    wholeNameKana?: string | null;
    birthDate?: string | null;
    sex?: string | null;
  };
  departmentCode?: string | null;
  physicianCode?: string | null;
}

const padTwoDigits = (value: number): string => value.toString().padStart(2, '0');

const formatOrcaTime = (date: Date): string => {
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());
  const seconds = padTwoDigits(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
};

const buildMutationPayload = (command: AppointmentCommand): OrcaAppointmentMutationPayload => {
  const requestNumber = command.action === 'cancel' ? '02' : '01';
  return {
    requestNumber,
    appointmentId: command.externalId ?? (command.id ? String(command.id) : null),
    appointmentDate: buildAppointmentDatePayload(command.scheduledAt),
    appointmentTime: formatOrcaTime(command.scheduledAt),
    appointmentInformation: command.name ?? undefined,
    appointmentNote: command.memo ?? undefined,
    medicalInformation: '00',
    duplicateMode: '0',
    departmentCode: command.departmentCode ?? undefined,
    physicianCode: command.physicianCode ?? undefined,
    patient: {
      patientId: command.patientId,
      wholeName: command.patientName ?? undefined,
      wholeNameKana: command.patientKana ?? undefined,
      birthDate: command.birthDate ?? undefined,
      sex: command.sex ?? undefined,
    },
  };
};

export const saveAppointments = async (commands: AppointmentCommand[]): Promise<void> => {
  if (!commands.length) {
    return;
  }

  await measureApiPerformance(
    PERFORMANCE_METRICS.reception.appointments.save,
    'POST /orca/appointments/mutation',
    async () => {
      for (const command of commands) {
        const payload = buildMutationPayload(command);
        await httpClient.post('/orca/appointments/mutation', payload);
      }
    },
    {
      count: commands.length,
      actions: commands.map((command) => command.action).join(','),
    },
  );
};

export const APPOINTMENT_CONSTANTS = {
  STATE_NEW: APPOINTMENT_STATE_NEW,
  STATE_REPLACE: APPOINTMENT_STATE_REPLACE,
};
