import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../../libs/observability/observability';
import { AuthServiceProvider } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { SoapNotePanel } from '../SoapNotePanel';
import type { SoapEntry } from '../soapNote';

afterEach(() => {
  cleanup();
  clearAuditEventLog();
});

describe('SOAP note audit', () => {
  it('テンプレ挿入と保存で監査イベントが必要メタを含む', async () => {
    updateObservabilityMeta({ runId: 'RUN-SOAP', traceId: 'TRACE-SOAP' });

    const user = userEvent.setup();
    render(
      <SoapNotePanel
        history={[]}
        meta={{
          runId: 'RUN-SOAP',
          cacheHit: false,
          missingMaster: false,
          fallbackUsed: false,
          dataSourceTransition: 'server',
          patientId: 'P-001',
          appointmentId: 'APT-01',
          receptionId: 'RCPT-01',
          visitDate: '2025-12-27',
        }}
        author={{ role: 'doctor', displayName: 'Dr. Soap', userId: 'doctor01' }}
      />,
    );

    const selects = screen.getAllByLabelText('テンプレ');
    await user.selectOptions(selects[1], 'TEMP-GENERAL-01');

    const insertButtons = screen.getAllByRole('button', { name: 'テンプレ挿入' });
    await user.click(insertButtons[1]);

    const subjectiveArea = screen.getByPlaceholderText('Subjective を記載してください。');
    await user.type(subjectiveArea, '追加記載');

    await user.click(screen.getByRole('button', { name: '保存' }));

    const events = getAuditEventLog();
    const templateEvent = events.find((event) => (event.payload as any)?.action === 'SOAP_TEMPLATE_APPLY');
    const saveEvent = events.find((event) => (event.payload as any)?.action === 'SOAP_NOTE_SAVE');

    expect(templateEvent).toBeTruthy();
    const templateDetails = (templateEvent?.payload as any)?.details ?? {};
    expect(templateDetails.templateId).toBe('TEMP-GENERAL-01');
    expect(templateDetails.authorRole).toBe('doctor');
    expect(templateDetails.authorName).toBe('Dr. Soap');
    expect(templateDetails.authoredAt).toBeTruthy();
    expect(templateDetails.soapLength).toBeGreaterThan(0);

    expect(saveEvent).toBeTruthy();
    const saveDetails = (saveEvent?.payload as any)?.details ?? {};
    expect(saveDetails.templateId).toBe('TEMP-GENERAL-01');
    expect(saveDetails.authorRole).toBe('doctor');
    expect(saveDetails.authorName).toBe('Dr. Soap');
    expect(saveDetails.authoredAt).toBeTruthy();
    expect(saveDetails.soapLength).toBeGreaterThan(0);
    expect(saveDetails.runId ?? (saveEvent as any)?.runId).toBe('RUN-SOAP');
    expect(saveDetails.traceId).toBe('TRACE-SOAP');
  });

  it('テンプレ挿入→保存でタイムラインに履歴が反映される', async () => {
    const user = userEvent.setup();
    const captured: SoapEntry[] = [];

    render(
      <SoapNotePanel
        history={[]}
        meta={{
          runId: 'RUN-SOAP',
          cacheHit: false,
          missingMaster: false,
          fallbackUsed: false,
          dataSourceTransition: 'server',
          patientId: 'P-001',
        }}
        author={{ role: 'doctor', displayName: 'Dr. Soap', userId: 'doctor01' }}
        onAppendHistory={(entries) => captured.push(...entries)}
      />,
    );

    const selects = screen.getAllByLabelText('テンプレ');
    await user.selectOptions(selects[1], 'TEMP-GENERAL-01');

    const insertButtons = screen.getAllByRole('button', { name: 'テンプレ挿入' });
    await user.click(insertButtons[1]);

    const subjectiveArea = screen.getByPlaceholderText('Subjective を記載してください。');
    await user.type(subjectiveArea, 'SOAPテスト');

    await user.click(screen.getByRole('button', { name: '保存' }));

    cleanup();

    render(
      <AuthServiceProvider initialFlags={{ runId: 'RUN-SOAP', missingMaster: false, cacheHit: false, fallbackUsed: false }}>
        <DocumentTimeline entries={[]} soapHistory={captured} />
      </AuthServiceProvider>,
    );

    expect(screen.getByText('SOAP記載履歴')).toBeTruthy();
    expect(screen.getAllByText('Subjective').length).toBeGreaterThan(0);
    expect(screen.getByText('template: TEMP-GENERAL-01')).toBeTruthy();
  });
});
