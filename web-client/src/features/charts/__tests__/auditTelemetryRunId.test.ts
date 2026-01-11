import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearAuditEventLog,
  getAuditEventLog,
  logAuditEvent,
  logUiState,
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
      cacheHit: false,
      missingMaster: false,
      fallbackUsed: false,
      dataSourceTransition: 'server',
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

  it('__AUDIT_* は機微情報がマスクされている', () => {
    logUiState({
      action: 'navigate',
      screen: 'test',
      runId: RUN_ID,
      details: {
        facilityId: 'FAC-01',
        patientId: 'PT-999',
        appointmentId: 'APT-999',
        actor: 'FAC-01:USER-01',
        email: 'test@example.com',
      },
    });

    logAuditEvent({
      runId: RUN_ID,
      source: 'test',
      note: 'mask-check',
      payload: {
        action: 'TEST_ACTION',
        details: {
          facilityId: 'FAC-01',
          patientId: 'PT-999',
          appointmentId: 'APT-999',
          actor: 'FAC-01:USER-01',
          email: 'test@example.com',
          passwordMd5: 'deadbeef',
        },
      },
    });

    const uiState = (window as any).__AUDIT_UI_STATE__ ?? [];
    const auditEvents = (window as any).__AUDIT_EVENTS__ ?? [];

    expect(Array.isArray(uiState)).toBeTruthy();
    expect(Array.isArray(auditEvents)).toBeTruthy();

    const uiEntry = uiState[uiState.length - 1];
    const eventEntry = auditEvents[auditEvents.length - 1];

    expect(uiEntry?.details?.facilityId).toBe('[REDACTED]');
    expect(uiEntry?.details?.patientId).toBe('[REDACTED]');
    expect(uiEntry?.details?.appointmentId).toBe('[REDACTED]');
    expect(uiEntry?.details?.actor).toBe('[REDACTED]');
    expect(uiEntry?.details?.email).toBe('[REDACTED]');

    const eventDetails = eventEntry?.payload?.details ?? {};
    expect(eventDetails?.facilityId).toBe('[REDACTED]');
    expect(eventDetails?.patientId).toBe('[REDACTED]');
    expect(eventDetails?.appointmentId).toBe('[REDACTED]');
    expect(eventDetails?.actor).toBe('[REDACTED]');
    expect(eventDetails?.email).toBe('[REDACTED]');
    expect(eventDetails?.passwordMd5).toBe('[REDACTED]');
  });
});
