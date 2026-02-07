export type RevisionOperation = 'create' | 'revise' | 'restore' | 'unknown';

export type RevisionHistoryEntry = {
  revisionId: string;
  parentRevisionId?: string | null;
  authoredAt?: string;
  authorRole?: string;
  authorName?: string;
  operation?: RevisionOperation;
  summary?: string;
  // Best-effort diff info (optional).
  changedSections?: string[];
  charDeltaBySection?: Record<string, number>;
  // API can attach arbitrary metadata; UI treats it as opaque.
  meta?: Record<string, unknown>;
};

export type RevisionHistorySource = 'server' | 'local' | 'none';

export type RevisionHistoryResult = {
  ok: boolean;
  source: RevisionHistorySource;
  revisions: RevisionHistoryEntry[];
  error?: string;
};

