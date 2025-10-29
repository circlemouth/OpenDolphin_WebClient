import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import { Button, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import { OrcaOrderPanel } from '@/features/charts/components/OrcaOrderPanel';
import { useChartEventSubscription } from '@/features/charts/hooks/useChartEventSubscription';
import { useChartLock } from '@/features/charts/hooks/useChartLock';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { StampDefinition } from '@/features/charts/types/stamp';
import { saveProgressNote } from '@/features/charts/api/progress-note-api';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { useAuth } from '@/libs/auth';

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr) minmax(0, 320px);
  gap: 16px;
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ListContainer = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VisitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 540px;
  overflow-y: auto;
  padding-right: 4px;
`;

const VisitItem = styled.button<{ $selected: boolean }>`
  display: grid;
  gap: 4px;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $selected }) => ($selected ? 'rgba(58, 122, 254, 0.08)' : theme.palette.surface)};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const VisitName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const VisitMeta = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ColumnStack = styled(Stack)`
  align-items: stretch;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const AllergiesList = styled.ul`
  margin: 0;
  padding-inline-start: 1.2rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};
`;

const NeutralMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineError = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.danger};
`;

const BIT_OPEN = 0;

const hasOpenBit = (state: number) => (state & (1 << BIT_OPEN)) !== 0;

const defaultDraft: ProgressNoteDraft = {
  title: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

export const ChartsPage = () => {
  useChartEventSubscription();

  const { session } = useAuth();
  const navigate = useNavigate();
  const visitsQuery = usePatientVisits();
  const userPk = session?.userProfile?.userModelId ?? null;
  const stampLibraryQuery = useStampLibrary(userPk);
  const canLoadStampLibrary = Boolean(userPk);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [draft, setDraft] = useState<ProgressNoteDraft>(defaultDraft);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);

  useEffect(() => {
    if (!selectedVisitId && visits.length > 0) {
      setSelectedVisitId(visits[0].visitId);
    }
  }, [visits, selectedVisitId]);

  const filteredVisits = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) {
      return visits;
    }
    return visits.filter((visit) => {
      const target = [visit.fullName, visit.patientId, visit.kanaName, visit.visitDate]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return target.includes(keyword);
    });
  }, [filter, visits]);

  const selectedVisit = useMemo<PatientVisitSummary | null>(() => {
    if (!selectedVisitId) {
      return null;
    }
    return visits.find((visit) => visit.visitId === selectedVisitId) ?? null;
  }, [selectedVisitId, visits]);

  useEffect(() => {
    setDraft(defaultDraft);
    setSaveFeedback(null);
    setSaveError(null);
  }, [selectedVisitId]);

  const karteQuery = usePatientKarte(selectedVisit?.patientId ?? null, {
    fromDate: undefined,
    enabled: Boolean(selectedVisit),
  });

  const clientUuid = session?.credentials.clientUuid;
  const lock = useChartLock(selectedVisit, clientUuid);

  const handleLock = async () => {
    setSaveFeedback(null);
    setSaveError(null);
    try {
      await lock.lock();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '診察開始に失敗しました');
    }
  };

  const handleUnlock = async () => {
    setSaveFeedback(null);
    setSaveError(null);
    try {
      await lock.unlock();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '診察終了に失敗しました');
    }
  };

  const handleDraftChange = (key: keyof ProgressNoteDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!session || !selectedVisit) {
      setSaveError('保存対象の診察情報が選択されていません');
      return;
    }
    if (!clientUuid || selectedVisit.ownerUuid !== clientUuid) {
      setSaveError('診察を開始してから保存してください');
      return;
    }
    const karteId = karteQuery.data?.id;
    if (!karteId) {
      setSaveError('カルテ情報の取得に失敗しました。再度お試しください。');
      return;
    }

    try {
      setSaveFeedback(null);
      setSaveError(null);
      const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
      await saveProgressNote(
        {
          draft,
          visit: selectedVisit,
          karteId,
          session,
          facilityName: session.userProfile?.facilityName,
          userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
          userModelId: session.userProfile?.userModelId,
          licenseName: session.userProfile?.licenseName,
          departmentCode: selectedVisit.departmentCode,
          departmentName: selectedVisit.departmentName,
        },
        nextState,
        selectedVisit.visitId,
      );
      setSaveFeedback('カルテを保存しました。');
      setDraft(defaultDraft);
      await lock.unlock();
      await karteQuery.refetch();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  };

  const isLockedByMe = Boolean(selectedVisit && clientUuid && selectedVisit.ownerUuid === clientUuid);
  const isLockedByOther = Boolean(
    selectedVisit && selectedVisit.ownerUuid && clientUuid && selectedVisit.ownerUuid !== clientUuid,
  );

  const handleInsertStamp = (stamp: StampDefinition) => {
    if (!isLockedByMe) {
      setSaveError('診察を開始してからスタンプを挿入してください');
      return;
    }
    const contextLabel = stamp.path.slice(1).join(' / ');
    const snippet = [
      stamp.name,
      stamp.entity ? `(${stamp.entity})` : null,
      contextLabel ? `[${contextLabel}]` : null,
    ]
      .filter(Boolean)
      .join(' ');
    setDraft((prev) => {
      const planText = prev.plan ? `${prev.plan}\n${snippet}` : snippet;
      return { ...prev, plan: planText };
    });
    setSaveError(null);
    setSaveFeedback(`スタンプ「${stamp.name}」をPlanに追記しました。`);
  };

  return (
    <Stack gap={16}>
      <header>
        <SectionTitle>カルテ編集</SectionTitle>
        <p style={{ margin: '4px 0 0', color: '#475569' }}>
          受付リストから患者を選択し、診察開始で排他制御を確保した上でカルテを編集・保存します。
        </p>
      </header>

      <PageGrid>
        <ListContainer tone="muted">
          <Stack gap={12}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>受付リスト</h3>
              <TextField
                label="検索"
                placeholder="氏名や患者IDで絞り込み"
                value={filter}
                onChange={(event) => setFilter(event.currentTarget.value)}
              />
            </div>

            {visitsQuery.isLoading ? (
              <NeutralMessage>受付リストを読み込み中です…</NeutralMessage>
            ) : filteredVisits.length === 0 ? (
              <NeutralMessage>一致する受付が見つかりません。</NeutralMessage>
            ) : (
              <VisitList>
                {filteredVisits.map((visit) => {
                  const selected = visit.visitId === selectedVisitId;
                  const lockedByMe = clientUuid && visit.ownerUuid === clientUuid;
                  const lockedByOther = clientUuid && visit.ownerUuid && visit.ownerUuid !== clientUuid;

                  return (
                    <VisitItem
                      key={visit.visitId}
                      type="button"
                      onClick={() => {
                        setSelectedVisitId(visit.visitId);
                      }}
                      $selected={selected}
                    >
                      <VisitName>{visit.fullName}</VisitName>
                      <VisitMeta>
                        ID: {visit.patientId} / 来院: {visit.visitDate ?? '---'}
                      </VisitMeta>
                      <BadgeRow>
                        {lockedByMe ? (
                          <StatusBadge tone="info">自端末で編集中</StatusBadge>
                        ) : null}
                        {lockedByOther ? (
                          <StatusBadge tone="danger">他端末で編集中</StatusBadge>
                        ) : null}
                        {!visit.ownerUuid && hasOpenBit(visit.state) ? (
                          <StatusBadge tone="warning">閲覧中</StatusBadge>
                        ) : null}
                      </BadgeRow>
                    </VisitItem>
                  );
                })}
              </VisitList>
            )}
          </Stack>
        </ListContainer>

        <Stack gap={16}>
          <SurfaceCard>
            <ColumnStack gap={16}>
              <div>
                <SectionTitle>患者情報</SectionTitle>
                {selectedVisit ? (
                  <Stack gap={4}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedVisit.fullName}</div>
                    <div style={{ color: '#475569' }}>
                      ID: {selectedVisit.patientId} / 生年月日: {selectedVisit.birthday ?? '---'} / 性別:
                      {selectedVisit.gender ?? '---'}
                    </div>
                    <BadgeRow>
                      {selectedVisit.safetyNotes.map((note) => (
                        <StatusBadge key={note} tone="warning">
                          {note}
                        </StatusBadge>
                      ))}
                    </BadgeRow>
                  </Stack>
                ) : (
                  <NeutralMessage>患者を選択すると詳細が表示されます。</NeutralMessage>
                )}
              </div>

              {selectedVisit ? (
                <Stack direction="row" gap={12} wrap>
                  <Button
                    type="button"
                    variant={isLockedByMe ? 'secondary' : 'primary'}
                    onClick={isLockedByMe ? handleUnlock : handleLock}
                    disabled={lock.isPending || isLockedByOther}
                    isLoading={lock.isPending}
                  >
                    {isLockedByMe ? '診察終了' : '診察開始'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => navigate('/patients')}>
                    患者検索へ戻る
                  </Button>
                </Stack>
              ) : null}

              {lock.error ? <InlineError>{String(lock.error)}</InlineError> : null}
              {saveError ? <InlineError>{saveError}</InlineError> : null}
              {saveFeedback ? (
                <p style={{ margin: 0, color: '#0f766e', fontWeight: 600 }}>{saveFeedback}</p>
              ) : null}
            </ColumnStack>
          </SurfaceCard>

          <SurfaceCard>
            <ColumnStack gap={16}>
              <SectionTitle>SOAP 編集</SectionTitle>
              <TextField
                label="タイトル"
                placeholder="例: 再診 / 高血圧"
                value={draft.title}
                onChange={(event) => handleDraftChange('title', event.currentTarget.value)}
              />
              <TextArea
                label="Subjective (主観)"
                placeholder="患者の主訴や自覚症状"
                value={draft.subjective}
                onChange={(event) => handleDraftChange('subjective', event.currentTarget.value)}
                disabled={!isLockedByMe}
              />
              <TextArea
                label="Objective (他覚)"
                placeholder="バイタルや検査所見など"
                value={draft.objective}
                onChange={(event) => handleDraftChange('objective', event.currentTarget.value)}
                disabled={!isLockedByMe}
              />
              <TextArea
                label="Assessment (評価)"
                placeholder="診断評価・考察"
                value={draft.assessment}
                onChange={(event) => handleDraftChange('assessment', event.currentTarget.value)}
                disabled={!isLockedByMe}
              />
              <TextArea
                label="Plan (計画)"
                placeholder="治療方針、投薬、検査計画など"
                value={draft.plan}
                onChange={(event) => handleDraftChange('plan', event.currentTarget.value)}
                disabled={!isLockedByMe}
              />
              <div>
                <Button type="button" onClick={handleSave} disabled={!isLockedByMe || lock.isPending}>
                  保存して終了
                </Button>
              </div>
            </ColumnStack>
          </SurfaceCard>
          <StampLibraryPanel
            stamps={stampLibraryQuery.data ?? []}
            isLoading={canLoadStampLibrary ? stampLibraryQuery.isLoading : false}
            isFetching={canLoadStampLibrary ? stampLibraryQuery.isFetching : false}
            error={canLoadStampLibrary ? stampLibraryQuery.error : null}
            onReload={() => {
              if (canLoadStampLibrary) {
                void stampLibraryQuery.refetch();
              }
            }}
            onInsert={handleInsertStamp}
            disabled={!isLockedByMe || !canLoadStampLibrary}
          />
        </Stack>

        <Stack gap={16}>
          <SurfaceCard tone="muted">
            <Stack gap={12}>
              <SectionTitle>アレルギー / メモ</SectionTitle>
              {karteQuery.isLoading ? (
                <NeutralMessage>読み込み中です…</NeutralMessage>
              ) : karteQuery.data?.allergies?.length ? (
                <AllergiesList>
                  {karteQuery.data.allergies.map((allergy) => (
                    <li key={`${allergy.factor}-${allergy.identifiedDate ?? ''}`}>
                      <strong>{allergy.factor}</strong>
                      {allergy.severity ? ` / 重症度: ${allergy.severity}` : ''}
                      {allergy.identifiedDate ? ` / 登録日: ${allergy.identifiedDate}` : ''}
                      {allergy.memo ? ` / メモ: ${allergy.memo}` : ''}
                    </li>
                  ))}
                </AllergiesList>
              ) : (
                <NeutralMessage>登録されたアレルギー情報はありません。</NeutralMessage>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={12}>
              <SectionTitle>患者メモ</SectionTitle>
              {karteQuery.isLoading ? (
                <NeutralMessage>読み込み中です…</NeutralMessage>
              ) : karteQuery.data?.memos?.length ? (
                <AllergiesList>
                  {karteQuery.data.memos.map((memo) => (
                    <li key={memo.id}>
                      {memo.memo ?? 'メモなし'}
                      {memo.confirmed ? `（${memo.confirmed}）` : ''}
                    </li>
                  ))}
                </AllergiesList>
              ) : (
                <NeutralMessage>患者メモは登録されていません。</NeutralMessage>
              )}
            </Stack>
          </SurfaceCard>
          <OrcaOrderPanel disabled={!isLockedByMe} />
        </Stack>
      </PageGrid>
    </Stack>
  );
};
