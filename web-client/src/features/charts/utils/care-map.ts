import type { DocInfoSummary } from '@/features/patients/types/karte';
import type { AppointmentSummary } from '@/features/reception/api/appointment-api';
import type { LaboModule } from '@/features/charts/types/labo';
import type { MediaItem } from '@/features/charts/types/media';

export type CareMapEventType = 'document' | 'appointment' | 'lab' | 'image';

export interface CareMapEventMeta {
  [key: string]: unknown;
}

export interface CareMapEvent {
  id: string;
  type: CareMapEventType;
  occurredAt: Date;
  title: string;
  description?: string;
  details?: string;
  meta?: CareMapEventMeta;
}

export interface BuildCareMapEventsParams {
  documents: DocInfoSummary[];
  appointments: AppointmentSummary[];
  laboModules: LaboModule[];
  mediaItems: MediaItem[];
}

const normalizeDateInput = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('T')) {
    return trimmed.length === 10 ? `${trimmed}T00:00:00` : trimmed;
  }
  if (trimmed.length === 10) {
    return `${trimmed}T00:00:00`;
  }
  return trimmed.replace(' ', 'T');
};

export const parseCareMapDate = (value: string | null | undefined): Date | null => {
  const normalized = normalizeDateInput(value);
  if (!normalized) {
    return null;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const isAbnormalFlag = (flag: string | null | undefined): boolean => {
  if (!flag) {
    return false;
  }
  const normalized = flag.trim().toUpperCase();
  return Boolean(normalized && normalized !== 'N' && normalized !== '0');
};

const summarizeLaboModule = (module: LaboModule): { description: string; details?: string } => {
  const items = module.items ?? [];
  const abnormalCount = items.filter((item) => isAbnormalFlag(item.abnormalFlag)).length;
  const description = `${module.itemCount}件の検査結果${
    abnormalCount ? `（異常 ${abnormalCount}）` : ''
  }`;
  const highlight = items
    .slice(0, 3)
    .map((item) => {
      const valueText = item.valueText ? item.valueText.trim() : '';
      const unit = item.unit ? item.unit.trim() : '';
      const suffix = unit ? `${valueText}${unit}` : valueText;
      return `${item.itemName}${suffix ? `：${suffix}` : ''}`;
    })
    .filter(Boolean)
    .join(' / ');
  return { description, details: highlight || undefined };
};

export const buildCareMapEvents = ({
  documents,
  appointments,
  laboModules,
  mediaItems,
}: BuildCareMapEventsParams): CareMapEvent[] => {
  const events: CareMapEvent[] = [];

  for (const doc of documents) {
    const occurredAt = parseCareMapDate(doc.confirmDate ?? null);
    if (!occurredAt) {
      continue;
    }
    events.push({
      id: `document-${doc.docPk}`,
      type: 'document',
      occurredAt,
      title: doc.title,
      description: doc.departmentDesc ?? undefined,
      details: doc.status ?? undefined,
      meta: { docPk: doc.docPk },
    });
  }

  for (const appointment of appointments) {
    const occurredAt = parseCareMapDate(appointment.dateTime);
    if (!occurredAt) {
      continue;
    }
    events.push({
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      occurredAt,
      title: appointment.name || '予約',
      description: appointment.memo ?? undefined,
      meta: { appointmentId: appointment.id, state: appointment.state },
    });
  }

  for (const module of laboModules) {
    const occurredAt = parseCareMapDate(module.sampleDate ?? module.items?.[0]?.sampleDate ?? null);
    if (!occurredAt) {
      continue;
    }
    const summary = summarizeLaboModule(module);
    events.push({
      id: `lab-${module.id}`,
      type: 'lab',
      occurredAt,
      title: module.items?.[0]?.specimenName
        ? `${module.items[0].specimenName}の検査`
        : '検査結果',
      description: summary.description,
      details: summary.details,
      meta: { moduleId: module.id, itemCount: module.itemCount },
    });
  }

  for (const media of mediaItems) {
    const occurredAt = parseCareMapDate(media.capturedAt ?? null);
    if (!occurredAt) {
      continue;
    }
    events.push({
      id: `image-${media.id}`,
      type: 'image',
      occurredAt,
      title: media.title,
      description: media.description ?? undefined,
      meta: { mediaId: media.id },
    });
  }

  return events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
};

export const formatCareMapDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const groupCareMapEventsByDate = (
  events: CareMapEvent[],
): Record<string, CareMapEvent[]> => {
  return events.reduce<Record<string, CareMapEvent[]>>((acc, event) => {
    const key = formatCareMapDateKey(event.occurredAt);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    acc[key].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    return acc;
  }, {});
};
