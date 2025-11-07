import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';
import { ProblemListCard } from '@/features/charts/components/layout/ProblemListCard';
import { partitionDiagnoses } from '@/features/charts/hooks/useDiagnoses';
import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';

const buildDiagnosis = (overrides: Partial<RegisteredDiagnosis>): RegisteredDiagnosis => ({
  diagnosis: 'テスト病名',
  diagnosisCode: 'X00',
  firstEncounterDate: '2025-01-01',
  started: '2025-01-01T00:00:00',
  status: 'F',
  ...overrides,
});

describe('partitionDiagnoses', () => {
  it('excludes active entries from past bucket and keeps chronological order', () => {
    const active = [
      buildDiagnosis({ id: 1, diagnosis: '高血圧症', started: '2025-10-01T00:00:00' }),
      buildDiagnosis({ id: 2, diagnosis: '糖尿病', started: '2025-09-15T00:00:00' }),
    ];
    const all = [
      buildDiagnosis({ id: 1, diagnosis: '高血圧症', started: '2025-10-01T00:00:00' }),
      buildDiagnosis({ id: 2, diagnosis: '糖尿病', started: '2025-09-15T00:00:00' }),
      buildDiagnosis({ id: 3, diagnosis: '脂質異常症', started: '2024-02-01T00:00:00', status: 'D' }),
    ];

    const result = partitionDiagnoses(active, all);

    expect(result.active.map((item) => item.id)).toEqual([1, 2]);
    expect(result.past.map((item) => item.id)).toEqual([3]);
  });
});

describe('ProblemListCard', () => {
  it('renders sections and triggers primary/plan handlers', async () => {
    const user = userEvent.setup();
    const activeDiagnosis = buildDiagnosis({ id: 10, diagnosis: '高血圧症', diagnosisCode: 'I10' });
    const pastDiagnosis = buildDiagnosis({ id: 20, diagnosis: '虫垂炎', diagnosisCode: 'K35', status: 'D' });
    const handlePrimary = vi.fn<(diagnosis: RegisteredDiagnosis) => void>();
    const handleAppend = vi.fn<(diagnosis: RegisteredDiagnosis) => void>();

    render(
      <ProblemListCard
        activeDiagnoses={[activeDiagnosis]}
        pastDiagnoses={[pastDiagnosis]}
        primaryDiagnosisName="高血圧症"
        onSelectPrimary={handlePrimary}
        onAppendToPlan={handleAppend}
        isLoading={false}
        isFetching={false}
        error={null}
        onReload={() => {}}
      />,
    );

    expect(screen.getByText('アクティブ')).toBeInTheDocument();
    expect(screen.getByText('既往')).toBeInTheDocument();

    const activeRow = screen.getByRole('button', { name: /高血圧症（主病名）/ });
    expect(activeRow).toHaveAttribute('aria-pressed', 'true');
    await user.click(activeRow);
    expect(handlePrimary).toHaveBeenCalledWith(activeDiagnosis);

    const appendActiveButton = screen.getByRole('button', { name: '高血圧症 を Plan カードに追加' });
    await user.click(appendActiveButton);
    expect(handleAppend).toHaveBeenCalledWith(activeDiagnosis);

    const pastHeading = screen.getByText('既往');
    const pastSection = pastHeading.closest('section');
    expect(pastSection).not.toBeNull();
    if (pastSection) {
      const pastRow = within(pastSection).getByText(/虫垂炎/);
      expect(pastRow).toBeInTheDocument();
    }
  });

  it('indicates loading and error states', () => {
    const { rerender } = render(
      <ProblemListCard
        activeDiagnoses={[]}
        pastDiagnoses={[]}
        primaryDiagnosisName=""
        onSelectPrimary={() => {}}
        onAppendToPlan={() => {}}
        isLoading
        isFetching
        error={null}
        onReload={() => {}}
      />,
    );

    expect(screen.getByText('病名一覧を読み込んでいます…')).toBeInTheDocument();

    rerender(
      <ProblemListCard
        activeDiagnoses={[]}
        pastDiagnoses={[]}
        primaryDiagnosisName=""
        onSelectPrimary={() => {}}
        onAppendToPlan={() => {}}
        isLoading={false}
        isFetching={false}
        error={new Error('failed')}
        onReload={() => {}}
      />,
    );

    expect(screen.getByText('病名一覧の取得に失敗しました。')).toBeInTheDocument();
  });
});
