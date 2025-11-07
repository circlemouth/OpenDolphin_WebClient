import { useCallback, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { hasOpenBit } from '@/features/charts/utils/visit-state';
import { PatientEditorPanel } from '@/features/patients/components/PatientEditorPanel';
import type { PatientUpsertMode } from '@/features/patients/hooks/usePatientUpsert';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import type { PatientDetail, PatientSummary } from '@/features/patients/types/patient';
import { useVisitHistory } from '@/features/reception/hooks/useVisitHistory';
import { recordOperationEvent } from '@/libs/audit';

export type ReceptionSidebarTab = 'reception' | 'patient' | 'history';

interface CallState {
  pendingId: number | null;
  error: { visitId: number; message: string } | null;
  isMutating: boolean;
}

export interface ReceptionSidebarContentProps {
  visit: PatientVisitSummary | null;
  patientSummary: PatientSummary | null;
  patientId: string | null;
  activeTab: ReceptionSidebarTab;
  onTabChange: (tab: ReceptionSidebarTab) => void;
  onClose: () => void;
  onOpenChart: (visitId: number) => void;
  onOpenManage: (visit: PatientVisitSummary) => void;
  onToggleCall: (visit: PatientVisitSummary) => Promise<void> | void;
  callState: CallState;
  hasTemporaryDocument: boolean;
  autoCreateReceptionEnabled: boolean;
  onAutoCreateReceptionChange: (enabled: boolean) => void;
  onCreateReception: (detail: PatientDetail) => Promise<void>;
  patientFormMode: PatientUpsertMode;
  onPatientFormModeChange: (mode: PatientUpsertMode) => void;
  onPatientSaved: (payload: { patientId: string; detail?: PatientDetail | null }) => void;
  karteFromDate: string;
  karteFromDateInput?: string;
  onChangeKarteFromDate: (value: string) => void;
  onRequestKarteRefetch?: () => void;
  formatDisplayDate: (value?: string | null) => string;
  patientSearchResults: PatientSummary[];
  patientSearchState: {
    hasParams: boolean;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    usingManualResults: boolean;
  };
  searchErrorMessage: string | null;
  onSelectPatientFromSearch: (summary: PatientSummary) => void;
  onQuickReceptionCreate: (summary: PatientSummary) => void;
  quickReceptionPatientId: string | null;
}

const Container = styled.div`
  display: grid;
  gap: 16px;
`;

const pillRadius = '9999px';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const TabList = styled.div`
  display: inline-flex;
  gap: 8px;
  border-radius: ${pillRadius};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  padding: 4px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: ${pillRadius};
  padding: 6px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme, $active }) => ($active ? theme.palette.primaryStrong : theme.palette.surfaceStrong)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabPanel = styled.div`
  display: grid;
  gap: 16px;
`;

const SidebarCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Section = styled.section`
  display: grid;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
`;

const MetaList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  font-size: 0.85rem;

  dt {
    color: ${({ theme }) => theme.palette.textMuted};
    font-weight: 500;
  }

  dd {
    margin: 0;
  }
`;

const HistoryList = styled.ul`
  margin: 0;
  padding-left: 1em;
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
`;

const Feedback = styled.div<{ $tone: 'info' | 'danger' }>`
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  font-size: 0.85rem;
  background: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.palette.dangerSubtle : theme.palette.surfaceMuted};
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.text)};
`;

const HistoryCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
`;

const EmptyState = styled(SurfaceCard)`
  display: grid;
  gap: 8px;
  padding: 16px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const HistoryMeta = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px 16px;
  font-size: 0.85rem;

  dt {
    color: ${({ theme }) => theme.palette.textMuted};
  }

  dd {
    margin: 0;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`;

const SearchResultsCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
`;

const SearchResultMessage = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SearchResultsList = styled.div`
  display: grid;
  gap: 8px;
`;

const SearchResultItem = styled.button<{ $active: boolean }>`
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $active }) =>
    $active ? `${theme.palette.primary}14` : theme.palette.surface};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  font: inherit;
  color: inherit;
  outline: none;
  border-width: 1px;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.palette.primary}19`};
  }
`;

const SearchResultName = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.textPrimary};
`;

const SearchResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SearchResultBadges = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SearchResultActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const HistoryControls = styled.div`
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const DocumentList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
`;

const DocumentItem = styled.li<{ $marked: boolean }>`
  border: 1px solid
    ${({ theme, $marked }) => ($marked ? theme.palette.danger : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $marked }) =>
    $marked ? theme.palette.dangerSubtle : theme.palette.surface};
  padding: 12px 16px;
  display: grid;
  gap: 6px;
`;

const DocumentTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const DocumentTitle = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.textPrimary};
`;

const DocumentBadgeRow = styled.div`
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const DocumentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const toKarteDateInputValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const [datePart] = value.split(' ');
  return datePart ?? value;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '---';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ja-JP', { hour12: false });
};

const deriveStatusBadge = (visit: PatientVisitSummary) => {
  if (visit.ownerUuid) {
    return <StatusBadge tone="info">診察中</StatusBadge>;
  }
  if (hasOpenBit(visit.state)) {
    return <StatusBadge tone="warning">呼出済み</StatusBadge>;
  }
  return <StatusBadge tone="neutral">待機中</StatusBadge>;
};

const resolveDocumentStatusTone = (status?: string | null): 'neutral' | 'info' | 'success' | 'warning' => {
  if (!status) {
    return 'neutral';
  }
  if (/未署名|未確定|ドラフト|下書/.test(status)) {
    return 'warning';
  }
  if (/確定|署名済|完了|済/.test(status)) {
    return 'success';
  }
  return 'info';
};

const resolveSafetyNoteTone = (note: string): 'danger' | 'warning' | 'info' => {
  const normalized = note.trim();
  if (!normalized) {
    return 'info';
  }
  if (/禁忌|アナフィラ|ショック|重症/.test(normalized)) {
    return 'danger';
  }
  if (/注意|慎重|警告/.test(normalized)) {
    return 'warning';
  }
  return 'info';
};

const tabId = (tab: ReceptionSidebarTab) => `reception-sidebar-tab-${tab}`;
const panelId = (tab: ReceptionSidebarTab) => `reception-sidebar-panel-${tab}`;

export const ReceptionSidebarContent = ({
  visit,
  patientSummary,
  patientId,
  activeTab,
  onTabChange,
  onClose,
  onOpenChart,
  onOpenManage,
  onToggleCall,
  callState,
  hasTemporaryDocument,
  autoCreateReceptionEnabled,
  onAutoCreateReceptionChange,
  onCreateReception,
  patientFormMode,
  onPatientFormModeChange,
  onPatientSaved,
  karteFromDate,
  karteFromDateInput,
  onChangeKarteFromDate,
  onRequestKarteRefetch,
  formatDisplayDate,
  patientSearchResults,
  patientSearchState,
  searchErrorMessage,
  onSelectPatientFromSearch,
  onQuickReceptionCreate,
  quickReceptionPatientId,
}: ReceptionSidebarContentProps) => {
  const resolvedPatientId =
    patientId ?? patientSummary?.patientId ?? visit?.patientId ?? null;

  const visitReferenceDate = visit?.visitDate ?? patientSummary?.lastVisitDate ?? undefined;
  const visitHistoryQuery = useVisitHistory(resolvedPatientId ?? undefined, visitReferenceDate);
  const karteQuery = usePatientKarte(resolvedPatientId, {
    fromDate: karteFromDate,
    enabled: activeTab === 'history' && Boolean(resolvedPatientId),
  });
  const { refetch: refetchKarte } = karteQuery;
  const karteFromDateInputValue = useMemo(
    () => karteFromDateInput ?? toKarteDateInputValue(karteFromDate),
    [karteFromDateInput, karteFromDate],
  );

  useEffect(() => {
    if (activeTab === 'reception' && !visit) {
      if (resolvedPatientId) {
        onTabChange('patient');
      } else {
        onTabChange('history');
      }
    }
  }, [activeTab, visit, resolvedPatientId, onTabChange]);

  useEffect(() => {
    if (activeTab === 'history' && !resolvedPatientId) {
      if (visit) {
        onTabChange('reception');
      } else {
        onTabChange('patient');
      }
    }
  }, [activeTab, resolvedPatientId, visit, onTabChange]);

  const handleSelectTab = useCallback(
    (tab: ReceptionSidebarTab) => {
      if (tab === activeTab) {
        return;
      }
      onTabChange(tab);
      recordOperationEvent('reception', 'info', 'sidebar_tab_change', '受付サイドバーのタブを切り替えました', {
        tab,
        patientId: resolvedPatientId ?? undefined,
        visitId: visit?.visitId ?? undefined,
        source: 'reception-sidebar',
      });
    },
    [activeTab, onTabChange, resolvedPatientId, visit],
  );

  const handleClose = useCallback(() => {
    recordOperationEvent('reception', 'info', 'sidebar_close', '受付サイドバーを閉じました', {
      visitId: visit?.visitId ?? undefined,
      patientId: resolvedPatientId ?? undefined,
      source: 'reception-sidebar',
    });
    onClose();
  }, [onClose, resolvedPatientId, visit]);

  const handleToggleCallClick = useCallback(async () => {
    if (!visit) {
      return;
    }
    const isCurrentlyCalled = hasOpenBit(visit.state);
    const event = isCurrentlyCalled ? 'visit_call_cancel' : 'visit_call_start';
    const message = isCurrentlyCalled ? '呼出状態を解除しました' : '患者を呼び出しました';
    try {
      await onToggleCall(visit);
      recordOperationEvent('reception', 'info', event, message, {
        visitId: visit.visitId,
        patientId: visit.patientId,
        source: 'reception-sidebar',
      });
    } catch (error) {
      recordOperationEvent('reception', 'critical', 'visit_call_toggle_failed', '呼出状態の更新に失敗しました', {
        visitId: visit.visitId,
        patientId: visit.patientId,
        source: 'reception-sidebar',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }, [onToggleCall, visit]);

  const handleAutoCreateToggle = useCallback(
    (enabled: boolean) => {
      onAutoCreateReceptionChange(enabled);
      recordOperationEvent('reception', 'info', 'auto_reception_preference_update', '患者登録後の自動受付作成設定を変更しました', {
        enabled,
        source: 'reception-sidebar',
      });
    },
    [onAutoCreateReceptionChange],
  );

  const handleModeChange = useCallback(
    (mode: PatientUpsertMode) => {
      onPatientFormModeChange(mode);
      recordOperationEvent('patient', 'info', 'patient_editor_mode_change', '患者編集モードを切り替えました', {
        mode,
        patientId: resolvedPatientId ?? undefined,
        source: 'reception-sidebar',
      });
    },
    [onPatientFormModeChange, resolvedPatientId],
  );

  const handlePatientSaved = useCallback(
    (result: { patientId: string; detail: PatientDetail | null; mode: PatientUpsertMode }) => {
      onPatientSaved({ patientId: result.patientId, detail: result.detail });
      recordOperationEvent('patient', 'info', 'patient_upsert_from_sidebar', '受付サイドバーから患者情報を保存しました', {
        patientId: result.patientId,
        mode: result.mode,
        source: 'reception-sidebar',
      });
    },
    [onPatientSaved],
  );

  const handleKarteDateChange = useCallback(
    (value: string) => {
      onChangeKarteFromDate(value);
      recordOperationEvent('reception', 'info', 'karte_history_from_date_change', 'カルテ履歴の取得期間を更新しました', {
        fromDate: value,
        patientId: resolvedPatientId ?? undefined,
        source: 'reception-sidebar',
      });
    },
    [onChangeKarteFromDate, resolvedPatientId],
  );

  const handleKarteRefetch = useCallback(() => {
    if (!resolvedPatientId) {
      return;
    }
    void refetchKarte();
    onRequestKarteRefetch?.();
    recordOperationEvent('reception', 'info', 'karte_history_refetch', 'カルテ履歴を再取得しました', {
      patientId: resolvedPatientId,
      source: 'reception-sidebar',
    });
  }, [onRequestKarteRefetch, refetchKarte, resolvedPatientId]);

  const renderReceptionTab = () => {
    if (!visit) {
      return (
        <EmptyState role="note">
          <strong>受付情報が選択されていません。</strong>
          <span>左側の一覧から受付を選択すると詳細が表示されます。</span>
        </EmptyState>
      );
    }

    const isCallPending = callState.pendingId === visit.visitId || callState.isMutating;
    const callError =
      callState.error && callState.error.visitId === visit.visitId ? callState.error.message : null;

    return (
      <TabPanel
        role="tabpanel"
        id={panelId('reception')}
        aria-labelledby={tabId('reception')}
        aria-live="polite"
      >
        <SidebarCard tone="muted" padding="md">
          <BadgeRow>
            {deriveStatusBadge(visit)}
            {hasTemporaryDocument ? <StatusBadge tone="danger">仮保存カルテあり</StatusBadge> : null}
            {visit.safetyNotes.map((note) => (
              <StatusBadge key={note} tone="warning">
                {note}
              </StatusBadge>
            ))}
          </BadgeRow>

          <Section aria-label="受付概要">
            <SectionTitle>受付概要</SectionTitle>
            <MetaList>
              <dt>来院日時</dt>
              <dd>{formatDateTime(visit.visitDate)}</dd>
              <dt>担当医</dt>
              <dd>
                {visit.doctorName
                  ? `${visit.doctorName}${visit.doctorId ? ` (${visit.doctorId})` : ''}`
                  : '---'}
              </dd>
              <dt>診療科</dt>
              <dd>
                {visit.departmentName
                  ? `${visit.departmentName}${visit.departmentCode ? ` (${visit.departmentCode})` : ''}`
                  : '---'}
              </dd>
            </MetaList>
            <div>
              <TextArea label="受付メモ" value={visit.memo ?? ''} readOnly rows={4} />
            </div>
          </Section>

          <Section aria-label="受付アクション">
            <SectionTitle>アクション</SectionTitle>
            <Stack gap={8}>
              <Button
                type="button"
                variant={hasOpenBit(visit.state) ? 'secondary' : 'primary'}
                onClick={handleToggleCallClick}
                isLoading={isCallPending}
              >
                {hasOpenBit(visit.state) ? '呼出を終了する' : '呼び出す'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => onOpenChart(visit.visitId)}>
                カルテを開く
              </Button>
              <Button type="button" variant="ghost" onClick={() => onOpenManage(visit)}>
                詳細操作（状態変更・受付取消）
              </Button>
            </Stack>
            {callError ? (
              <Feedback role="alert" $tone="danger">
                {callError}
              </Feedback>
            ) : null}
          </Section>
        </SidebarCard>
      </TabPanel>
    );
  };

  const renderPatientTab = () => {
    const { hasParams, isLoading, isFetching, isError, usingManualResults } = patientSearchState;
    const hasResults = patientSearchResults.length > 0;

    return (
      <TabPanel role="tabpanel" id={panelId('patient')} aria-labelledby={tabId('patient')}>
        <SearchResultsCard tone="muted" padding="md" aria-live="polite">
          <Stack gap={8}>
            <SectionTitle>検索結果</SectionTitle>
            {usingManualResults ? <StatusBadge tone="warning">バーコード候補</StatusBadge> : null}
            {searchErrorMessage ? (
              <Feedback role="alert" $tone="danger">
                {searchErrorMessage}
              </Feedback>
            ) : null}
            {isError ? (
              <Feedback role="alert" $tone="danger">
                患者検索に失敗しました。時間をおいて再度お試しください。
              </Feedback>
            ) : isLoading ? (
              <SearchResultMessage>検索結果を読み込み中です…</SearchResultMessage>
            ) : hasResults ? (
              <SearchResultsList
                role="listbox"
                aria-label="患者検索結果"
                aria-busy={isFetching}
              >
                {patientSearchResults.map((patient) => {
                  const isSelected = resolvedPatientId === patient.patientId;
                  const genderLabel = patient.genderDesc ?? patient.gender ?? '---';
                  const lastVisitLabel = formatDisplayDate(patient.lastVisitDate);
                  const safetyNotes = patient.safetyNotes ?? [];
                  return (
                    <SearchResultItem
                      key={patient.patientId}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      $active={isSelected}
                      onClick={() => onSelectPatientFromSearch(patient)}
                    >
                      <div>
                        <SearchResultName>{patient.fullName ?? '---'}</SearchResultName>
                        <SearchResultMeta>
                          <span>患者ID: {patient.patientId || '---'}</span>
                          <span>性別: {genderLabel}</span>
                          <span>最終来院: {lastVisitLabel}</span>
                        </SearchResultMeta>
                        {safetyNotes.length ? (
                          <SearchResultBadges>
                            {safetyNotes.map((note, index) => (
                              <StatusBadge key={`${patient.patientId}-safety-${index}`} tone={resolveSafetyNoteTone(note)} size="sm">
                                {note}
                              </StatusBadge>
                            ))}
                          </SearchResultBadges>
                        ) : null}
                      </div>
                      <SearchResultActions>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectPatientFromSearch(patient);
                          }}
                        >
                          詳細
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onQuickReceptionCreate(patient);
                          }}
                          isLoading={quickReceptionPatientId === patient.patientId}
                        >
                          受付に追加
                        </Button>
                      </SearchResultActions>
                    </SearchResultItem>
                  );
                })}
              </SearchResultsList>
            ) : hasParams ? (
              <SearchResultMessage>該当する患者が見つかりませんでした。</SearchResultMessage>
            ) : (
              <SearchResultMessage>検索条件を入力すると結果が表示されます。</SearchResultMessage>
            )}
          </Stack>
        </SearchResultsCard>

        <PatientEditorPanel
          layout="sidebar"
          mode={patientFormMode}
          patientId={resolvedPatientId}
          summary={patientSummary}
          onModeChange={handleModeChange}
          onSaved={handlePatientSaved}
          showCollapseToggle={false}
          autoCreateReceptionEnabled={autoCreateReceptionEnabled}
          onToggleAutoCreateReception={handleAutoCreateToggle}
          onCreateReceptionRequested={onCreateReception}
        />
      </TabPanel>
    );
  };

  const renderHistoryTab = () => {
    if (!resolvedPatientId) {
      return (
        <EmptyState role="note" id={panelId('history')} aria-labelledby={tabId('history')}>
          <strong>患者が選択されていません。</strong>
          <span>患者を選択すると来院履歴とカルテ概要を表示します。</span>
        </EmptyState>
      );
    }

    const historyItems = visitHistoryQuery.data ?? [];
    const karte = karteQuery.data;
    const isKartePending = karteQuery.isPending;
    const isKarteRefetching = karteQuery.isFetching && !karteQuery.isPending;

    return (
      <TabPanel role="tabpanel" id={panelId('history')} aria-labelledby={tabId('history')}>
        <HistoryCard padding="md" tone="muted" aria-live="polite">
          <SectionTitle>最近の受付履歴</SectionTitle>
          {visitHistoryQuery.isLoading ? (
            <span>履歴を読み込み中です…</span>
          ) : historyItems.length ? (
            <HistoryList>
              {historyItems.map((entry, index) => (
                <li key={entry.visitDate ?? `${resolvedPatientId}-${index}`}>
                  {formatDateTime(entry.visitDate)}／{entry.memo ?? '受付記録'}
                </li>
              ))}
            </HistoryList>
          ) : (
            <span>表示できる受付履歴がありません。</span>
          )}
        </HistoryCard>

        <HistoryCard padding="md" tone="muted" aria-live="polite">
          <Stack gap={12}>
            <HistoryHeader>
              <SectionTitle>カルテ履歴</SectionTitle>
              <HistoryControls>
                <TextField
                  label="取得開始日"
                  type="date"
                  value={karteFromDateInputValue}
                  onChange={(event) => handleKarteDateChange(event.currentTarget.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleKarteRefetch}
                  disabled={!resolvedPatientId}
                  isLoading={isKarteRefetching}
                >
                  再取得
                </Button>
              </HistoryControls>
            </HistoryHeader>
          </Stack>
          {isKartePending ? (
            <span>カルテ情報を取得しています…</span>
          ) : karte ? (
            <Stack gap={12}>
              <HistoryMeta>
                <dt>最終文書日</dt>
                <dd>{formatDateTime(karte.lastDocDate)}</dd>
                <dt>アレルギー件数</dt>
                <dd>{karte.allergies.length} 件</dd>
                <dt>保存メモ件数</dt>
                <dd>{karte.memos.length} 件</dd>
                <dt>文書件数</dt>
                <dd>{karte.documents.length} 件</dd>
              </HistoryMeta>
              {karte.documents.length ? (
                <Section>
                  <SectionTitle>カルテ文書一覧</SectionTitle>
                  <DocumentList>
                    {karte.documents.map((doc) => (
                      <DocumentItem key={doc.docPk} $marked={Boolean(doc.hasMark)}>
                        <DocumentTitleRow>
                          <DocumentTitle>{doc.title ?? '無題'}</DocumentTitle>
                          <DocumentBadgeRow>
                            {doc.status ? (
                              <StatusBadge tone={resolveDocumentStatusTone(doc.status)}>
                                {doc.status}
                              </StatusBadge>
                            ) : null}
                            {doc.hasMark ? <StatusBadge tone="danger">注意</StatusBadge> : null}
                          </DocumentBadgeRow>
                        </DocumentTitleRow>
                        <DocumentMeta>
                          <span>確定日: {formatDisplayDate(doc.confirmDate)}</span>
                          <span>診療科: {doc.departmentDesc ?? '---'}</span>
                        </DocumentMeta>
                      </DocumentItem>
                    ))}
                  </DocumentList>
                </Section>
              ) : (
                <span>カルテ文書は登録されていません。</span>
              )}
            </Stack>
          ) : (
            <span>カルテ履歴を取得できませんでした。</span>
          )}
        </HistoryCard>
      </TabPanel>
    );
  };

  const tabs = useMemo(() => {
    const base: { key: ReceptionSidebarTab; label: string; disabled: boolean }[] = [
      { key: 'reception', label: '受付', disabled: !visit },
      { key: 'patient', label: '患者', disabled: false },
      { key: 'history', label: '履歴', disabled: !resolvedPatientId },
    ];
    return base;
  }, [resolvedPatientId, visit]);

  return (
    <Container>
      <Header>
        <TitleBlock>
          <h2>{visit?.fullName ?? patientSummary?.fullName ?? '患者未選択'}</h2>
          <span>患者ID: {resolvedPatientId ?? '---'}</span>
        </TitleBlock>
        <Button type="button" variant="ghost" onClick={handleClose}>
          閉じる
        </Button>
      </Header>

      <TabList role="tablist" aria-label="受付サイドバータブ">
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-selected={activeTab === tab.key}
            aria-controls={panelId(tab.key)}
            $active={activeTab === tab.key}
            onClick={() => handleSelectTab(tab.key)}
            disabled={tab.disabled}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabList>

      {activeTab === 'reception'
        ? renderReceptionTab()
        : activeTab === 'history'
          ? renderHistoryTab()
          : renderPatientTab()}
    </Container>
  );
};
