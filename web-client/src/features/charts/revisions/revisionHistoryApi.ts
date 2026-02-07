import type { RevisionHistoryEntry, RevisionHistoryResult } from './types';

import { httpFetch } from '../../../libs/http/httpClient';

type FetchRevisionHistoryParams = {
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string; // YYYY-MM-DD
};

const safeJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!contentType.includes('application/json')) {
    throw new Error(`unexpected content-type: ${contentType || 'unknown'} (body starts with: ${text.slice(0, 24)})`);
  }
  return JSON.parse(text) as unknown;
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toIsoFromEpoch = (value: unknown): string | undefined => {
  const num = parseNumeric(value);
  if (!num) return undefined;
  const date = new Date(num);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const normalizeEntry = (raw: any): RevisionHistoryEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const revisionId = typeof raw.revisionId === 'string' ? raw.revisionId : typeof raw.id === 'string' ? raw.id : '';
  if (!revisionId) return null;
  return {
    revisionId,
    parentRevisionId: typeof raw.parentRevisionId === 'string' ? raw.parentRevisionId : null,
    authoredAt: typeof raw.authoredAt === 'string' ? raw.authoredAt : undefined,
    authorRole: typeof raw.authorRole === 'string' ? raw.authorRole : undefined,
    authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
    operation:
      raw.operation === 'create' || raw.operation === 'revise' || raw.operation === 'restore' ? raw.operation : 'unknown',
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    changedSections: Array.isArray(raw.changedSections) ? raw.changedSections.filter((v: unknown) => typeof v === 'string') : undefined,
    charDeltaBySection:
      raw.charDeltaBySection && typeof raw.charDeltaBySection === 'object' ? (raw.charDeltaBySection as Record<string, number>) : undefined,
    meta: raw.meta && typeof raw.meta === 'object' ? (raw.meta as Record<string, unknown>) : undefined,
  };
};

export async function fetchRevisionHistory(params: FetchRevisionHistoryParams): Promise<RevisionHistoryResult> {
  if (typeof window === 'undefined') {
    return { ok: false, source: 'server', revisions: [], error: 'fetch is not available' };
  }
  if (!params.patientId) {
    return { ok: false, source: 'server', revisions: [], error: 'patientId is required' };
  }
  if (!params.visitDate) {
    return { ok: false, source: 'server', revisions: [], error: 'visitDate is required' };
  }

  // server-modernized Phase1 API:
  // - GET /karte/pid/{patientId},{fromDate} -> { id: <karteId> }
  // - GET /karte/revisions?karteId=<karteId>&visitDate=<YYYY-MM-DD>
  // - GET /karte/revisions/{revisionId} (optional detail)
  // - GET /karte/revisions/diff?fromRevisionId=<id>&toRevisionId=<id> (optional diff)
  //
  // NOTE: These paths are proxied in dev via Vite to `/openDolphin/resources/*`.
  const pidEndpoint = `/karte/pid/${encodeURIComponent(params.patientId)},${encodeURIComponent('2000-01-01 00:00:00')}`;

  try {
    const pidRes = await httpFetch(pidEndpoint, { method: 'GET' });
    if (!pidRes.ok) {
      return { ok: false, source: 'server', revisions: [], error: `HTTP ${pidRes.status} (${pidEndpoint})` };
    }
    const pidJson = (await safeJson(pidRes)) as any;
    const karteId = parseNumeric(pidJson?.id);
    if (!karteId) {
      return { ok: false, source: 'server', revisions: [], error: 'karteId is missing' };
    }

    const historyQuery = new URLSearchParams();
    historyQuery.set('karteId', String(karteId));
    historyQuery.set('visitDate', params.visitDate);
    const historyEndpoint = `/karte/revisions?${historyQuery.toString()}`;

    const historyRes = await httpFetch(historyEndpoint, { method: 'GET' });
    if (!historyRes.ok) {
      return { ok: false, source: 'server', revisions: [], error: `HTTP ${historyRes.status} (${historyEndpoint})` };
    }
    const historyJson = (await safeJson(historyRes)) as any;
    const groups = Array.isArray(historyJson?.groups) ? historyJson.groups : [];
    const items = groups.flatMap((group: any) => (Array.isArray(group?.items) ? group.items : []));
    if (items.length === 0) {
      return { ok: true, source: 'server', revisions: [] };
    }

    const detailById = new Map<number, any>();
    const diffSummaryByToId = new Map<number, string>();

    const revisionIds = Array.from(
      new Set(
        items
          .map((it: any) => parseNumeric(it?.revisionId))
          .filter((v: number | null): v is number => Boolean(v)),
      ),
    ).slice(0, 20);

    // Best-effort: hydrate author/time from revision details.
    await Promise.all(
      revisionIds.map(async (revId) => {
        const endpoint = `/karte/revisions/${encodeURIComponent(String(revId))}`;
        try {
          const res = await httpFetch(endpoint, { method: 'GET' });
          if (!res.ok) return;
          const json = await safeJson(res);
          detailById.set(revId, json);
        } catch {
          // ignore
        }
      }),
    );

    // Best-effort: fetch diffs for items that have parentRevisionId.
    await Promise.all(
      items
        .map((it: any) => ({
          to: parseNumeric(it?.revisionId),
          from: parseNumeric(it?.parentRevisionId),
        }))
        .filter((x): x is { to: number; from: number } => Boolean(x.to && x.from))
        .slice(0, 20)
        .map(async ({ from, to }) => {
          const endpoint = `/karte/revisions/diff?fromRevisionId=${encodeURIComponent(String(from))}&toRevisionId=${encodeURIComponent(String(to))}`;
          try {
            const res = await httpFetch(endpoint, { method: 'GET' });
            if (!res.ok) return;
            const json = (await safeJson(res)) as any;
            const changed = parseNumeric(json?.summary?.changedEntitiesCount);
            const label = changed === null ? 'server diff: ok' : `server diff: changedEntities=${changed}`;
            diffSummaryByToId.set(to, label);
          } catch {
            // ignore
          }
        }),
    );

    const revisions = items
      .map((it: any) => {
        const revIdNum = parseNumeric(it?.revisionId);
        const parentIdNum = parseNumeric(it?.parentRevisionId);
        if (!revIdNum) return null;

        const detail = detailById.get(revIdNum);
        const authorName =
          typeof detail?.userModel?.commonName === 'string'
            ? detail.userModel.commonName
            : typeof it?.creatorUserId === 'string'
              ? it.creatorUserId
              : undefined;
        const authoredAt =
          toIsoFromEpoch(detail?.confirmed) ??
          toIsoFromEpoch(detail?.docInfoModel?.confirmDate) ??
          toIsoFromEpoch(it?.confirmedAt) ??
          toIsoFromEpoch(it?.startedAt);

        const operation = parentIdNum ? 'revise' : 'create';
        return normalizeEntry({
          revisionId: String(revIdNum),
          parentRevisionId: parentIdNum ? String(parentIdNum) : null,
          authoredAt,
          authorRole: 'server',
          authorName,
          operation,
          summary: diffSummaryByToId.get(revIdNum),
          meta: {
            karteId,
            visitDate: params.visitDate,
            docType: typeof it?.docType === 'string' ? it.docType : undefined,
            title: typeof it?.title === 'string' ? it.title : undefined,
          },
        });
      })
      .filter((v: RevisionHistoryEntry | null): v is RevisionHistoryEntry => Boolean(v))
      // Prefer newest first. (confirmedAt may be missing; fall back to numeric id)
      .sort((a, b) => {
        const at = a.authoredAt ? Date.parse(a.authoredAt) : Number.NaN;
        const bt = b.authoredAt ? Date.parse(b.authoredAt) : Number.NaN;
        if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) return bt - at;
        const aid = parseNumeric(a.revisionId) ?? 0;
        const bid = parseNumeric(b.revisionId) ?? 0;
        return bid - aid;
      });

    return { ok: true, source: 'server', revisions };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, source: 'server', revisions: [], error: message };
  }
}
