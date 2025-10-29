import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import { OrcaOrderPanel } from '@/features/charts/components/OrcaOrderPanel';
import { PatientDocumentsPanel } from '@/features/charts/components/PatientDocumentsPanel';
import { useChartEventSubscription } from '@/features/charts/hooks/useChartEventSubscription';
import { useChartLock } from '@/features/charts/hooks/useChartLock';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { StampDefinition } from '@/features/charts/types/stamp';
import { saveProgressNote } from '@/features/charts/api/progress-note-api';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import type { BillingMode, ProgressNoteBilling } from '@/features/charts/utils/progress-note-payload';
import { extractInsuranceOptions } from '@/features/charts/utils/health-insurance';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';
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

const BillingCard = styled(SurfaceCard)<{ $selfPay: boolean }>`
  border-color: ${({ theme, $selfPay }) => ($selfPay ? theme.palette.warning : theme.palette.border)} !important;
  background: ${({ theme, $selfPay }) => ($selfPay ? 'rgba(250, 204, 21, 0.16)' : theme.palette.surface)} !important;
`;

const ModeToggleRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
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

type BillingState = {
  mode: BillingMode;
  insuranceId: string | null;
  selfPayCategory: string;
  quantity: string;
  performer: string;
  lotNumber: string;
  memo: string;
};

const SELF_PAY_OPTIONS = [
  { value: '950', label: 'その他の自費（非課税）' },
  { value: '960', label: 'その他の自費（課税）' },
] as const;

const createInitialBillingState = (
  mode: BillingMode,
  insuranceId: string | null,
  performer?: string,
): BillingState => ({
  mode,
  insuranceId,
  selfPayCategory: '950',
  quantity: '1',
  performer: performer ?? '',
  lotNumber: '',
  memo: '',
});

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
  const [billing, setBilling] = useState<BillingState>(
    createInitialBillingState('insurance', null, session?.userProfile?.displayName),
  );

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
  const selectedVisit = useMemo<PatientVisitSummary | null>(() => {
    if (!selectedVisitId) {
      return null;
    }
    return visits.find((visit) => visit.visitId === selectedVisitId) ?? null;
  }, [selectedVisitId, visits]);
  const insuranceOptions = useMemo<ParsedHealthInsurance[]>(() => extractInsuranceOptions(selectedVisit), [selectedVisit]);
  const canSelectInsurance = insuranceOptions.length > 0;
  const previousVisitIdRef = useRef<number | null>(null);
  const selectedInsurance = useMemo<ParsedHealthInsurance | null>(() => {
    if (billing.mode !== 'insurance') {
      return null;
    }
    if (!billing.insuranceId) {
      return null;
    }
    return insuranceOptions.find((option) => option.id === billing.insuranceId) ?? null;
  }, [billing.insuranceId, billing.mode, insuranceOptions]);
  const selectedSelfPayOption = useMemo(
    () => SELF_PAY_OPTIONS.find((option) => option.value === billing.selfPayCategory) ?? SELF_PAY_OPTIONS[0],
    [billing.selfPayCategory],
  );
  const claimSendEnabled = billing.mode === 'insurance' && Boolean(selectedInsurance?.classCode);
  const billingDisabled = !selectedVisit;

  useEffect(() => {
    if (!selectedVisitId && visits.length > 0) {
      setSelectedVisitId(visits[0].visitId);
    }
  }, [visits, selectedVisitId]);

  useEffect(() => {
    if (!selectedVisitId) {
      return;
    }

    const defaultInsuranceId = insuranceOptions[0]?.id ?? null;
    const performer = session?.userProfile?.displayName;

    if (previousVisitIdRef.current !== selectedVisitId) {
      previousVisitIdRef.current = selectedVisitId;
      setBilling(createInitialBillingState(defaultInsuranceId ? 'insurance' : 'self-pay', defaultInsuranceId, performer));
      return;
    }

    if (defaultInsuranceId) {
      setBilling((prev) => {
        if (prev.mode === 'insurance' && !prev.insuranceId) {
          return { ...prev, insuranceId: defaultInsuranceId };
        }
        return prev;
      });
    } else {
      setBilling((prev) => {
        if (prev.mode === 'insurance') {
          return { ...prev, mode: 'self-pay', insuranceId: null };
        }
        return prev;
      });
    }
  }, [selectedVisitId, insuranceOptions, session?.userProfile?.displayName]);

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

  const updateBilling = (patch: Partial<BillingState>) => {
    setBilling((prev) => ({ ...prev, ...patch }));
    setSaveError(null);
  };

  const handleBillingModeChange = (mode: BillingMode) => {
    if (mode === 'insurance' && !canSelectInsurance) {
      return;
    }
    updateBilling({
      mode,
      insuranceId:
        mode === 'insurance' ? billing.insuranceId ?? (insuranceOptions[0]?.id ?? null) : billing.insuranceId,
    });
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
    if (billing.mode === 'insurance' && !selectedInsurance) {
      setSaveError('適用する保険を選択してください');
      return;
    }

    const billingPayload: ProgressNoteBilling =
      billing.mode === 'insurance'
        ? {
            mode: 'insurance' as const,
            classCode: selectedInsurance?.classCode,
            description: selectedInsurance?.description ?? selectedInsurance?.label ?? '',
            guid: selectedInsurance?.guid ?? selectedVisit.insuranceUid ?? undefined,
          }
        : {
            mode: 'self-pay' as const,
            receiptCode: billing.selfPayCategory,
            label: selectedSelfPayOption.label,
            quantity: billing.quantity.trim() || undefined,
            performer: billing.performer.trim() || undefined,
            lotNumber: billing.lotNumber.trim() || undefined,
            memo: billing.memo.trim() || undefined,
          };

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
          billing: billingPayload,
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

          <BillingCard $selfPay={billing.mode === 'self-pay'}>
            <ColumnStack gap={16}>
              <SectionTitle>請求モード</SectionTitle>
              <ModeToggleRow>
                <Button
                  type="button"
                  size="sm"
                  variant={billing.mode === 'insurance' ? 'primary' : 'ghost'}
                  onClick={() => handleBillingModeChange('insurance')}
                  disabled={!canSelectInsurance}
                >
                  保険請求
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={billing.mode === 'self-pay' ? 'secondary' : 'ghost'}
                  onClick={() => handleBillingModeChange('self-pay')}
                >
                  自費モード
                </Button>
                <StatusBadge tone={claimSendEnabled ? 'info' : 'warning'}>
                  CLAIM送信: {claimSendEnabled ? '有効' : '停止'}
                </StatusBadge>
              </ModeToggleRow>

              {billing.mode === 'insurance' ? (
                canSelectInsurance ? (
                  <SelectField
                    label="適用保険"
                    value={billing.insuranceId ?? (insuranceOptions[0]?.id ?? '')}
                    onChange={(event) => updateBilling({ insuranceId: event.currentTarget.value || null })}
                    options={insuranceOptions.map((option) => ({ value: option.id, label: option.label }))}
                    disabled={billingDisabled}
                  />
                ) : (
                  <NeutralMessage>
                    受付情報に保険が紐付いていません。自費モードに切り替えて保存してください。
                  </NeutralMessage>
                )
              ) : (
                <Stack gap={12}>
                  <SelectField
                    label="自費カテゴリ"
                    value={billing.selfPayCategory}
                    onChange={(event) => updateBilling({ selfPayCategory: event.currentTarget.value })}
                    options={SELF_PAY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                    disabled={billingDisabled}
                    description={
                      billing.selfPayCategory === '950'
                        ? '095: その他の自費（非課税）'
                        : '096: その他の自費（課税）'
                    }
                  />
                  <Stack direction="row" gap={12} wrap>
                    <TextField
                      label="数量"
                      value={billing.quantity}
                      onChange={(event) => updateBilling({ quantity: event.currentTarget.value })}
                      disabled={billingDisabled}
                    />
                    <TextField
                      label="実施者"
                      value={billing.performer}
                      onChange={(event) => updateBilling({ performer: event.currentTarget.value })}
                      disabled={billingDisabled}
                    />
                    <TextField
                      label="ロット番号"
                      value={billing.lotNumber}
                      onChange={(event) => updateBilling({ lotNumber: event.currentTarget.value })}
                      disabled={billingDisabled}
                    />
                  </Stack>
                  <TextArea
                    label="自費メモ"
                    placeholder="提供内容や会計備考などを記入"
                    value={billing.memo}
                    onChange={(event) => updateBilling({ memo: event.currentTarget.value })}
                    rows={3}
                    disabled={billingDisabled}
                  />
                </Stack>
              )}

              <NeutralMessage>
                {billing.mode === 'self-pay'
                  ? `${selectedSelfPayOption.label} を DocInfoModel に設定し、CLAIM送信を停止します。`
                  : '選択した保険コードでCLAIM送信を行います。'}
              </NeutralMessage>
            </ColumnStack>
          </BillingCard>

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
          <PatientDocumentsPanel
            patient={
              selectedVisit
                ? {
                    id: selectedVisit.patientId,
                    name: selectedVisit.fullName,
                    gender: selectedVisit.gender ?? undefined,
                    birthday: selectedVisit.birthday ?? undefined,
                  }
                : null
            }
            facilityName={session?.userProfile?.facilityName}
            doctorName={
              session?.userProfile?.displayName ??
              (session?.userProfile as { commonName?: string } | undefined)?.commonName ??
              session?.credentials.userId
            }
            disabled={!selectedVisit}
          />
        </Stack>
      </PageGrid>
    </Stack>
  );
};
