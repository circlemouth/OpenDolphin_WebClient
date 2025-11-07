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
        message: '施設 ID が解決できません。再度ログインしてください。',
      });
      return;
    }
    if (!phrKeyForm.patientId?.trim()) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: '患者 ID を入力してください。',
      });
      return;
    }
    if (!phrKeyForm.accessKey?.trim() || !phrKeyForm.secretKey?.trim()) {
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'アクセスキーとシークレットキーを入力してください（自動生成も利用できます）。',
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
        message: 'PHR キーを登録しました。',
      });
    } catch (error) {
      console.error(error);
      setPhrKeyFeedback({
        tone: 'danger',
        message: 'PHR キーの登録に失敗しました。',
      });
    }
  };

  const handleFetchContainer = async () => {
    if (facilityUnavailable) {
      setPhrContainerFeedback({
        tone: 'danger',
        message: '施設 ID が解決できません。再度ログインしてください。',
      });
      return;
    }
    const targetPatientId = phrKeyForm.patientId?.trim() || patientIdInput.trim();
    if (!targetPatientId) {
      setPhrContainerFeedback({
        tone: 'danger',
        message: '患者 ID を指定してください。',
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
        message: 'PHR コンテナを取得しました。',
      });
    } catch (error) {
      console.error(error);
      setPhrContainer(null);
      setPhrContainerFeedback({
        tone: 'danger',
        message: 'PHR コンテナの取得に失敗しました。',
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
        message: '患者 ID を指定してください。',
      });
      return;
    }
    try {
      setPhrTextFeedback(null);
      const text = await phrTextMutation.mutateAsync({ patientId: targetPatientId, type: phrTextType });
      setPhrTextContents(text);
      setPhrTextFeedback({
        tone: 'info',
        message: 'テキストデータを取得しました。',
      });
    } catch (error) {
      console.error(error);
      setPhrTextContents('');
      setPhrTextFeedback({
        tone: 'danger',
        message: 'テキストデータの取得に失敗しました。',
      });
    }
  };

  const docList = phrContainer?.docList ?? [];
  const labList = phrContainer?.labList ?? [];

  return (
    <Stack gap={20}>
      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>PHR キー管理</SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            施設に紐づく PHR キーやアクセスキーを検索・生成し、クラウド連携に必要な資格情報を更新します。
          </p>
          {facilityUnavailable ? (
            <FeedbackBanner tone="danger">施設 ID を取得できません。再度ログインしてからやり直してください。</FeedbackBanner>
          ) : null}
          {phrKeyFeedback ? <FeedbackBanner tone={phrKeyFeedback.tone}>{phrKeyFeedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <TextField
              label="患者 ID"
              value={patientIdInput}
              onChange={(event) => setPatientIdInput(event.currentTarget.value)}
              style={{ minWidth: 200 }}
            />
            <Button
              onClick={handleLookupByPatient}
              isLoading={keyByPatientMutation.isPending}
              disabled={facilityUnavailable}
            >
              患者 ID で検索
            </Button>
            <TextField
              label="アクセスキー"
              value={accessKeyInput}
              onChange={(event) => setAccessKeyInput(event.currentTarget.value)}
              style={{ minWidth: 200 }}
            />
            <Button
              onClick={handleLookupByAccessKey}
              isLoading={keyByAccessMutation.isPending}
              disabled={facilityUnavailable}
            >
              アクセスキーで検索
            </Button>
          </Stack>
          <FormGrid>
            <TextField
              label="患者 ID"
              value={phrKeyForm.patientId}
              onChange={(event) => handleKeyFieldChange('patientId', event.currentTarget.value)}
            />
            <TextField
              label="アクセスキー"
              value={phrKeyForm.accessKey}
              onChange={(event) => handleKeyFieldChange('accessKey', event.currentTarget.value)}
            />
            <TextField
              label="シークレットキー"
              value={phrKeyForm.secretKey}
              onChange={(event) => handleKeyFieldChange('secretKey', event.currentTarget.value)}
            />
            <TextField
              label="登録日時 (yyyy-MM-ddTHH:mm:ss)"
              value={phrKeyForm.registeredString ?? ''}
              onChange={(event) => handleKeyFieldChange('registeredString', event.currentTarget.value)}
            />
          </FormGrid>
          <Stack direction="row" gap={12} wrap>
            <Button variant="ghost" onClick={handleGenerateKeys} disabled={facilityUnavailable}>
              ランダムキーを生成
            </Button>
            <Button variant="ghost" onClick={handleSetNow} disabled={facilityUnavailable}>
              登録日時を現在時刻で更新
            </Button>
            <Button
              onClick={handleSavePhrKey}
              isLoading={keyUpsertMutation.isPending}
              disabled={facilityUnavailable}
            >
              PHR キーを保存
            </Button>
          </Stack>
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>PHR コンテナ取得</SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            PHR の文書・検査データを取得し、最新のコンテナ内容を確認できます。JSON でダウンロードして外部システムへ連携する場合は、取得履歴が監査対象となる点にご注意ください。
          </p>
          {phrContainerFeedback ? (
            <FeedbackBanner tone={phrContainerFeedback.tone}>{phrContainerFeedback.message}</FeedbackBanner>
          ) : null}
          <FormGrid>
            <TextField
              label="文書取得開始日 (例: 2025-01-01)"
              placeholder="YYYY-MM-DD"
              value={documentSince}
              onChange={(event) => setDocumentSince(event.currentTarget.value)}
            />
            <TextField
              label="検査取得開始日 (例: 2025-01-01)"
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
              PHR コンテナを取得
            </Button>
            <Button variant="ghost" onClick={handleDownloadContainer} disabled={!phrContainer}>
              JSON をダウンロード
            </Button>
          </Stack>
          {containerMutation.isPending ? (
            <EmptyState>PHR コンテナを取得しています...</EmptyState>
          ) : phrContainer ? (
            <Stack gap={12}>
              <InfoGrid>
                <InfoCard>
                  <InfoLabel>文書件数</InfoLabel>
                  <InfoValue>{docList.length}</InfoValue>
                </InfoCard>
                <InfoCard>
                  <InfoLabel>検査件数</InfoLabel>
                  <InfoValue>{labList.length}</InfoValue>
                </InfoCard>
              </InfoGrid>
              {docList.length > 0 ? (
                <div>
                  <h4 style={{ margin: '16px 0 8px', fontSize: '0.95rem' }}>文書サマリー（最新 5 件）</h4>
                  <ResultTable>
                    <thead>
                      <tr>
                        <th>文書 ID</th>
                        <th>作成日時</th>
                        <th>ステータス</th>
                        <th>担当医</th>
                        <th>バンドル数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docList.slice(0, 5).map((doc, index) => (
                        <tr key={`${doc.catchId ?? 'doc'}-${index}`}>
                          <td>{doc.catchId ?? '---'}</td>
                          <td>{formatTimestamp(doc.started)}</td>
                          <td>{doc.status ?? '---'}</td>
                          <td>{doc.physicianName ?? '---'}</td>
                          <td>{doc.bundles?.length ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </ResultTable>
                </div>
              ) : (
                <EmptyState>文書データはまだありません。</EmptyState>
              )}
              {labList.length > 0 ? (
                <div>
                  <h4 style={{ margin: '16px 0 8px', fontSize: '0.95rem' }}>検査結果サマリー（最新 5 件）</h4>
                  <ResultTable>
                    <thead>
                      <tr>
                        <th>検査 ID</th>
                        <th>採取日時</th>
                        <th>項目数</th>
                        <th>実施施設</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labList.slice(0, 5).map((lab, index) => (
                        <tr key={`${lab.catchId ?? 'lab'}-${index}`}>
                          <td>{lab.catchId ?? '---'}</td>
                          <td>{formatTimestamp(lab.sampleDate)}</td>
                          <td>{lab.numOfItems ?? lab.testItems?.length ?? 0}</td>
                          <td>{lab.facilityName ?? '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </ResultTable>
                </div>
              ) : (
                <EmptyState>検査データはまだありません。</EmptyState>
              )}
            </Stack>
          ) : (
            <EmptyState>PHR コンテナはまだ取得していません。</EmptyState>
          )}
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <SectionTitle>PHR テキスト表示</SectionTitle>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            処方や検査などのテキストデータを取得して内容を確認できます。コピーして共有する際は取り扱いにご注意ください。
          </p>
          {phrTextFeedback ? <FeedbackBanner tone={phrTextFeedback.tone}>{phrTextFeedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <SelectField
              label="取得対象"
              name="phrTextType"
              value={phrTextType}
              onChange={(event) => setPhrTextType(event.currentTarget.value as PhrTextType)}
              options={phrTextOptions}
              style={{ minWidth: 220 }}
            />
            <Button onClick={handleFetchPhrText} isLoading={phrTextMutation.isPending} disabled={facilityUnavailable}>
              テキストを取得
            </Button>
            <Button variant="ghost" onClick={() => setPhrTextContents('')}>
              表示をクリア
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
            {phrTextContents ? phrTextContents : 'テキストはまだ表示されていません。'}
          </div>
        </Stack>
      </SurfaceCard>
    </Stack>
  );
};

const formatNumber = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('ja-JP') : '---';

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
        message: '施設情報の読み込みが完了していません。',
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
        message: '施設情報を更新しました。',
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '施設情報の更新に失敗しました。';
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
        message: '管理者ユーザー ID と仮パスワードを入力してください。',
      });
      return;
    }
    if (!facilityAdminForm.sirName.trim() || !facilityAdminForm.givenName.trim()) {
      setFacilityAdminFeedback({
        tone: 'danger',
        message: '管理者氏名（姓・名）を入力してください。',
      });
      return;
    }
    if (!facilityAdminForm.facilityName.trim()) {
      setFacilityAdminFeedback({
        tone: 'danger',
        message: '新規施設名を入力してください。',
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
        message: `施設 ID ${result.facilityId} / 管理者 ID ${result.userId} を登録しました。`,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '施設管理者の登録に失敗しました。';
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
        message: 'ライセンス UID を入力してください。',
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
          message = 'ライセンスの認証が完了しました。';
          break;
        case 'limit_reached':
          tone = 'danger';
          message = 'ライセンス数の上限に達しました。契約内容をご確認ください。';
          break;
        case 'write_failed':
          tone = 'danger';
          message = 'ライセンスファイルの書き込みに失敗しました。権限とディスクの空き容量を確認してください。';
          break;
        default:
          tone = 'danger';
          message = 'ライセンス認証に失敗しました。UID が正しいか確認してください。';
      }
      setLicenseFeedback({ tone, message });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'ライセンス認証に失敗しました。';
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
        message: 'Cloud Zero 連携メール送信を要求しました。',
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Cloud Zero 連携メールの要求に失敗しました。';
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
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>システム設定</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              施設情報、ライセンス、Cloud Zero 連携、PHR 管理をまとめて設定します。
            </p>
          </div>
          <TabNav>
            <Button
              size="sm"
              variant={activeTab === 'basic' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('basic')}
            >
              基本情報
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'license' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('license')}
            >
              ライセンス
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'cloud' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('cloud')}
            >
              Cloud Zero 連携
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'phr' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('phr')}
            >
              PHR 管理
            </Button>
          </TabNav>
        </Stack>
      </SurfaceCard>

      {activeTab === 'basic' ? (
        <Stack gap={20}>
          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>施設情報</SectionTitle>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                施設名や所在地、連絡先などを更新します。既存情報を読み込んだうえで編集してください。
              </p>
              {facilityFeedback ? <FeedbackBanner tone={facilityFeedback.tone}>{facilityFeedback.message}</FeedbackBanner> : null}
              <FormGrid>
                <TextField
                  label="施設名"
                  value={facilityForm.facilityName}
                  onChange={(event) => handleFacilityChange('facilityName', event.currentTarget.value)}
                />
                <TextField
                  label="郵便番号"
                  value={facilityForm.zipCode}
                  onChange={(event) => handleFacilityChange('zipCode', event.currentTarget.value)}
                />
                <TextField
                  label="住所"
                  value={facilityForm.address}
                  onChange={(event) => handleFacilityChange('address', event.currentTarget.value)}
                />
                <TextField
                  label="電話番号"
                  value={facilityForm.telephone}
                  onChange={(event) => handleFacilityChange('telephone', event.currentTarget.value)}
                />
                <TextField
                  label="FAX"
                  value={facilityForm.facsimile}
                  onChange={(event) => handleFacilityChange('facsimile', event.currentTarget.value)}
                />
                <TextField
                  label="Web サイト URL"
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
                  施設情報を保存
                </Button>
              </div>
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>新規施設管理者登録</SectionTitle>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                新しい施設と管理者アカウントを同時に登録します。必要項目を入力し、登録ボタンを押してください。
              </p>
              {facilityAdminFeedback ? (
                <FeedbackBanner tone={facilityAdminFeedback.tone}>{facilityAdminFeedback.message}</FeedbackBanner>
              ) : null}
              <FormGrid>
                <TextField
                  label="施設名"
                  value={facilityAdminForm.facilityName}
                  onChange={(event) => handleFacilityAdminChange('facilityName', event.currentTarget.value)}
                />
                <TextField
                  label="郵便番号"
                  value={facilityAdminForm.facilityZipCode}
                  onChange={(event) => handleFacilityAdminChange('facilityZipCode', event.currentTarget.value)}
                />
                <TextField
                  label="住所"
                  value={facilityAdminForm.facilityAddress}
                  onChange={(event) => handleFacilityAdminChange('facilityAddress', event.currentTarget.value)}
                />
                <TextField
                  label="電話番号"
                  value={facilityAdminForm.facilityTelephone}
                  onChange={(event) => handleFacilityAdminChange('facilityTelephone', event.currentTarget.value)}
                />
                <TextField
                  label="FAX"
                  value={facilityAdminForm.facilityFacsimile}
                  onChange={(event) => handleFacilityAdminChange('facilityFacsimile', event.currentTarget.value)}
                />
                <TextField
                  label="Web サイト URL"
                  value={facilityAdminForm.facilityUrl}
                  onChange={(event) => handleFacilityAdminChange('facilityUrl', event.currentTarget.value)}
                />
              </FormGrid>
              <FormGrid>
                <TextField
                  label="管理者ユーザー ID"
                  value={facilityAdminForm.userId}
                  onChange={(event) => handleFacilityAdminChange('userId', event.currentTarget.value)}
                />
                <TextField
                  type="password"
                  label="仮パスワード"
                  value={facilityAdminForm.password}
                  onChange={(event) => handleFacilityAdminChange('password', event.currentTarget.value)}
                />
                <TextField
                  label="姓"
                  value={facilityAdminForm.sirName}
                  onChange={(event) => handleFacilityAdminChange('sirName', event.currentTarget.value)}
                />
                <TextField
                  label="名"
                  value={facilityAdminForm.givenName}
                  onChange={(event) => handleFacilityAdminChange('givenName', event.currentTarget.value)}
                />
                <TextField
                  label="メールアドレス"
                  value={facilityAdminForm.email}
                  onChange={(event) => handleFacilityAdminChange('email', event.currentTarget.value)}
                />
              </FormGrid>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleFacilityAdminSubmit}
                  isLoading={facilityAdminMutation.isPending}
                >
                  管理者を登録
                </Button>
              </div>
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>サーバー情報</SectionTitle>
              {serverInfoQuery.isPending ? (
                <EmptyState>サーバー情報を読み込んでいます...</EmptyState>
              ) : serverInfo ? (
                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>JMARI コード</InfoLabel>
                    <InfoValue>{serverInfo.jamriCode || '未設定'}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>CLAIM 接続</InfoLabel>
                    <InfoValue>{serverInfo.claimConnection || '未設定'}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Cloud Zero</InfoLabel>
                    <InfoValue>
                      {serverInfo.cloudZeroStatus ? (
                        <StatusBadge tone="info">{serverInfo.cloudZeroStatus}</StatusBadge>
                      ) : (
                        '未設定'
                      )}
                    </InfoValue>
                  </InfoCard>
                </InfoGrid>
              ) : (
                <EmptyState>サーバー情報を取得できませんでした。</EmptyState>
              )}
            </Stack>
          </SurfaceCard>

          <SurfaceCard>
            <Stack gap={16}>
              <SectionTitle>稼働統計</SectionTitle>
              {activitiesQuery.isPending ? (
                <EmptyState>稼働統計を読み込んでいます...</EmptyState>
              ) : activitiesQuery.data && activitiesQuery.data.length > 0 ? (
                <ActivityTable>
                  <thead>
                    <tr>
                      <th>集計期間</th>
                      <th>患者数</th>
                      <th>来院回数</th>
                      <th>カルテ件数</th>
                      <th>検査件数</th>
                      <th>紹介状件数</th>
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
                <EmptyState>稼働統計データはまだありません。</EmptyState>
              )}
            </Stack>
          </SurfaceCard>
        </Stack>
      ) : null}

      {activeTab === 'license' ? (
        <SurfaceCard>
          <Stack gap={16}>
            <SectionTitle>ライセンス認証</SectionTitle>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              有効なライセンス UID を入力し、認証を実行します。契約更新時は再度登録してください。
            </p>
            {licenseFeedback ? <FeedbackBanner tone={licenseFeedback.tone}>{licenseFeedback.message}</FeedbackBanner> : null}
            <TextField
              label="ライセンス UID"
              placeholder="例: XXXX-XXXX-XXXX-XXXX"
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
                ライセンスを認証
              </Button>
              <Button variant="ghost" onClick={() => setLicenseToken('')} disabled={licenseMutation.isPending}>
                クリア
              </Button>
            </div>
          </Stack>
        </SurfaceCard>
      ) : null}

      {activeTab === 'cloud' ? (
        <SurfaceCard>
          <Stack gap={16}>
            <SectionTitle>Cloud Zero 連携</SectionTitle>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Cloud Zero 連携メールを送信し、初期設定をやり直す場合に利用します。
            </p>
            {cloudFeedback ? <FeedbackBanner tone={cloudFeedback.tone}>{cloudFeedback.message}</FeedbackBanner> : null}
            <Button
              onClick={handleTriggerCloudZero}
              isLoading={cloudZeroMutation.isPending}
            >
              連携メールを送信
            </Button>
            {serverInfo?.cloudZeroStatus ? (
              <InfoCard>
                <InfoLabel>最新ステータス</InfoLabel>
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
