import { useMemo } from 'react';
import styled from '@emotion/styled';
import { useQuery } from '@tanstack/react-query';

import { SurfaceCard, Stack } from '@/components';
import {
  fetchRoutineMedications,
  fetchRpHistory,
  fetchUserProperties,
  type RpHistoryEntry,
  type UserPropertyEntry,
} from '@/features/charts/api/masuda-api';
import {
  routineMedicationLabel,
  routineMedicationModules,
  routineMedicationUpdatedAt,
} from '@/features/charts/utils/routine-medication';

type MasudaSupportPanelProps = {
  karteId: number | null;
  userId: string | null;
};

const SupportCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
`;

const HelperText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListItem = styled.li`
  line-height: 1.4;
`;

const ItemTitle = styled.span`
  font-weight: 600;
  margin-right: 4px;
`;

const ItemMeta = styled.div`
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const getRpSummary = (entry: RpHistoryEntry) => {
  const items = entry.rpList ?? [];
  if (!items.length) {
    return '処方内容情報なし';
  }
  const top = items.slice(0, 3).map((item) => item.name ?? item.srycd ?? '処方');
  return top.join(' / ');
};

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const yyyy = `${date.getFullYear()}`.padStart(4, '0');
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const groupUserProperties = (entries: UserPropertyEntry[]) => {
  const grouped = new Map<string, UserPropertyEntry[]>();
  entries.forEach((entry) => {
    const key = entry.category ?? 'その他';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  });
  return Array.from(grouped.entries());
};

export const MasudaSupportPanel = ({ karteId, userId }: MasudaSupportPanelProps) => {
  const routineQuery = useQuery({
    queryKey: ['masuda', 'routineMed', karteId ?? 'none'],
    enabled: typeof karteId === 'number',
    queryFn: () => fetchRoutineMedications(karteId ?? 0, { firstResult: 0, maxResults: 50 }),
  });

  const historyRange = useMemo(() => {
    const now = new Date();
    const toDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDate = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(oneYearAgo.getDate()).padStart(2, '0')}`;
    return { fromDate, toDate };
  }, []);

  const rpHistoryQuery = useQuery({
    queryKey: ['masuda', 'rpHistory', karteId ?? 'none', historyRange.fromDate, historyRange.toDate],
    enabled: typeof karteId === 'number',
    queryFn: () =>
      fetchRpHistory(karteId ?? 0, {
        fromDate: historyRange.fromDate,
        toDate: historyRange.toDate,
        lastOnly: false,
      }),
  });

  const userPropertyQuery = useQuery({
    queryKey: ['masuda', 'userProperty', userId ?? 'none'],
    enabled: Boolean(userId),
    queryFn: () => fetchUserProperties(userId ?? ''),
  });

  const groupedProperties = useMemo(() => {
    if (!userPropertyQuery.data) {
      return [];
    }
    return groupUserProperties(userPropertyQuery.data);
  }, [userPropertyQuery.data]);

  return (
    <SupportCard tone="muted">
      <Stack gap={20}>
        <Section>
          <SectionTitle>定期処方</SectionTitle>
          {routineQuery.isLoading ? <HelperText>定期処方を読み込み中です…</HelperText> : null}
          {routineQuery.error ? (
            <ErrorText>定期処方の取得に失敗しました。ページを再読み込みしてください。</ErrorText>
          ) : null}
          {!routineQuery.isLoading && !routineQuery.error ? (
            routineQuery.data && routineQuery.data.length ? (
              <List>
                {routineQuery.data.map((entry) => {
                  const title = routineMedicationLabel(entry);
                  const updated = routineMedicationUpdatedAt(entry);
                  const modules = routineMedicationModules(entry, 5);
                  return (
                    <ListItem key={`routine-${entry.id ?? title}`}>
                      <ItemTitle>{title}</ItemTitle>
                      {modules.length ? <div>{modules.join(' / ')}</div> : null}
                      {entry.memo ? <ItemMeta>{entry.memo}</ItemMeta> : null}
                      {updated ? <ItemMeta>最終更新: {updated}</ItemMeta> : null}
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <HelperText>定期処方情報は登録されていません。</HelperText>
            )
          ) : null}
        </Section>

        <Section>
          <SectionTitle>処方履歴</SectionTitle>
          {rpHistoryQuery.isLoading ? <HelperText>処方履歴を読み込み中です…</HelperText> : null}
          {rpHistoryQuery.error ? (
            <ErrorText>処方履歴の取得に失敗しました。</ErrorText>
          ) : null}
          {!rpHistoryQuery.isLoading && !rpHistoryQuery.error ? (
            rpHistoryQuery.data && rpHistoryQuery.data.length ? (
              <List>
                {rpHistoryQuery.data.slice(0, 8).map((entry, index) => (
                  <ListItem key={`rp-${entry.issuedDate ?? index}`}>
                    <ItemTitle>{formatDateLabel(entry.issuedDate)}</ItemTitle>
                    <div>{getRpSummary(entry)}</div>
                    {entry.memo ? <ItemMeta>{entry.memo}</ItemMeta> : null}
                  </ListItem>
                ))}
              </List>
            ) : (
              <HelperText>表示期間内の処方履歴はありません。</HelperText>
            )
          ) : null}
        </Section>

        <Section>
          <SectionTitle>ユーザー設定メモ</SectionTitle>
          {userPropertyQuery.isLoading ? <HelperText>ユーザー設定を読み込み中です…</HelperText> : null}
          {userPropertyQuery.error ? <ErrorText>ユーザー設定の取得に失敗しました。</ErrorText> : null}
          {!userPropertyQuery.isLoading && !userPropertyQuery.error ? (
            groupedProperties.length ? (
              <Stack gap={12}>
                {groupedProperties.map(([category, entries]) => (
                  <div key={category}>
                    <ItemTitle>{category}</ItemTitle>
                    <List>
                      {entries.map((entry) => (
                        <ListItem key={`${category}-${entry.id ?? entry.name}`}>
                          <ItemTitle>{entry.name ?? '設定'}</ItemTitle>
                          <div>{entry.value ?? '値未設定'}</div>
                          {entry.description ? <ItemMeta>{entry.description}</ItemMeta> : null}
                        </ListItem>
                      ))}
                    </List>
                  </div>
                ))}
              </Stack>
            ) : (
              <HelperText>ユーザー設定メモは登録されていません。</HelperText>
            )
          ) : null}
        </Section>
      </Stack>
    </SupportCard>
  );
};
