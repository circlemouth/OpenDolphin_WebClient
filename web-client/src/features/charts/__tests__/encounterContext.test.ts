import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildChartsEncounterSearch,
  loadChartsEncounterContext,
  parseChartsEncounterContext,
  parseReceptionCarryoverParams,
  storeChartsEncounterContext,
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
});
