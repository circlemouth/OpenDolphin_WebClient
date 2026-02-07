import { SOAP_SECTION_LABELS, type SoapEntry, type SoapSectionKey } from '../soapNote';

import type { RevisionHistoryEntry, RevisionHistoryResult } from './types';

type SoapRevisionGroup = {
  authoredAt: string;
  entries: SoapEntry[];
};

const toIso = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

const sortAsc = (a: string, b: string) => a.localeCompare(b);

const groupByAuthoredAt = (entries: SoapEntry[]): SoapRevisionGroup[] => {
  const groups = new Map<string, SoapEntry[]>();
  entries.forEach((entry) => {
    const key = entry.authoredAt || 'unknown';
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  });
  const authoredAts = Array.from(groups.keys()).sort(sortAsc);
  return authoredAts.map((authoredAt) => ({
    authoredAt,
    entries: (groups.get(authoredAt) ?? []).slice(),
  }));
};

const resolveGroupAuthor = (group: SoapRevisionGroup) => {
  const first = group.entries[0];
  return {
    authorRole: first?.authorRole,
    authorName: first?.authorName,
  };
};

const resolveOperation = (group: SoapRevisionGroup): 'create' | 'revise' | 'unknown' => {
  const actions = new Set(group.entries.map((e) => e.action));
  if (actions.has('save') && !actions.has('update')) return 'create';
  if (actions.has('update') && !actions.has('save')) return 'revise';
  if (actions.size > 1) return 'revise';
  return 'unknown';
};

const resolveChangedSections = (group: SoapRevisionGroup): SoapSectionKey[] => {
  const set = new Set<SoapSectionKey>();
  group.entries.forEach((entry) => set.add(entry.section));
  return Array.from(set.values());
};

type SoapSnapshot = Record<SoapSectionKey, string>;

const emptySnapshot = (): SoapSnapshot => ({
  free: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
});

const applyGroupToSnapshot = (prev: SoapSnapshot, group: SoapRevisionGroup): SoapSnapshot => {
  const next: SoapSnapshot = { ...prev };
  group.entries.forEach((entry) => {
    next[entry.section] = entry.body ?? '';
  });
  return next;
};

const snapshotCharDelta = (prev: SoapSnapshot, next: SoapSnapshot, sections: SoapSectionKey[]) => {
  const delta: Record<string, number> = {};
  sections.forEach((section) => {
    const before = prev[section]?.length ?? 0;
    const after = next[section]?.length ?? 0;
    delta[SOAP_SECTION_LABELS[section]] = after - before;
  });
  return delta;
};

export function buildSoapRevisionHistory(entries: SoapEntry[]): RevisionHistoryResult {
  if (!entries || entries.length === 0) {
    return { ok: true, source: 'none', revisions: [] };
  }

  const groups = groupByAuthoredAt(entries).sort((a, b) => toIso(a.authoredAt).localeCompare(toIso(b.authoredAt)));
  const revisions: RevisionHistoryEntry[] = [];

  let prevSnapshot: SoapSnapshot = emptySnapshot();
  let prevRevisionId: string | null = null;

  groups.forEach((group, index) => {
    const revisionId = group.authoredAt ? `soap:${group.authoredAt}` : `soap:unknown:${index}`;
    const parentRevisionId = prevRevisionId;
    const changedSections = resolveChangedSections(group);
    const nextSnapshot = applyGroupToSnapshot(prevSnapshot, group);
    const charDeltaBySection = snapshotCharDelta(prevSnapshot, nextSnapshot, changedSections);
    const { authorRole, authorName } = resolveGroupAuthor(group);

    revisions.push({
      revisionId,
      parentRevisionId,
      authoredAt: group.authoredAt,
      authorRole,
      authorName,
      operation: resolveOperation(group),
      summary: changedSections.length > 0 ? `SOAP更新: ${changedSections.map((s) => SOAP_SECTION_LABELS[s]).join(', ')}` : 'SOAP更新',
      changedSections: changedSections.map((s) => SOAP_SECTION_LABELS[s]),
      charDeltaBySection,
      meta: {
        kind: 'soap',
        entryCount: group.entries.length,
      },
    });

    prevSnapshot = nextSnapshot;
    prevRevisionId = revisionId;
  });

  // Newest first for UI.
  revisions.reverse();
  return { ok: true, source: 'local', revisions };
}

