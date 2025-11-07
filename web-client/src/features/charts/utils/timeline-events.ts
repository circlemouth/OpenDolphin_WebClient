import type { PaletteToken } from '@/styles/theme';
import type { DocInfoSummary } from '@/features/charts/types/doc';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { LaboModule } from '@/features/charts/types/labo';

export type TimelineEventCategory = 'document' | 'visit' | 'lab' | 'order';

export interface TimelineEventCategoryMeta {
  id: TimelineEventCategory;
  label: string;
  icon: string;
  color: PaletteToken;
}

export const TIMELINE_EVENT_CATEGORIES: TimelineEventCategoryMeta[] = [
  { id: 'document', label: 'カルテ', icon: '📄', color: 'primary' },
  { id: 'visit', label: '来院', icon: '🩺', color: 'accent' },
  { id: 'lab', label: '検査', icon: '🧪', color: 'success' },
  { id: 'order', label: 'オーダ', icon: '💊', color: 'warning' },
] as const;

export const TIMELINE_EVENT_META: Record<TimelineEventCategory, TimelineEventCategoryMeta> =
  TIMELINE_EVENT_CATEGORIES.reduce<Record<TimelineEventCategory, TimelineEventCategoryMeta>>(
    (accumulator, meta) => {
      accumulator[meta.id] = meta;
      return accumulator;
    },
    {
      document: TIMELINE_EVENT_CATEGORIES[0],
      visit: TIMELINE_EVENT_CATEGORIES[1],
      lab: TIMELINE_EVENT_CATEGORIES[2],
      order: TIMELINE_EVENT_CATEGORIES[3],
    },
  );

export interface TimelineOrderSource {
  id: string;
  type: 'medication' | 'procedure' | 'exam' | 'followup' | 'injection' | 'guidance';
  label: string;
  detail?: string;
  orderModuleId?: string | null;
  createdAt?: string | null;
  orderSummary?: string | null;
}

export interface TimelinePlanCardSource {
  id: string;
  type: 'medication' | 'procedure' | 'exam' | 'followup' | 'injection' | 'guidance';
  title: string;
  detail: string;
  createdAt?: string | null;
  orderModuleId?: string | null;
  orderSummary?: string | null;
}

interface DocumentEventPayload {
  kind: 'document';
  docPk: number;
  status: string;
  department?: string | null;
  docType?: string | null;
  docId?: string | null;
}

interface VisitEventPayload {
  kind: 'visit';
  visitId: number;
  state: number;
  department?: string;
  doctor?: string | null;
}

interface LabEventPayload {
  kind: 'lab';
  moduleId: number;
  sampleDate?: string | null;
  abnormalCount: number;
  topItems: { name: string; value: string; unit?: string }[];
}

interface OrderEventPayload {
  kind: 'order';
  orderId: string;
  orderModuleId?: string | null;
  orderType: TimelineOrderSource['type'];
  summary: string;
  detail?: string;
}

export type TimelineEventPayload = DocumentEventPayload | VisitEventPayload | LabEventPayload | OrderEventPayload;

export interface TimelineEvent {
  id: string;
  type: TimelineEventCategory;
  occurredAt: string | null;
  title: string;
  subtitle?: string;
  badge?: string;
  description?: string;
  tags: string[];
  searchText: string;
  payload: TimelineEventPayload;
}

export interface BuildTimelineEventsOptions {
  documents?: DocInfoSummary[];
  visits?: PatientVisitSummary[];
  labModules?: LaboModule[];
  orderSources?: TimelineOrderSource[];
  planCards?: TimelinePlanCardSource[];
}

const PLAN_TYPE_LABEL: Record<TimelineOrderSource['type'], string> = {
  medication: '処方',
  procedure: '処置',
  exam: '検査',
  followup: 'フォロー',
  injection: '注射',
  guidance: '指導',
};

const toSortValue = (timestamp: string | null | undefined, fallback: number) => {
  if (!timestamp) {
    return fallback;
  }
  const parsed = Date.parse(timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T'));
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toSearchText = (values: Array<string | null | undefined>) =>
  values
    .flatMap((value) => (typeof value === 'string' ? value.trim() : []))
    .filter((value) => value.length > 0)
    .join(' ')
    .toLowerCase();

const countAbnormalItems = (module: LaboModule) =>
  module.items.filter((item) => Boolean(item.abnormalFlag) && item.abnormalFlag !== 'N').length;

const pickTopLabItems = (module: LaboModule): { name: string; value: string; unit?: string }[] =>
  module.items.slice(0, 3).map((item) => ({
    name: item.itemName ?? '検査項目',
    value: item.valueText ?? '---',
    unit: item.unit ?? undefined,
  }));

const normalizePlanSource = (
  sources: TimelinePlanCardSource[] | undefined,
  orders: TimelineOrderSource[] | undefined,
): TimelineOrderSource[] => {
  const byId = new Map<string, TimelineOrderSource>();

  for (const order of orders ?? []) {
    byId.set(order.id, order);
  }

  for (const card of sources ?? []) {
    const existing = byId.get(card.id);
    if (existing) {
      byId.set(card.id, {
        ...existing,
        label: existing.label || card.title || PLAN_TYPE_LABEL[card.type],
        detail: existing.detail ?? card.detail,
        createdAt: existing.createdAt ?? card.createdAt,
        orderModuleId: existing.orderModuleId ?? card.orderModuleId,
        orderSummary: existing.orderSummary ?? card.orderSummary,
      });
    } else {
      byId.set(card.id, {
        id: card.id,
        type: card.type,
        label: card.title || PLAN_TYPE_LABEL[card.type],
        detail: card.detail,
        orderModuleId: card.orderModuleId,
        createdAt: card.createdAt,
        orderSummary: card.orderSummary,
      });
    }
  }

  return Array.from(byId.values());
};

export const buildTimelineEvents = ({
  documents = [],
  visits = [],
  labModules = [],
  orderSources,
  planCards,
}: BuildTimelineEventsOptions): TimelineEvent[] => {
  const events: Array<{ sort: number; sequence: number; event: TimelineEvent }> = [];
  let sequence = 0;

  for (const doc of documents) {
    sequence += 1;
    const occurredAt = doc.confirmDate ?? doc.firstConfirmDate ?? null;
    const sort = toSortValue(occurredAt, Number.NEGATIVE_INFINITY);
    events.push({
      sort,
      sequence,
      event: {
        id: `document-${doc.docPk}`,
        type: 'document',
        occurredAt,
        title: doc.title || '無題のカルテ',
        subtitle: doc.docType ?? undefined,
        badge: doc.departmentDesc ?? undefined,
        description: doc.purposeDesc ?? undefined,
        tags: [doc.status, doc.docType, doc.departmentDesc, doc.purposeDesc].filter(
          (value): value is string => Boolean(value),
        ),
        searchText: toSearchText([
          doc.title,
          doc.docType,
          doc.departmentDesc,
          doc.status,
          doc.docId,
          doc.purposeDesc,
          doc.healthInsuranceDesc,
        ]),
        payload: {
          kind: 'document',
          docPk: doc.docPk,
          status: doc.status,
          department: doc.departmentDesc,
          docType: doc.docType,
          docId: doc.docId,
        },
      },
    });
  }

  for (const visit of visits) {
    sequence += 1;
    const occurredAt = visit.visitDate ?? visit.raw.pvtDate ?? null;
    const sort = toSortValue(occurredAt, Number.NEGATIVE_INFINITY);
    events.push({
      sort,
      sequence,
      event: {
        id: `visit-${visit.visitId}`,
        type: 'visit',
        occurredAt,
        title: visit.departmentName || '来院記録',
        subtitle: visit.doctorName ?? undefined,
        badge: visit.state.toString(),
        description: visit.memo ?? undefined,
        tags: [
          visit.departmentName,
          visit.doctorName,
          visit.memo,
          visit.patientId,
          visit.fullName,
          visit.kanaName,
        ].filter((value): value is string => Boolean(value)),
        searchText: toSearchText([
          visit.departmentName,
          visit.doctorName,
          visit.memo,
          visit.patientId,
          visit.fullName,
          visit.kanaName,
        ]),
        payload: {
          kind: 'visit',
          visitId: visit.visitId,
          state: visit.state,
          department: visit.departmentName,
          doctor: visit.doctorName,
        },
      },
    });
  }

  for (const module of labModules) {
    sequence += 1;
    const occurredAt = module.sampleDate ?? module.items[0]?.sampleDate ?? null;
    const sort = toSortValue(occurredAt, Number.NEGATIVE_INFINITY);
    const topItems = pickTopLabItems(module);
    events.push({
      sort,
      sequence,
      event: {
        id: `lab-${module.id}`,
        type: 'lab',
        occurredAt,
        title: topItems[0]?.name ?? '検査結果',
        subtitle: module.itemCount ? `${module.itemCount} 件` : undefined,
        badge: countAbnormalItems(module) > 0 ? '要確認' : undefined,
        description: topItems
          .map((item) => `${item.name}: ${item.value}${item.unit ? ` ${item.unit}` : ''}`)
          .join(' / '),
        tags: topItems.map((item) => item.name),
        searchText: toSearchText([
          module.raw?.facilityName,
          module.raw?.patientName,
          module.raw?.moduleKey,
          ...topItems.map((item) => item.name),
        ]),
        payload: {
          kind: 'lab',
          moduleId: module.id,
          sampleDate: module.sampleDate,
          abnormalCount: countAbnormalItems(module),
          topItems,
        },
      },
    });
  }

  const normalizedOrders = normalizePlanSource(planCards, orderSources);
  for (const order of normalizedOrders) {
    sequence += 1;
    const occurredAt = order.createdAt ?? null;
    const sort = toSortValue(occurredAt, Number.NEGATIVE_INFINITY);
    const typeLabel = PLAN_TYPE_LABEL[order.type];
    events.push({
      sort,
      sequence,
      event: {
        id: `order-${order.id}`,
        type: 'order',
        occurredAt,
        title: order.label || typeLabel,
        subtitle: typeLabel,
        badge: undefined,
        description: order.orderSummary ?? order.detail ?? undefined,
        tags: [typeLabel, order.label, order.detail, order.orderSummary].filter(
          (value): value is string => Boolean(value),
        ),
        searchText: toSearchText([order.label, order.detail, order.orderSummary, typeLabel]),
        payload: {
          kind: 'order',
          orderId: order.id,
          orderModuleId: order.orderModuleId,
          orderType: order.type,
          summary: order.orderSummary ?? order.label ?? typeLabel,
          detail: order.detail,
        },
      },
    });
  }

  return events
    .sort((left, right) => {
      if (right.sort === left.sort) {
        return right.sequence - left.sequence;
      }
      return right.sort - left.sort;
    })
    .map((item) => item.event);
};

export interface TimelineFilterOptions {
  categories?: Set<TimelineEventCategory> | TimelineEventCategory[];
  keyword?: string;
}

export const filterTimelineEvents = (events: TimelineEvent[], options: TimelineFilterOptions): TimelineEvent[] => {
  const categorySet: Set<TimelineEventCategory> = Array.isArray(options.categories)
    ? new Set(options.categories)
    : options.categories instanceof Set
      ? options.categories
      : new Set(['document', 'visit', 'lab', 'order']);

  const normalizedKeyword = options.keyword?.trim().toLowerCase() ?? '';

  return events.filter((event) => {
    if (!categorySet.has(event.type)) {
      return false;
    }
    if (!normalizedKeyword) {
      return true;
    }
    return event.searchText.includes(normalizedKeyword);
  });
};
