import { describe, expect, it } from 'vitest';

import { buildSoapRevisionHistory } from '../revisions/soapRevisionHistory';
import type { SoapEntry } from '../soapNote';

describe('buildSoapRevisionHistory', () => {
  it('authoredAt でグルーピングし、parentRevisionId と差分（char delta）を付与する', () => {
    const history: SoapEntry[] = [
      {
        id: 'subjective-1',
        section: 'subjective',
        body: 'S1',
        authoredAt: '2026-02-06T10:00:00.000Z',
        authorRole: 'doctor',
        authorName: 'Dr A',
        action: 'save',
      },
      {
        id: 'plan-1',
        section: 'plan',
        body: 'P1',
        authoredAt: '2026-02-06T10:00:00.000Z',
        authorRole: 'doctor',
        authorName: 'Dr A',
        action: 'save',
      },
      {
        id: 'subjective-2',
        section: 'subjective',
        body: 'S1-updated',
        authoredAt: '2026-02-06T11:00:00.000Z',
        authorRole: 'doctor',
        authorName: 'Dr B',
        action: 'update',
      },
    ];

    const result = buildSoapRevisionHistory(history);
    expect(result.ok).toBe(true);
    expect(result.source).toBe('local');
    expect(result.revisions.length).toBe(2);

    const newest = result.revisions[0];
    const older = result.revisions[1];

    expect(newest.revisionId).toContain('soap:2026-02-06T11:00:00.000Z');
    expect(newest.parentRevisionId).toContain('soap:2026-02-06T10:00:00.000Z');
    expect(newest.changedSections).toEqual(['Subjective']);
    expect(newest.charDeltaBySection?.Subjective).toBe('S1-updated'.length - 'S1'.length);

    expect(older.parentRevisionId).toBeNull();
    expect(older.changedSections?.sort()).toEqual(['Plan', 'Subjective'].sort());
    expect(older.charDeltaBySection?.Subjective).toBe('S1'.length);
    expect(older.charDeltaBySection?.Plan).toBe('P1'.length);
  });

  it('空の場合は source=none で空配列', () => {
    const result = buildSoapRevisionHistory([]);
    expect(result.ok).toBe(true);
    expect(result.source).toBe('none');
    expect(result.revisions).toEqual([]);
  });
});

