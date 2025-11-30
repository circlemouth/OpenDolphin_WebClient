import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, StatusBadge, SurfaceCard } from '@/components';
import type { FacilityScheduleEntry } from '@/features/schedule/api/facility-schedule-api';
import { buildRunIdHistory } from '@/libs/runId';

interface ScheduleReservationDialogProps {
  entry: FacilityScheduleEntry;
  selectedDate: string;
  onClose: () => void;
  onCreateDocument: (sendClaim: boolean) => void;
  onDeleteReservation: () => void;
  onOpenChart?: () => void;
  isCreating: boolean;
  isDeleting: boolean;
  isCreateDisabled: boolean;
  feedbackMessage?: string | null;
  errorMessage?: string | null;
  runId?: string;
  statusLabel: string;
  statusTone: 'neutral' | 'info' | 'warning';
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1200;
`;

const Dialog = styled(SurfaceCard)`
  max-width: 720px;
  width: 100%;
  display: grid;
  gap: 16px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  p {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.palette.textMuted};
    font-size: 0.85rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  gap: 12px;

  @media (min-width: 720px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const Section = styled.section`
  display: grid;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Field = styled.div`
  display: grid;
  gap: 4px;
  font-size: 0.95rem;

  span {
    color: ${({ theme }) => theme.palette.textMuted};
    font-size: 0.8rem;
  }
`;

const DangerZone = styled.div`
  padding: 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.dangerSubtle};
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const Message = styled.p<{ $tone: 'info' | 'danger' }>`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.success : theme.palette.danger)};
`;

const PanelCard = styled(SurfaceCard)`
  padding: 12px 14px;
  display: grid;
  gap: 8px;
`;

const HistoryList = styled.div`
  display: grid;
  gap: 8px;
`;

const HistoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  font-size: 0.9rem;
`;

const HistoryInfo = styled.div`
  display: grid;
  gap: 2px;
`;

const RunIdList = styled.div`
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
`;

const RunIdItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollapseSummary = styled.summary`
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 6px;
`;

const ConfirmInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.95rem;
`;


const SCHEDULE_EVIDENCE = 'docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule';
const CHART_LINK_EVIDENCE =
  'docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule-chart-link';
const OPERATION_HISTORY_EVIDENCE =
  'docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule-operation-history';

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};


type OperationHistoryEntry = {
  action: string;
  description: string;
  timestamp?: string | null;
  runId?: string;
  evidencePath?: string;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '---';
  }
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

export const ScheduleReservationDialog = ({
  entry,
  selectedDate,
  onClose,
  onCreateDocument,
  onDeleteReservation,
  onOpenChart,
  isCreating,
  isDeleting,
  isCreateDisabled,
  feedbackMessage,
  errorMessage,
  runId,
  statusLabel,
  statusTone,
}: ScheduleReservationDialogProps) => {
  const [sendClaim, setSendClaim] = useState(false);

  const lastDocument = useMemo(() => formatDateTime(entry.lastDocumentDate ?? null), [entry.lastDocumentDate]);
  const reservationTime = useMemo(() => formatTime(entry.scheduledAt), [entry.scheduledAt]);

  const disableCreate = isCreateDisabled || Boolean(entry.lastDocumentDate);

  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [reviewedEvidence, setReviewedEvidence] = useState(false);
  const [patientIdConfirmation, setPatientIdConfirmation] = useState('');
  const [visitIdConfirmation, setVisitIdConfirmation] = useState('');
  const [dangerReady, setDangerReady] = useState(false);
  const patientInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAcknowledgedRisk(false);
    setReviewedEvidence(false);
    setPatientIdConfirmation('');
    setVisitIdConfirmation('');
    setDangerReady(false);
    const timer = setTimeout(() => {
      setDangerReady(true);
      patientInputRef.current?.focus();
    }, 3000);
    return () => clearTimeout(timer);
  }, [entry.visitId]);

  const requiredPatientId = (entry.patientId ?? '').trim();
  const requiredVisitId = String(entry.visitId ?? '').trim();
  const patientIdMatches = patientIdConfirmation.trim() === requiredPatientId;
  const visitIdMatches = visitIdConfirmation.trim() === requiredVisitId;
  const dangerChecklistComplete = acknowledgedRisk && reviewedEvidence;
  const canDangerDelete = dangerReady && patientIdMatches && visitIdMatches && dangerChecklistComplete && !isDeleting;

  const runIdHistory = useMemo(() => buildRunIdHistory(runId), [runId]);

  const operationHistoryEntries = useMemo<OperationHistoryEntry[]>(
    () => {
      const list: OperationHistoryEntry[] = [
        {
          action: '予約登録',
          description: `予約日時: ${formatDateTime(entry.scheduledAt) ?? '不明'}`,
          timestamp: entry.scheduledAt,
          runId,
          evidencePath: OPERATION_HISTORY_EVIDENCE,
        },
      ];
      if (entry.lastDocumentDate) {
        list.push({
          action: 'カルテ生成',
          description: `最終保存: ${formatDateTime(entry.lastDocumentDate) ?? '不明'}`,
          timestamp: entry.lastDocumentDate,
          runId,
          evidencePath: OPERATION_HISTORY_EVIDENCE,
        });
      }
      return list;
    },
    [entry, runId],
  );

  const chartStatusTooltip = useMemo(
    () => ({ runId, status: statusLabel }),
    [runId, statusLabel],
  );

  return (
    <Overlay role="dialog" aria-modal aria-label="予約詳細" onClick={onClose}>
      <Dialog tone="muted" padding="lg" onClick={(event) => event.stopPropagation()}>
        <Header>
          <div>
            <h2>{entry.patientName} の予約詳細</h2>
            <p>
              患者ID: {entry.patientId} / 予約日: {selectedDate} / 予定時刻: {reservationTime}
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            閉じる
          </Button>
        </Header>

        {feedbackMessage ? <Message $tone="info">{feedbackMessage}</Message> : null}
        {errorMessage ? <Message $tone="danger">{errorMessage}</Message> : null}

        <ContentGrid>
          <Section>
            <SectionTitle>基本情報</SectionTitle>
            <Field>
              <span>氏名（カナ）</span>
              <div>
                {entry.patientName}
                {entry.patientKana ? `（${entry.patientKana}）` : ''}
              </div>
            </Field>
            <Field>
              <span>担当医 / 診療科</span>
              <div>
                {entry.doctorName ?? '---'} / {entry.departmentName ?? '---'}
              </div>
            </Field>
            <Field>
              <span>受付メモ</span>
              <div>{entry.memo ?? '---'}</div>
            </Field>
            <Field>
              <span>最終カルテ保存</span>
              <div>{lastDocument ?? '未作成'}</div>
            </Field>
            <Stack direction="row" gap={8} wrap>
              <Button type="button" variant="secondary" size="sm" onClick={onOpenChart} disabled={!onOpenChart || !entry.visitId}>
                カルテを開く
              </Button>
            </Stack>
          </Section>

          <Section>
            <SectionTitle>カルテ連動</SectionTitle>
            <PanelCard tone="muted">
              <SectionTitle as="h4">ChartLinkPanel</SectionTitle>
              <Stack gap={8}>
                <HistoryInfo>
                  <StatusBadge tone={statusTone} tooltipFields={chartStatusTooltip}>
                    {statusLabel}
                  </StatusBadge>
                  <div>
                    <div>
                      担当: {entry.doctorName ?? '---'} / {entry.departmentName ?? '---'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>RUN_ID: {runId ?? '未設定'}</div>
                  </div>
                </HistoryInfo>
                <Stack direction="row" gap={8} wrap>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChart?.()}
                    disabled={!onOpenChart}
                  >
                    Chartsへ遷移
                  </Button>
                  <Button
                    as="a"
                    variant="ghost"
                    size="sm"
                    href={CHART_LINK_EVIDENCE}
                    target="_blank"
                    rel="noreferrer"
                  >
                    証跡を開く
                  </Button>
                </Stack>
              </Stack>
            </PanelCard>
            <PanelCard tone="muted">
              <SectionTitle as="h4">OperationHistoryPanel</SectionTitle>
              <HistoryList>
                {operationHistoryEntries.map((history, index) => (
                  <HistoryRow key={`${history.action}-${history.timestamp ?? index}`}>
                    <HistoryInfo>
                      <strong>{history.action}</strong>
                      <span>{history.description}</span>
                    </HistoryInfo>
                    <Stack direction="row" gap={8} align="center">
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        RUN_ID: {history.runId ?? runId ?? '未設定'}
                      </span>
                      <Button
                        as="a"
                        variant="ghost"
                        size="sm"
                        href={history.evidencePath ?? SCHEDULE_EVIDENCE}
                        target="_blank"
                        rel="noreferrer"
                      >
                        証跡
                      </Button>
                    </Stack>
                  </HistoryRow>
                ))}
              </HistoryList>
            </PanelCard>
            {runIdHistory.length ? (
              <PanelCard tone="muted">
                <details open>
                  <CollapseSummary>RUN_ID 履歴</CollapseSummary>
                  <RunIdList>
                    {runIdHistory.map((historyId) => (
                      <RunIdItem key={historyId} data-run-id={historyId}>
                        <span>{historyId}</span>
                        <a href={SCHEDULE_EVIDENCE} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>
                          証跡
                        </a>
                      </RunIdItem>
                    ))}
                  </RunIdList>
                </details>
              </PanelCard>
            ) : null}
            <Field>
              <span>カルテ生成</span>
              <Stack gap={8}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={sendClaim}
                    onChange={(event) => setSendClaim(event.currentTarget.checked)}
                    disabled={disableCreate || isCreating || isDeleting}
                  />
                  生成後にレセ電送信フラグを有効化する
                </label>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => onCreateDocument(sendClaim)}
                  disabled={disableCreate || isCreating || isDeleting}
                  isLoading={isCreating}
                >
                  予約からカルテ文書を生成
                </Button>
                {disableCreate ? (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    既にカルテが作成済み、または担当者情報が不足しているため生成できません。
                  </p>
                ) : null}
              </Stack>
            </Field>
            <Field>
              <span>予約取消</span>
              <DangerZone role="status" aria-live="polite">
                予約を削除するとスケジュールから完全に除外され、復元できません。受付済みの場合は先に受付一覧と監査証跡を確認してください。
              </DangerZone>
              <Stack gap={8}>
                <label>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>患者ID（再入力）</span>
                  <ConfirmInput
                    ref={patientInputRef}
                    value={patientIdConfirmation}
                    onChange={(event) => setPatientIdConfirmation(event.currentTarget.value)}
                    placeholder={requiredPatientId}
                  />
                </label>
                <label>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>予約ID（再入力）</span>
                  <ConfirmInput
                    value={visitIdConfirmation}
                    onChange={(event) => setVisitIdConfirmation(event.currentTarget.value)}
                    placeholder={requiredVisitId}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={acknowledgedRisk}
                    onChange={(event) => setAcknowledgedRisk(event.currentTarget.checked)}
                  />
                  操作が復元不能であることを認識しました
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={reviewedEvidence}
                    onChange={(event) => setReviewedEvidence(event.currentTarget.checked)}
                  />
                  証跡（<a href={SCHEDULE_EVIDENCE} target="_blank" rel="noreferrer">{SCHEDULE_EVIDENCE}</a>）を確認済みです
                </label>
                {!dangerReady ? (
                  <Message $tone="info">3 秒後に患者ID・予約ID入力欄がフォーカスされます。</Message>
                ) : null}
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => canDangerDelete && onDeleteReservation()}
                  disabled={!canDangerDelete}
                  isLoading={isDeleting}
                  data-run-id={runId ?? 'unknown'}
                >
                  予約を削除
                </Button>
              </Stack>
            </Field>
          </Section>
        </ContentGrid>

        {entry.ownerUuid ? (
          <StatusBadge tone="info">他端末で編集中: {entry.ownerUuid}</StatusBadge>
        ) : null}
      </Dialog>
    </Overlay>
  );
};
