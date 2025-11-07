import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { usePatientDetail } from '@/features/patients/hooks/usePatientDetail';
import { usePatientUpsert, type PatientUpsertMode } from '@/features/patients/hooks/usePatientUpsert';
import type {
  PatientDetail,
  PatientSummary,
  PatientUpsertPayload,
} from '@/features/patients/types/patient';
import { recordOperationEvent } from '@/libs/audit';
import {
  decodeHealthInsuranceBean,
  encodeHealthInsuranceBean,
  parseHealthInsuranceBean,
  type BeanParseResult,
  type BeanPropertyValue,
} from '@/features/charts/utils/health-insurance';
import { fetchPatientById } from '@/features/patients/api/patient-api';
import {
  defaultInsuranceOrder,
  defaultPatientEditorValues,
  genderOptions,
  mapDetailToFormValues,
  patientEditorSchema,
  type PatientEditorFormInput,
  type PatientEditorFormValues,
} from './patient-editor.schema';

type PatientEditorLayout = 'page' | 'sidebar';

const PanelContainer = styled.div<{ $layout: PatientEditorLayout }>`
  display: grid;
  gap: ${({ $layout }) => ($layout === 'sidebar' ? '12px' : '16px')};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const SubtleText = styled.span`
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
`;

const ToggleEditorButton = styled.button`
  border: none;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceStrong};
  }
`;

const FieldGrid = styled.div<{ $layout: PatientEditorLayout }>`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(${({ $layout }) => ($layout === 'sidebar' ? 200 : 220)}px, 1fr));
`;

const InsuranceCard = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 16px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  display: grid;
  gap: 12px;
`;

const InsuranceGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const FeedbackMessage = styled.div<{ $tone: 'success' | 'error' | 'info' }>`
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${({ theme, $tone }) => {
    if ($tone === 'success') {
      return theme.palette.surfaceMuted;
    }
    if ($tone === 'error') {
      return theme.palette.dangerSubtle;
    }
    return theme.palette.surfaceMuted;
  }};
  color: ${({ theme, $tone }) => {
    if ($tone === 'success') {
      return theme.palette.success;
    }
    if ($tone === 'error') {
      return theme.palette.danger;
    }
    return theme.palette.text;
  }};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  accent-color: ${({ theme }) => theme.palette.primary};
`;

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

const toOptionalString = (value?: string | null) => {
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

interface PatientEditorPanelProps {
  mode: PatientUpsertMode;
  patientId: string | null;
  summary: PatientSummary | null;
  layout?: PatientEditorLayout;
  onModeChange?: (mode: PatientUpsertMode) => void;
  onSaved?: (result: { patientId: string; detail: PatientDetail | null; mode: PatientUpsertMode }) => void;
  readOnlySections?: Partial<Record<'basic' | 'contact' | 'notes' | 'insurance', boolean>>;
  showCollapseToggle?: boolean;
  autoCreateReceptionEnabled?: boolean;
  onToggleAutoCreateReception?: (enabled: boolean) => void;
  onCreateReceptionRequested?: (detail: PatientDetail) => Promise<void>;
}

export const PatientEditorPanel = ({
  mode,
  patientId,
  summary,
  layout = 'page',
  onModeChange,
  onSaved,
  readOnlySections,
  showCollapseToggle = true,
  autoCreateReceptionEnabled,
  onToggleAutoCreateReception,
  onCreateReceptionRequested,
}: PatientEditorPanelProps) => {
  const patientUpsert = usePatientUpsert();
  const detailQuery = usePatientDetail(mode === 'update' ? patientId ?? null : null, {
    enabled: mode === 'update' && Boolean(patientId),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientEditorFormInput, undefined, PatientEditorFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(patientEditorSchema),
    defaultValues: defaultPatientEditorValues,
  });

  const { fields: insuranceFields, append, remove } = useFieldArray({
    control,
    name: 'healthInsurances',
  });

  const insuranceMetaRef = useRef<Record<string, InsuranceMeta>>({});
  const pendingInsuranceMetaRef = useRef<BeanParseResult[]>([]);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(mode === 'create');

  useEffect(() => {
    if (mode === 'create') {
      reset(defaultPatientEditorValues);
      insuranceMetaRef.current = {};
      pendingInsuranceMetaRef.current = [];
      setFeedback(null);
    }
  }, [mode, reset]);

  useEffect(() => {
    if (mode !== 'update') {
      return;
    }
    if (detailQuery.status !== 'success') {
      return;
    }
    const detail = detailQuery.data;
    if (!detail) {
      reset(defaultPatientEditorValues);
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

    reset(mapDetailToFormValues(detail, nextInsurances));
    insuranceMetaRef.current = {};
    pendingInsuranceMetaRef.current = [];
    setFeedback(null);
  }, [mode, detailQuery.status, detailQuery.data, reset]);

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

    const existingIds: Set<string> = new Set(insuranceFields.map((field) => field.id));
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
    if (!summary) {
      return;
    }
    recordOperationEvent('patient', 'info', 'patient_select', '患者を選択しました', {
      patientId: summary.patientId,
      fullName: summary.fullName,
    });
  }, [summary]);

  const handleAddInsurance = () => {
    append({
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
    setFeedback(null);
    recordOperationEvent('patient', 'info', 'patient_insurance_add', '保険情報の入力欄を追加しました', {});
  };

  const handleRemoveInsurance = (index: number) => {
    const field = insuranceFields[index];
    if (!field) {
      return;
    }
    remove(index);
    delete insuranceMetaRef.current[field.id];
    setFeedback(null);
    recordOperationEvent('patient', 'info', 'patient_insurance_remove', '保険情報の入力欄を削除しました', { index });
  };

  const buildUpsertPayload = useCallback(
    (values: PatientEditorFormValues): PatientUpsertPayload => {
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

        return {
          id: entry?.id,
          beanBytes: encodeHealthInsuranceBean(meta.properties, meta.order),
        };
      });

      return {
        id: values.id,
        patientId: values.patientId.trim(),
        fullName: values.fullName.trim(),
        kanaName: toOptionalString(values.kanaName),
        gender: values.gender,
        genderDesc: undefined,
        birthday: toOptionalString(values.birthday),
        telephone: toOptionalString(values.telephone),
        mobilePhone: toOptionalString(values.mobilePhone),
        email: toOptionalString(values.email),
        memo: toOptionalString(values.memo),
        appMemo: toOptionalString(values.appMemo),
        relations: toOptionalString(values.relations),
        address: {
          zipCode: toOptionalString(values.zipCode),
          address: toOptionalString(values.address),
        },
        reserve1: toOptionalString(values.reserve1),
        reserve2: toOptionalString(values.reserve2),
        reserve3: toOptionalString(values.reserve3),
        reserve4: toOptionalString(values.reserve4),
        reserve5: toOptionalString(values.reserve5),
        reserve6: toOptionalString(values.reserve6),
        healthInsurances: insuranceList,
      } satisfies PatientUpsertPayload;
    },
    [insuranceFields],
  );

  const handleSave = handleSubmit(async (values) => {
    const trimmedId = values.patientId.trim();
    const trimmedName = values.fullName.trim();
    if (!trimmedId || !trimmedName) {
      setFeedback({ tone: 'error', message: '患者IDと氏名を入力してください。' });
      return;
    }

    setFeedback({ tone: 'info', message: mode === 'create' ? '患者情報を登録しています…' : '患者情報を更新しています…' });
    try {
      const payload = buildUpsertPayload(values);
      const resultId = await patientUpsert.mutateAsync({ mode, payload });
      const normalizedId = resultId?.trim() || payload.patientId;
      recordOperationEvent('patient', 'info', mode === 'create' ? 'patient_create' : 'patient_update', mode === 'create' ? '患者を登録しました' : '患者情報を更新しました', {
        patientId: normalizedId,
        hasInsurance: payload.healthInsurances.length > 0,
      });

      let detail: PatientDetail | null = null;
      try {
        detail = await fetchPatientById(normalizedId);
      } catch (error) {
        console.warn('患者詳細の再取得に失敗しました', error);
      }

      if (detail) {
        const nextInsurances = detail.healthInsurances.map((entry) => {
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

        reset(mapDetailToFormValues(detail, nextInsurances));
        insuranceMetaRef.current = {};
        pendingInsuranceMetaRef.current = [];
      }

      setFeedback({ tone: 'success', message: '患者情報を保存しました。' });

      if (mode === 'create' && onModeChange) {
        onModeChange('update');
      }

      if (onSaved) {
        onSaved({ patientId: normalizedId, detail: detail ?? null, mode });
      }

      if (mode === 'create' && autoCreateReceptionEnabled && onCreateReceptionRequested && detail) {
        try {
          await onCreateReceptionRequested(detail);
        } catch (error) {
          setFeedback({ tone: 'error', message: error instanceof Error ? error.message : '受付登録に失敗しました。' });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '患者情報の保存に失敗しました。';
      setFeedback({ tone: 'error', message });
      recordOperationEvent('patient', 'critical', 'patient_upsert_failed', '患者情報の登録/更新に失敗しました', {
        patientId: values.patientId,
        mode,
      });
    }
  });

  const readOnly = (section: keyof NonNullable<typeof readOnlySections>) => Boolean(readOnlySections?.[section]);

  const renderInsuranceForms = () => {
    if (!insuranceFields.length) {
      return <SubtleText>保険情報は登録されていません。必要に応じて「行を追加」してください。</SubtleText>;
    }

    return insuranceFields.map((field, index) => {
      const errorsForIndex = errors.healthInsurances?.[index];
      return (
        <InsuranceCard key={field.id}>
          <InsuranceGrid>
            <TextField label="GUID" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.guid?.message} {...register(`healthInsurances.${index}.guid` as const)} />
            <TextField label="区分" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.className?.message} {...register(`healthInsurances.${index}.className` as const)} />
            <TextField label="区分コード" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.classCode?.message} {...register(`healthInsurances.${index}.classCode` as const)} />
            <TextField label="保険者番号" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.insuranceNumber?.message} {...register(`healthInsurances.${index}.insuranceNumber` as const)} />
            <TextField label="記号" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.clientGroup?.message} {...register(`healthInsurances.${index}.clientGroup` as const)} />
            <TextField label="番号" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.clientNumber?.message} {...register(`healthInsurances.${index}.clientNumber` as const)} />
            <TextField type="date" label="開始日" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.startDate?.message} {...register(`healthInsurances.${index}.startDate` as const)} />
            <TextField type="date" label="期限" disabled={readOnly('insurance')} errorMessage={errorsForIndex?.expiredDate?.message} {...register(`healthInsurances.${index}.expiredDate` as const)} />
          </InsuranceGrid>
          {readOnly('insurance') ? null : (
            <Button type="button" variant="ghost" onClick={() => handleRemoveInsurance(index)} size="sm">
              この行を削除
            </Button>
          )}
        </InsuranceCard>
      );
    });
  };

  const detail = detailQuery.data;

  return (
    <PanelContainer $layout={layout} role="group" aria-label="患者編集パネル">
      <HeaderRow>
        <Stack gap={4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge tone={mode === 'create' ? 'warning' : 'info'}>
              {mode === 'create' ? '新規登録モード' : '既存患者編集'}
            </StatusBadge>
            {mode === 'create' && summary && onModeChange ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onModeChange('update')}>
                選択患者に戻る
              </Button>
            ) : null}
          </div>
          {summary ? (
            <SubtleText>
              {summary.fullName} ／ {summary.patientId} ／ {summary.genderDesc ?? summary.gender ?? '---'}
            </SubtleText>
          ) : (
            <SubtleText>患者を選択すると概要が表示されます。</SubtleText>
          )}
        </Stack>
        {showCollapseToggle ? (
          <ToggleEditorButton type="button" onClick={() => setIsEditorExpanded((prev) => !prev)}>
            {isEditorExpanded ? '編集フォームを閉じる' : '編集フォームを開く'}
          </ToggleEditorButton>
        ) : null}
      </HeaderRow>

      {mode === 'update' && !summary ? (
        <SubtleText>患者を選択すると編集フォームが表示されます。</SubtleText>
      ) : mode === 'update' && detailQuery.isPending ? (
        <SubtleText>患者情報を読み込み中です…</SubtleText>
      ) : !isEditorExpanded ? (
        <SubtleText>編集が必要な場合は「編集フォームを開く」を選択してください。</SubtleText>
      ) : (
        <form onSubmit={handleSave}>
          <Stack gap={20}>
            <FieldGrid $layout={layout}>
              <TextField
                label="患者ID"
                placeholder="000001"
                errorMessage={errors.patientId?.message}
                disabled={mode === 'update' || readOnly('basic')}
                {...register('patientId')}
              />
              <TextField
                label="氏名"
                placeholder="山田 太郎"
                errorMessage={errors.fullName?.message}
                disabled={readOnly('basic')}
                {...register('fullName')}
              />
              <TextField
                label="カナ氏名"
                placeholder="ヤマダ タロウ"
                errorMessage={errors.kanaName?.message}
                disabled={readOnly('basic')}
                {...register('kanaName')}
              />
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>性別</span>
                <select
                  {...register('gender')}
                  disabled={readOnly('basic')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5F5',
                    fontSize: '0.95rem',
                    background: readOnly('basic') ? '#f4f4f5' : '#fff',
                  }}
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender?.message ? (
                  <span style={{ color: '#dc2626', fontSize: '0.8rem' }} role="alert">
                    {errors.gender.message}
                  </span>
                ) : null}
              </label>
              <TextField
                type="date"
                label="生年月日"
                errorMessage={errors.birthday?.message}
                disabled={readOnly('basic')}
                {...register('birthday')}
              />
            </FieldGrid>

            <FieldGrid $layout={layout}>
              <TextField
                label="電話番号"
                placeholder="03-1234-5678"
                errorMessage={errors.telephone?.message}
                disabled={readOnly('contact')}
                {...register('telephone')}
              />
              <TextField
                label="携帯番号"
                placeholder="090-1234-5678"
                errorMessage={errors.mobilePhone?.message}
                disabled={readOnly('contact')}
                {...register('mobilePhone')}
              />
              <TextField
                label="メールアドレス"
                type="email"
                placeholder="user@example.com"
                errorMessage={errors.email?.message}
                disabled={readOnly('contact')}
                {...register('email')}
              />
              <TextField
                label="郵便番号"
                placeholder="100-0001"
                errorMessage={errors.zipCode?.message}
                disabled={readOnly('contact')}
                {...register('zipCode')}
              />
              <TextField
                label="住所"
                placeholder="東京都千代田区千代田1-1"
                errorMessage={errors.address?.message}
                disabled={readOnly('contact')}
                {...register('address')}
              />
            </FieldGrid>

            <FieldGrid $layout={layout}>
              <TextArea
                label="患者メモ"
                rows={3}
                errorMessage={errors.memo?.message}
                disabled={readOnly('notes')}
                {...register('memo')}
              />
              <TextArea
                label="安全情報メモ"
                rows={3}
                description="スタッフ用の注意事項を入力"
                errorMessage={errors.appMemo?.message}
                disabled={readOnly('notes')}
                {...register('appMemo')}
              />
            </FieldGrid>

            <FieldGrid $layout={layout}>
              <TextField label="予備1" disabled={readOnly('notes')} {...register('reserve1')} />
              <TextField label="予備2" disabled={readOnly('notes')} {...register('reserve2')} />
              <TextField label="予備3" disabled={readOnly('notes')} {...register('reserve3')} />
              <TextField label="予備4" disabled={readOnly('notes')} {...register('reserve4')} />
              <TextField label="予備5" disabled={readOnly('notes')} {...register('reserve5')} />
              <TextField label="予備6" disabled={readOnly('notes')} {...register('reserve6')} />
            </FieldGrid>

            <Stack gap={12}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <strong>健康保険</strong>
                {readOnly('insurance') ? null : (
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddInsurance}>
                    行を追加
                  </Button>
                )}
              </div>
              {renderInsuranceForms()}
            </Stack>

            {mode === 'create' && onToggleAutoCreateReception ? (
              <CheckboxLabel>
                <CheckboxInput
                  type="checkbox"
                  checked={Boolean(autoCreateReceptionEnabled)}
                  onChange={(event) => onToggleAutoCreateReception(event.currentTarget.checked)}
                />
                登録後にこの患者で受付を作成する
              </CheckboxLabel>
            ) : null}

            <Stack direction="row" gap={12} style={{ flexWrap: 'wrap' }}>
              <Button type="submit" variant="primary" isLoading={patientUpsert.isPending}>
                保存する
              </Button>
              {mode === 'update' && !detailQuery.isFetching ? (
                <Button type="button" variant="secondary" onClick={() => detailQuery.refetch()}>
                  最新情報を再取得
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </form>
      )}

      {feedback ? <FeedbackMessage $tone={feedback.tone}>{feedback.message}</FeedbackMessage> : null}

      {mode === 'update' && detail ? (
        <SurfaceCard tone="muted" padding="md">
          <Stack gap={6}>
            <strong>最新の患者概要</strong>
            <SubtleText>
              最終更新日: {formatDisplayDate(detail.updatedAt)} ／ 最終来院: {formatDisplayDate(detail.lastVisitDate)}
            </SubtleText>
          </Stack>
        </SurfaceCard>
      ) : null}
    </PanelContainer>
  );
};
