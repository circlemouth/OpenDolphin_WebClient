import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentTimelinePanel } from '@/features/charts/components/DocumentTimelinePanel';
import { deriveActiveCategories } from '@/features/charts/components/document-timeline-utils';
import {
  TIMELINE_EVENT_CATEGORIES,
  type TimelineEvent,
  type TimelineEventCategoryMeta,
} from '@/features/charts/utils/timeline-events';
import { render, screen, waitFor } from '@/test/test-utils';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
  };
});

vi.mock('@/features/charts/hooks/useDocInfos', () => ({
  useDocumentDetail: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

const cloneCategories = (): TimelineEventCategoryMeta[] => TIMELINE_EVENT_CATEGORIES.map((category) => ({ ...category }));

const sampleEvents: TimelineEvent[] = [
  {
    id: 'doc-1',
    type: 'document',
    occurredAt: '2025-06-01T09:00:00',
    title: 'カルテA',
    subtitle: '初診メモ',
    badge: '内科',
    description: '初診時のカルテ',
    tags: ['カルテ'],
    searchText: 'カルテ 初診',
    payload: {
      kind: 'document',
      docPk: 101,
      status: 'F',
      department: '内科',
      docType: 'SOAP',
      docId: 'DOC-101',
    },
  },
  {
    id: 'visit-1',
    type: 'visit',
    occurredAt: '2025-06-02T09:00:00',
    title: '来院イベント',
    subtitle: '再診',
    badge: '内科',
    description: '来院受付',
    tags: ['来院'],
    searchText: '来院 再診',
    payload: {
      kind: 'visit',
      visitId: 202,
      state: 1,
      department: '内科',
      doctor: '医師 太郎',
    },
  },
  {
    id: 'lab-1',
    type: 'lab',
    occurredAt: '2025-06-03T09:00:00',
    title: '血液検査',
    subtitle: '血算',
    badge: '検査',
    description: '定期検査',
    tags: ['検査'],
    searchText: '検査 血液',
    payload: {
      kind: 'lab',
      moduleId: 303,
      abnormalCount: 0,
      topItems: [],
    },
  },
];

describe('DocumentTimelinePanel', () => {
  it('フィルタ切替でイベント選択とハンドラ呼び出しが期待通りに動作する', async () => {
    const user = userEvent.setup();
    const onVisitEventSelected = vi.fn();

    render(
      <DocumentTimelinePanel
        events={sampleEvents}
        categories={cloneCategories()}
        isLoading={false}
        isFetching={false}
        error={null}
        onVisitEventSelected={onVisitEventSelected}
      />,
    );

    const documentFilter = screen.getByRole('button', { name: /カルテ/ });
    await user.click(documentFilter);

    await waitFor(() => {
      expect(screen.queryByText('カルテA')).not.toBeInTheDocument();
    });

    expect(onVisitEventSelected).toHaveBeenCalledTimes(1);

    const visitItem = screen.getByText('来院イベント').closest('button');
    expect(visitItem).not.toBeNull();
    expect(visitItem).toHaveAttribute('aria-pressed', 'true');

    await user.click(documentFilter);

    await waitFor(() => {
      expect(screen.getByText('カルテA')).toBeInTheDocument();
    });

    expect(onVisitEventSelected).toHaveBeenCalledTimes(1);

    const visitItemAfter = screen.getByText('来院イベント').closest('button');
    expect(visitItemAfter).not.toBeNull();
    expect(visitItemAfter).toHaveAttribute('aria-pressed', 'true');
  });

  it('deriveActiveCategories は差分がない場合に null を返し、差分がある場合は新しい配列を返す', () => {
    const allCategories = cloneCategories();
    const fullActive = allCategories.map((category) => category.id);

    expect(deriveActiveCategories(fullActive, allCategories)).toBeNull();

    const withoutLab = allCategories.filter((category) => category.id !== 'lab');
    expect(deriveActiveCategories(fullActive, withoutLab)).toEqual(['document', 'visit', 'order']);

    const onlyOrder = allCategories.filter((category) => category.id === 'order');
    expect(deriveActiveCategories(['lab'], onlyOrder)).toEqual(['order']);
  });
});
