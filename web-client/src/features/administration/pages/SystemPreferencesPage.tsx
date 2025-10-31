import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styled from '@emotion/styled';

import { Button, SelectField, StatusBadge, SurfaceCard, Stack, TextField } from '@/components';
import { useAuth } from '@/libs/auth';
import { useUsersQuery, useUserMutations } from '@/features/administration/hooks/useUsers';
import {
  useActivitiesQuery,
  useCloudZeroTrigger,
  useFacilityAdminRegistration,
  useLicenseSubmission,
  useServerInfoSnapshot,
} from '@/features/administration/hooks/useSystemPreferences';
import type { ActivityModel } from '@/features/administration/types/system';
import type { FacilityModel } from '@/features/administration/types/user';
import {
  fetchPhrContainer,
  fetchPhrKeyByAccessKey,
  fetchPhrKeyByPatientId,
  fetchPhrText,
  upsertPhrKey,
} from '@/features/administration/api/phr-api';
import type { PhrKeyLookupResult, PhrKeyUpsertPayload, PhrTextType } from '@/features/administration/api/phr-api';
import type { PhrContainer } from '@/features/administration/types/phr';

type TabKey = 'basic' | 'license' | 'cloud' | 'phr';

interface FacilityFormValues {
  id: number | null;
  facilityId: string;
  facilityName: string;
  zipCode: string;
  address: string;
  telephone: string;
  facsimile: string;
  url: string;
}

interface FacilityAdminFormValues {
  userId: string;
  password: string;
  sirName: string;
  givenName: string;
  email: string;
  facilityName: string;
  facilityZipCode: string;
  facilityAddress: string;
  facilityTelephone: string;
  facilityFacsimile: string;
  facilityUrl: string;
}

interface FeedbackState {
  tone: 'info' | 'danger';
  message: string;
}

const TabNav = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FeedbackBanner = styled.div<{ tone: 'info' | 'danger' }>`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, tone }) =>
    tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2'};
  color: ${({ theme, tone }) => (tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#991b1b')};
  font-size: 0.9rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const InfoCard = styled.div`
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
  word-break: break-word;
`;

const ActivityTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 0.9rem;

  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.border};
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.palette.textMuted};
    font-weight: 600;
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 8px;

  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.border};
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.palette.textMuted};
    font-weight: 600;
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const FormGrid = styled.div`
  display: grid;
  gap: 12px;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
`;

const EmptyState = styled.div`
  padding: 24px 0;
  color: ${({ theme }) => theme.palette.textMuted};
  text-align: center;
  font-size: 0.9rem;
`;

const mapFacilityToForm = (facility?: FacilityModel | null): FacilityFormValues => ({
  id: facility?.id ?? null,
  facilityId: facility?.facilityId ?? '',
  facilityName: facility?.facilityName ?? '',
  zipCode: facility?.zipCode ?? '',
  address: facility?.address ?? '',
  telephone: facility?.telephone ?? '',
  facsimile: facility?.facsimile ?? '',
  url: facility?.url ?? '',
});

const createFacilityAdminForm = (facility?: FacilityModel | null): FacilityAdminFormValues => ({
  userId: '',
  password: '',
  sirName: '',
  givenName: '',
  email: '',
  facilityName: facility?.facilityName ?? '',
  facilityZipCode: facility?.zipCode ?? '',
  facilityAddress: facility?.address ?? '',
  facilityTelephone: facility?.telephone ?? '',
  facilityFacsimile: facility?.facsimile ?? '',
  facilityUrl: facility?.url ?? '',
});

const formatActivityLabel = (activity: ActivityModel): string => {
  if (activity.flag === 'T') {
    return '累計';
  }
  if (activity.year != null && activity.month != null) {
    return `${activity.year}年${activity.month + 1}月`;
  }
  return '---';
};

interface PhrManagementPanelProps {
  facilityId: string;
}

const generateRandomKey = (length = 32) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijklmnopqrstuvwxyz';
  const result: string[] = [];
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result.push(characters.charAt(randomIndex));
  }
  return result.join('');
};

const formatTimestamp = (value?: string | null) => (value && value.trim().length > 0 ? value : '---');

const ensureTimestamp = (value?: string | null) => {
  const trimmed = value?.trim();
  if (trimmed && trimmed.length >= 19) {
    return trimmed.slice(0, 19);
  }
  return new Date().toISOString().slice(0, 19);
};

const phrTextOptions: Array<{ value: PhrTextType; label: string }> = [
  { value: 'medication', label: '最新処方テキスト' },
  { value: 'labtest', label: '最新検査テキスト' },
  { value: 'disease', label: '病名一覧' },
  { value: 'allergy', label: 'アレルギー情報' },
];
const PhrManagementPanel = ({ facilityId }: PhrManagementPanelProps) => {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [phrKeyForm, setPhrKeyForm] = useState<PhrKeyUpsertPayload>({
    facilityId,
    patientId: '',
    accessKey: '',
    secretKey: '',
    registeredString: '',
  });
  const [phrKeyFeedback, setPhrKeyFeedback] = useState<FeedbackState | null>(null);
  const [phrContainerFeedback, setPhrContainerFeedback] = useState<FeedbackState | null>(null);
  const [phrContainer, setPhrContainer] = useState<PhrContainer | null>(null);
  const [phrTextFeedback, setPhrTextFeedback] = useState<FeedbackState | null>(null);
  const [phrTextContents, setPhrTextContents] = useState('');
  const [documentSince, setDocumentSince] = useState('');
  const [labSince, setLabSince] = useState('');
  const [phrTextType, setPhrTextType] = useState<PhrTextType>('medication');

  const facilityUnavailable = !facilityId;

  useEffect(() => {
    setPhrKeyForm((prev) => ({
      ...prev,
      facilityId,
    }));
    setPhrContainer(null);
  }, [facilityId]);

  const keyByPatientMutation = useMutation({
    mutationFn: (id: string) => fetchPhrKeyByPatientId(id),
  });
  const keyByAccessMutation = useMutation({
    mutationFn: (key: string) => fetchPhrKeyByAccessKey(key),
  });
  const keyUpsertMutation = useMutation({
    mutationFn: (payload: PhrKeyUpsertPayload) => upsertPhrKey(payload),
  });
  const containerMutation = useMutation({
    mutationFn: fetchPhrContainer,
  });
  const phrTextMutation = useMutation({
    mutationFn: (params: { patientId: string; type: PhrTextType }) => fetchPhrText(params.patientId, params.type),
  });

  const applyKeyResult = (result: PhrKeyLookupResult | null, fallbackPatientId: string) => {
    if (result) {
      setPhrKeyForm({
        id: result.id ?? undefined,
        facilityId,
        patientId: result.patientId ?? fallbackPatientId,
        accessKey: result.accessKey ?? '',
        secretKey: result.secretKey ?? '',
        registeredString: result.registeredString ?? '',
      });
      setPhrKeyFeedback({
        tone: 'info',
        message: 'PHR キー情報を読み込みました。',
      });
    } else {
      setPhrKeyForm({
        facilityId,
        patientId: fallbackPatientId,
        accessKey: '',
        secretKey: '',
        registeredString: '',
      });
      setPhrKeyFeedback({
        tone: 'danger',
        message: '該当する PHR キーが見つかりません。新規作成できます。',
      });
    }
  };

  const handleLookupByPatient = async () => {
    const trimmed = patientIdInput.trim();
    if (!trimmed) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: '患者IDを入力してください。',
      });
      return;
    }
    try {
      const result = await keyByPatientMutation.mutateAsync(trimmed);
      applyKeyResult(result, trimmed);
    } catch (error) {
      console.error(error);
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'PHR キーの取得に失敗しました。',
      });
    }
  };

  const handleLookupByAccessKey = async () => {
    const trimmed = accessKeyInput.trim();
    if (!trimmed) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'アクセスキーを入力してください。',
      });
      return;
    }
    try {
      const result = await keyByAccessMutation.mutateAsync(trimmed);
      applyKeyResult(result, phrKeyForm.patientId || patientIdInput.trim());
    } catch (error) {
      console.error(error);
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'PHR キーの取得に失敗しました。',
      });
    }
  };

  const handleKeyFieldChange = (field: 'patientId' | 'accessKey' | 'secretKey' | 'registeredString', value: string) => {
    setPhrKeyFeedback(null);
    setPhrKeyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateKeys = () => {
    setPhrKeyFeedback(null);
    setPhrKeyForm((prev) => ({
      ...prev,
      accessKey: generateRandomKey(24),
      secretKey: generateRandomKey(40),
      registeredString: ensureTimestamp(prev.registeredString),
    }));
  };

  const handleSetNow = () => {
    setPhrKeyForm((prev) => ({
      ...prev,
      registeredString: ensureTimestamp(),
    }));
  };

  const handleSavePhrKey = async () => {
    if (facilityUnavailable) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: '譁ｽ險ｭ ID 縺瑚ｧ｣豎ｺ縺ｧ縺阪∪縺帙ｓ縲ょ・繝ｭ繧ｰ繧､繝ｳ縺励※縺上□縺輔＞縲・,
      });
      return;
    }
    if (!phrKeyForm.patientId?.trim()) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: '謔｣閠・ID 繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    if (!phrKeyForm.accessKey?.trim() || !phrKeyForm.secretKey?.trim()) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: '繧｢繧ｯ繧ｻ繧ｹ繧ｭ繝ｼ縺ｨ繧ｷ繝ｼ繧ｯ繝ｬ繝・ヨ繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ縺上□縺輔＞・郁・蜍慕函謌舌ｂ蛻ｩ逕ｨ縺ｧ縺阪∪縺呻ｼ峨・,
      });
      return;
    }
    try {
      await keyUpsertMutation.mutateAsync({
        ...phrKeyForm,
        facilityId,
        patientId: phrKeyForm.patientId.trim(),
        accessKey: phrKeyForm.accessKey.trim(),
        secretKey: phrKeyForm.secretKey.trim(),
        registeredString: ensureTimestamp(phrKeyForm.registeredString),
      });
      setPhrKeyFeedback({
        tone: 'info',
        message: 'PHR 繧ｭ繝ｼ繧堤匳骭ｲ縺励∪縺励◆縲・,
      });
    } catch (error) {
      console.error(error);
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'PHR 繧ｭ繝ｼ縺ｮ逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・,
      });
    }
  };

  const handleFetchContainer = async () => {
    if (facilityUnavailable) {
      setPhrContainerFeedback({
        tone: 'danger',
        message: '譁ｽ險ｭ ID 縺瑚ｧ｣豎ｺ縺ｧ縺阪∪縺帙ｓ縲ょ・繝ｭ繧ｰ繧､繝ｳ縺励※縺上□縺輔＞縲・,
      });
      return;
    }
    const targetPatientId = phrKeyForm.patientId?.trim() || patientIdInput.trim();
    if (!targetPatientId) {
      setPhrContainerFeedback({
        tone: 'danger',
        message: '謔｣閠・ID 繧呈欠螳壹＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    try {
      setPhrContainerFeedback(null);
      const container = await containerMutation.mutateAsync({
        facilityId,
        patientId: targetPatientId,
        documentSince: documentSince.trim() || undefined,
        labSince: labSince.trim() || undefined,
      });
      setPhrContainer(container);
      setPhrContainerFeedback({
        tone: 'info',
        message: 'PHR 繝・・繧ｿ繧貞叙蠕励＠縺ｾ縺励◆縲・,
      });
    } catch (error) {
      console.error(error);
      setPhrContainer(null);
      setPhrContainerFeedback({
        tone: 'danger',
        message: 'PHR 繝・・繧ｿ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲・,
      });
    }
  };

  const handleDownloadContainer = () => {
    if (!phrContainer) {
      return;
    }
    const fileNamePatientId = phrKeyForm.patientId || patientIdInput || 'phr';
    const blob = new Blob([JSON.stringify(phrContainer, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phr_${fileNamePatientId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFetchPhrText = async () => {
    const targetPatientId = phrKeyForm.patientId?.trim() || patientIdInput.trim();
    if (!targetPatientId) {
      setPhrTextFeedback({
        tone: 'danger',
        message: '謔｣閠・ID 繧呈欠螳壹＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    try {
      setPhrTextFeedback(null);
      const text = await phrTextMutation.mutateAsync({ patientId: targetPatientId, type: phrTextType });
      setPhrTextContents(text);
      setPhrTextFeedback({
        tone: 'info',
        message: '繝・く繧ｹ繝医ョ繝ｼ繧ｿ繧貞叙蠕励＠縺ｾ縺励◆縲・,
      });
    } catch (error) {
      console.error(error);
      setPhrTextContents('');
      setPhrTextFeedback({
        tone: 'danger',
        message: '繝・く繧ｹ繝医ョ繝ｼ繧ｿ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲・,
      });
    }
  };

  const docList = phrContainer?.docList ?? [];
  const labList = phrContainer?.labList ?? [];

  return (
    <Stack gap={20}>
      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>PHR 繧ｭ繝ｼ邂｡逅・/SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            謔｣閠・＃縺ｨ縺ｮ PHR 繧ｭ繝ｼ・医い繧ｯ繧ｻ繧ｹ繧ｭ繝ｼ・上す繝ｼ繧ｯ繝ｬ繝・ヨ繧ｭ繝ｼ・峨ｒ蜿ら・繝ｻ譖ｴ譁ｰ縺ｧ縺阪∪縺吶・          </p>
          {facilityUnavailable ? (
            <FeedbackBanner tone="danger">譁ｽ險ｭ ID 縺梧悴蜿門ｾ励・縺溘ａ謫堺ｽ懊〒縺阪∪縺帙ｓ縲ょ・繝ｭ繧ｰ繧､繝ｳ蠕後↓蜀崎ｩｦ陦後＠縺ｦ縺上□縺輔＞縲・/FeedbackBanner>
          ) : null}
          {phrKeyFeedback ? <FeedbackBanner tone={phrKeyFeedback.tone}>{phrKeyFeedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <TextField
              label="謔｣閠・ID 讀懃ｴ｢"
              value={patientIdInput}
              onChange={(event) => setPatientIdInput(event.currentTarget.value)}
              style={{ minWidth: 200 }}
            />
            <Button
              onClick={handleLookupByPatient}
              isLoading={keyByPatientMutation.isPending}
              disabled={facilityUnavailable}
            >
              謔｣閠・ID 縺ｧ蜿門ｾ・            </Button>
            <TextField
              label="繧｢繧ｯ繧ｻ繧ｹ繧ｭ繝ｼ讀懃ｴ｢"
              value={accessKeyInput}
              onChange={(event) => setAccessKeyInput(event.currentTarget.value)}
              style={{ minWidth: 200 }}
            />
            <Button
              onClick={handleLookupByAccessKey}
              isLoading={keyByAccessMutation.isPending}
              disabled={facilityUnavailable}
            >
              繧｢繧ｯ繧ｻ繧ｹ繧ｭ繝ｼ縺ｧ蜿門ｾ・            </Button>
          </Stack>
          <FormGrid>
            <TextField
              label="謔｣閠・ID"
              value={phrKeyForm.patientId}
              onChange={(event) => handleKeyFieldChange('patientId', event.currentTarget.value)}
            />
            <TextField
              label="繧｢繧ｯ繧ｻ繧ｹ繧ｭ繝ｼ"
              value={phrKeyForm.accessKey}
              onChange={(event) => handleKeyFieldChange('accessKey', event.currentTarget.value)}
            />
            <TextField
              label="繧ｷ繝ｼ繧ｯ繝ｬ繝・ヨ繧ｭ繝ｼ"
              value={phrKeyForm.secretKey}
              onChange={(event) => handleKeyFieldChange('secretKey', event.currentTarget.value)}
            />
            <TextField
              label="逋ｻ骭ｲ譌･譎・(yyyy-MM-ddTHH:mm:ss)"
              value={phrKeyForm.registeredString ?? ''}
              onChange={(event) => handleKeyFieldChange('registeredString', event.currentTarget.value)}
            />
          </FormGrid>
          <Stack direction="row" gap={12} wrap>
            <Button variant="ghost" onClick={handleGenerateKeys} disabled={facilityUnavailable}>
              繧ｭ繝ｼ繧定・蜍慕函謌・            </Button>
            <Button variant="ghost" onClick={handleSetNow} disabled={facilityUnavailable}>
              逋ｻ骭ｲ譌･譎ゅｒ迴ｾ蝨ｨ譎ょ綾縺ｧ譖ｴ譁ｰ
            </Button>
            <Button
              onClick={handleSavePhrKey}
              isLoading={keyUpsertMutation.isPending}
              disabled={facilityUnavailable}
            >
              PHR 繧ｭ繝ｼ繧剃ｿ晏ｭ・            </Button>
          </Stack>
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>PHR 繝・・繧ｿ蜿門ｾ・/SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            PHR 繧ｳ繝ｳ繝・リ・域枚譖ｸ繝ｻ讀懈渊・峨ｒ蜿門ｾ励＠縲゛SON 蠖｢蠑上〒繝繧ｦ繝ｳ繝ｭ繝ｼ繝峨〒縺阪∪縺吶よ悄髢薙ｒ謖・ｮ壹☆繧九→蠢・ｦ√↑繝・・繧ｿ縺ｮ縺ｿ繧貞叙蠕励＠縺ｾ縺吶・          </p>
          {phrContainerFeedback ? (
            <FeedbackBanner tone={phrContainerFeedback.tone}>{phrContainerFeedback.message}</FeedbackBanner>
          ) : null}
          <FormGrid>
            <TextField
              label="譁・嶌蜿門ｾ怜渕貅匁律 (萓・ 2025-01-01)"
              placeholder="YYYY-MM-DD"
              value={documentSince}
              onChange={(event) => setDocumentSince(event.currentTarget.value)}
            />
            <TextField
              label="讀懈渊蜿門ｾ怜渕貅匁律 (萓・ 2025-01-01)"
              placeholder="YYYY-MM-DD"
              value={labSince}
              onChange={(event) => setLabSince(event.currentTarget.value)}
            />
          </FormGrid>
          <Stack direction="row" gap={12} wrap>
            <Button
              onClick={handleFetchContainer}
              isLoading={containerMutation.isPending}
              disabled={facilityUnavailable}
            >
              PHR 繝・・繧ｿ繧貞叙蠕・            </Button>
            <Button
              variant="ghost"
              onClick={handleDownloadContainer}
              disabled={!phrContainer}
            >
              JSON 繧偵ム繧ｦ繝ｳ繝ｭ繝ｼ繝・            </Button>
          </Stack>
          {containerMutation.isPending ? (
            <EmptyState>PHR 繝・・繧ｿ繧貞叙蠕励＠縺ｦ縺・∪縺吮ｦ</EmptyState>
          ) : phrContainer ? (
            <Stack gap={12}>
              <InfoGrid>
                <InfoCard>
                  <InfoLabel>譁・嶌莉ｶ謨ｰ</InfoLabel>
                  <InfoValue>{docList.length}</InfoValue>
                </InfoCard>
                <InfoCard>
                  <InfoLabel>讀懈渊莉ｶ謨ｰ</InfoLabel>
                  <InfoValue>{labList.length}</InfoValue>
                </InfoCard>
              </InfoGrid>
              {docList.length > 0 ? (
                <div>
                  <h4 style={{ margin: '16px 0 8px', fontSize: '0.95rem' }}>譁・嶌讎りｦ・ｼ域怙螟ｧ 5 莉ｶ・・/h4>
                  <ResultTable>
                    <thead>
                      <tr>
                        <th>譁・嶌 ID</th>
                        <th>髢句ｧ区律譎・/th>
                        <th>迥ｶ諷・/th>
                        <th>諡・ｽ灘現</th>
                        <th>繝｢繧ｸ繝･繝ｼ繝ｫ謨ｰ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docList.slice(0, 5).map((doc, index) => (
                        <tr key={`${doc.catchId ?? 'doc'}-${index}`}>
                          <td>{doc.catchId ?? '窶・}</td>
                          <td>{formatTimestamp(doc.started)}</td>
                          <td>{doc.status ?? '窶・}</td>
                          <td>{doc.physicianName ?? '窶・}</td>
                          <td>{doc.bundles?.length ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </ResultTable>
                </div>
              ) : (
                <EmptyState>譁・嶌縺ｯ隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・/EmptyState>
              )}
              {labList.length > 0 ? (
                <div>
                  <h4 style={{ margin: '16px 0 8px', fontSize: '0.95rem' }}>讀懈渊讎りｦ・ｼ域怙螟ｧ 5 莉ｶ・・/h4>
                  <ResultTable>
                    <thead>
                      <tr>
                        <th>繝｢繧ｸ繝･繝ｼ繝ｫ ID</th>
                        <th>謗｡蜿匁律</th>
                        <th>讀懈渊鬆・岼謨ｰ</th>
                        <th>萓晞ｼ譁ｽ險ｭ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labList.slice(0, 5).map((lab, index) => (
                        <tr key={`${lab.catchId ?? 'lab'}-${index}`}>
                          <td>{lab.catchId ?? '窶・}</td>
                          <td>{formatTimestamp(lab.sampleDate)}</td>
                          <td>{lab.numOfItems ?? lab.testItems?.length ?? 0}</td>
                          <td>{lab.facilityName ?? '窶・}</td>
                        </tr>
                      ))}
                    </tbody>
                  </ResultTable>
                </div>
              ) : (
                <EmptyState>讀懈渊繝・・繧ｿ縺ｯ隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・/EmptyState>
              )}
            </Stack>
          ) : (
            <EmptyState>PHR 繝・・繧ｿ縺ｯ縺ｾ縺蜿門ｾ励＆繧後※縺・∪縺帙ｓ縲・/EmptyState>
          )}
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>繝・く繧ｹ繝医お繧ｯ繧ｹ繝昴・繝・/SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            繧｢繝ｬ繝ｫ繧ｮ繝ｼ繝ｻ逞・錐繝ｻ蜃ｦ譁ｹ繝ｻ讀懈渊縺ｪ縺ｩ縺ｮ繝・く繧ｹ繝域ュ蝣ｱ繧貞叙蠕励＠縲・劼螟夜｣謳ｺ繧・ぅ閠・署萓帷畑縺ｫ豢ｻ逕ｨ縺ｧ縺阪∪縺吶・          </p>
          {phrTextFeedback ? <FeedbackBanner tone={phrTextFeedback.tone}>{phrTextFeedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <SelectField
              label="蜿門ｾ怜ｯｾ雎｡"
              name="phrTextType"
              value={phrTextType}
              onChange={(event) => setPhrTextType(event.currentTarget.value as PhrTextType)}
              options={phrTextOptions}
              style={{ minWidth: 220 }}
            />
            <Button
              onClick={handleFetchPhrText}
              isLoading={phrTextMutation.isPending}
              disabled={facilityUnavailable}
            >
              繝・く繧ｹ繝医ｒ蜿門ｾ・            </Button>
            <Button
              variant="ghost"
              onClick={() => setPhrTextContents('')}
            >
              陦ｨ遉ｺ繧偵け繝ｪ繧｢
            </Button>
          </Stack>
          <div
            style={{
              border: '1px solid #cbd5f5',
              borderRadius: 6,
              padding: 12,
              minHeight: 160,
              background: '#f8fafc',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
            aria-live="polite"
          >
            {phrTextContents ? phrTextContents : '繝・く繧ｹ繝医′陦ｨ遉ｺ縺輔ｌ縺ｾ縺吶・}
          </div>
        </Stack>
      </SurfaceCard>
    </Stack>
  );
};

const formatNumber = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('ja-JP') : '窶・;

export const SystemPreferencesPage = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const usersQuery = useUsersQuery();
  const { facilityMutation } = useUserMutations();
  const serverInfoQuery = useServerInfoSnapshot();
  const licenseMutation = useLicenseSubmission();
  const cloudZeroMutation = useCloudZeroTrigger();
  const facilityAdminMutation = useFacilityAdminRegistration();

  const [facilityForm, setFacilityForm] = useState<FacilityFormValues>(mapFacilityToForm());
  const [facilityFeedback, setFacilityFeedback] = useState<FeedbackState | null>(null);
  const [facilityAdminForm, setFacilityAdminForm] = useState<FacilityAdminFormValues>(createFacilityAdminForm());
  const [facilityAdminFeedback, setFacilityAdminFeedback] = useState<FeedbackState | null>(null);
  const [licenseToken, setLicenseToken] = useState('');
  const [licenseFeedback, setLicenseFeedback] = useState<FeedbackState | null>(null);
  const [cloudFeedback, setCloudFeedback] = useState<FeedbackState | null>(null);

  const baselineFacility = usersQuery.data?.[0]?.facilityModel ?? null;

  useEffect(() => {
    if (baselineFacility) {
      setFacilityForm(mapFacilityToForm(baselineFacility));
      setFacilityAdminForm((prev) => ({
        ...prev,
        facilityName: prev.facilityName
          ? prev.facilityName
          : baselineFacility.facilityName ?? '',
        facilityZipCode: prev.facilityZipCode
          ? prev.facilityZipCode
          : baselineFacility.zipCode ?? '',
        facilityAddress: prev.facilityAddress
          ? prev.facilityAddress
          : baselineFacility.address ?? '',
        facilityTelephone: prev.facilityTelephone
          ? prev.facilityTelephone
          : baselineFacility.telephone ?? '',
        facilityFacsimile: prev.facilityFacsimile
          ? prev.facilityFacsimile
          : baselineFacility.facsimile ?? '',
        facilityUrl: prev.facilityUrl ? prev.facilityUrl : baselineFacility.url ?? '',
      }));
    }
  }, [baselineFacility]);

  const now = useMemo(() => new Date(), []);
  const facilityId = useMemo(
    () => session?.credentials.facilityId ?? facilityForm.facilityId ?? '',
    [facilityForm.facilityId, session?.credentials.facilityId],
  );
  const activityOptions = useMemo(
    () => ({
      year: now.getFullYear(),
      month: now.getMonth(),
      count: 3,
    }),
    [now],
  );

  const activitiesQuery = useActivitiesQuery(activityOptions, activeTab === 'basic');

  const handleFacilityChange = (field: keyof FacilityFormValues, value: string) => {
    setFacilityFeedback(null);
    setFacilityForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacilityAdminChange = (field: keyof FacilityAdminFormValues, value: string) => {
    setFacilityAdminFeedback(null);
    setFacilityAdminForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacilitySubmit = async () => {
    if (!facilityForm.facilityId || facilityForm.id == null) {
      setFacilityFeedback({
        tone: 'danger',
        message: '譁ｽ險ｭ諠・ｱ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺悟ｮ御ｺ・＠縺ｦ縺・∪縺帙ｓ縲・,
      });
      return;
    }
    try {
      await facilityMutation.mutateAsync({
        facilityModel: {
          id: facilityForm.id,
          facilityId: facilityForm.facilityId,
          facilityName: facilityForm.facilityName.trim(),
          zipCode: facilityForm.zipCode.trim(),
          address: facilityForm.address.trim(),
          telephone: facilityForm.telephone.trim(),
          facsimile: facilityForm.facsimile.trim() || undefined,
          url: facilityForm.url.trim() || undefined,
        },
      });
      setFacilityFeedback({
        tone: 'info',
        message: '譁ｽ險ｭ諠・ｱ繧呈峩譁ｰ縺励∪縺励◆縲・,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '譁ｽ險ｭ諠・ｱ縺ｮ譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・;
      setFacilityFeedback({
        tone: 'danger',
        message,
      });
    }
  };

  const handleFacilityAdminSubmit = async () => {
    if (!facilityAdminForm.userId.trim() || !facilityAdminForm.password.trim()) {
      setFacilityAdminFeedback({
        tone: 'danger',
        message: '邂｡逅・・・繝ｦ繝ｼ繧ｶ繝ｼ ID 縺ｨ莉ｮ繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    if (!facilityAdminForm.sirName.trim() || !facilityAdminForm.givenName.trim()) {
      setFacilityAdminFeedback({
        tone: 'danger',
        message: '邂｡逅・・ｰ丞錐・亥ｧ薙・蜷搾ｼ峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    if (!facilityAdminForm.facilityName.trim()) {
      setFacilityAdminFeedback({
        tone: 'danger',
        message: '譁ｰ隕乗命險ｭ蜷阪ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }

    try {
      setFacilityAdminFeedback(null);
      const result = await facilityAdminMutation.mutateAsync({
        userId: facilityAdminForm.userId.trim(),
        password: facilityAdminForm.password,
        sirName: facilityAdminForm.sirName.trim(),
        givenName: facilityAdminForm.givenName.trim(),
        email: facilityAdminForm.email.trim() || undefined,
        facilityName: facilityAdminForm.facilityName.trim(),
        facilityZipCode: facilityAdminForm.facilityZipCode.trim() || undefined,
        facilityAddress: facilityAdminForm.facilityAddress.trim() || undefined,
        facilityTelephone: facilityAdminForm.facilityTelephone.trim() || undefined,
        facilityFacsimile: facilityAdminForm.facilityFacsimile.trim() || undefined,
        facilityUrl: facilityAdminForm.facilityUrl.trim() || undefined,
      });
      setFacilityAdminFeedback({
        tone: 'info',
        message: `譁ｰ隕乗命險ｭ ID ${result.facilityId} / 邂｡逅・・${result.userId} 繧堤匳骭ｲ縺励∪縺励◆縲Ａ,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '譁ｽ險ｭ邂｡逅・・・逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・;
      setFacilityAdminFeedback({
        tone: 'danger',
        message,
      });
    }
  };

  const handleSubmitLicense = async () => {
    const token = licenseToken.trim();
    if (!token) {
      setLicenseFeedback({
        tone: 'danger',
        message: '繝ｩ繧､繧ｻ繝ｳ繧ｹ UID 繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・,
      });
      return;
    }
    try {
      setLicenseFeedback(null);
      const result = await licenseMutation.mutateAsync(token);
      let message = '';
      let tone: FeedbackState['tone'] = 'info';
      switch (result.status) {
        case 'success':
          message = '繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ縺悟ｮ御ｺ・＠縺ｾ縺励◆縲・;
          break;
        case 'limit_reached':
          tone = 'danger';
          message = '繝ｩ繧､繧ｻ繝ｳ繧ｹ謨ｰ縺御ｸ企剞縺ｫ驕斐＠縺ｦ縺・∪縺吶ゆｸ崎ｦ√↑遶ｯ譛ｫ縺ｮ逋ｻ骭ｲ繧定ｧ｣髯､縺励※縺上□縺輔＞縲・;
          break;
        case 'write_failed':
          tone = 'danger';
          message = '繝ｩ繧､繧ｻ繝ｳ繧ｹ繝輔ぃ繧､繝ｫ縺ｮ譖ｴ譁ｰ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲よｨｩ髯舌∪縺溘・繝・ぅ繧ｹ繧ｯ迥ｶ諷九ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・;
          break;
        default:
          tone = 'danger';
          message = '繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲６ID 繧堤｢ｺ隱阪・荳翫∝・隧ｦ陦後＠縺ｦ縺上□縺輔＞縲・;
      }
      setLicenseFeedback({ tone, message });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・;
      setLicenseFeedback({
        tone: 'danger',
        message,
      });
    }
  };

  const handleTriggerCloudZero = async () => {
    try {
      setCloudFeedback(null);
      await cloudZeroMutation.mutateAsync();
      setCloudFeedback({
        tone: 'info',
        message: 'Cloud Zero 騾｣謳ｺ繝｡繝ｼ繝ｫ騾∽ｿ｡繧定ｦ∵ｱゅ＠縺ｾ縺励◆縲・,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Cloud Zero 騾｣謳ｺ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・;
      setCloudFeedback({
        tone: 'danger',
        message,
      });
    }
  };

  const serverInfo = serverInfoQuery.data;

  return (
    <Stack gap={20}>
      <SurfaceCard>
        <Stack gap={16}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>繧ｷ繧ｹ繝・Β險ｭ螳・/h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              譁ｽ險ｭ諠・ｱ繝ｻ繝ｩ繧､繧ｻ繝ｳ繧ｹ繝ｻCloud Zero 騾｣謳ｺ繧堤ｮ｡逅・＠縺ｾ縺吶・            </p>
          </div>
          <TabNav>
            <Button
              size="sm"
              variant={activeTab === 'basic' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('basic')}
            >
              蝓ｺ譛ｬ諠・ｱ
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'license' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('license')}
            >
              繝ｩ繧､繧ｻ繝ｳ繧ｹ
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'cloud' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('cloud')}
            >
              Cloud Zero 騾｣謳ｺ
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'phr' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('phr')}
            >
              PHR 邂｡逅・            </Button>
          </TabNav>
        </Stack>
      </SurfaceCard>

      {activeTab === 'basic' ? (
        <Stack gap={20}>
          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>譁ｽ險ｭ諠・ｱ</SectionTitle>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                譁ｽ險ｭ蜷阪ｄ菴乗園縲・｣邨｡蜈医↑縺ｩ縺ｮ諠・ｱ繧呈峩譁ｰ縺ｧ縺阪∪縺吶・              </p>
              {facilityFeedback ? <FeedbackBanner tone={facilityFeedback.tone}>{facilityFeedback.message}</FeedbackBanner> : null}
              <FormGrid>
                <TextField
                  label="譁ｽ險ｭ蜷・
                  value={facilityForm.facilityName}
                  onChange={(event) => handleFacilityChange('facilityName', event.currentTarget.value)}
                />
                <TextField
                  label="驛ｵ萓ｿ逡ｪ蜿ｷ"
                  value={facilityForm.zipCode}
                  onChange={(event) => handleFacilityChange('zipCode', event.currentTarget.value)}
                />
                <TextField
                  label="菴乗園"
                  value={facilityForm.address}
                  onChange={(event) => handleFacilityChange('address', event.currentTarget.value)}
                />
                <TextField
                  label="髮ｻ隧ｱ逡ｪ蜿ｷ"
                  value={facilityForm.telephone}
                  onChange={(event) => handleFacilityChange('telephone', event.currentTarget.value)}
                />
                <TextField
                  label="FAX"
                  value={facilityForm.facsimile}
                  onChange={(event) => handleFacilityChange('facsimile', event.currentTarget.value)}
                />
                <TextField
                  label="Web 繧ｵ繧､繝・
                  value={facilityForm.url}
                  onChange={(event) => handleFacilityChange('url', event.currentTarget.value)}
                />
              </FormGrid>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleFacilitySubmit}
                  isLoading={facilityMutation.isPending}
                  disabled={!baselineFacility}
                >
                  譁ｽ險ｭ諠・ｱ繧剃ｿ晏ｭ・                </Button>
              </div>
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>譁ｰ隕乗命險ｭ邂｡逅・・匳骭ｲ</SectionTitle>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                譁ｰ縺励＞譁ｽ險ｭ縺ｨ邂｡逅・・い繧ｫ繧ｦ繝ｳ繝医ｒ荳諡ｬ縺ｧ逋ｻ骭ｲ縺励∪縺吶ゆｻｮ繝代せ繝ｯ繝ｼ繝峨・逋ｻ骭ｲ蠕後↓蛻ｩ逕ｨ閠・∈蜈ｱ譛峨＠縺ｦ縺上□縺輔＞縲・              </p>
              {facilityAdminFeedback ? (
                <FeedbackBanner tone={facilityAdminFeedback.tone}>{facilityAdminFeedback.message}</FeedbackBanner>
              ) : null}
              <FormGrid>
                <TextField
                  label="譁ｽ險ｭ蜷・
                  value={facilityAdminForm.facilityName}
                  onChange={(event) => handleFacilityAdminChange('facilityName', event.currentTarget.value)}
                />
                <TextField
                  label="驛ｵ萓ｿ逡ｪ蜿ｷ"
                  value={facilityAdminForm.facilityZipCode}
                  onChange={(event) => handleFacilityAdminChange('facilityZipCode', event.currentTarget.value)}
                />
                <TextField
                  label="菴乗園"
                  value={facilityAdminForm.facilityAddress}
                  onChange={(event) => handleFacilityAdminChange('facilityAddress', event.currentTarget.value)}
                />
                <TextField
                  label="髮ｻ隧ｱ逡ｪ蜿ｷ"
                  value={facilityAdminForm.facilityTelephone}
                  onChange={(event) => handleFacilityAdminChange('facilityTelephone', event.currentTarget.value)}
                />
                <TextField
                  label="FAX"
                  value={facilityAdminForm.facilityFacsimile}
                  onChange={(event) => handleFacilityAdminChange('facilityFacsimile', event.currentTarget.value)}
                />
                <TextField
                  label="Web 繧ｵ繧､繝・
                  value={facilityAdminForm.facilityUrl}
                  onChange={(event) => handleFacilityAdminChange('facilityUrl', event.currentTarget.value)}
                />
              </FormGrid>
              <FormGrid>
                <TextField
                  label="邂｡逅・・Θ繝ｼ繧ｶ繝ｼ ID"
                  value={facilityAdminForm.userId}
                  onChange={(event) => handleFacilityAdminChange('userId', event.currentTarget.value)}
                />
                <TextField
                  type="password"
                  label="莉ｮ繝代せ繝ｯ繝ｼ繝・
                  value={facilityAdminForm.password}
                  onChange={(event) => handleFacilityAdminChange('password', event.currentTarget.value)}
                />
                <TextField
                  label="蟋・
                  value={facilityAdminForm.sirName}
                  onChange={(event) => handleFacilityAdminChange('sirName', event.currentTarget.value)}
                />
                <TextField
                  label="蜷・
                  value={facilityAdminForm.givenName}
                  onChange={(event) => handleFacilityAdminChange('givenName', event.currentTarget.value)}
                />
                <TextField
                  label="繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ"
                  value={facilityAdminForm.email}
                  onChange={(event) => handleFacilityAdminChange('email', event.currentTarget.value)}
                />
              </FormGrid>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleFacilityAdminSubmit}
                  isLoading={facilityAdminMutation.isPending}
                >
                  譁ｽ險ｭ邂｡逅・・ｒ逋ｻ骭ｲ
                </Button>
              </div>
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>繧ｵ繝ｼ繝舌・繧ｹ繝・・繧ｿ繧ｹ</SectionTitle>
              {serverInfoQuery.isLoading ? (
                <EmptyState>繧ｵ繝ｼ繝舌・諠・ｱ繧貞叙蠕励＠縺ｦ縺・∪縺吮ｦ</EmptyState>
              ) : serverInfo ? (
                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>JMARI 繧ｳ繝ｼ繝・/InfoLabel>
                    <InfoValue>{serverInfo.jamriCode || '譛ｪ險ｭ螳・}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>CLAIM 謗･邯・/InfoLabel>
                    <InfoValue>{serverInfo.claimConnection || '譛ｪ險ｭ螳・}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Cloud Zero</InfoLabel>
                    <InfoValue>
                      {serverInfo.cloudZeroStatus ? (
                        <StatusBadge tone="info">{serverInfo.cloudZeroStatus}</StatusBadge>
                      ) : (
                        '譛ｪ險ｭ螳・
                      )}
                    </InfoValue>
                  </InfoCard>
                </InfoGrid>
              ) : (
                <EmptyState>繧ｵ繝ｼ繝舌・諠・ｱ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・/EmptyState>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>遞ｼ蜒咲憾豕・/SectionTitle>
              {activitiesQuery.isLoading ? (
                <EmptyState>遞ｼ蜒咲憾豕√ｒ髮・ｨ医＠縺ｦ縺・∪縺吮ｦ</EmptyState>
              ) : activitiesQuery.data && activitiesQuery.data.length > 0 ? (
                <ActivityTable>
                  <thead>
                    <tr>
                      <th>譛滄俣</th>
                      <th>謔｣閠・焚</th>
                      <th>譚･髯｢莉ｶ謨ｰ</th>
                      <th>繧ｫ繝ｫ繝・ｽ懈・</th>
                      <th>讀懈渊邨先棡</th>
                      <th>險ｺ譁ｭ譖ｸ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activitiesQuery.data.map((activity: ActivityModel, index: number) => (
                      <tr key={`${activity.flag ?? 'M'}-${index}`}>
                        <td>{formatActivityLabel(activity)}</td>
                        <td>{formatNumber(activity.numOfPatients)}</td>
                        <td>{formatNumber(activity.numOfPatientVisits)}</td>
                        <td>{formatNumber(activity.numOfKarte)}</td>
                        <td>{formatNumber(activity.numOfLabTests)}</td>
                        <td>{formatNumber(activity.numOfLetters)}</td>
                      </tr>
                    ))}
                  </tbody>
                </ActivityTable>
              ) : (
                <EmptyState>遞ｼ蜒咲憾豕√・繝・・繧ｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・/EmptyState>
              )}
            </Stack>
          </SurfaceCard>
        </Stack>
      ) : null}

      {activeTab === 'license' ? (
        <SurfaceCard>
          <Stack gap={16}>
            <SectionTitle>繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ</SectionTitle>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              譁ｰ縺励＞繝ｩ繧､繧ｻ繝ｳ繧ｹ UID 繧貞・蜉帙＠縲∫匳骭ｲ遶ｯ譛ｫ謨ｰ繧呈峩譁ｰ縺励∪縺吶・            </p>
            {licenseFeedback ? <FeedbackBanner tone={licenseFeedback.tone}>{licenseFeedback.message}</FeedbackBanner> : null}
            <TextField
              label="繝ｩ繧､繧ｻ繝ｳ繧ｹ UID"
              placeholder="萓・ XXXX-XXXX-XXXX-XXXX"
              value={licenseToken}
              onChange={(event) => {
                setLicenseToken(event.currentTarget.value);
                setLicenseFeedback(null);
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={handleSubmitLicense}
                isLoading={licenseMutation.isPending}
              >
                繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ
              </Button>
              <Button variant="ghost" onClick={() => setLicenseToken('')} disabled={licenseMutation.isPending}>
                繧ｯ繝ｪ繧｢
              </Button>
            </div>
          </Stack>
        </SurfaceCard>
      ) : null}

      {activeTab === 'cloud' ? (
        <SurfaceCard>
          <Stack gap={16}>
            <SectionTitle>Cloud Zero 騾｣謳ｺ</SectionTitle>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Cloud Zero 騾｣謳ｺ繝｡繝ｼ繝ｫ繧呈焔蜍輔〒騾∽ｿ｡縺励∵怦谺｡蛻ｩ逕ｨ迥ｶ豕√ｒ蝣ｱ蜻翫＠縺ｾ縺吶・            </p>
            {cloudFeedback ? <FeedbackBanner tone={cloudFeedback.tone}>{cloudFeedback.message}</FeedbackBanner> : null}
            <Button
              onClick={handleTriggerCloudZero}
              isLoading={cloudZeroMutation.isPending}
            >
              騾｣謳ｺ繝｡繝ｼ繝ｫ繧帝∽ｿ｡
            </Button>
            {serverInfo?.cloudZeroStatus ? (
              <InfoCard>
                <InfoLabel>迴ｾ蝨ｨ縺ｮ繧ｹ繝・・繧ｿ繧ｹ</InfoLabel>
                <InfoValue>{serverInfo.cloudZeroStatus}</InfoValue>
              </InfoCard>
            ) : null}
          </Stack>
        </SurfaceCard>
      ) : null}

      {activeTab === 'phr' ? <PhrManagementPanel facilityId={facilityId} /> : null}
    </Stack>
  );
};
