import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubjectivesPanel } from '../soap/SubjectivesPanel';
import { fetchSubjectivesListXml, postSubjectivesModXml } from '../soap/subjectivesApi';

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

vi.mock('../soap/subjectivesApi', () => ({
  buildSubjectivesListRequestXml: vi.fn().mockReturnValue('<data />'),
  buildSubjectivesModRequestXml: vi.fn().mockReturnValue('<data />'),
  fetchSubjectivesListXml: vi.fn(),
  postSubjectivesModXml: vi.fn(),
}));

const buildClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('SubjectivesPanel warnings', () => {
  it('警告メッセージがある場合に警告バナーを表示する', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchSubjectivesListXml).mockResolvedValue({
      ok: true,
      status: 200,
      rawXml: '<data />',
      items: [],
      apiResult: '00',
      apiResultMessage: 'OK',
      missingTags: [],
    });
    vi.mocked(postSubjectivesModXml).mockResolvedValue({
      ok: true,
      status: 200,
      rawXml: '<data />',
      apiResult: '00',
      apiResultMessage: 'OK',
      warningMessages: ['Check content'],
      missingTags: [],
    } as any);

    render(
      <QueryClientProvider client={buildClient()}>
        <SubjectivesPanel patientId="P-100" visitDate="2026-01-10" runId="RUN-SUB" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(fetchSubjectivesListXml).toHaveBeenCalled());

    await user.type(screen.getByLabelText('症状詳記内容'), 'テスト');
    await user.click(screen.getByRole('button', { name: '症状詳記を登録' }));

    await waitFor(() => expect(postSubjectivesModXml).toHaveBeenCalled());
    expect(screen.getByText(/症状詳記の登録で警告/)).toBeInTheDocument();
    expect(screen.getByText(/warning=Check content/)).toBeInTheDocument();
  });
});
