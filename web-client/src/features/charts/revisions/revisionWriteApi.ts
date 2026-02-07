import { httpFetch } from '../../../libs/http/httpClient';

type FetchParams = {
  patientId: string;
  visitDate: string; // YYYY-MM-DD
};

export type RevisionWriteOperation = 'revise' | 'restore';

export type RevisionWriteResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  createdRevisionId?: number;
  latestRevisionId?: number;
  errorCode?: string;
  error?: string;
  conflict?: boolean;
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const safeJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!contentType.includes('application/json')) {
    throw new Error(`unexpected content-type: ${contentType || 'unknown'} (body starts with: ${text.slice(0, 24)})`);
  }
  return JSON.parse(text) as unknown;
};

const parseMaybeJson = async (response: Response): Promise<{ json: unknown | null; text: string }> => {
  const text = await response.text();
  if (!text) return { json: null, text: '' };
  try {
    return { json: JSON.parse(text) as unknown, text };
  } catch {
    return { json: null, text };
  }
};

const resolveKarteId = async (patientId: string): Promise<number> => {
  const endpoint = `/karte/pid/${encodeURIComponent(patientId)},${encodeURIComponent('2000-01-01 00:00:00')}`;
  const res = await httpFetch(endpoint, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${endpoint})`);
  const json = (await safeJson(res)) as any;
  const karteId = parseNumeric(json?.id);
  if (!karteId) throw new Error('karteId is missing');
  return karteId;
};

type HistoryItem = {
  revisionId: number;
  parentRevisionId: number | null;
  rootRevisionId: number;
};

type HistoryGroup = {
  rootRevisionId: number;
  latestRevisionId: number;
  items: HistoryItem[];
};

const fetchHistoryGroups = async (karteId: number, visitDate: string): Promise<HistoryGroup[]> => {
  const query = new URLSearchParams({ karteId: String(karteId), visitDate });
  const endpoint = `/karte/revisions?${query.toString()}`;
  const res = await httpFetch(endpoint, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${endpoint})`);
  const json = (await safeJson(res)) as any;
  const groups = Array.isArray(json?.groups) ? json.groups : [];
  return groups
    .map((group: any) => {
      const rootRevisionId = parseNumeric(group?.rootRevisionId);
      const latestRevisionId = parseNumeric(group?.latestRevisionId);
      if (!rootRevisionId || !latestRevisionId) return null;
      const items: HistoryItem[] = Array.isArray(group?.items)
        ? group.items
            .map((it: any) => {
              const revisionId = parseNumeric(it?.revisionId);
              const parentRevisionId = parseNumeric(it?.parentRevisionId);
              const root = parseNumeric(it?.rootRevisionId) ?? rootRevisionId;
              if (!revisionId) return null;
              return {
                revisionId,
                parentRevisionId: parentRevisionId ?? null,
                rootRevisionId: root,
              };
            })
            .filter(Boolean)
        : [];
      return { rootRevisionId, latestRevisionId, items };
    })
    .filter((v: HistoryGroup | null): v is HistoryGroup => Boolean(v));
};

export async function createKarteRevision(
  params: FetchParams & { operation: RevisionWriteOperation; revisionId: number; baseRevisionIdOverride?: number },
): Promise<RevisionWriteResult> {
  const operation = params.operation;
  const endpoint = operation === 'revise' ? '/karte/revisions/revise' : '/karte/revisions/restore';

  try {
    const karteId = await resolveKarteId(params.patientId);
    const groups = await fetchHistoryGroups(karteId, params.visitDate);
    const group = groups.find((g) => g.items.some((it) => it.revisionId === params.revisionId));
    const latest =
      group?.latestRevisionId ??
      groups.map((g) => g.latestRevisionId).reduce<number | null>((acc, v) => (acc === null ? v : Math.max(acc, v)), null) ??
      params.revisionId;

    const sourceRevisionId = params.revisionId;
    const baseRevisionId = params.baseRevisionIdOverride ?? latest;

    const res = await httpFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourceRevisionId, baseRevisionId }),
    });

    const parsed = await parseMaybeJson(res);
    const body = (parsed.json && typeof parsed.json === 'object' ? (parsed.json as any) : {}) as any;

    if (res.status === 409) {
      return {
        ok: false,
        status: res.status,
        endpoint,
        conflict: true,
        errorCode:
          typeof body?.code === 'string'
            ? body.code
            : typeof body?.error === 'string'
              ? body.error
              : typeof body?.reason === 'string'
                ? body.reason
                : undefined,
        latestRevisionId: parseNumeric(body?.latestRevisionId) ?? undefined,
        error: typeof body?.message === 'string' ? body.message : `HTTP 409 (${endpoint})`,
      };
    }

    if (!res.ok) {
      const msg =
        typeof body?.message === 'string'
          ? body.message
          : typeof body?.error === 'string'
            ? body.error
            : parsed.text
              ? parsed.text.slice(0, 240)
              : `HTTP ${res.status} (${endpoint})`;
      return { ok: false, status: res.status, endpoint, error: msg };
    }

    const createdRevisionId =
      parseNumeric(body?.createdRevisionId) ??
      parseNumeric(body?.docPk) ??
      parseNumeric(body?.id) ??
      parseNumeric(parsed.text);

    return {
      ok: true,
      status: res.status,
      endpoint,
      createdRevisionId: createdRevisionId ?? undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, endpoint, error: message };
  }
}
