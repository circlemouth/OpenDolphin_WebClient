import { afterEach, describe, expect, it } from 'vitest';

import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';
import { recordChartsAuditEvent } from '../audit';

afterEach(() => {
  clearAuditEventLog();
});

describe('Charts print/export audit', () => {
  it('PRINT_OUTPATIENT は actor/runId/patientId を details に含める', () => {
    recordChartsAuditEvent({
      action: 'PRINT_OUTPATIENT',
      outcome: 'started',
      subject: 'outpatient-document-output',
      actor: '0001:doctor01',
      patientId: '000123',
      appointmentId: 'APT-001',
      runId: 'RUN-PRINT',
      cacheHit: false,
      missingMaster: false,
      fallbackUsed: false,
      dataSourceTransition: 'server',
      note: 'output=pdf',
    });

    const events = getAuditEventLog();
    expect(events).toHaveLength(1);
    const payload = events[0]?.payload as any;
    expect(payload.action).toBe('PRINT_OUTPATIENT');
    expect(payload.details.runId).toBe('RUN-PRINT');
    expect(payload.details.patientId).toBe('000123');
    expect(payload.details.actor).toBe('0001:doctor01');
  });

  it('PRINT_DOCUMENT は document 情報を details に含める', () => {
    recordChartsAuditEvent({
      action: 'PRINT_DOCUMENT',
      outcome: 'started',
      subject: 'charts-document-output',
      actor: '0001:doctor01',
      patientId: '000123',
      runId: 'RUN-DOC-PRINT',
      cacheHit: false,
      missingMaster: false,
      fallbackUsed: false,
      dataSourceTransition: 'server',
      note: 'output=print',
      details: {
        documentType: 'referral',
        documentTitle: '紹介状',
        documentIssuedAt: '2025-12-29',
        templateId: 'REF-ODT-STD',
        documentId: 'DOC-001',
      },
    });

    const events = getAuditEventLog();
    expect(events).toHaveLength(1);
    const payload = events[0]?.payload as any;
    expect(payload.action).toBe('PRINT_DOCUMENT');
    expect(payload.details.runId).toBe('RUN-DOC-PRINT');
    expect(payload.details.patientId).toBe('000123');
    expect(payload.details.actor).toBe('0001:doctor01');
    expect(payload.details.documentType).toBe('referral');
    expect(payload.details.templateId).toBe('REF-ODT-STD');
    expect(payload.details.documentId).toBe('DOC-001');
  });
});
