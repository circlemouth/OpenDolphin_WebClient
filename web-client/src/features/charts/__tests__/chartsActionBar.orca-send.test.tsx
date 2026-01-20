import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { ChartsActionBar } from '../ChartsActionBar';
import { postOrcaMedicalModV2Xml } from '../orcaClaimApi';

vi.mock('../orcaClaimApi', () => ({
  postOrcaMedicalModV2Xml: vi.fn(),
  buildMedicalModV2RequestXml: vi.fn().mockReturnValue('<data></data>'),
}));

vi.mock('../orcaMedicalModApi', () => ({
  buildMedicalModV23RequestXml: vi.fn().mockReturnValue('<data></data>'),
  postOrcaMedicalModV23Xml: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    apiResult: '00',
    rawXml: '<xml></xml>',
    missingTags: [],
  }),
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  logAuditEvent: vi.fn(),
  logUiState: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

const baseProps = {
  runId: 'RUN-CLAIM',
  cacheHit: false,
  missingMaster: false,
  dataSourceTransition: 'server' as const,
  fallbackUsed: false,
};

describe('ChartsActionBar ORCA送信 (medicalmodv2)', () => {
  it('公式経路で Api_Result/Invoice_Number/Data_Id を取得しトーストに表示する', async () => {
    const user = userEvent.setup();
    vi.mocked(postOrcaMedicalModV2Xml).mockResolvedValue({
      ok: true,
      status: 200,
      apiResult: '00',
      apiResultMessage: 'OK',
      invoiceNumber: 'INV-999',
      dataId: 'DATA-999',
      runId: 'RUN-API',
      traceId: 'TRACE-API',
      rawXml: '<xml></xml>',
      missingTags: [],
    });

    render(
      <MemoryRouter>
        <ChartsActionBar
          {...baseProps}
          patientId="000001"
          visitDate="2026-01-20"
          selectedEntry={{ department: '01 内科', patientId: '000001' } as any}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'ORCA 送信' }));
    await user.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => expect(postOrcaMedicalModV2Xml).toHaveBeenCalled());
    expect(screen.getByText(/ORCA送信を完了/)).toBeInTheDocument();
    expect(screen.getByText(/Invoice_Number=INV-999/)).toBeInTheDocument();
    expect(screen.getByText(/Data_Id=DATA-999/)).toBeInTheDocument();
  });
});
