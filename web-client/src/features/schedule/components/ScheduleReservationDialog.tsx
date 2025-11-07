import { useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, StatusBadge, SurfaceCard } from '@/components';
import type { FacilityScheduleEntry } from '@/features/schedule/api/facility-schedule-api';

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
}: ScheduleReservationDialogProps) => {
  const [sendClaim, setSendClaim] = useState(false);

  const lastDocument = useMemo(() => formatDateTime(entry.lastDocumentDate ?? null), [entry.lastDocumentDate]);
  const reservationTime = useMemo(() => formatTime(entry.scheduledAt), [entry.scheduledAt]);

  const disableCreate = isCreateDisabled || Boolean(entry.lastDocumentDate);

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
              <DangerZone>
                予約を削除するとスケジュールから完全に除外され、復元できません。受付済みの場合は先に受付一覧で状態を確認してください。
              </DangerZone>
              <Button
                type="button"
                variant="danger"
                onClick={onDeleteReservation}
                disabled={isDeleting}
                isLoading={isDeleting}
              >
                予約を削除
              </Button>
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
