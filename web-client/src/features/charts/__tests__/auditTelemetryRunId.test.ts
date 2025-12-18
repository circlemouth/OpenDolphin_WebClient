import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearAuditEventLog,
  getAuditEventLog,
} from '../../../libs/audit/auditLogger';
import {
  clearOutpatientFunnelLog,
  getOutpatientFunnelLog,
  recordOutpatientFunnel,
} from '../../../libs/telemetry/telemetryClient';
import { updateObservabilityMeta } from '../../../libs/observability/observability';
import { recordChartsAuditEvent } from '../audit';

const RUN_ID = '20251218T183545Z';
const TRACE_ID = 'trace-52-run';

describe('auditEvent と telemetry の runId 整合', () => {
  beforeEach(() => {
    updateObservabilityMeta({
      runId: RUN_ID,
      traceId: TRACE_ID,
      dataSourceTransition: 'server',
      cacheHit: false,
      missingMaster: false,
      fallbackUsed: false,
    });
  });

  afterEach(() => {
    clearOutpatientFunnelLog();
    clearAuditEventLog();
  });

  it('主要操作(ORCA_SEND)で runId/traceId が一致する', () => {
    recordOutpatientFunnel('charts_action', {
      action: 'ORCA_SEND',
      outcome: 'started',
      durationMs: 1200,
    });

    recordChartsAuditEvent({
      action: 'ORCA_SEND',
      outcome: 'started',
      durationMs: 1200,
      note: 'telemetry-audit-run-id-check',
    });

    const telemetry = getOutpatientFunnelLog()[0];
    const audit = getAuditEventLog()[0];
    const auditDetails =
      (audit?.payload as { details?: Record<string, unknown> } | undefined)
        ?.details ?? {};

    expect(telemetry?.runId).toBe(RUN_ID);
    expect(auditDetails.runId ?? audit?.runId).toBe(RUN_ID);
    expect(telemetry?.traceId).toBe(TRACE_ID);
    expect(auditDetails.traceId).toBe(TRACE_ID);
  });
});
