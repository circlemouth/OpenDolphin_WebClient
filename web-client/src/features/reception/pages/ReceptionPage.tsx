import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { useSidebar } from '@/app/layout/SidebarContext';
import { patientVisitsQueryKey, usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { hasOpenBit } from '@/features/charts/utils/visit-state';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { useAuth } from '@/libs/auth';
import { useReceptionCallMutation, useReceptionMemoMutation } from '@/features/reception/hooks/useReceptionActions';
import { AppointmentManager } from '@/features/reception/components/AppointmentManager';
import { BarcodeCheckInPanel } from '@/features/reception/components/BarcodeCheckInPanel';
import type { BarcodeCheckInResult } from '@/features/reception/hooks/useReceptionCheckIn';
import { ColumnConfigurator } from '@/features/reception/components/ColumnConfigurator';
import { VisitManagementDialog } from '@/features/reception/components/VisitManagementDialog';
import { useTemporaryDocuments } from '@/features/reception/hooks/useTemporaryDocuments';
import {
  useReceptionPreferences,
  type ReceptionColumnKey,
} from '@/features/reception/hooks/useReceptionPreferences';
import {
  deleteVisit,
  fetchLegacyVisits,
  registerVisit,
  registerLegacyVisit,
  updateLegacyVisitMemo,
  updateVisitState,
  type LegacyVisitSearchParams,
} from '@/features/reception/api/visit-api';
import { usePatientSearch } from '@/features/patients/hooks/usePatientSearch';
import type { PatientUpsertMode } from '@/features/patients/hooks/usePatientUpsert';
import type {
  PatientDetail,
  PatientSearchMode,
  PatientSearchRequest,
  PatientSummary,
} from '@/features/patients/types/patient';
import { defaultKarteFromDate } from '@/features/patients/utils/rest-date';
import { recordOperationEvent } from '@/libs/audit';
import {
  ReceptionSidebarContent,
  type ReceptionSidebarTab,
} from '@/features/reception/components/ReceptionSidebarContent';
import { fetchPatientById } from '@/features/patients/api/patient-api';

type QueueStatus = 'waiting' | 'calling' | 'inProgress';
type SidebarTab = ReceptionSidebarTab;

const AUTO_RECEPTION_PREF_KEY = 'reception.autoCreateAfterPatient';

const QUEUE_GROUP_LABELS: Record<QueueStatus, { title: string; subtitle: string }> = {
  waiting: { title: '受付患者', subtitle: '待機中' },
  calling: { title: '呼出済み患者', subtitle: '呼出済み' },
  inProgress: { title: '診察中患者', subtitle: '診察中' },
};
const QUEUE_ORDER: QueueStatus[] = ['waiting', 'calling', 'inProgress'];

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ContentGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const ReceptionColumn = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const ColumnHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const ColumnTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.palette.textMuted};
    font-size: 0.9rem;
  }
`;

const CountsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const CountCard = styled.div`
  flex: 1 1 120px;
  min-width: 120px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }

  strong {
    font-size: 1.4rem;
  }
`;

const GroupSection = styled.section`
  display: grid;
  gap: 12px;
`;

const GroupTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const GroupList = styled.div`
  display: grid;
  gap: 12px;
`;

const GroupEmpty = styled.div`
  border: 1px dashed ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 16px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
  text-align: center;
`;

const ColumnTools = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const RightColumn = styled.div`
  display: grid;
  gap: 16px;
`;

const PatientSearchCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const PatientSearchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
`;

const SearchForm = styled.form`
  display: grid;
  gap: 12px;
`;

const SearchFields = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PatientResultList = styled.div`
  display: grid;
  gap: 8px;
`;

const PatientResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surface};
`;

const PatientResultInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const PatientResultName = styled.span`
  font-weight: 600;
`;

const PatientResultMeta = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PatientResultActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const buildPatientSummaryFromVisit = (visit: PatientVisitSummary): PatientSummary => {
  const baseRaw = visit.raw.patientModel ?? {};
  return {
    id: visit.patientPk,
    patientId: visit.patientId,
    fullName: visit.fullName,
    kanaName: visit.kanaName ?? undefined,
    gender: visit.gender ?? baseRaw.gender ?? undefined,
    genderDesc: baseRaw.genderDesc ?? undefined,
    birthday: visit.birthday ?? baseRaw.birthday ?? undefined,
    lastVisitDate: visit.visitDate,
    safetyNotes: visit.safetyNotes,
    raw: {
      id: baseRaw.id ?? visit.patientPk,
      patientId: visit.patientId,
      fullName: visit.fullName,
      kanaName: visit.kanaName ?? baseRaw.kanaName,
      gender: visit.gender ?? baseRaw.gender,
      genderDesc: baseRaw.genderDesc,
      birthday: visit.birthday ?? baseRaw.birthday,
      pvtDate: visit.visitDate ?? baseRaw.pvtDate,
      memo: baseRaw.memo,
      appMemo: baseRaw.appMemo,
      reserve1: baseRaw.reserve1,
      reserve2: baseRaw.reserve2,
      reserve3: baseRaw.reserve3,
      reserve4: baseRaw.reserve4,
      reserve5: baseRaw.reserve5,
      reserve6: baseRaw.reserve6,
      telephone: baseRaw.telephone,
      mobilePhone: baseRaw.mobilePhone,
      email: baseRaw.email,
      simpleAddressModel: baseRaw.simpleAddressModel ?? null,
      healthInsurances: baseRaw.healthInsurances ?? null,
    },
  } satisfies PatientSummary;
};

const buildPatientSummaryFromDetail = (detail: PatientDetail): PatientSummary => ({
  id: detail.id,
  patientId: detail.patientId,
  fullName: detail.fullName,
  kanaName: detail.kanaName ?? undefined,
  gender: detail.gender ?? undefined,
  genderDesc: detail.genderDesc ?? undefined,
  birthday: detail.birthday ?? undefined,
  lastVisitDate: detail.raw?.pvtDate ?? undefined,
  safetyNotes: detail.safetyNotes,
  raw: detail.raw,
});

const VisitCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const PatientName = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const MetaList = styled.div`
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemoEditor = styled.div`
  display: grid;
  gap: 12px;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.danger};
`;

const classifyVisit = (visit: PatientVisitSummary): QueueStatus => {
  if (visit.ownerUuid) {
    return 'inProgress';
  }
  if (hasOpenBit(visit.state)) {
    return 'calling';
  }
  return 'waiting';
};

const extractErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '操作に失敗しました。時間をおいて再度お試しください。';
};

export const ReceptionPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const clientUuid = session?.credentials.clientUuid;
  const visitsQuery = usePatientVisits();
  const { preferences, setVisibleColumns } = useReceptionPreferences();
  const receptionCallMutation = useReceptionCallMutation();
  const receptionMemoMutation = useReceptionMemoMutation();
  const [statePendingVisitId, setStatePendingVisitId] = useState<number | null>(null);
  const [memoPendingVisitId, setMemoPendingVisitId] = useState<number | null>(null);
  const [editingMemoVisitId, setEditingMemoVisitId] = useState<number | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [stateError, setStateError] = useState<{ visitId: number; message: string } | null>(null);
  const [memoError, setMemoError] = useState<{ visitId: number; message: string } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<PatientVisitSummary | null>(null);
  const [isAppointmentSaving, setIsAppointmentSaving] = useState(false);
  const [showColumnConfigurator, setShowColumnConfigurator] = useState(false);
  const queryClient = useQueryClient();
  const { setSidebar, clearSidebar } = useSidebar();
  const temporaryDocumentsQuery = useTemporaryDocuments();

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
  const temporaryDocumentPatientIds = useMemo(
    () => new Set((temporaryDocumentsQuery.data ?? []).map((entry) => entry.patientId)),
    [temporaryDocumentsQuery.data],
  );
  const [receptionSearchKeyword, setReceptionSearchKeyword] = useState('');
  const [patientSearchMode, setPatientSearchMode] = useState<PatientSearchMode>('name');
  const [patientSearchKeyword, setPatientSearchKeyword] = useState('');
  const [patientSearchParams, setPatientSearchParams] = useState<PatientSearchRequest | null>(null);
  const patientSearchQuery = usePatientSearch(patientSearchParams);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientSummary, setSelectedPatientSummary] = useState<PatientSummary | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('reception');
  const [karteFromDateInput, setKarteFromDateInput] = useState<string>(defaultKarteFromDate());
  const [karteFromDate, setKarteFromDate] = useState<string>(defaultKarteFromDate());
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [autoCreateReceptionEnabled, setAutoCreateReceptionEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(AUTO_RECEPTION_PREF_KEY);
    if (stored === 'false') {
      return false;
    }
    return true;
  });
  const [patientFormMode, setPatientFormMode] = useState<PatientUpsertMode>('update');

  useEffect(() => {
    const ridParam = urlSearchParams.get('rid');
    const pidParam = urlSearchParams.get('pid');
    if (ridParam) {
      const parsed = Number.parseInt(ridParam, 10);
      if (!Number.isNaN(parsed)) {
        setSelectedVisitId(parsed);
      }
    }
    if (pidParam) {
      setSelectedPatientId(pidParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [manageTargetId, setManageTargetId] = useState<number | null>(null);
  const [desiredState, setDesiredState] = useState(0);
  const [manageError, setManageError] = useState<string | null>(null);
  const [quickReceptionPatientId, setQuickReceptionPatientId] = useState<string | null>(null);

  const selectedVisit = useMemo(
    () => visits.find((visit) => visit.visitId === selectedVisitId) ?? null,
    [visits, selectedVisitId],
  );
  const manageTarget = useMemo(
    () => visits.find((visit) => visit.visitId === manageTargetId) ?? null,
    [visits, manageTargetId],
  );

  useEffect(() => {
    if (!selectedVisit) {
      return;
    }
    const summary = buildPatientSummaryFromVisit(selectedVisit);
    setSelectedPatientId(selectedVisit.patientId);
    setSelectedPatientSummary(summary);
    setActiveSidebarTab('reception');
  }, [selectedVisit]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }
    if (selectedVisit && selectedVisit.patientId === selectedPatientId) {
      return;
    }
    const candidates = patientSearchQuery.data ?? [];
    const matched = candidates.find((entry) => entry.patientId === selectedPatientId);
    if (matched) {
      setSelectedPatientSummary(matched);
    }
  }, [patientSearchQuery.data, selectedPatientId, selectedVisit]);

  useEffect(() => {
    if (manageTarget) {
      setDesiredState(manageTarget.state ?? 0);
    }
  }, [manageTarget]);

  const visibleColumns = useMemo(() => preferences.visibleColumns, [preferences.visibleColumns]);
  const isColumnVisible = useCallback(
    (key: ReceptionColumnKey) => visibleColumns.includes(key),
    [visibleColumns],
  );

  useEffect(() => {
    if (!scheduleTarget) {
      return;
    }
    const exists = visits.some((visit) => visit.visitId === scheduleTarget.visitId);
    if (!exists) {
      setScheduleTarget(null);
      setIsAppointmentSaving(false);
    }
  }, [scheduleTarget, visits]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      AUTO_RECEPTION_PREF_KEY,
      autoCreateReceptionEnabled ? 'true' : 'false',
    );
  }, [autoCreateReceptionEnabled]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedVisitId) {
      params.set('rid', String(selectedVisitId));
    }
    if (selectedPatientId) {
      params.set('pid', selectedPatientId);
    }
    setUrlSearchParams(params, { replace: true });
  }, [selectedVisitId, selectedPatientId, setUrlSearchParams]);

  const handleOpenChart = useCallback(
    (visitId: number) => {
      navigate(`/charts/${visitId}`);
    },
    [navigate],
  );

  const handlePatientSearch = useCallback(() => {
    const keywordInput = patientSearchKeyword.trim();
    if (!keywordInput) {
      setSearchError('患者検索キーワードを入力してください');
      return;
    }
    setSearchError(null);
    const params: PatientSearchRequest = { keyword: keywordInput, mode: patientSearchMode };
    setPatientSearchParams(params);
    recordOperationEvent('patient', 'info', 'patient_search_inline', '受付画面から患者検索を実行しました', {
      keywordLength: keywordInput.length,
      mode: patientSearchMode,
    });
  }, [patientSearchKeyword, patientSearchMode]);

  const handleSelectPatientSummary = useCallback(
    (summary: PatientSummary, options?: { focusTab?: SidebarTab }) => {
      setSelectedPatientId(summary.patientId);
      setSelectedPatientSummary(summary);
      setSelectedVisitId(null);
      setPatientFormMode('update');
      setActiveSidebarTab(options?.focusTab ?? 'patient');
      recordOperationEvent('patient', 'info', 'patient_select', '患者を選択しました', {
        patientId: summary.patientId,
        fullName: summary.fullName,
        source: 'reception-page-search',
      });
    },
    [],
  );

  const handleBarcodeSuccess = useCallback(
    (result: BarcodeCheckInResult) => {
      setSelectedVisitId(null);
      setReceptionSearchKeyword('');
      setSelectedPatientId(result.patientId);
      setSelectedPatientSummary(buildPatientSummaryFromDetail(result.patient));
      setPatientFormMode('update');
      setActiveSidebarTab('patient');
    },
    [],
  );

  const handleCreateReceptionFromPatient = useCallback(
    async (detail: PatientDetail) => {
      try {
        await registerVisit(detail, {
          doctorId: preferences.defaultDoctorId ?? undefined,
          doctorName: preferences.defaultDoctorName ?? undefined,
          departmentCode: preferences.defaultDepartmentCode ?? undefined,
          departmentName: preferences.defaultDepartmentName ?? undefined,
          insuranceUid: preferences.defaultInsuranceUid ?? undefined,
          source: 'manual',
        });
        await queryClient.invalidateQueries({ queryKey: patientVisitsQueryKey });
        recordOperationEvent('reception', 'info', 'visit_create_from_patient', '患者編集から受付を作成しました', {
          patientId: detail.patientId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '受付登録に失敗しました。';
        recordOperationEvent('reception', 'error', 'visit_create_from_patient_failed', '患者編集からの受付作成に失敗しました', {
          patientId: detail.patientId,
        });
        throw new Error(message);
      }
    },
    [preferences.defaultDoctorId, preferences.defaultDoctorName, preferences.defaultDepartmentCode, preferences.defaultDepartmentName, preferences.defaultInsuranceUid, queryClient],
  );

  const handleQuickReceptionCreate = useCallback(
    async (patient: PatientSummary) => {
      setQuickReceptionPatientId(patient.patientId);
      setSearchError(null);
      try {
        const detail = await fetchPatientById(patient.patientId);
        if (!detail) {
          throw new Error('患者情報を取得できませんでした。');
        }
        await handleCreateReceptionFromPatient(detail);
        setSelectedPatientId(patient.patientId);
        setSelectedPatientSummary(buildPatientSummaryFromDetail(detail));
        setActiveSidebarTab('reception');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '受付登録に失敗しました。時間をおいて再度お試しください。';
        setSearchError(message);
      } finally {
        setQuickReceptionPatientId(null);
      }
    },
    [handleCreateReceptionFromPatient],
  );

  const handleOpenManage = useCallback(
    (visit: PatientVisitSummary) => {
      setManageError(null);
      setManageTargetId(visit.visitId);
      setDesiredState(visit.state ?? 0);
    },
    [],
  );

  const handleToggleCall = useCallback(
    async (visit: PatientVisitSummary) => {
      if (visit.ownerUuid) {
        return;
      }
      setStateError(null);
      setStatePendingVisitId(visit.visitId);
      try {
        await receptionCallMutation.mutateAsync({
          visit,
          shouldCall: !hasOpenBit(visit.state),
        });
      } catch (error) {
        setStateError({ visitId: visit.visitId, message: extractErrorMessage(error) });
      } finally {
        setStatePendingVisitId(null);
      }
    },
    [receptionCallMutation],
  );

  const patientResults = useMemo(() => patientSearchQuery.data ?? [], [patientSearchQuery.data]);

  const filteredVisits = useMemo(() => {
    const normalizedKeyword = receptionSearchKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return visits;
    }
    return visits.filter((visit) => {
      const target = [
        visit.fullName,
        visit.kanaName,
        visit.patientId,
        visit.memo,
        visit.raw.memo,
        visit.raw.patientModel?.memo,
        visit.raw.patientModel?.fullName,
        visit.raw.patientModel?.kanaName,
        visit.doctorName,
        visit.doctorId,
        visit.departmentName,
        visit.raw.patientModel?.telephone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return target.includes(normalizedKeyword);
    });
  }, [receptionSearchKeyword, visits]);

  const groupedVisits = useMemo(
    () =>
      filteredVisits.reduce(
        (groups, visit) => {
          const status = classifyVisit(visit);
          groups[status].push(visit);
          return groups;
        },
        {
          waiting: [] as PatientVisitSummary[],
          calling: [] as PatientVisitSummary[],
          inProgress: [] as PatientVisitSummary[],
        },
      ),
    [filteredVisits],
  );

  const summary = useMemo(
    () => ({
      waiting: groupedVisits.waiting.length,
      calling: groupedVisits.calling.length,
      inProgress: groupedVisits.inProgress.length,
    }),
    [groupedVisits],
  );

  const isReceptionLoading = visitsQuery.isPending;
  const isReceptionRefreshing = visitsQuery.isFetching && !visitsQuery.isPending;
  const scheduleKarteId = scheduleTarget?.patientPk ?? null;

  const visitStateMutation = useMutation({
    mutationFn: async ({ visitId, nextState }: { visitId: number; nextState: number }) => {
      await updateVisitState(visitId, nextState);
      return { visitId, nextState };
    },
    onSuccess: ({ visitId, nextState }) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((visit) =>
          visit.visitId === visitId
            ? {
                ...visit,
                state: nextState,
                raw: {
                  ...visit.raw,
                  state: nextState,
                },
              }
            : visit,
        );
      });
      setManageTargetId(null);
      setManageError(null);
    },
    onError: (error) => {
      setManageError(extractErrorMessage(error));
    },
  });

  const visitDeleteMutation = useMutation({
    mutationFn: async (visitId: number) => {
      await deleteVisit(visitId);
      return visitId;
    },
    onSuccess: (visitId) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) =>
        current ? current.filter((visit) => visit.visitId !== visitId) : current,
      );
      setManageTargetId(null);
      setManageError(null);
      setSelectedVisitId((current) => (current === visitId ? null : current));
    },
    onError: (error) => {
      setManageError(extractErrorMessage(error));
    },
  });

  const legacyMemoMutation = useMutation({
    mutationFn: async ({ visitId, memo }: { visitId: number; memo: string }) => {
      await updateLegacyVisitMemo(visitId, memo);
      return { visitId, memo };
    },
    onSuccess: ({ visitId, memo }) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((visit) =>
          visit.visitId === visitId
            ? {
                ...visit,
                memo,
                raw: {
                  ...visit.raw,
                  memo,
                  patientModel: visit.raw.patientModel
                    ? {
                        ...visit.raw.patientModel,
                        memo,
                      }
                    : visit.raw.patientModel,
                },
              }
            : visit,
        );
      });
    },
  });

  const legacyRegisterMutation = useMutation({
    mutationFn: async (visit: PatientVisitSummary['raw']) => {
      await registerLegacyVisit(visit);
      return visit.id ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientVisitsQueryKey });
    },
  });

  const handleStartMemoEdit = useCallback((visit: PatientVisitSummary) => {
    setMemoError(null);
    setEditingMemoVisitId(visit.visitId);
    setMemoDraft(visit.memo ?? '');
  }, []);

  const handleCancelMemoEdit = useCallback(() => {
    setEditingMemoVisitId(null);
    setMemoDraft('');
  }, []);

  const handleSaveMemo = useCallback(
    async (visit: PatientVisitSummary) => {
      setMemoError(null);
      setMemoPendingVisitId(visit.visitId);
      try {
        await receptionMemoMutation.mutateAsync({ visit, memo: memoDraft });
        setEditingMemoVisitId(null);
        setMemoDraft('');
      } catch (error) {
        setMemoError({ visitId: visit.visitId, message: extractErrorMessage(error) });
      } finally {
        setMemoPendingVisitId(null);
      }
    },
    [memoDraft, receptionMemoMutation],
  );

  const handleSubmitStateUpdate = useCallback(async () => {
    if (!manageTarget) {
      return;
    }
    setManageError(null);
    try {
      await visitStateMutation.mutateAsync({ visitId: manageTarget.visitId, nextState: desiredState });
    } catch {
      // onError already handles user feedback
    }
  }, [desiredState, manageTarget, visitStateMutation]);

  const handleDeleteVisit = useCallback(async () => {
    if (!manageTarget) {
      return;
    }
    setManageError(null);
    try {
      await visitDeleteMutation.mutateAsync(manageTarget.visitId);
    } catch {
      // handled in onError
    }
  }, [manageTarget, visitDeleteMutation]);

  const handleCloseManageDialog = useCallback(() => {
    if (
      visitStateMutation.isPending ||
      visitDeleteMutation.isPending ||
      legacyMemoMutation.isPending ||
      legacyRegisterMutation.isPending
    ) {
      return;
    }
    setManageTargetId(null);
    setManageError(null);
  }, [
    visitStateMutation.isPending,
    visitDeleteMutation.isPending,
    legacyMemoMutation.isPending,
    legacyRegisterMutation.isPending,
  ]);

  const isManageProcessing =
    visitStateMutation.isPending ||
    visitDeleteMutation.isPending ||
    legacyMemoMutation.isPending ||
    legacyRegisterMutation.isPending;

  const handleLegacyMemoSubmit = useCallback(
    async (memo: string) => {
      if (!manageTarget) {
        throw new Error('受付情報が見つかりません。');
      }
      try {
        await legacyMemoMutation.mutateAsync({ visitId: manageTarget.visitId, memo });
      } catch (error) {
        throw new Error(extractErrorMessage(error));
      }
    },
    [legacyMemoMutation, manageTarget],
  );

  const handleLegacyFetchVisits = useCallback(async (params: LegacyVisitSearchParams) => {
    try {
      return await fetchLegacyVisits(params);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }, []);

  const handleLegacyReRegister = useCallback(async () => {
    if (!manageTarget) {
      throw new Error('受付情報が見つかりません。');
    }
    try {
      await legacyRegisterMutation.mutateAsync(manageTarget.raw);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }, [legacyRegisterMutation, manageTarget]);

  const handleCloseAppointmentManager = useCallback(() => {
    setIsAppointmentSaving(false);
    setScheduleTarget(null);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSelectedVisitId(null);
  }, []);

  const refetchPatientSearch = patientSearchQuery.refetch;

  const handlePatientSaved = useCallback(
    ({ patientId, detail }: { patientId: string; detail?: PatientDetail | null }) => {
      setSelectedPatientId(patientId);
      if (detail) {
        setSelectedPatientSummary(buildPatientSummaryFromDetail(detail));
      }
      setPatientFormMode('update');
      setActiveSidebarTab('patient');
      void refetchPatientSearch();
    },
    [refetchPatientSearch],
  );

  const handleSidebarKarteFromDateChange = useCallback((value: string) => {
    if (!value) {
      const fallback = defaultKarteFromDate();
      setKarteFromDateInput(fallback);
      setKarteFromDate(fallback);
      return;
    }
    setKarteFromDateInput(value);
    setKarteFromDate(value);
  }, []);

  const handleAutoReceptionPreference = useCallback((enabled: boolean) => {
    setAutoCreateReceptionEnabled(enabled);
  }, []);

  const isCallMutating = receptionCallMutation.isPending;
  const isMemoMutating = receptionMemoMutation.isPending;

  const callState = useMemo(
    () => ({
      pendingId: statePendingVisitId,
      error: stateError,
      isMutating: isCallMutating,
    }),
    [isCallMutating, stateError, statePendingVisitId],
  );

  const sidebarContent = useMemo(() => {
    if (!selectedVisit && !selectedPatientSummary && !selectedPatientId) {
      return null;
    }
    const hasTemporaryDocument =
      (selectedVisit && temporaryDocumentPatientIds.has(selectedVisit.patientId)) ||
      (selectedPatientId ? temporaryDocumentPatientIds.has(selectedPatientId) : false);

    return (
      <ReceptionSidebarContent
        visit={selectedVisit}
        patientSummary={selectedPatientSummary}
        patientId={selectedPatientId}
        activeTab={activeSidebarTab}
        onTabChange={setActiveSidebarTab}
        onClose={handleSidebarClose}
        onOpenChart={handleOpenChart}
        onOpenManage={handleOpenManage}
        onToggleCall={handleToggleCall}
        callState={callState}
        hasTemporaryDocument={Boolean(hasTemporaryDocument)}
        autoCreateReceptionEnabled={autoCreateReceptionEnabled}
        onAutoCreateReceptionChange={handleAutoReceptionPreference}
        onCreateReception={handleCreateReceptionFromPatient}
        patientFormMode={patientFormMode}
        onPatientFormModeChange={setPatientFormMode}
        onPatientSaved={handlePatientSaved}
        karteFromDate={karteFromDate}
        karteFromDateInput={karteFromDateInput}
        onChangeKarteFromDate={handleSidebarKarteFromDateChange}
      />
    );
  }, [
    activeSidebarTab,
    autoCreateReceptionEnabled,
    callState,
    handleAutoReceptionPreference,
    handleCreateReceptionFromPatient,
    handleOpenChart,
    handleOpenManage,
    handlePatientSaved,
    handleSidebarClose,
    handleSidebarKarteFromDateChange,
    handleToggleCall,
    karteFromDate,
    karteFromDateInput,
    patientFormMode,
    selectedPatientId,
    selectedPatientSummary,
    selectedVisit,
    setActiveSidebarTab,
    setPatientFormMode,
    temporaryDocumentPatientIds,
  ]);

  useEffect(() => {
    if (!sidebarContent) {
      clearSidebar();
      return undefined;
    }
    setSidebar(sidebarContent);
    return () => {
      clearSidebar();
    };
  }, [clearSidebar, setSidebar, sidebarContent]);

  const getVisitCard = useCallback(
    (visit: PatientVisitSummary) => {
      const isOwnedByMe = clientUuid && visit.ownerUuid === clientUuid;
      const isOwnedByOther = clientUuid && visit.ownerUuid && visit.ownerUuid !== clientUuid;
      const isCalling = hasOpenBit(visit.state);
      const canToggleCall = !visit.ownerUuid;
      const callButtonLabel = isCalling ? '呼出を解除' : '呼出する';
      const callButtonTitle = !canToggleCall ? '診察中のため呼出状態を変更できません' : undefined;
      const isStateUpdating = statePendingVisitId === visit.visitId && isCallMutating;
      const isMemoEditing = editingMemoVisitId === visit.visitId;
      const isMemoUpdating = memoPendingVisitId === visit.visitId && isMemoMutating;
      const stateErrorMessage =
        stateError?.visitId === visit.visitId ? stateError.message : null;
      const memoErrorMessage =
        memoError?.visitId === visit.visitId ? memoError.message : null;
      const firstInsurance =
        visit.raw.firstInsurance?.trim() ??
        visit.raw.patientModel?.firstInsurance?.trim() ??
        '---';
      const doctorInfo =
        [visit.doctorName?.trim(), visit.doctorId?.trim()].filter(Boolean).join(' / ') || '---';
      const statusBadge = visit.ownerUuid ? (
        <StatusBadge tone="info">診察中</StatusBadge>
      ) : isCalling ? (
        <StatusBadge tone="warning">呼出済み</StatusBadge>
      ) : (
        <StatusBadge tone="neutral">待機中</StatusBadge>
      );

      const badges: JSX.Element[] = [];
      if (temporaryDocumentPatientIds.has(visit.patientId)) {
        badges.push(
          <StatusBadge key="document" tone="danger">
            仮保存カルテあり
          </StatusBadge>,
        );
      }
      if (isColumnVisible('owner')) {
        if (isOwnedByMe) {
          badges.push(
            <StatusBadge key="owner-self" tone="success">
              自端末で編集中
            </StatusBadge>,
          );
        } else if (isOwnedByOther) {
          badges.push(
            <StatusBadge key="owner-other" tone="danger">
              他端末で編集中
            </StatusBadge>,
          );
        }
      }
      if (isColumnVisible('safetyNotes') && !visit.ownerUuid && visit.safetyNotes?.length) {
        visit.safetyNotes.forEach((note) => {
          badges.push(
            <StatusBadge key={`note-${note}`} tone="warning">
              {note}
            </StatusBadge>,
          );
        });
      }

      const metaItems: JSX.Element[] = [];
      if (isColumnVisible('patientId')) {
        metaItems.push(<span key="patientId">ID: {visit.patientId}</span>);
      }
      if (isColumnVisible('kanaName')) {
        metaItems.push(<span key="kanaName">かな: {visit.kanaName ?? '---'}</span>);
      }
      if (isColumnVisible('visitDate')) {
        metaItems.push(<span key="visitDate">来院: {visit.visitDate ?? '---'}</span>);
      }
      if (isColumnVisible('insurance')) {
        metaItems.push(<span key="insurance">保険: {firstInsurance}</span>);
      }
      if (isColumnVisible('doctor')) {
        metaItems.push(<span key="doctor">担当医: {doctorInfo}</span>);
      }
      if (isColumnVisible('memo')) {
        metaItems.push(<span key="memo">受付メモ: {visit.memo ?? '---'}</span>);
      }

      return (
        <VisitCard key={visit.visitId} tone="muted" padding="lg">
          <Stack gap={12}>
            <CardHeader>
              <div>
                <PatientName>{visit.fullName}</PatientName>
                {metaItems.length ? <MetaList>{metaItems}</MetaList> : null}
              </div>
              {isColumnVisible('status') ? statusBadge : null}
            </CardHeader>
            {badges.length ? <BadgeRow>{badges}</BadgeRow> : null}
            {stateErrorMessage ? <ErrorText role="alert">{stateErrorMessage}</ErrorText> : null}
            {memoErrorMessage && !isMemoEditing ? (
              <ErrorText role="alert">{memoErrorMessage}</ErrorText>
            ) : null}
            {isMemoEditing ? (
              <MemoEditor>
                <TextArea
                  label="受付メモ"
                  description="保存すると他端末にも即座に反映されます。"
                  placeholder="スタッフ間で共有したい注意事項を入力してください。"
                  value={memoDraft}
                  onChange={(event) => setMemoDraft(event.currentTarget.value)}
                  disabled={isMemoUpdating}
                />
                {memoErrorMessage ? <ErrorText role="alert">{memoErrorMessage}</ErrorText> : null}
                <ActionRow>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      void handleSaveMemo(visit);
                    }}
                    isLoading={isMemoUpdating}
                  >
                    保存する
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelMemoEdit}
                    disabled={isMemoUpdating}
                  >
                    キャンセル
                  </Button>
                </ActionRow>
              </MemoEditor>
            ) : null}
            <ActionRow>
              <Button
                type="button"
                variant={isCalling ? 'secondary' : 'primary'}
                onClick={() => {
                  void handleToggleCall(visit);
                }}
                disabled={!canToggleCall || isStateUpdating}
                isLoading={isStateUpdating}
                title={callButtonTitle}
              >
                {callButtonLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleStartMemoEdit(visit)}
                disabled={isMemoUpdating || isMemoEditing}
              >
                受付メモを編集
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setScheduleTarget(visit)}
                disabled={isMemoUpdating || isStateUpdating || isAppointmentSaving}
              >
                予約を管理
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleOpenChart(visit.visitId)}
              >
                カルテを開く
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedVisitId(visit.visitId);
                  setActiveSidebarTab('reception');
                }}
              >
                受付詳細
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenManage(visit)}
                disabled={isManageProcessing}
              >
                詳細操作
              </Button>
            </ActionRow>
          </Stack>
        </VisitCard>
      );
    },
    [
      clientUuid,
      handleCancelMemoEdit,
      handleOpenChart,
      handleOpenManage,
      handleSaveMemo,
      handleStartMemoEdit,
      handleToggleCall,
      isAppointmentSaving,
      isCallMutating,
      isColumnVisible,
      isManageProcessing,
      isMemoMutating,
      memoDraft,
      memoError,
      memoPendingVisitId,
      setActiveSidebarTab,
      setScheduleTarget,
      setSelectedVisitId,
      stateError,
      statePendingVisitId,
      temporaryDocumentPatientIds,
    ],
  );

  return (
    <PageContainer>
      <ContentGrid>
        <ReceptionColumn tone="muted" padding="lg">
          <ColumnHeader>
            <ColumnTitle>
              <h2>受付患者一覧</h2>
              <p>受付検索で絞り込み、ステータスごとに受付状況を確認できます。</p>
            </ColumnTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void visitsQuery.refetch();
              }}
              disabled={visitsQuery.isFetching}
            >
              {isReceptionRefreshing ? '更新中…' : '受付情報を再取得'}
            </Button>
          </ColumnHeader>
          <TextField
            label="受付検索"
            placeholder="氏名・患者ID・メモで絞り込み"
            value={receptionSearchKeyword}
            onChange={(event) => setReceptionSearchKeyword(event.currentTarget.value)}
          />
          <CountsRow>
            <CountCard>
              <span>待機中</span>
              <strong>{summary.waiting}</strong>
            </CountCard>
            <CountCard>
              <span>呼出済み</span>
              <strong>{summary.calling}</strong>
            </CountCard>
            <CountCard>
              <span>診察中</span>
              <strong>{summary.inProgress}</strong>
            </CountCard>
          </CountsRow>
          {isReceptionLoading ? (
            <GroupEmpty>受付情報を読み込み中です…</GroupEmpty>
          ) : (
            QUEUE_ORDER.map((status) => {
              const visitsForStatus = groupedVisits[status];
              const { title, subtitle } = QUEUE_GROUP_LABELS[status];
              return (
                <GroupSection key={status}>
                  <GroupTitleRow>
                    <GroupTitle>{title}</GroupTitle>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                      {subtitle}：{visitsForStatus.length}件
                    </span>
                  </GroupTitleRow>
                  {visitsForStatus.length ? (
                    <GroupList>{visitsForStatus.map(getVisitCard)}</GroupList>
                  ) : (
                    <GroupEmpty>該当する受付はありません。</GroupEmpty>
                  )}
                </GroupSection>
              );
            })
          )}
          <ColumnTools>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowColumnConfigurator((prev) => !prev)}
            >
              {showColumnConfigurator ? '列設定を閉じる' : '表示列を設定'}
            </Button>
          </ColumnTools>
          {showColumnConfigurator ? (
            <ColumnConfigurator
              selected={visibleColumns}
              onChange={(columns) => setVisibleColumns(columns)}
              onClose={() => setShowColumnConfigurator(false)}
            />
          ) : null}
        </ReceptionColumn>
        <RightColumn>
          <PatientSearchCard tone="muted" padding="lg">
            <PatientSearchHeader>
              <ColumnTitle>
                <h2>患者検索</h2>
                <p>患者情報の参照や受付登録を行います。</p>
              </ColumnTitle>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setPatientFormMode('create');
                  setSelectedVisitId(null);
                  setSelectedPatientId(null);
                  setSelectedPatientSummary(null);
                  setActiveSidebarTab('patient');
                  recordOperationEvent(
                    'patient',
                    'info',
                    'patient_create_mode',
                    '新規患者登録フォームを開きました',
                    {
                      source: 'reception-page-right-column',
                    },
                  );
                }}
              >
                新規患者登録
              </Button>
            </PatientSearchHeader>
            <SearchForm
              onSubmit={(event) => {
                event.preventDefault();
                handlePatientSearch();
              }}
            >
              <SearchFields>
                <TextField
                  label="患者検索キーワード"
                  placeholder="患者ID または 氏名"
                  value={patientSearchKeyword}
                  onChange={(event) => setPatientSearchKeyword(event.currentTarget.value)}
                  errorMessage={searchError ?? undefined}
                />
                <SelectField
                  label="検索対象"
                  value={patientSearchMode}
                  onChange={(event) => setPatientSearchMode(event.currentTarget.value as PatientSearchMode)}
                  options={[
                    { value: 'name', label: '漢字氏名' },
                    { value: 'kana', label: 'カナ氏名' },
                    { value: 'id', label: '患者ID' },
                    { value: 'digit', label: '番号（下4桁など）' },
                  ]}
                />
                <Button type="submit" variant="primary" isLoading={patientSearchQuery.isFetching}>
                  検索実行
                </Button>
              </SearchFields>
            </SearchForm>
            {searchError ? (
              <span style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                {searchError}
              </span>
            ) : null}
            {patientSearchQuery.isError ? (
              <span style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                患者検索に失敗しました。時間をおいて再度お試しください。
              </span>
            ) : null}
            {patientResults.length > 0 ? (
              <PatientResultList>
                {patientResults.map((patient) => (
                  <PatientResultItem key={patient.patientId}>
                    <PatientResultInfo>
                      <PatientResultName>{patient.fullName}</PatientResultName>
                      <PatientResultMeta>患者ID: {patient.patientId}</PatientResultMeta>
                    </PatientResultInfo>
                    <PatientResultActions>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectPatientSummary(patient, { focusTab: 'patient' })}
                      >
                        詳細
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          void handleQuickReceptionCreate(patient);
                        }}
                        isLoading={quickReceptionPatientId === patient.patientId}
                      >
                        受付に追加
                      </Button>
                    </PatientResultActions>
                  </PatientResultItem>
                ))}
              </PatientResultList>
            ) : null}
          </PatientSearchCard>
          <BarcodeCheckInPanel onSuccess={handleBarcodeSuccess} />
        </RightColumn>
      </ContentGrid>
      {scheduleTarget && session ? (
        <AppointmentManager
          visit={scheduleTarget}
          karteId={scheduleKarteId}
          facilityId={session.credentials.facilityId}
          userId={session.credentials.userId}
          userModelId={session.userProfile?.userModelId}
          facilityName={session.userProfile?.facilityName}
          operatorName={
            session.userProfile?.displayName ??
            session.userProfile?.commonName ??
            session.credentials.userId
          }
          onClose={handleCloseAppointmentManager}
          onPendingChange={setIsAppointmentSaving}
        />
      ) : null}
      {manageTarget ? (
        <VisitManagementDialog
          visit={manageTarget}
          stateValue={desiredState}
          onChangeState={setDesiredState}
          onSubmitState={() => {
            void handleSubmitStateUpdate();
          }}
          onDelete={() => {
            void handleDeleteVisit();
          }}
          onClose={handleCloseManageDialog}
          isUpdating={visitStateMutation.isPending}
          isDeleting={visitDeleteMutation.isPending}
          errorMessage={manageError}
          onLegacyMemoSubmit={handleLegacyMemoSubmit}
          onLegacyFetchVisits={handleLegacyFetchVisits}
          onLegacyReRegister={handleLegacyReRegister}
        />
      ) : null}
    </PageContainer>
  );
};
