import { http, HttpResponse, passthrough } from 'msw';

const generateRunId = () => new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';

const generateTraceId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `trace-${Date.now()}`;
};

const resolveAuditHeaders = (request: Request) => {
  const runId = request.headers.get('x-run-id') ?? generateRunId();
  const traceId = request.headers.get('x-trace-id') ?? generateTraceId();
  return { runId, traceId };
};

const shouldBypass = (request: Request): boolean => {
  // When the app explicitly requests server-backed data (e.g. E2E with
  // X-DataSource-Transition=server), do not override master queries.
  const transition = request.headers.get('x-datasource-transition');
  return transition != null && transition.trim().toLowerCase() === 'server';
};

type TensuItem = {
  tensuCode?: string;
  name?: string;
  unit?: string;
  category?: string;
  points?: number;
  noticeDate?: string;
  startDate?: string;
  endDate?: string;
};

type DrugMasterItem = {
  code?: string;
  name?: string;
  unit?: string;
  category?: string;
  note?: string;
  validFrom?: string;
  validTo?: string;
};

const BODY_PART_ITEMS: TensuItem[] = [
  { tensuCode: '002001', name: '胸部', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
  { tensuCode: '002002', name: '腹部', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
  { tensuCode: '002003', name: '膝関節', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
];

const GENERIC_CLASS_ITEMS: DrugMasterItem[] = [
  {
    code: 'A100',
    name: 'アムロジピン',
    unit: '錠',
    category: '降圧薬',
    note: 'MSW',
    validFrom: '20240101',
    validTo: '99999999',
  },
  {
    code: 'A200',
    name: 'ロサルタン',
    unit: '錠',
    category: '降圧薬',
    note: 'MSW',
    validFrom: '20240101',
    validTo: '99999999',
  },
];

const MATERIAL_ITEMS: DrugMasterItem[] = [
  {
    code: 'M001',
    name: '処置材料A',
    unit: '個',
    category: '処置',
    note: 'MSW',
    validFrom: '20240101',
    validTo: '99999999',
  },
];

const YOUHOU_ITEMS: DrugMasterItem[] = [
  {
    code: 'Y100',
    name: '1日1回 朝食後',
    unit: '回',
    category: '用法',
    note: 'MSW',
    validFrom: '20240101',
    validTo: '99999999',
  },
];

const KENSA_SORT_ITEMS: DrugMasterItem[] = [
  {
    code: 'K01',
    name: '血液検査',
    unit: '回',
    category: '検査区分',
    note: 'MSW',
    validFrom: '20240101',
    validTo: '99999999',
  },
];

const filterByKeyword = (items: TensuItem[], keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const name = item.name?.toLowerCase() ?? '';
    const code = item.tensuCode?.toLowerCase() ?? '';
    return name.includes(normalized) || code.includes(normalized);
  });
};

const handleEtensuRequest = (request: Request) => {
  const { runId, traceId } = resolveAuditHeaders(request);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const keyword = url.searchParams.get('keyword') ?? '';
  if (category && category !== '2') {
    return HttpResponse.json(
      { items: [], totalCount: 0, message: 'unsupported category', runId, traceId },
      { status: 400, headers: { 'x-run-id': runId, 'x-trace-id': traceId } },
    );
  }
  const items = filterByKeyword(BODY_PART_ITEMS, keyword);
  return HttpResponse.json(
    { items, totalCount: items.length, runId, traceId },
    { headers: { 'x-run-id': runId, 'x-trace-id': traceId } },
  );
};

const filterDrugItems = (items: DrugMasterItem[], keyword: string) => {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const name = item.name?.toLowerCase() ?? '';
    const code = item.code?.toLowerCase() ?? '';
    return name.includes(normalized) || code.includes(normalized);
  });
};

const handleDrugMasterRequest = (request: Request, items: DrugMasterItem[]) => {
  const { runId, traceId } = resolveAuditHeaders(request);
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword') ?? '';
  const filtered = filterDrugItems(items, keyword);
  return HttpResponse.json(
    { items: filtered, totalCount: filtered.length, runId, traceId },
    { headers: { 'x-run-id': runId, 'x-trace-id': traceId } },
  );
};

export const orcaMasterHandlers = [
  http.get('/orca/tensu/etensu', ({ request }) => (shouldBypass(request) ? passthrough() : handleEtensuRequest(request))),
  http.get('/orca/master/etensu', ({ request }) => (shouldBypass(request) ? passthrough() : handleEtensuRequest(request))),
  http.get('/orca/master/generic-class', ({ request }) => (shouldBypass(request) ? passthrough() : handleDrugMasterRequest(request, GENERIC_CLASS_ITEMS))),
  http.get('/orca/master/material', ({ request }) => (shouldBypass(request) ? passthrough() : handleDrugMasterRequest(request, MATERIAL_ITEMS))),
  http.get('/orca/master/youhou', ({ request }) => (shouldBypass(request) ? passthrough() : handleDrugMasterRequest(request, YOUHOU_ITEMS))),
  http.get('/orca/master/kensa-sort', ({ request }) => (shouldBypass(request) ? passthrough() : handleDrugMasterRequest(request, KENSA_SORT_ITEMS))),
];
