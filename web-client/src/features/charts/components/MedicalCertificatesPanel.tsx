import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, SelectField, Stack, SurfaceCard, TextArea, TextField } from '@/components';
import { recordOperationEvent } from '@/libs/audit';
import type { AuthSession } from '@/libs/auth/auth-types';

import {
  buildMedicalCertificatePayload,
  deleteLetter,
  fetchLetterSummaries,
  fetchMedicalCertificate,
  filterMedicalCertificates,
  saveMedicalCertificate,
} from '@/features/charts/api/letter-api';
import type { LetterSummary, MedicalCertificateDetail } from '@/features/charts/types/letter';
import { buildMedicalCertificateHtml } from '@/features/charts/utils/medical-certificate-template';
import { calculateAgeLabel } from '@/features/charts/utils/age-label';

const InlineMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 16px 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textPrimary};
`;

export interface MedicalCertificatesPanelPatient {
  id: string;
  name: string;
  kana?: string;
  gender?: string;
  birthday?: string;
  ageLabel?: string;
  address?: string;
  zipCode?: string;
  telephone?: string;
  mobilePhone?: string;
}

interface MedicalCertificatesPanelProps {
  patient: MedicalCertificatesPanelPatient | null;
  karteId: number | null;
  patientPk: number | null;
  session: AuthSession | null;
  facilityName?: string;
  doctorName?: string | null;
  departmentName?: string | null;
  disabled?: boolean;
  onSaved?: () => void;
}

const buildInitialDetail = (
  patient: MedicalCertificatesPanelPatient,
  consultant: {
    facilityName?: string;
    doctorName?: string | null;
    departmentName?: string | null;
  },
): MedicalCertificateDetail => ({
  id: null,
  linkId: null,
  confirmedAt: null,
  title: patient.name ? `診断書:${patient.name}` : '診断書',
  disease: '',
  informedContent: '',
  consultantHospital: consultant.facilityName ?? '',
  consultantDept: consultant.departmentName ?? '',
  consultantDoctor: consultant.doctorName ?? '',
  consultantZipCode: '',
  consultantAddress: '',
  consultantTelephone: '',
  consultantFax: '',
  patientId: patient.id,
  patientName: patient.name,
  patientKana: patient.kana ?? '',
  patientGender: patient.gender ?? '',
  patientBirthday: patient.birthday ?? '',
  patientAge: patient.ageLabel ?? '',
  patientAddress: patient.address ?? '',
  patientZipCode: patient.zipCode ?? '',
  patientTelephone: patient.telephone ?? '',
  patientMobilePhone: patient.mobilePhone ?? '',
});

const LETTER_QUERY_KEY = ['charts', 'letters'] as const;

export const MedicalCertificatesPanel = ({
  patient,
  karteId,
  patientPk,
  session,
  facilityName,
  doctorName,
  departmentName,
  disabled,
  onSaved,
}: MedicalCertificatesPanelProps) => {
  const queryClient = useQueryClient();
  const [selectedLetterId, setSelectedLetterId] = useState<number | 'new'>('new');
  const [detail, setDetail] = useState<MedicalCertificateDetail | null>(
    patient ? buildInitialDetail(patient, { facilityName, doctorName, departmentName }) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const userModelId = session?.userProfile?.userModelId ?? null;
  const userId = session?.credentials.userId ?? null;
  const facilityId = session?.credentials.facilityId ?? '';
  const userCommonName = session?.userProfile?.displayName ?? session?.userProfile?.commonName ?? null;

  const lettersQuery = useQuery({
    queryKey: [...LETTER_QUERY_KEY, karteId] as const,
    queryFn: () => fetchLetterSummaries(karteId!),
    enabled: Boolean(karteId),
    select: (data: LetterSummary[]) => filterMedicalCertificates(data),
  });

  const detailQuery = useQuery({
    queryKey: [...LETTER_QUERY_KEY, 'detail', selectedLetterId] as const,
    queryFn: () => fetchMedicalCertificate(selectedLetterId as number),
    enabled: typeof selectedLetterId === 'number',
  });

  useEffect(() => {
    if (!patient) {
      setDetail(null);
      return;
    }
    setDetail((current) => {
      if (!current || selectedLetterId === 'new') {
        return buildInitialDetail(patient, { facilityName, doctorName, departmentName });
      }
      return current;
    });
  }, [patient, selectedLetterId, facilityName, doctorName, departmentName]);

  useEffect(() => {
    if (detailQuery.data) {
      setDetail(detailQuery.data);
      setInfo('既存の診断書を読み込みました。内容を確認して保存してください。');
    }
  }, [detailQuery.data]);

  useEffect(() => {
    if (patient && !patient.ageLabel && patient.birthday) {
      const age = calculateAgeLabel(patient.birthday);
      if (age) {
        setDetail((current) => (current ? { ...current, patientAge: age } : current));
      }
    }
  }, [patient]);

  const updateDetail = useCallback(
    (changes: Partial<MedicalCertificateDetail>) => {
      setDetail((current) => (current ? { ...current, ...changes } : current));
    },
    [],
  );

  const resetToNew = useCallback(() => {
    if (!patient) {
      return;
    }
    setSelectedLetterId('new');
    setDetail(buildInitialDetail(patient, { facilityName, doctorName, departmentName }));
    setInfo('新規の診断書を作成します。必要事項を入力して保存してください。');
    setError(null);
  }, [doctorName, departmentName, facilityName, patient]);

  const saveMutation = useMutation({
    mutationFn: async (payload: MedicalCertificateDetail) => {
      if (!karteId || !userModelId || !userId) {
        throw new Error('カルテまたはユーザー情報が不足しています');
      }
      const enriched = buildMedicalCertificatePayload(payload, {
        karteId,
        userModelId,
        userId: `${facilityId}:${userId}`,
        commonName: userCommonName,
      });
      const id = await saveMedicalCertificate(enriched);
      return { id };
    },
    onSuccess: async ({ id }) => {
      recordOperationEvent('chart', 'info', 'medical_certificate_save', '診断書を保存しました', {
        letterId: id,
        patientId: detail?.patientId,
      });
      setInfo('診断書を保存しました。最新の一覧に更新します。');
      setError(null);
      setSelectedLetterId(id);
      await queryClient.invalidateQueries({ queryKey: LETTER_QUERY_KEY });
      onSaved?.();
    },
    onError: (cause: unknown) => {
      const message = cause instanceof Error ? cause.message : '診断書の保存に失敗しました。';
      setError(message);
      setInfo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (letterId: number) => deleteLetter(letterId),
    onSuccess: async () => {
      recordOperationEvent('chart', 'warning', 'medical_certificate_delete', '診断書を削除しました', {
        letterId: detail?.id,
      });
      setInfo('診断書を削除しました。新規作成モードに戻ります。');
      setError(null);
      resetToNew();
      await queryClient.invalidateQueries({ queryKey: LETTER_QUERY_KEY });
    },
    onError: (cause: unknown) => {
      const message = cause instanceof Error ? cause.message : '診断書の削除に失敗しました。';
      setError(message);
      setInfo(null);
    },
  });

  const handleSave = useCallback(() => {
    if (!detail) {
      return;
    }
    saveMutation.mutate(detail);
  }, [detail, saveMutation]);

  const handlePrint = useCallback(() => {
    if (!detail) {
      return;
    }
    const html = buildMedicalCertificateHtml({
      certificate: detail,
      facilityName: facilityName ?? detail.consultantHospital,
      doctorName: doctorName ?? detail.consultantDoctor,
    });
    if (typeof window === 'undefined') {
      setError('ブラウザ環境でのみプレビューできます。');
      return;
    }
    const preview = window.open('', '_blank');
    if (!preview) {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${detail.patientId}_診断書.html`;
      anchor.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setInfo('プレビューウィンドウを開けないため、HTMLファイルをダウンロードしました。');
      return;
    }
    preview.document.open();
    preview.document.write(html);
    preview.document.close();
    preview.focus();
    preview.print();
  }, [detail, doctorName, facilityName]);

  const handleDelete = useCallback(() => {
    if (typeof selectedLetterId !== 'number') {
      return;
    }
    deleteMutation.mutate(selectedLetterId);
  }, [deleteMutation, selectedLetterId]);

  const letterOptions = useMemo(() => {
    const base = lettersQuery.data ?? [];
    return [
      { value: 'new', label: '新規作成' },
      ...base.map((entry) => ({
        value: String(entry.id),
        label: `${entry.title}${entry.confirmedAt ? ` / ${new Date(entry.confirmedAt).toLocaleString('ja-JP')}` : ''}`,
      })),
    ];
  }, [lettersQuery.data]);

  const isFormDisabled = disabled || !patient || !karteId || !patientPk || !userModelId || !detail;

  return (
    <SurfaceCard tone="muted">
      <Stack gap={16}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>診断書・医療文書</h2>
          <InlineMessage>
            オンプレ版の MedicalCertificateViewer と同じ形式で診断書を作成・編集し、PDF 印刷できます。
          </InlineMessage>
        </div>

        <SelectField
          label="既存診断書"
          options={letterOptions}
          value={selectedLetterId === 'new' ? 'new' : String(selectedLetterId)}
          onChange={(event) => {
            const next = event.currentTarget.value === 'new' ? 'new' : Number.parseInt(event.currentTarget.value, 10);
            setSelectedLetterId(next);
            if (next === 'new') {
              resetToNew();
            }
          }}
          disabled={Boolean(disabled || lettersQuery.isLoading || !karteId)}
          description={lettersQuery.isFetching ? '診断書一覧を更新しています…' : undefined}
        />

        {detail ? (
          <>
            <SectionTitle>患者情報</SectionTitle>
            <FieldGrid>
              <TextField label="患者ID" value={detail.patientId} onChange={() => {}} disabled />
              <TextField label="氏名" value={detail.patientName} onChange={() => {}} disabled />
              <TextField label="カナ" value={detail.patientKana} onChange={() => {}} disabled />
              <TextField label="性別" value={detail.patientGender} onChange={() => {}} disabled />
              <TextField label="生年月日" value={detail.patientBirthday} onChange={() => {}} disabled />
              <TextField label="年齢" value={detail.patientAge} onChange={() => {}} disabled />
              <TextField label="郵便番号" value={detail.patientZipCode} onChange={() => {}} disabled />
              <TextField label="住所" value={detail.patientAddress} onChange={() => {}} disabled />
              <TextField label="電話" value={detail.patientTelephone} onChange={() => {}} disabled />
              <TextField label="携帯" value={detail.patientMobilePhone} onChange={() => {}} disabled />
            </FieldGrid>

            <SectionTitle>医療機関情報</SectionTitle>
            <FieldGrid>
              <TextField
                label="医療機関名"
                value={detail.consultantHospital}
                onChange={(event) => updateDetail({ consultantHospital: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="診療科"
                value={detail.consultantDept}
                onChange={(event) => updateDetail({ consultantDept: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="担当医"
                value={detail.consultantDoctor}
                onChange={(event) => updateDetail({ consultantDoctor: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="郵便番号"
                value={detail.consultantZipCode}
                onChange={(event) => updateDetail({ consultantZipCode: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="住所"
                value={detail.consultantAddress}
                onChange={(event) => updateDetail({ consultantAddress: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="電話"
                value={detail.consultantTelephone}
                onChange={(event) => updateDetail({ consultantTelephone: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
              <TextField
                label="FAX"
                value={detail.consultantFax}
                onChange={(event) => updateDetail({ consultantFax: event.currentTarget.value })}
                disabled={isFormDisabled}
              />
            </FieldGrid>

            <SectionTitle>診断内容</SectionTitle>
            <TextField
              label="タイトル"
              value={detail.title}
              onChange={(event) => updateDetail({ title: event.currentTarget.value })}
              disabled={isFormDisabled}
            />
            <TextField
              label="傷病名"
              value={detail.disease}
              onChange={(event) => updateDetail({ disease: event.currentTarget.value })}
              disabled={isFormDisabled}
            />
            <TextArea
              label="診断内容・指示"
              rows={5}
              value={detail.informedContent}
              onChange={(event) => updateDetail({ informedContent: event.currentTarget.value })}
              disabled={isFormDisabled}
            />

            <Stack direction="row" gap={12} style={{ flexWrap: 'wrap' }}>
              <Button type="button" variant="primary" onClick={handleSave} disabled={isFormDisabled || saveMutation.isPending}>
                保存
              </Button>
              <Button type="button" variant="secondary" onClick={handlePrint} disabled={isFormDisabled}>
                プレビュー / 印刷
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetToNew}
                disabled={isFormDisabled || saveMutation.isPending}
              >
                新規作成に戻る
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isFormDisabled || typeof selectedLetterId !== 'number' || deleteMutation.isPending}
              >
                削除
              </Button>
            </Stack>
          </>
        ) : (
          <InlineMessage>カルテを開くと患者情報に基づいた診断書を作成できます。</InlineMessage>
        )}

        {error ? <InlineError>{error}</InlineError> : null}
        {info ? <InlineMessage>{info}</InlineMessage> : null}
        {lettersQuery.error ? <InlineError>診断書一覧の取得に失敗しました。</InlineError> : null}
      </Stack>
    </SurfaceCard>
  );
};
