import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { usePatientSearch } from '@/features/patients/hooks/usePatientSearch';
import type { PatientSearchMode, PatientSummary } from '@/features/patients/types/patient';
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

const Highlight = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
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
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { keyword: '', mode: 'name' },
  });

  const [searchParams, setSearchParams] = useState<SearchFormValues | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
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
    if (karteQuery.status !== 'success' || !selectedPatient) {
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
  });

  const handleFromDateChange = (value: string) => {
    setFromDateInput(value);
    if (!value) {
      const fallback = defaultKarteFromDate();
      setKarteFromDate(fallback);
      return;
    }
    const nextDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nextDate.getTime())) {
      return;
    }
    setKarteFromDate(formatRestDate(nextDate));
  };

  return (
    <PageLayout>
      <SurfaceCard as="section" aria-labelledby="patient-search-heading">
        <Stack gap={16}>
          <header>
            <SectionTitle id="patient-search-heading">患者検索</SectionTitle>
            <p style={{ margin: '4px 0 0', color: '#475569' }}>
              氏名・カナ・患者IDなどで検索し、安全情報を即座に確認できます。
            </p>
          </header>
          <form onSubmit={onSubmit}>
            <Stack direction="row" gap={16} align="end" wrap>
              <div style={{ flex: '1 1 240px' }}>
                <TextField
                  label="キーワード"
                  placeholder="氏名や患者IDを入力"
                  errorMessage={errors.keyword?.message}
                  {...register('keyword')}
                />
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '160px' }}>
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
              </label>
              <Button type="submit" isLoading={searchQuery.isFetching}>
                検索
              </Button>
            </Stack>
          </form>
          {searchQuery.isError ? (
            <div role="alert" style={{ color: '#dc2626', fontSize: '0.9rem' }}>
              患者検索中にエラーが発生しました。後ほど再試行してください。
            </div>
          ) : null}
        </Stack>
      </SurfaceCard>

      <ResultsLayout>
        <SurfaceCard as="section" aria-labelledby="patient-result-heading">
          <Stack gap={12}>
            <SectionTitle id="patient-result-heading">検索結果</SectionTitle>
            {searchQuery.isLoading ? (
              <p>患者リストを読み込み中です…</p>
            ) : patients.length === 0 ? (
              <p>{searchParams ? '該当する患者が見つかりませんでした。' : '検索条件を入力してください。'}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <thead>
                    <tr>
                      <TableHeaderCell>患者ID</TableHeaderCell>
                      <TableHeaderCell>氏名</TableHeaderCell>
                      <TableHeaderCell>カナ</TableHeaderCell>
                      <TableHeaderCell>生年月日</TableHeaderCell>
                      <TableHeaderCell>性別</TableHeaderCell>
                      <TableHeaderCell>最終受診日</TableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        $selected={patient.patientId === selectedPatientId}
                        onClick={() => setSelectedPatientId(patient.patientId)}
                      >
                        <TableCell>{patient.patientId}</TableCell>
                        <TableCell>
                          <Highlight>{patient.fullName}</Highlight>
                        </TableCell>
                        <TableCell>{patient.kanaName ?? '---'}</TableCell>
                        <TableCell>{patient.birthday ?? '---'}</TableCell>
                        <TableCell>{patient.genderDesc ?? patient.gender ?? '---'}</TableCell>
                        <TableCell>{patient.lastVisitDate ?? '---'}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Stack>
        </SurfaceCard>

        <Stack gap={24}>
          <SurfaceCard as="section" aria-labelledby="patient-detail-heading">
            <Stack gap={16}>
              <SectionTitle id="patient-detail-heading">患者概要</SectionTitle>
              {selectedPatient ? (
                <Stack gap={12}>
                  <div>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{selectedPatient.fullName}</p>
                    <SubtleText>
                      ID: {selectedPatient.patientId} / 生年月日: {selectedPatient.birthday ?? '---'} / 性別:{' '}
                      {selectedPatient.genderDesc ?? selectedPatient.gender ?? '---'}
                    </SubtleText>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>安全情報</h3>
                    {selectedPatient.safetyNotes.length > 0 ? (
                      <Stack direction="row" gap={8} wrap>
                        {selectedPatient.safetyNotes.map((note) => (
                          <SafetyNote key={note} tone="warning">
                            {note}
                          </SafetyNote>
                        ))}
                      </Stack>
                    ) : (
                      <SubtleText>特記事項は登録されていません。</SubtleText>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>アレルギー</h3>
                    {karteQuery.isLoading ? (
                      <SubtleText>読み込み中…</SubtleText>
                    ) : karteQuery.data?.allergies?.length ? (
                      <ul style={{ margin: 0, paddingInlineStart: '1.2rem', color: '#1e293b' }}>
                        {karteQuery.data.allergies.map((allergy) => (
                          <li key={`${allergy.factor}-${allergy.identifiedDate ?? ''}`}>
                            <strong>{allergy.factor}</strong>
                            {allergy.severity ? ` / 重症度: ${allergy.severity}` : ''}
                            {allergy.identifiedDate ? ` / 登録日: ${allergy.identifiedDate}` : ''}
                            {allergy.memo ? ` / メモ: ${allergy.memo}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <SubtleText>アレルギー情報は登録されていません。</SubtleText>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>患者メモ</h3>
                    {karteQuery.isLoading ? (
                      <SubtleText>読み込み中…</SubtleText>
                    ) : karteQuery.data?.memos?.length ? (
                      <ul style={{ margin: 0, paddingInlineStart: '1.2rem', color: '#1e293b' }}>
                        {karteQuery.data.memos.map((memo) => (
                          <li key={memo.id}>
                            {memo.memo ?? 'メモ内容なし'}
                            {memo.confirmed ? <SubtleText> （{formatDisplayDate(memo.confirmed)}）</SubtleText> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <SubtleText>患者メモは登録されていません。</SubtleText>
                    )}
                  </div>
                </Stack>
              ) : (
                <SubtleText>患者を選択すると詳細情報が表示されます。</SubtleText>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard as="section" aria-labelledby="karte-history-heading">
            <Stack gap={16}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <SectionTitle id="karte-history-heading">カルテ履歴</SectionTitle>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>取得開始日</span>
                  <input
                    type="date"
                    value={fromDateInput}
                    onChange={(event) => handleFromDateChange(event.target.value)}
                    style={{
                      padding: '0.5rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5F5',
                    }}
                  />
                </label>
              </div>
              {selectedPatient ? (
                karteQuery.isLoading ? (
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
                            確定日: {formatDisplayDate(doc.confirmDate)} / 診療科: {doc.departmentDesc ?? '---'} / ステータス:{' '}
                            {doc.status ?? '---'}
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
        </Stack>
      </ResultsLayout>
    </PageLayout>
  );
};
