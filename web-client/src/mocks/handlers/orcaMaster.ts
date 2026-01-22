import { http, HttpResponse } from 'msw';

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

const BODY_PART_ITEMS: TensuItem[] = [
  { tensuCode: '002001', name: '胸部', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
  { tensuCode: '002002', name: '腹部', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
  { tensuCode: '002003', name: '膝関節', unit: '部位', category: '2', points: 0, noticeDate: '20240101', startDate: '20240101' },
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

export const orcaMasterHandlers = [
  http.get('/orca/tensu/etensu', ({ request }) => {
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
  }),
];
