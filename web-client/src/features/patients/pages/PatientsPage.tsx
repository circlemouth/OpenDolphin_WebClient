import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import { PatientEditorPanel } from '@/features/patients/components/PatientEditorPanel';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { usePatientSearch } from '@/features/patients/hooks/usePatientSearch';
import type { PatientSearchMode, PatientSummary } from '@/features/patients/types/patient';
import type { PatientUpsertMode } from '@/features/patients/hooks/usePatientUpsert';
import { defaultKarteFromDate, formatRestDate } from '@/features/patients/utils/rest-date';
import { recordOperationEvent } from '@/libs/audit';

const PageLayout = styled.div`
  display: grid;
  gap: 24px;
`;

const ResultsLayout = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 0.6rem 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
  font-weight: 600;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const TableRow = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  background: ${({ theme, $selected }) => ($selected ? theme.palette.surfaceMuted : 'transparent')};

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const TableCell = styled.td`
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  vertical-align: middle;
`;

const SafetyNote = styled(StatusBadge)`
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.8rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
`;

const SubtleText = styled.span`
  color: ${({ theme }) => theme.palette.textMuted};
`;

const searchSchema = z.object({
  keyword: z.string().min(1, '検索キーワードを入力してください'),
  mode: z.enum(['name', 'kana', 'id', 'digit']),
});

type SearchFormValues = z.infer<typeof searchSchema>;

const searchModeLabels: Record<PatientSearchMode, string> = {
  name: '漢字氏名',
  kana: 'カナ氏名',
  id: '患者ID',
  digit: '番号（下4桁など）',
};

const defaultFromDateInput = '2000-01-01';

const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return '---';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return value;
  }
};

export const PatientsPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { keyword: '', mode: 'name' },
  });

  const [searchParams, setSearchParams] = useState<SearchFormValues | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<PatientUpsertMode>('update');
  const [fromDateInput, setFromDateInput] = useState(defaultFromDateInput);
  const [karteFromDate, setKarteFromDate] = useState(defaultKarteFromDate());
  const lastSearchAuditRef = useRef<number>(0);

  const searchQuery = usePatientSearch(searchParams);
  const patients = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  useEffect(() => {
    if (!patients.length) {
      setSelectedPatientId(null);
      return;
    }
    if (selectedPatientId && patients.some((patient) => patient.patientId === selectedPatientId)) {
      return;
    }
    setSelectedPatientId(patients[0].patientId);
  }, [patients, selectedPatientId]);

  const selectedPatient = useMemo<PatientSummary | null>(() => {
    if (!selectedPatientId) {
      return null;
    }
    return patients.find((patient) => patient.patientId === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);

  const karteQuery = usePatientKarte(selectedPatient?.patientId ?? null, {
    fromDate: karteFromDate,
    enabled: Boolean(selectedPatient),
  });

  useEffect(() => {
    if (!searchParams || searchQuery.status !== 'success') {
      return;
    }
    if (lastSearchAuditRef.current === searchQuery.dataUpdatedAt) {
      return;
    }
    lastSearchAuditRef.current = searchQuery.dataUpdatedAt;
    const hitCount = searchQuery.data?.length ?? 0;
    recordOperationEvent(
      'patient',
      hitCount > 0 ? 'info' : 'warning',
      'patient_search',
      '患者検索を実行しました',
      {
        keywordLength: searchParams.keyword.length,
        mode: searchParams.mode,
        hitCount,
      },
    );
  }, [searchParams, searchQuery.status, searchQuery.dataUpdatedAt, searchQuery.data]);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }
    recordOperationEvent('patient', 'info', 'patient_select', '患者を選択しました', {
      patientId: selectedPatient.patientId,
      fullName: selectedPatient.fullName,
    });
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }
    if (karteQuery.status !== 'success') {
      return;
    }
    recordOperationEvent('chart', 'info', 'karte_fetch', 'カルテ情報を取得しました', {
      patientId: selectedPatient.patientId,
      fromDate: karteFromDate,
      hasDocuments: Boolean(karteQuery.data?.documents?.length),
    });
  }, [karteQuery.status, karteQuery.data, selectedPatient, karteFromDate]);

  const onSubmit = handleSubmit((values) => {
    setSearchParams(values);
    setFormMode('update');
  });

  const handleStartCreate = () => {
    setFormMode('create');
    setSelectedPatientId(null);
    recordOperationEvent('patient', 'info', 'patient_create_mode', '新規患者登録フォームを開きました', {});
  };

  const handleChangeFromDate = (value: string) => {
    setFromDateInput(value);
    if (!value) {
      return;
    }
    try {
      const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
      if (!year || !month || !day) {
        return;
      }
      const formatted = formatRestDate(new Date(year, month - 1, day));
      setKarteFromDate(formatted);
    } catch {
      // noop
    }
  };

  const handlePatientSaved = ({ patientId }: { patientId: string }) => {
    setFormMode('update');
    setSelectedPatientId(patientId);
    reset({ keyword: patientId, mode: 'id' });
    setSearchParams({ keyword: patientId, mode: 'id' });
  };

  return (
    <PageLayout>
      <SurfaceCard as="section" tone="muted" padding="lg" aria-labelledby="patient-search-heading">
        <Stack gap={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Stack gap={4}>
              <h1 id="patient-search-heading" style={{ margin: 0, fontSize: '1.4rem' }}>
                患者検索
              </h1>
              <SubtleText>患者情報を検索し、受付・カルテへスムーズに遷移します。</SubtleText>
            </Stack>
            <Button type="button" variant="primary" onClick={handleStartCreate}>
              新規患者を登録
            </Button>
          </div>

          <form onSubmit={onSubmit} style={{ width: '100%' }}>
            <Stack gap={16}>
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)' }}>
                <TextField
                  label="検索キーワード"
                  placeholder="患者ID または 氏名"
                  errorMessage={errors.keyword?.message}
                  {...register('keyword')}
                />
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>検索対象</span>
                  <select
                    {...register('mode')}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5F5',
                      fontSize: '0.95rem',
                      background: '#fff',
                    }}
                  >
                    {Object.entries(searchModeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.mode?.message ? (
                    <span style={{ color: '#dc2626', fontSize: '0.8rem' }} role="alert">
                      {errors.mode.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <div>
                <Button type="submit" variant="primary" isLoading={searchQuery.isFetching}>
                  検索する
                </Button>
              </div>
            </Stack>
          </form>
        </Stack>
      </SurfaceCard>

      <ResultsLayout>
        <Stack gap={24}>
          <SurfaceCard as="section" aria-labelledby="patient-result-heading">
            <Stack gap={12}>
              <SectionTitle id="patient-result-heading">検索結果</SectionTitle>
              {searchQuery.isPending ? (
                <p>患者リストを読み込み中です…</p>
              ) : patients.length === 0 ? (
                <p>{searchParams ? '該当する患者が見つかりませんでした。' : '検索条件を入力してください。'}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <thead>
                      <tr>
                        <TableHeaderCell>氏名</TableHeaderCell>
                        <TableHeaderCell>患者ID</TableHeaderCell>
                        <TableHeaderCell>性別</TableHeaderCell>
                        <TableHeaderCell>生年月日</TableHeaderCell>
                        <TableHeaderCell>最終来院</TableHeaderCell>
                        <TableHeaderCell>安全情報</TableHeaderCell>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <TableRow
                          key={patient.patientId}
                          $selected={patient.patientId === selectedPatientId}
                          onClick={() => {
                            setFormMode('update');
                            setSelectedPatientId(patient.patientId);
                          }}
                        >
                          <TableCell style={{ fontWeight: 600 }}>{patient.fullName}</TableCell>
                          <TableCell>{patient.patientId}</TableCell>
                          <TableCell>{patient.genderDesc ?? patient.gender ?? '---'}</TableCell>
                          <TableCell>{formatDisplayDate(patient.birthday)}</TableCell>
                          <TableCell>{formatDisplayDate(patient.lastVisitDate)}</TableCell>
                          <TableCell>
                            <Stack direction="row" gap={8} style={{ flexWrap: 'wrap' }}>
                              {patient.safetyNotes.map((note) => (
                                <SafetyNote key={note} tone="warning">
                                  {note}
                                </SafetyNote>
                              ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard as="section" aria-labelledby="patient-summary-heading">
            <Stack gap={12}>
              <SectionTitle id="patient-summary-heading">患者概要</SectionTitle>
              {selectedPatient ? (
                <Stack gap={8}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedPatient.fullName}</div>
                  <SubtleText>患者ID: {selectedPatient.patientId}</SubtleText>
                  <SubtleText>
                    性別: {selectedPatient.genderDesc ?? selectedPatient.gender ?? '---'} ／ 生年月日:
                    {formatDisplayDate(selectedPatient.birthday)}
                  </SubtleText>
                  <Stack direction="row" gap={8} style={{ flexWrap: 'wrap' }}>
                    {selectedPatient.safetyNotes.map((note) => (
                      <SafetyNote key={note} tone="danger">
                        {note}
                      </SafetyNote>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <SubtleText>患者を選択すると詳細情報が表示されます。</SubtleText>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard as="section" aria-labelledby="patient-editor-heading">
            <Stack gap={16}>
              <SectionTitle id="patient-editor-heading">患者情報編集</SectionTitle>
              <PatientEditorPanel
                mode={formMode}
                patientId={formMode === 'update' ? selectedPatient?.patientId ?? null : null}
                summary={selectedPatient}
                layout="page"
                onModeChange={(nextMode) => {
                  setFormMode(nextMode);
                  if (nextMode === 'create') {
                    setSelectedPatientId(null);
                    recordOperationEvent('patient', 'info', 'patient_create_mode', '新規患者登録フォームを開きました', {});
                  }
                }}
                onSaved={({ patientId }) => handlePatientSaved({ patientId })}
                showCollapseToggle={false}
              />
            </Stack>
          </SurfaceCard>
        </Stack>

        <SurfaceCard as="section" aria-labelledby="patient-history-heading">
          <Stack gap={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <SectionTitle id="patient-history-heading">カルテ履歴</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TextField
                  type="date"
                  label="取得開始日"
                  value={fromDateInput}
                  onChange={(event) => handleChangeFromDate(event.currentTarget.value)}
                />
                <Button type="button" variant="secondary" onClick={() => karteQuery.refetch()} disabled={!selectedPatient}>
                  再取得
                </Button>
              </div>
            </div>
            {selectedPatient ? (
              karteQuery.isPending ? (
                <p>カルテ履歴を取得中です…</p>
              ) : karteQuery.data?.documents?.length ? (
                <Stack gap={12}>
                  {karteQuery.data.documents.map((doc) => (
                    <div
                      key={doc.docPk}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0.9rem 1rem',
                        background: doc.hasMark ? 'rgba(254, 226, 226, 0.5)' : '#fff',
                      }}
                    >
                      <Stack gap={4}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <strong>{doc.title}</strong>
                          {doc.hasMark ? <StatusBadge tone="danger">注意</StatusBadge> : null}
                        </div>
                        <SubtleText>
                          確定日: {formatDisplayDate(doc.confirmDate)} ／ 診療科: {doc.departmentDesc ?? '---'} ／ ステータス: {doc.status ?? '---'}
                        </SubtleText>
                      </Stack>
                    </div>
                  ))}
                </Stack>
              ) : (
                <SubtleText>対象期間のカルテ履歴がありません。</SubtleText>
              )
            ) : (
              <SubtleText>患者を選択するとカルテ履歴が表示されます。</SubtleText>
            )}
          </Stack>
        </SurfaceCard>
      </ResultsLayout>
    </PageLayout>
  );
};
