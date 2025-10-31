import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, Stack, TextField } from '@/components';
import {
  fetchAllPatients,
  fetchCustomPatients,
  fetchPatientCountByPrefix,
} from '@/features/administration/api/patient-export-api';
import type { RawPatientResource } from '@/features/patients/types/patient';

interface FeedbackState {
  tone: 'info' | 'danger';
  message: string;
}

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  border: 1px solid ${({ theme }) => theme.palette.border};

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
    position: sticky;
    top: 0;
  }
`;

const EmptyState = styled.div`
  padding: 24px 0;
  color: ${({ theme }) => theme.palette.textMuted};
  text-align: center;
  font-size: 0.9rem;
`;

const toSafeString = (value?: string | null) => (value ?? '').trim();

const formatDate = (value?: string | null) => {
  const text = toSafeString(value);
  if (!text) {
    return '—';
  }
  if (text.includes('T')) {
    return text.slice(0, 10);
  }
  return text;
};

const formatGender = (resource: RawPatientResource) => toSafeString(resource.genderDesc) || toSafeString(resource.gender) || '—';

const buildCsv = (records: RawPatientResource[]): string => {
  const header = ['患者ID', '氏名', 'カナ', '性別', '生年月日', '電話番号', '住所'];
  const rows = records.map((record) => {
    const address =
      record.simpleAddressModel?.address
        ? `${toSafeString(record.simpleAddressModel?.zipCode)} ${toSafeString(record.simpleAddressModel?.address)}`
        : '';
    return [
      toSafeString(record.patientId),
      toSafeString(record.fullName),
      toSafeString(record.kanaName),
      formatGender(record),
      formatDate(record.birthday),
      toSafeString(record.telephone),
      address.trim(),
    ];
  });
  return [header, ...rows]
    .map((columns) => columns.map((column) => `"${column.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
};

const PatientPreviewTable = ({ records }: { records: RawPatientResource[] }) => {
  if (records.length === 0) {
    return <EmptyState>データはまだ取得されていません。</EmptyState>;
  }
  const preview = records.slice(0, 20);
  return (
    <div style={{ overflowX: 'auto' }}>
      <ResultTable>
        <thead>
          <tr>
            <th>患者ID</th>
            <th>氏名</th>
            <th>カナ</th>
            <th>性別</th>
            <th>生年月日</th>
            <th>最終来院日</th>
          </tr>
        </thead>
        <tbody>
          {preview.map((record) => (
            <tr key={record.id ?? record.patientId ?? Math.random()}>
              <td>{toSafeString(record.patientId) || '—'}</td>
              <td>{toSafeString(record.fullName) || '—'}</td>
              <td>{toSafeString(record.kanaName) || '—'}</td>
              <td>{formatGender(record)}</td>
              <td>{formatDate(record.birthday)}</td>
              <td>{formatDate(record.pvtDate)}</td>
            </tr>
          ))}
        </tbody>
      </ResultTable>
      {records.length > preview.length ? (
        <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b' }}>
          先頭 {preview.length} 件を表示中です。CSV/JSON ダウンロードで全件を取得できます。
        </p>
      ) : null}
    </div>
  );
};

export const PatientDataExportPage = () => {
  const [patients, setPatients] = useState<RawPatientResource[]>([]);
  const [lastQuery, setLastQuery] = useState<'all' | 'custom' | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [customCondition, setCustomCondition] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  const [countFeedback, setCountFeedback] = useState<FeedbackState | null>(null);
  const [countResult, setCountResult] = useState<number | null>(null);

  const fetchAllMutation = useMutation({
    mutationFn: fetchAllPatients,
  });
  const fetchCustomMutation = useMutation({
    mutationFn: fetchCustomPatients,
  });
  const countMutation = useMutation({
    mutationFn: fetchPatientCountByPrefix,
  });

  const totalPatients = patients.length;
  const queryLabel = useMemo(() => {
    if (lastQuery === 'all') {
      return '全件取得結果';
    }
    if (lastQuery === 'custom') {
      return `カスタム条件: ${customCondition.trim() || '(未入力)'}`;
    }
    return 'データ未取得';
  }, [customCondition, lastQuery]);

  const handleFetchAll = async () => {
    try {
      setFeedback(null);
      const result = await fetchAllMutation.mutateAsync();
      setPatients(result);
      setLastQuery('all');
      setFeedback({
        tone: 'info',
        message: `患者データを ${result.length.toLocaleString('ja-JP')} 件取得しました。`,
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: 'danger',
        message: '患者全件データの取得に失敗しました。',
      });
    }
  };

  const handleFetchCustom = async () => {
    const trimmed = customCondition.trim();
    if (!trimmed) {
      setFeedback({
        tone: 'danger',
        message: 'カスタム条件を入力してください。',
      });
      return;
    }
    try {
      setFeedback(null);
      const result = await fetchCustomMutation.mutateAsync(trimmed);
      setPatients(result);
      setLastQuery('custom');
      setFeedback({
        tone: 'info',
        message: `条件「${trimmed}」で ${result.length.toLocaleString('ja-JP')} 件の患者データを取得しました。`,
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: 'danger',
        message: 'カスタム条件による取得に失敗しました。',
      });
    }
  };

  const handleCountPatients = async () => {
    const trimmed = prefixInput.trim();
    if (!trimmed) {
      setCountFeedback({
        tone: 'danger',
        message: '患者 ID 接頭辞を入力してください。',
      });
      return;
    }
    try {
      setCountFeedback(null);
      const count = await countMutation.mutateAsync(trimmed);
      setCountResult(count);
      setCountFeedback({
        tone: 'info',
        message: `接頭辞「${trimmed}」に一致する患者は ${count.toLocaleString('ja-JP')} 件です。`,
      });
    } catch (error) {
      console.error(error);
      setCountFeedback({
        tone: 'danger',
        message: '患者件数の取得に失敗しました。',
      });
    }
  };

  const handleDownloadJson = () => {
    if (patients.length === 0) {
      return;
    }
    const blob = new Blob([JSON.stringify(patients, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `patients_${lastQuery ?? 'export'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (patients.length === 0) {
      return;
    }
    const csv = buildCsv(patients);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `patients_${lastQuery ?? 'export'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap={20}>
      <SurfaceCard>
        <Stack gap={16}>
          <div>
            <SectionTitle>患者データ出力</SectionTitle>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              施設内の患者情報を一括で取得し、CSV/JSON 形式でダウンロードできます。条件を指定した抽出や件数確認にも対応します。
            </p>
          </div>
          <InfoGrid>
            <InfoCard>
              <InfoLabel>取得状況</InfoLabel>
              <InfoValue>
                <StatusBadge tone={lastQuery ? 'info' : 'neutral'}>{queryLabel}</StatusBadge>
              </InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>取得件数</InfoLabel>
              <InfoValue>{totalPatients.toLocaleString('ja-JP')} 件</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>件数確認</InfoLabel>
              <InfoValue>
                {countResult != null ? `${countResult.toLocaleString('ja-JP')} 件` : '未取得'}
              </InfoValue>
            </InfoCard>
          </InfoGrid>
          {feedback ? <FeedbackBanner tone={feedback.tone}>{feedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <Button variant="ghost" onClick={handleDownloadCsv} disabled={patients.length === 0}>
              CSV をダウンロード
            </Button>
            <Button variant="ghost" onClick={handleDownloadJson} disabled={patients.length === 0}>
              JSON をダウンロード
            </Button>
          </Stack>
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>患者データ取得</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            全件取得またはカスタム条件による抽出を実行します。取得後は上部カードでダウンロードできます。
          </p>
          <Stack direction="row" gap={12} wrap>
            <Button
              onClick={handleFetchAll}
              isLoading={fetchAllMutation.isPending}
            >
              患者全件を取得
            </Button>
            <TextField
              label="カスタム条件"
              placeholder="例: withDiagnosis:高血圧"
              value={customCondition}
              onChange={(event) => setCustomCondition(event.currentTarget.value)}
            />
            <Button
              onClick={handleFetchCustom}
              isLoading={fetchCustomMutation.isPending}
            >
              条件で取得
            </Button>
          </Stack>
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>患者件数チェック</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            接頭辞に一致する患者 ID の件数を確認します。ID 発番や移行時の件数確認に利用できます。
          </p>
          {countFeedback ? <FeedbackBanner tone={countFeedback.tone}>{countFeedback.message}</FeedbackBanner> : null}
          <Stack direction="row" gap={12} wrap>
            <TextField
              label="患者 ID 接頭辞"
              placeholder="例: 0001-"
              value={prefixInput}
              onChange={(event) => setPrefixInput(event.currentTarget.value)}
            />
            <Button
              onClick={handleCountPatients}
              isLoading={countMutation.isPending}
            >
              件数を確認
            </Button>
          </Stack>
        </Stack>
      </SurfaceCard>

      <SurfaceCard>
        <Stack gap={16}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>プレビュー</h3>
          <PatientPreviewTable records={patients} />
        </Stack>
      </SurfaceCard>
    </Stack>
  );
};
