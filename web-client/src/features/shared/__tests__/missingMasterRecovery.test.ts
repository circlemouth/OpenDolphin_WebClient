import { describe, expect, it } from 'vitest';

import {
  MISSING_MASTER_RECOVERY_ACTIONS,
  MISSING_MASTER_RECOVERY_NEXT_ACTION,
  MISSING_MASTER_RECOVERY_STATUS_DETAIL,
  MISSING_MASTER_RECOVERY_STEPS,
  buildMissingMasterShareText,
} from '../missingMasterRecovery';

describe('missingMaster recovery constants', () => {
  it('nextAction と steps の構成が復旧導線の意図に合っている', () => {
    const actionLabels = Object.values(MISSING_MASTER_RECOVERY_ACTIONS);
    expect(MISSING_MASTER_RECOVERY_NEXT_ACTION).toBe(MISSING_MASTER_RECOVERY_ACTIONS.refetch);

    const stepLabels = MISSING_MASTER_RECOVERY_STEPS.map((step) => step.label);
    expect(stepLabels).toEqual(actionLabels);
    expect(MISSING_MASTER_RECOVERY_STATUS_DETAIL).toContain(MISSING_MASTER_RECOVERY_ACTIONS.refetch);
    expect(MISSING_MASTER_RECOVERY_STATUS_DETAIL).toContain(MISSING_MASTER_RECOVERY_ACTIONS.share);
  });
});

describe('buildMissingMasterShareText', () => {
  it('runId と traceId を含む共有文言を返す', () => {
    expect(buildMissingMasterShareText('RUN-1', 'TRACE-1')).toBe('runId=RUN-1 / traceId=TRACE-1');
  });

  it('runId のみの場合は traceId=unknown を返す', () => {
    expect(buildMissingMasterShareText('RUN-2', undefined)).toBe('runId=RUN-2 / traceId=unknown');
  });

  it('traceId のみの場合は runId=unknown を返す', () => {
    expect(buildMissingMasterShareText(undefined, 'TRACE-2')).toBe('runId=unknown / traceId=TRACE-2');
  });

  it('両方未指定なら null を返す', () => {
    expect(buildMissingMasterShareText(undefined, undefined)).toBeNull();
  });
});
