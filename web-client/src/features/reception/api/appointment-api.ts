import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

export interface RawAppointmentResource {
  id?: number;
  state?: number;
  date?: string;
  name?: string | null;
  memo?: string | null;
  patientId?: string;
  karteBean?: { id?: number } | null;
}

export interface RawAppoListResource {
  list?: RawAppointmentResource[] | null;
}

export interface RawAppoListListResource {
  list?: RawAppoListResource[] | null;
}

export interface AppointmentSummary {
  id: number;
  dateTime: string;
  name: string;
  memo?: string | null;
  patientId: string;
  karteId: number;
  state: number;
}

const APPOINTMENT_STATE_NEW = 1;
const APPOINTMENT_STATE_REPLACE = 3;

const formatRestDateTime = (date: Date) => {
  const iso = date.toISOString();
  return iso.slice(0, 19);
};

const parseDateTime = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const transformAppointment = (
  raw: RawAppointmentResource,
  fallbackKarteId: number,
): AppointmentSummary | null => {
  const id = raw.id ?? 0;
  const dateTime = parseDateTime(raw.date);
  const patientId = raw.patientId?.trim() ?? '';
  if (!id || !dateTime || !patientId) {
    return null;
  }
  return {
    id,
    dateTime,
    name: raw.name?.trim() ?? '',
    memo: raw.memo ?? null,
    patientId,
    karteId: raw.karteBean?.id ?? fallbackKarteId,
    state: raw.state ?? 0,
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
  const endpoint = `/karte/appo/${encodeURIComponent(
    `${karteId},${formatRestDateTime(from)},${formatRestDateTime(to)}`,
  )}`;

  return measureApiPerformance(
    'reception.appointments.fetch',
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawAppoListListResource>(endpoint);
      const groups = response.data?.list ?? [];
      const flattened = groups.flatMap((group) => group.list ?? []);
      return flattened
        .map((entry) => transformAppointment(entry, karteId))
        .filter((entry): entry is AppointmentSummary => Boolean(entry))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    },
    { karteId, from: from.toISOString(), to: to.toISOString() },
  );
};

export type AppointmentCommandAction = 'create' | 'update' | 'cancel';

export interface AppointmentCommand {
  id?: number;
  scheduledAt: Date;
  name: string | null;
  memo?: string | null;
  patientId: string;
  karteId: number;
  userModelId: number;
  userId: string;
  facilityId: string;
  action: AppointmentCommandAction;
}

interface AppointmentPayload {
  id?: number;
  state: number;
  date: string;
  name: string | null;
  memo: string | null;
  patientId: string;
  confirmed: string;
  started: string;
  recorded: string;
  ended: null;
  linkId: number;
  linkRelation: null;
  status: string;
  userModel: {
    id: number;
    userId: string;
  };
  karteBean: {
    id: number;
  };
}

const buildAppointmentPayload = (command: AppointmentCommand): AppointmentPayload => {
  const timestamp = formatRestDateTime(new Date());
  const scheduled = formatRestDateTime(command.scheduledAt);
  const state = command.action === 'create' ? APPOINTMENT_STATE_NEW : APPOINTMENT_STATE_REPLACE;
  const name = command.action === 'cancel' ? null : command.name;
  const memo = command.action === 'cancel' ? null : command.memo ?? null;

  return {
    id: command.id,
    state,
    date: scheduled,
    name,
    memo,
    patientId: command.patientId,
    confirmed: timestamp,
    started: timestamp,
    recorded: timestamp,
    ended: null,
    linkId: 0,
    linkRelation: null,
    status: 'F',
    userModel: {
      id: command.userModelId,
      userId: `${command.facilityId}:${command.userId}`,
    },
    karteBean: {
      id: command.karteId,
    },
  };
};

export const saveAppointments = async (commands: AppointmentCommand[]): Promise<void> => {
  if (!commands.length) {
    return;
  }

  const payload = {
    list: commands.map(buildAppointmentPayload),
  };

  await measureApiPerformance(
    'reception.appointments.save',
    'PUT /appo',
    async () => {
      await httpClient.put<string>('/appo', payload);
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
