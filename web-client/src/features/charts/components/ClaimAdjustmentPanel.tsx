import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styled from '@emotion/styled';

import { Button, SelectField, SurfaceCard, TextArea, TextField } from '@/components';
import { formatDateTime, getStatusTone } from '@/features/charts/components/document-timeline-utils';
import { MetadataBadgeRow, MetadataBadge } from '@/features/charts/components/shared/MetadataBadges';
import { searchModules, sendClaimDocument } from '@/features/charts/api/claim-api';
import { fetchDocumentsByIds } from '@/features/charts/api/doc-info-api';
import type { DocInfoSummary, DocumentModelPayload } from '@/features/charts/types/doc';
import type { ModuleModelPayload } from '@/features/charts/types/module';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { AuthSession } from '@/libs/auth/auth-types';
import { formatRestDate } from '@/features/patients/utils/rest-date';

const PanelCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 1.05rem;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const SectionCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const ModuleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.border};
    text-align: left;
  }

  th {
    font-weight: 600;
    background: ${({ theme }) => theme.palette.surfaceMuted};
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const FeedbackBox = styled.div<{ $tone: 'info' | 'danger' }>`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.85rem;
  background: ${({ theme, $tone }) =>
    $tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerSubtle};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger)};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.border : theme.palette.danger ?? '#dc2626')};
`;

const defaultEntities = ['medOrder', 'treatment', 'surgery'];

const formatDateInput = (date: Date) => formatRestDate(date);

const extractErrorMessage = (error: unknown) => {
  if (!error) {
    return '不明なエラーが発生しました。';
  }
  if (error instanceof Error) {
    return error.message || '処理に失敗しました。';
  }
  if (typeof error === 'string') {
    return error;
  }
  return '処理に失敗しました。';
};

const buildClaimPayload = (
  document: DocumentModelPayload,
  context: {
    session: AuthSession | null;
    visit: PatientVisitSummary | null;
    insurance: ParsedHealthInsurance | null;
  },
): DocumentModelPayload => {
  const now = new Date().toISOString();
  const source = document.docInfoModel;

  const updatedDocInfo: DocInfoSummary = {
    ...source,
    confirmDate: now,
    claimDate: now,
    sendClaim: true,
    facilityName: context.session?.userProfile?.facilityName ?? source.facilityName,
    creatorLicense: context.session?.userProfile?.licenseName ?? source.creatorLicense ?? null,
    createrLisence: context.session?.userProfile?.licenseName ?? source.createrLisence ?? null,
    patientId: context.visit?.patientId ?? source.patientId,
    patientName: context.visit?.fullName ?? source.patientName,
    patientGender: context.visit?.gender ?? source.patientGender,
    healthInsuranceGUID:
      context.insurance?.guid ?? context.visit?.insuranceUid ?? source.healthInsuranceGUID,
    healthInsurance: context.insurance?.classCode ?? source.healthInsurance,
    healthInsuranceDesc: context.insurance?.description ?? source.healthInsuranceDesc,
    pVTHealthInsuranceModel: context.insurance
      ? {
          uuid: context.insurance.guid ?? null,
          insuranceClass: context.insurance.className ?? context.insurance.description ?? '',
          insuranceClassCode: context.insurance.classCode ?? '',
          insuranceNumber: context.insurance.number ?? '',
          clientGroup: context.insurance.clientGroup ?? '',
          clientNumber: context.insurance.clientNumber ?? '',
          startDate: context.insurance.startDate ?? null,
          expiredDate: context.insurance.expiredDate ?? null,
        }
      : source.pVTHealthInsuranceModel,
  };

  return {
    ...document,
    docInfoModel: updatedDocInfo,
  };
};

type ClaimAdjustmentPanelProps = {
  karteId: number | null;
  docInfos: DocInfoSummary[];
  session: AuthSession | null;
  selectedVisit: PatientVisitSummary | null;
  selectedInsurance: ParsedHealthInsurance | null;
  onClaimSent?: () => void;
};

export const ClaimAdjustmentPanel = ({
  karteId,
  docInfos,
  session,
  selectedVisit,
  selectedInsurance,
  onClaimSent,
}: ClaimAdjustmentPanelProps) => {
  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState<string>(
    formatDateInput(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
  );
  const [toDate, setToDate] = useState<string>(formatDateInput(today));
  const [entityInput, setEntityInput] = useState<string>(defaultEntities.join(', '));

  const [modules, setModules] = useState<ModuleModelPayload[]>([]);
  const [moduleFeedback, setModuleFeedback] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const [selectedDocPk, setSelectedDocPk] = useState<number | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const cachedDocuments = useRef<Map<number, DocumentModelPayload>>(new Map());
  const documentOptions = useMemo(
    () => [
      { value: '', label: '文書を選択' },
      ...docInfos.map((doc) => ({
        value: String(doc.docPk),
        label: `${doc.title ?? '無題'}（${doc.confirmDate ?? '未確定'}）`,
      })),
    ],
    [docInfos],
  );

  const selectedDocInfo = useMemo(
    () => docInfos.find((doc) => doc.docPk === selectedDocPk) ?? null,
    [docInfos, selectedDocPk],
  );

  const moduleSearchMutation = useMutation({
    mutationFn: searchModules,
    onSuccess: (result) => {
      setModules(result);
      if (result.length === 0) {
        setModuleFeedback({ tone: 'info', message: '該当するモジュールはありませんでした。' });
      } else {
        setModuleFeedback({
          tone: 'info',
          message: `${result.length} 件のモジュールを取得しました。`,
        });
      }
    },
    onError: (error) => {
      setModuleFeedback({ tone: 'danger', message: extractErrorMessage(error) });
    },
  });

  const documentFetchMutation = useMutation({
    mutationFn: async (docPk: number) => {
      const documents = await fetchDocumentsByIds([docPk]);
      return documents[0] ?? null;
    },
  });

  const claimMutation = useMutation({
    mutationFn: sendClaimDocument,
    onSuccess: () => {
      setClaimFeedback({
        tone: 'info',
        message: 'CLAIM 再送信を受け付けました。結果はサーバーログで確認してください。',
      });
      if (onClaimSent) {
        onClaimSent();
      }
    },
    onError: (error) => {
      setClaimFeedback({ tone: 'danger', message: extractErrorMessage(error) });
    },
  });

  const handleModuleSearch = async () => {
    if (!karteId) {
      setModuleFeedback({ tone: 'danger', message: 'カルテ情報が取得できていません。' });
      return;
    }

    const entities = entityInput
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (entities.length === 0) {
      setModuleFeedback({ tone: 'danger', message: '検索するエンティティを入力してください。' });
      return;
    }

    setModuleFeedback(null);
    try {
      await moduleSearchMutation.mutateAsync({
        karteId,
        fromDate,
        toDate,
        entities,
      });
    } catch (error) {
      setModuleFeedback({ tone: 'danger', message: extractErrorMessage(error) });
    }
  };

  const ensureDocumentLoaded = async (docPk: number): Promise<DocumentModelPayload | null> => {
    if (cachedDocuments.current.has(docPk)) {
      return cachedDocuments.current.get(docPk) ?? null;
    }
    const document = await documentFetchMutation.mutateAsync(docPk);
    if (document) {
      cachedDocuments.current.set(docPk, document);
    }
    return document;
  };

  const handleSendClaim = async () => {
    if (!selectedDocPk) {
      setClaimFeedback({ tone: 'danger', message: '再送するカルテ文書を選択してください。' });
      return;
    }

    setClaimFeedback(null);

    try {
      const document = await ensureDocumentLoaded(selectedDocPk);
      if (!document) {
        setClaimFeedback({ tone: 'danger', message: 'ドキュメントの取得に失敗しました。' });
        return;
      }

      const payload = buildClaimPayload(document, {
        session,
        visit: selectedVisit,
        insurance: selectedInsurance,
      });

      await claimMutation.mutateAsync(payload);
    } catch (error) {
      setClaimFeedback({ tone: 'danger', message: extractErrorMessage(error) });
    }
  };

  const moduleRows = useMemo(() => modules, [modules]);

  return (
    <PanelCard>
      <PanelHeader>
        <h3>請求調整</h3>
        <p>請求内容の確認や CLAIME 送信の再実行を行います。エンティティを指定してモジュールを検索し、必要に応じて文書単位で CLAIM を再送してください。</p>
      </PanelHeader>

      <SectionCard tone="muted">
        <h4 style={{ margin: 0, fontSize: '1rem' }}>モジュール検索 (GET /karte/moduleSearch)</h4>
        <FieldGrid>
          <TextField
            label="検索開始日"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.currentTarget.value)}
          />
          <TextField
            label="検索終了日"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.currentTarget.value)}
          />
          <TextField
            label="モジュールエンティティ"
            value={entityInput}
            onChange={(event) => setEntityInput(event.currentTarget.value)}
            placeholder="例: medOrder, treatment"
          />
        </FieldGrid>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleModuleSearch}
            disabled={moduleSearchMutation.isPending}
            isLoading={moduleSearchMutation.isPending}
          >
            モジュールを検索
          </Button>
        </div>
        {moduleFeedback ? <FeedbackBox $tone={moduleFeedback.tone}>{moduleFeedback.message}</FeedbackBox> : null}
        {moduleRows.length > 0 ? (
          <ModuleTable>
            <thead>
              <tr>
                <th>スタンプ名</th>
                <th>ロール</th>
                <th>エンティティ</th>
              </tr>
            </thead>
            <tbody>
              {moduleRows.map((module, index) => (
                <tr key={`${module.moduleInfoBean?.stampId ?? 'module'}-${index}`}>
                  <td>{module.moduleInfoBean?.stampName ?? '名称未設定'}</td>
                  <td>{module.moduleInfoBean?.stampRole ?? '―'}</td>
                  <td>{module.moduleInfoBean?.entity ?? '―'}</td>
                </tr>
              ))}
            </tbody>
          </ModuleTable>
        ) : null}
      </SectionCard>

      <SectionCard tone="muted">
        <h4 style={{ margin: 0, fontSize: '1rem' }}>CLAIM 再送信 (PUT /karte/claim)</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
          再送信対象のカルテ文書を選択し、保険情報を確認してから送信してください。送信結果はサーバーログで確認できます。
        </p>
        <FieldGrid>
          <SelectField
            label="カルテ文書"
            options={documentOptions}
            value={selectedDocPk !== null ? String(selectedDocPk) : ''}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setSelectedDocPk(nextValue ? Number.parseInt(nextValue, 10) || null : null);
            }}
          />
          <TextField
            label="適用保険"
            value={
              selectedInsurance
                ? selectedInsurance.description ?? selectedInsurance.label
                : selectedVisit?.insuranceUid ?? ''
            }
            placeholder="保険情報がありません"
            readOnly
          />
        </FieldGrid>
        {selectedDocInfo ? (
          <MetadataBadgeRow>
            <MetadataBadge $tone={getStatusTone(selectedDocInfo.status)}>
              ステータス: {selectedDocInfo.status ?? '---'}
            </MetadataBadge>
            <MetadataBadge>文書ID: {selectedDocInfo.docId}</MetadataBadge>
            <MetadataBadge>バージョン: {selectedDocInfo.versionNumber ?? '―'}</MetadataBadge>
            <MetadataBadge $tone="info">
              確定: {formatDateTime(selectedDocInfo.confirmDate ?? selectedDocInfo.firstConfirmDate ?? null)}
            </MetadataBadge>
            <MetadataBadge $tone="info">
              更新: {formatDateTime(selectedDocInfo.updatedAt ?? selectedDocInfo.recordedAt ?? null)}
            </MetadataBadge>
            <MetadataBadge $tone={selectedDocInfo.sendClaim ? 'info' : 'warning'}>
              CLAIM: {selectedDocInfo.sendClaim ? '送信済み' : '未送信'}
            </MetadataBadge>
            <MetadataBadge>
              保険: {selectedDocInfo.healthInsuranceDesc ?? selectedDocInfo.healthInsurance ?? '―'}
            </MetadataBadge>
          </MetadataBadgeRow>
        ) : (
          <InlineMessage>CLAIM 再送信対象の文書を選ぶと監査情報が表示されます。</InlineMessage>
        )}
        <TextArea
          label="送信メモ"
          placeholder="送信理由や補足事項をメモできます（任意）"
          rows={2}
          style={{ minHeight: 'auto' }}
          readOnly
          value={
            selectedInsurance
              ? `保険種別: ${selectedInsurance.classCode ?? '不明'} / ${selectedInsurance.description ?? selectedInsurance.label}`
              : '保険情報が選択されていません。'
          }
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            type="button"
            variant="primary"
            onClick={handleSendClaim}
            disabled={claimMutation.isPending}
            isLoading={claimMutation.isPending}
          >
            CLAIM を再送信
          </Button>
        </div>
        {claimFeedback ? <FeedbackBox $tone={claimFeedback.tone}>{claimFeedback.message}</FeedbackBox> : null}
      </SectionCard>
    </PanelCard>
  );
};
