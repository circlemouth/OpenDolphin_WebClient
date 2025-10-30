import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { usePatientDetail } from '@/features/patients/hooks/usePatientDetail';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { usePatientSearch } from '@/features/patients/hooks/usePatientSearch';
import { usePatientUpsert, type PatientUpsertMode } from '@/features/patients/hooks/usePatientUpsert';
import type { PatientSearchMode, PatientSummary, PatientUpsertPayload } from '@/features/patients/types/patient';
import { defaultKarteFromDate, formatRestDate } from '@/features/patients/utils/rest-date';
import { recordOperationEvent } from '@/libs/audit';
import {
  decodeHealthInsuranceBean,
  encodeHealthInsuranceBean,
  parseHealthInsuranceBean,
  type BeanParseResult,
  type BeanPropertyValue,
} from '@/features/charts/utils/health-insurance';

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

const FieldGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const InsuranceCard = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
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

const genderOptions = [
  { value: 'M', label: '男性' },
  { value: 'F', label: '女性' },
  { value: 'U', label: '不明' },
  { value: 'O', label: 'その他' },
] as const;

const defaultInsuranceOrder = [
  'GUID',
  'insuranceClass',
  'insuranceClassCode',
  'insuranceNumber',
  'clientGroup',
  'clientNumber',
  'startDate',
  'expiredDate',
] as const;

const insuranceSchema = z.object({
  id: z.number().optional(),
  guid: z.string().optional(),
  className: z.string().optional(),
  classCode: z.string().optional(),
  insuranceNumber: z.string().optional(),
  clientGroup: z.string().optional(),
  clientNumber: z.string().optional(),
  startDate: z.string().optional(),
  expiredDate: z.string().optional(),
});

const patientEditorSchema = z.object({
  id: z.number().optional(),
  patientId: z.string().min(1, '患者IDを入力してください'),
  fullName: z.string().min(1, '氏名を入力してください'),
  kanaName: z.string().optional(),
  gender: z.enum(['M', 'F', 'U', 'O']).default('U'),
  birthday: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'YYYY-MM-DD 形式で入力してください',
    }),
  telephone: z.string().optional(),
  mobilePhone: z.string().optional(),
  email: z.string().optional(),
  memo: z.string().optional(),
  appMemo: z.string().optional(),
  relations: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  reserve1: z.string().optional(),
  reserve2: z.string().optional(),
  reserve3: z.string().optional(),
  reserve4: z.string().optional(),
  reserve5: z.string().optional(),
  reserve6: z.string().optional(),
  healthInsurances: z.array(insuranceSchema),
});

type PatientEditorFormValues = z.infer<typeof patientEditorSchema>;

const defaultPatientEditorValues: PatientEditorFormValues = {
  patientId: '',
  fullName: '',
  kanaName: '',
  gender: 'U',
  birthday: '',
  telephone: '',
  mobilePhone: '',
  email: '',
  memo: '',
  appMemo: '',
  relations: '',
  zipCode: '',
  address: '',
  reserve1: '',
  reserve2: '',
  reserve3: '',
  reserve4: '',
  reserve5: '',
  reserve6: '',
  healthInsurances: [],
};

const defaultFromDateInput = '2000-01-01';

type InsuranceMeta = {
  properties: Record<string, BeanPropertyValue>;
  order: string[];
};

const createEmptyInsuranceMeta = (): InsuranceMeta => {
  const properties: Record<string, BeanPropertyValue> = {};
  for (const key of defaultInsuranceOrder) {
    properties[key] = { type: 'string', value: '' };
  }
  return { properties, order: [...defaultInsuranceOrder] };
};

const toOptionalString = (value?: string) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

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
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
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

  const {
    control: patientControl,
    register: registerPatient,
    handleSubmit: handlePatientSubmit,
    reset: resetPatientForm,
    formState: { errors: patientErrors },
    watch: watchPatient,
  } = useForm<PatientEditorFormValues>({
    resolver: zodResolver(patientEditorSchema),
    defaultValues: defaultPatientEditorValues,
  });

  const { fields: insuranceFields, append: appendInsurance, remove: removeInsurance } = useFieldArray({
    control: patientControl,
    name: 'healthInsurances',
  });

  const insuranceMetaRef = useRef<Record<string, InsuranceMeta>>({});
  const pendingInsuranceMetaRef = useRef<BeanParseResult[]>([]);

  const [formMode, setFormMode] = useState<PatientUpsertMode>('update');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const patientUpsert = usePatientUpsert();

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

  const detailQuery = usePatientDetail(formMode === 'update' ? selectedPatient?.patientId ?? null : null, {
    enabled: formMode === 'update' && Boolean(selectedPatient),
  });

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
    if (formMode !== 'update') {
      return;
    }
    if (detailQuery.status !== 'success') {
      return;
    }
    const detail = detailQuery.data;
    if (!detail) {
      resetPatientForm(defaultPatientEditorValues);
      insuranceMetaRef.current = {};
      pendingInsuranceMetaRef.current = [];
      return;
    }

    pendingInsuranceMetaRef.current = [];
    const nextInsurances = detail.healthInsurances.map((entry) => {
      const decoded = decodeHealthInsuranceBean(entry.beanBytes);
      pendingInsuranceMetaRef.current.push(decoded);
      const parsed = parseHealthInsuranceBean(entry.beanBytes);
      return {
        id: entry.id,
        guid: parsed?.guid ?? '',
        className: parsed?.className ?? '',
        classCode: parsed?.classCode ?? '',
        insuranceNumber: parsed?.number ?? '',
        clientGroup: parsed?.clientGroup ?? '',
        clientNumber: parsed?.clientNumber ?? '',
        startDate: parsed?.startDate ?? '',
        expiredDate: parsed?.expiredDate ?? '',
      } satisfies PatientEditorFormValues['healthInsurances'][number];
    });

    resetPatientForm({
      id: detail.id,
      patientId: detail.patientId,
      fullName: detail.fullName,
      kanaName: detail.kanaName ?? '',
      gender: detail.gender ?? 'U',
      birthday: detail.birthday ?? '',
      telephone: detail.telephone ?? '',
      mobilePhone: detail.mobilePhone ?? '',
      email: detail.email ?? '',
      memo: detail.memo ?? '',
      appMemo: detail.appMemo ?? '',
      relations: detail.relations ?? '',
      zipCode: detail.address?.zipCode ?? '',
      address: detail.address?.address ?? '',
      reserve1: detail.reserve1 ?? '',
      reserve2: detail.reserve2 ?? '',
      reserve3: detail.reserve3 ?? '',
      reserve4: detail.reserve4 ?? '',
      reserve5: detail.reserve5 ?? '',
      reserve6: detail.reserve6 ?? '',
      healthInsurances: nextInsurances,
    });
    insuranceMetaRef.current = {};
    setSaveStatus('idle');
    setSaveError(null);
  }, [detailQuery.status, detailQuery.data, formMode, resetPatientForm]);

  useEffect(() => {
    if (pendingInsuranceMetaRef.current.length > 0) {
      const pending = [...pendingInsuranceMetaRef.current];
      pendingInsuranceMetaRef.current = [];
      insuranceFields.forEach((field, index) => {
        if (insuranceMetaRef.current[field.id]) {
          return;
        }
        const source = pending[index];
        if (source) {
          insuranceMetaRef.current[field.id] = {
            properties: { ...source.properties },
            order: [...source.order],
          } satisfies InsuranceMeta;
        }
      });
    }

    const existingIds = new Set(insuranceFields.map((field) => field.id));
    Object.keys(insuranceMetaRef.current).forEach((key) => {
      if (!existingIds.has(key)) {
        delete insuranceMetaRef.current[key];
      }
    });

    for (const field of insuranceFields) {
      if (!insuranceMetaRef.current[field.id]) {
        insuranceMetaRef.current[field.id] = createEmptyInsuranceMeta();
      }
    }
  }, [insuranceFields]);

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

  const onSubmit = handleSearchSubmit((values) => {
    setSearchParams(values);
  });

  const insuranceValues = watchPatient('healthInsurances');

  const handleStartCreate = () => {
    setFormMode('create');
    setSelectedPatientId(null);
    pendingInsuranceMetaRef.current = [];
    insuranceMetaRef.current = {};
    resetPatientForm(defaultPatientEditorValues);
    setSaveStatus('idle');
    setSaveError(null);
    recordOperationEvent('patient', 'info', 'patient_create_mode', '新規患者登録フォームを開きました', {});
  };

  const handleAddInsurance = () => {
    appendInsurance({
      id: undefined,
      guid: '',
      className: '',
      classCode: '',
      insuranceNumber: '',
      clientGroup: '',
      clientNumber: '',
      startDate: '',
      expiredDate: '',
    });
    setSaveStatus('idle');
    recordOperationEvent('patient', 'info', 'patient_insurance_add', '保険情報の入力欄を追加しました', {});
  };

  const handleRemoveInsurance = (index: number) => {
    const field = insuranceFields[index];
    if (!field) {
      return;
    }
    removeInsurance(index);
    delete insuranceMetaRef.current[field.id];
    setSaveStatus('idle');
    recordOperationEvent('patient', 'info', 'patient_insurance_remove', '保険情報の入力欄を削除しました', { index });
  };

  const submitPatient = handlePatientSubmit(async (values) => {
    const trimmedId = values.patientId.trim();
    const trimmedName = values.fullName.trim();
    if (!trimmedId || !trimmedName) {
      setSaveStatus('error');
      setSaveError('患者IDと氏名を入力してください');
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const insuranceList = insuranceFields.map((field, index) => {
        const entry = values.healthInsurances[index];
        const meta = insuranceMetaRef.current[field.id] ?? createEmptyInsuranceMeta();
        const applyString = (key: string, value?: string) => {
          const trimmed = value?.trim() ?? '';
          meta.properties[key] = { type: 'string', value: trimmed };
          if (!meta.order.includes(key)) {
            meta.order.push(key);
          }
        };

        applyString('GUID', entry?.guid);
        applyString('insuranceClass', entry?.className);
        applyString('insuranceClassCode', entry?.classCode);
        applyString('insuranceNumber', entry?.insuranceNumber);
        applyString('clientGroup', entry?.clientGroup);
        applyString('clientNumber', entry?.clientNumber);
        applyString('startDate', entry?.startDate);
        applyString('expiredDate', entry?.expiredDate);

        insuranceMetaRef.current[field.id] = meta;

        return {
          id: entry?.id,
          beanBytes: encodeHealthInsuranceBean(meta.properties, meta.order),
        };
      });

      const address =
        toOptionalString(values.zipCode) || toOptionalString(values.address)
          ? {
              zipCode: toOptionalString(values.zipCode),
              address: toOptionalString(values.address),
            }
          : null;

      const mode: PatientUpsertMode = formMode === 'create' ? 'create' : 'update';

      const payload: PatientUpsertPayload = {
        id: values.id ?? detailQuery.data?.id,
        patientId: trimmedId,
        fullName: trimmedName,
        kanaName: toOptionalString(values.kanaName),
        gender: values.gender ?? 'U',
        birthday: toOptionalString(values.birthday),
        memo: toOptionalString(values.memo),
        appMemo: toOptionalString(values.appMemo),
        relations: toOptionalString(values.relations),
        telephone: toOptionalString(values.telephone),
        mobilePhone: toOptionalString(values.mobilePhone),
        email: toOptionalString(values.email),
        reserve1: toOptionalString(values.reserve1),
        reserve2: toOptionalString(values.reserve2),
        reserve3: toOptionalString(values.reserve3),
        reserve4: toOptionalString(values.reserve4),
        reserve5: toOptionalString(values.reserve5),
        reserve6: toOptionalString(values.reserve6),
        address,
        healthInsurances: insuranceList,
      };

      const result = await patientUpsert.mutateAsync({ mode, payload });
      setSaveStatus('success');
      recordOperationEvent(
        'patient',
        'info',
        mode === 'create' ? 'patient_create' : 'patient_update',
        mode === 'create' ? '患者を新規登録しました' : '患者情報を更新しました',
        {
          patientId: trimmedId,
          response: result,
        },
      );

      if (mode === 'create') {
        setSelectedPatientId(trimmedId);
        setFormMode('update');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存に失敗しました';
      setSaveStatus('error');
      setSaveError(message);
      recordOperationEvent('patient', 'error', 'patient_upsert_failed', '患者情報の登録/更新に失敗しました', {
        patientId: values.patientId,
        mode: formMode,
        message,
      });
    }
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
          <header
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <SectionTitle id="patient-search-heading">患者検索</SectionTitle>
              <p style={{ margin: '4px 0 0', color: '#475569' }}>
                氏名・カナ・患者IDなどで検索し、安全情報を即座に確認できます。
              </p>
            </div>
            <Button type="button" onClick={handleStartCreate} variant="secondary">
              新規患者登録
            </Button>
          </header>
          <form onSubmit={onSubmit}>
            <Stack direction="row" gap={16} align="end" wrap>
              <div style={{ flex: '1 1 240px' }}>
                <TextField
                  label="キーワード"
                  placeholder="氏名や患者IDを入力"
                  errorMessage={searchErrors.keyword?.message}
                  {...registerSearch('keyword')}
                />
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '160px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>検索対象</span>
                <select
                  {...registerSearch('mode')}
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
                        onClick={() => {
                          setSelectedPatientId(patient.patientId);
                          setFormMode('update');
                          pendingInsuranceMetaRef.current = [];
                          setSaveStatus('idle');
                          setSaveError(null);
                        }}
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

          <SurfaceCard as="section" aria-labelledby="patient-editor-heading">
            <Stack gap={16}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <SectionTitle id="patient-editor-heading">患者情報編集</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge tone={formMode === 'create' ? 'warning' : 'info'}>
                    {formMode === 'create' ? '新規登録モード' : '既存患者編集'}
                  </StatusBadge>
                  {formMode === 'create' && selectedPatient ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormMode('update')}>
                      選択患者に戻る
                    </Button>
                  ) : null}
                </div>
              </div>

              {formMode === 'update' && !selectedPatient ? (
                <SubtleText>患者を選択すると編集フォームが表示されます。</SubtleText>
              ) : formMode === 'update' && detailQuery.isLoading ? (
                <SubtleText>患者情報を読み込み中です…</SubtleText>
              ) : (
                <form onSubmit={submitPatient}>
                  <Stack gap={20}>
                    <FieldGrid>
                      <TextField
                        label="患者ID"
                        placeholder="000001"
                        errorMessage={patientErrors.patientId?.message}
                        {...registerPatient('patientId')}
                      />
                      <TextField
                        label="氏名"
                        placeholder="山田 太郎"
                        errorMessage={patientErrors.fullName?.message}
                        {...registerPatient('fullName')}
                      />
                      <TextField
                        label="カナ氏名"
                        placeholder="ヤマダ タロウ"
                        errorMessage={patientErrors.kanaName?.message}
                        {...registerPatient('kanaName')}
                      />
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>性別</span>
                        <select
                          {...registerPatient('gender')}
                          style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5F5',
                            fontSize: '0.95rem',
                            background: '#fff',
                          }}
                        >
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {patientErrors.gender?.message ? (
                          <span style={{ color: '#dc2626', fontSize: '0.8rem' }} role="alert">
                            {patientErrors.gender.message}
                          </span>
                        ) : null}
                      </label>
                      <TextField
                        type="date"
                        label="生年月日"
                        errorMessage={patientErrors.birthday?.message}
                        {...registerPatient('birthday')}
                      />
                    </FieldGrid>

                    <FieldGrid>
                      <TextField
                        label="電話番号"
                        placeholder="03-1234-5678"
                        errorMessage={patientErrors.telephone?.message}
                        {...registerPatient('telephone')}
                      />
                      <TextField
                        label="携帯番号"
                        placeholder="090-1234-5678"
                        errorMessage={patientErrors.mobilePhone?.message}
                        {...registerPatient('mobilePhone')}
                      />
                      <TextField
                        label="メールアドレス"
                        type="email"
                        placeholder="user@example.com"
                        errorMessage={patientErrors.email?.message}
                        {...registerPatient('email')}
                      />
                      <TextField
                        label="郵便番号"
                        placeholder="100-0001"
                        errorMessage={patientErrors.zipCode?.message}
                        {...registerPatient('zipCode')}
                      />
                      <TextField
                        label="住所"
                        placeholder="東京都千代田区"
                        errorMessage={patientErrors.address?.message}
                        {...registerPatient('address')}
                      />
                    </FieldGrid>

                    <FieldGrid>
                      <TextField label="予備情報1" {...registerPatient('reserve1')} />
                      <TextField label="予備情報2" {...registerPatient('reserve2')} />
                      <TextField label="予備情報3" {...registerPatient('reserve3')} />
                      <TextField label="予備情報4" {...registerPatient('reserve4')} />
                      <TextField label="予備情報5" {...registerPatient('reserve5')} />
                      <TextField label="予備情報6" {...registerPatient('reserve6')} />
                    </FieldGrid>

                    <TextArea
                      label="患者メモ"
                      placeholder="患者共有メモを入力"
                      errorMessage={patientErrors.memo?.message}
                      {...registerPatient('memo')}
                    />
                    <TextArea
                      label="安全情報 (アプリメモ)"
                      placeholder="アレルギーや注意事項を入力"
                      errorMessage={patientErrors.appMemo?.message}
                      {...registerPatient('appMemo')}
                    />
                    <TextArea
                      label="家族・関係者情報"
                      placeholder="緊急連絡先など"
                      errorMessage={patientErrors.relations?.message}
                      {...registerPatient('relations')}
                    />

                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>健康保険情報</h3>
                      {insuranceFields.length === 0 ? (
                        <SubtleText>保険情報は登録されていません。必要に応じて追加してください。</SubtleText>
                      ) : (
                        <Stack gap={12}>
                          {insuranceFields.map((field, index) => {
                            const insuranceError = patientErrors.healthInsurances?.[index];
                            const insuranceValue = insuranceValues?.[index];
                            return (
                              <InsuranceCard key={field.id}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                  }}
                                >
                                  <div>
                                    <strong>保険 {index + 1}</strong>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                                      {insuranceValue?.className || '保険名称未入力'}
                                      {insuranceValue?.insuranceNumber
                                        ? ` / 保険者番号: ${insuranceValue.insuranceNumber}`
                                        : ''}
                                      {insuranceValue?.clientGroup || insuranceValue?.clientNumber
                                        ? ` / 記号番号: ${(insuranceValue?.clientGroup ?? '')}${
                                            insuranceValue?.clientNumber ?? ''
                                          }`
                                        : ''}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveInsurance(index)}
                                  >
                                    削除
                                  </Button>
                                </div>
                                <FieldGrid>
                                  <TextField
                                    label="GUID"
                                    errorMessage={insuranceError?.guid?.message}
                                    {...registerPatient(`healthInsurances.${index}.guid` as const)}
                                  />
                                  <TextField
                                    label="保険名称"
                                    errorMessage={insuranceError?.className?.message}
                                    {...registerPatient(`healthInsurances.${index}.className` as const)}
                                  />
                                  <TextField
                                    label="保険区分コード"
                                    errorMessage={insuranceError?.classCode?.message}
                                    {...registerPatient(`healthInsurances.${index}.classCode` as const)}
                                  />
                                  <TextField
                                    label="保険者番号"
                                    errorMessage={insuranceError?.insuranceNumber?.message}
                                    {...registerPatient(`healthInsurances.${index}.insuranceNumber` as const)}
                                  />
                                  <TextField
                                    label="記号"
                                    errorMessage={insuranceError?.clientGroup?.message}
                                    {...registerPatient(`healthInsurances.${index}.clientGroup` as const)}
                                  />
                                  <TextField
                                    label="番号"
                                    errorMessage={insuranceError?.clientNumber?.message}
                                    {...registerPatient(`healthInsurances.${index}.clientNumber` as const)}
                                  />
                                  <TextField
                                    type="date"
                                    label="開始日"
                                    errorMessage={insuranceError?.startDate?.message}
                                    {...registerPatient(`healthInsurances.${index}.startDate` as const)}
                                  />
                                  <TextField
                                    type="date"
                                    label="期限"
                                    errorMessage={insuranceError?.expiredDate?.message}
                                    {...registerPatient(`healthInsurances.${index}.expiredDate` as const)}
                                  />
                                </FieldGrid>
                              </InsuranceCard>
                            );
                          })}
                        </Stack>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddInsurance}
                        style={{ marginTop: '12px' }}
                      >
                        保険情報を追加
                      </Button>
                    </div>

                    <Stack direction="row" gap={12} align="center" wrap>
                      <Button
                        type="submit"
                        isLoading={saveStatus === 'saving' || patientUpsert.isPending}
                        disabled={formMode === 'update' && !selectedPatient}
                      >
                        {formMode === 'create' ? '患者を登録' : '患者情報を保存'}
                      </Button>
                      {formMode === 'update' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => detailQuery.refetch()}
                          disabled={detailQuery.isLoading}
                        >
                          最新情報を再取得
                        </Button>
                      ) : null}
                      {saveStatus === 'success' ? <StatusBadge tone="success">保存しました</StatusBadge> : null}
                      {saveStatus === 'error' ? (
                        <StatusBadge tone="danger">{saveError ?? '保存に失敗しました'}</StatusBadge>
                      ) : null}
                    </Stack>
                  </Stack>
                </form>
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
