import { describe, expect, it } from 'vitest';

import type { DocInfoSummary } from '@/features/charts/types/doc';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { LaboModule, LaboItem } from '@/features/charts/types/labo';
import type { TimelineOrderSource, TimelinePlanCardSource } from '../timeline-events';
import { buildTimelineEvents, filterTimelineEvents } from '../timeline-events';
import { createDocInfoSummary } from './doc-info-summary.fixture';

const createDoc = (overrides: Partial<DocInfoSummary> = {}): DocInfoSummary =>
  createDocInfoSummary({
    docType: '経過記録',
    departmentDesc: '内科',
    title: '標準カルテ',
    confirmDate: '2025-10-10T09:00:00Z',
    firstConfirmDate: null,
    ...overrides,
  });

const createVisit = (overrides: Partial<PatientVisitSummary> = {}): PatientVisitSummary => ({
  visitId: overrides.visitId ?? 1,
  facilityId: overrides.facilityId,
  visitDate: overrides.visitDate ?? '2025-10-11T09:30:00Z',
  state: overrides.state ?? 1,
  memo: overrides.memo ?? '発熱外来',
  insuranceUid: overrides.insuranceUid,
  departmentCode: overrides.departmentCode,
  departmentName: overrides.departmentName ?? '総合内科',
  doctorId: overrides.doctorId,
  doctorName: overrides.doctorName ?? '担当医',
  jmariNumber: overrides.jmariNumber,
  patientPk: overrides.patientPk ?? 100,
  patientId: overrides.patientId ?? '0001',
  fullName: overrides.fullName ?? 'テスト太郎',
  kanaName: overrides.kanaName ?? 'テストタロウ',
  gender: overrides.gender,
  birthday: overrides.birthday,
  ownerUuid: overrides.ownerUuid ?? null,
  safetyNotes: overrides.safetyNotes ?? [],
  raw:
    overrides.raw ??
    ({
      id: overrides.visitId ?? 1,
      pvtDate: overrides.visitDate ?? '2025-10-11T09:30:00Z',
      memo: overrides.memo ?? '発熱外来',
    } as PatientVisitSummary['raw']),
});

const createLabItem = (overrides: Partial<LaboItem> = {}): LaboItem => ({
  id: overrides.id ?? 1,
  itemCode: overrides.itemCode ?? 'GLU',
  itemName: overrides.itemName ?? '血糖',
  valueText: overrides.valueText ?? '110',
  unit: overrides.unit,
  abnormalFlag: overrides.abnormalFlag ?? 'H',
  normalRange: overrides.normalRange ?? null,
  sampleDate: overrides.sampleDate ?? '2025-10-12T08:40:00Z',
  comments: overrides.comments ?? [],
  specimenName: overrides.specimenName,
  raw: overrides.raw ?? {
    id: overrides.id ?? 1,
    itemName: overrides.itemName ?? '血糖',
  },
});

const createLabModule = (overrides: Partial<LaboModule> = {}): LaboModule => ({
  id: overrides.id ?? 1,
  sampleDate: overrides.sampleDate ?? '2025-10-12T08:40:00Z',
  itemCount: overrides.itemCount ?? 2,
  centerCode: overrides.centerCode,
  moduleKey: overrides.moduleKey ?? 'LAB-001',
  reportFormat: overrides.reportFormat,
  items: overrides.items ?? [createLabItem(), createLabItem({ id: 2, itemName: 'HbA1c', valueText: '6.5', unit: '%' })],
  raw: overrides.raw ?? {
    id: overrides.id ?? 1,
    sampleDate: overrides.sampleDate ?? '2025-10-12T08:40:00Z',
  },
});

const createOrder = (overrides: Partial<TimelineOrderSource> = {}): TimelineOrderSource => ({
  id: overrides.id ?? 'order-1',
  type: overrides.type ?? 'medication',
  label: overrides.label ?? '降圧薬',
  detail: overrides.detail ?? 'アムロジピン 5mg',
  orderModuleId: overrides.orderModuleId ?? null,
  createdAt: overrides.createdAt ?? '2025-10-13T07:15:00Z',
  orderSummary: overrides.orderSummary ?? '高血圧治療',
});

const createPlanCard = (overrides: Partial<TimelinePlanCardSource> = {}): TimelinePlanCardSource => ({
  id: overrides.id ?? 'order-1',
  type: overrides.type ?? 'medication',
  title: overrides.title ?? '降圧薬追加',
  detail: overrides.detail ?? 'アムロジピンを継続処方',
  createdAt: overrides.createdAt,
  orderModuleId: overrides.orderModuleId ?? null,
  orderSummary: overrides.orderSummary,
});

describe('buildTimelineEvents', () => {
  it('merges and sorts events by時刻降順で、タイムスタンプがないイベントを末尾に配置する', () => {
    const events = buildTimelineEvents({
      documents: [
        createDoc({ docPk: 1, confirmDate: '2025-10-10T09:00:00Z', title: '初診記録' }),
        createDoc({ docPk: 2, confirmDate: '2025-10-09T09:00:00Z', title: '再診記録' }),
      ],
      visits: [createVisit({ visitId: 10, visitDate: '2025-10-11T08:00:00Z', departmentName: '小児科' })],
      labModules: [createLabModule({ id: 99, sampleDate: '2025-10-12T07:00:00Z' })],
      orderSources: [
        createOrder({ id: 'order-1', createdAt: '2025-10-13T06:00:00Z' }),
        createOrder({ id: 'order-2', type: 'exam', label: '胸部X線', detail: '立位正面', createdAt: '' }),
      ],
      planCards: [createPlanCard({ id: 'order-2', type: 'exam', detail: '胸部X線撮影', createdAt: '' })],
    });

    expect(events.map((event) => event.id)).toEqual([
      'order-order-1',
      'lab-99',
      'visit-10',
      'document-1',
      'document-2',
      'order-order-2',
    ]);
  });
});

describe('filterTimelineEvents', () => {
  it('filters by category set and keyword', () => {
    const allEvents = buildTimelineEvents({
      documents: [createDoc({ title: '糖尿病経過', status: 'F' })],
      visits: [createVisit({ memo: '眼科紹介', departmentName: '眼科' })],
      labModules: [
        createLabModule({
          items: [
            createLabItem({ itemName: '尿蛋白', valueText: '+', abnormalFlag: 'A' }),
            createLabItem({ id: 3, itemName: '尿糖', valueText: '-', abnormalFlag: 'N' }),
          ],
        }),
      ],
      orderSources: [createOrder({ type: 'guidance', label: '生活指導', detail: '食事療法' })],
    });

    const filtered = filterTimelineEvents(allEvents, {
      categories: ['document', 'lab'],
      keyword: '尿蛋白',
    });

    expect(filtered.map((event) => event.type)).toEqual(['lab']);
    const labPayload = filtered[0]?.payload;
    expect(labPayload?.kind).toBe('lab');
    if (labPayload?.kind === 'lab') {
      expect(labPayload.topItems[0]?.name).toBe('尿蛋白');
    }

    const docOnly = filterTimelineEvents(allEvents, {
      categories: ['document'],
      keyword: '糖尿病',
    });

    expect(docOnly).toHaveLength(1);
    expect(docOnly[0]?.payload).toMatchObject({ kind: 'document' });

    const noMatch = filterTimelineEvents(allEvents, {
      categories: ['visit'],
      keyword: '尿蛋白',
    });

    expect(noMatch).toHaveLength(0);
  });
});
