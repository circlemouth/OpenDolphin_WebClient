import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildChartsEncounterSearch,
  loadChartsEncounterContext,
  parseChartsEncounterContext,
  parseChartsNavigationMeta,
  parseReceptionCarryoverParams,
  storeChartsEncounterContext,
  normalizeRunId,
} from '../encounterContext';

describe('charts encounterContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('parse/build: empty -> empty', () => {
    expect(parseChartsEncounterContext('')).toEqual({
      patientId: undefined,
      appointmentId: undefined,
      receptionId: undefined,
      visitDate: undefined,
    });
    expect(buildChartsEncounterSearch({})).toBe('');
  });

  it('parse/build: visitDate は YYYY-MM-DD のみ採用', () => {
    const parsed = parseChartsEncounterContext('?patientId=0001&receptionId=R-9&visitDate=2025-12-18');
    expect(parsed).toEqual({
      patientId: '0001',
      appointmentId: undefined,
      receptionId: 'R-9',
      visitDate: '2025-12-18',
    });

    const carryover = parseReceptionCarryoverParams('?kw=tanaka&dept=D1&sort=time&date=2025-12-27');
    const rebuilt = buildChartsEncounterSearch(parsed, carryover);
    expect(rebuilt).toContain('patientId=0001');
    expect(rebuilt).toContain('receptionId=R-9');
    expect(rebuilt).toContain('visitDate=2025-12-18');
    expect(rebuilt).toContain('kw=tanaka');
    expect(rebuilt).toContain('dept=D1');
    expect(rebuilt).toContain('sort=time');
    expect(rebuilt).toContain('date=2025-12-27');

    expect(parseChartsEncounterContext('?visitDate=20251218').visitDate).toBeUndefined();
  });

  it('store/load: sessionStorage round-trip', () => {
    storeChartsEncounterContext({
      patientId: 'PX-1',
      appointmentId: 'A-1',
      receptionId: 'R-1',
      visitDate: '2025-12-18',
    });
    expect(loadChartsEncounterContext()).toEqual({
      patientId: 'PX-1',
      appointmentId: 'A-1',
      receptionId: 'R-1',
      visitDate: '2025-12-18',
    });
  });

  it('runId normalize: 空/スペース/フォーマット外は無効', () => {
    expect(normalizeRunId('')).toBeUndefined();
    expect(normalizeRunId('   ')).toBeUndefined();
    expect(normalizeRunId('20251227T133020')).toBeUndefined();
    expect(normalizeRunId('2025-12-27T133020Z')).toBeUndefined();
    expect(normalizeRunId('RUN-123')).toBeUndefined();
  });

  it('runId parse/build: valid のみ反映される', () => {
    const validRunId = '20251227T133020Z';
    expect(normalizeRunId(` ${validRunId} `)).toBe(validRunId);
    expect(parseChartsNavigationMeta(`?runId=${validRunId}`)).toEqual({ runId: validRunId });
    expect(buildChartsEncounterSearch({ patientId: 'PX-9' }, {}, { runId: validRunId })).toContain(`runId=${validRunId}`);

    const invalidRunId = '20251227T133020';
    expect(parseChartsNavigationMeta(`?runId=${invalidRunId}`)).toEqual({ runId: undefined });
    const search = buildChartsEncounterSearch({ patientId: 'PX-9' }, {}, { runId: invalidRunId });
    expect(search).not.toContain('runId=');
  });

  it('parseChartsEncounterContext: runId は取り込まず無視する', () => {
    const parsed = parseChartsEncounterContext('?patientId=PX-1&runId=20251227T133020Z');
    expect(parsed).toEqual({
      patientId: 'PX-1',
      appointmentId: undefined,
      receptionId: undefined,
      visitDate: undefined,
    });
    expect(parsed).not.toHaveProperty('runId');
  });
});
