import { forwardRef, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';

interface PatientHeaderBarProps {
  patient: PatientVisitSummary | null;
  chiefComplaint: string;
  onChiefComplaintChange: (value: string) => void;
  diagnosisTags: string[];
  onAddDiagnosisTag: (value: string) => void;
  onRemoveDiagnosisTag: (value: string) => void;
  cautionFlags: string[];
  onToggleLock: () => void;
  isLockedByMe: boolean;
  isLockedByOther: boolean;
  isLockPending: boolean;
  onOpenSearch: () => void;
  canEdit: boolean;
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  align-items: center;
  gap: 16px;
  padding: 8px 24px;
  height: 64px;
  background: ${({ theme }) => theme.palette.surface};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  box-shadow: 0 2px 12px rgba(20, 31, 44, 0.08);
`;

const PatientBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const PatientName = styled.span`
  font-weight: 700;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PatientMeta = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ComplaintBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const ComplaintLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  border-bottom: 2px solid ${({ theme }) => theme.palette.border};
  padding: 6px 0;
  font-size: 1rem;
  background: transparent;
  color: ${({ theme }) => theme.palette.text};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.palette.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const TagsBlock = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const InlineButton = styled(Button)`
  height: 32px;
  min-width: 0;
  padding: 0 10px;
  font-size: 0.85rem;
`;

const cautionTone = (flag: string) => {
  const normalized = flag.toLowerCase();
  if (normalized.includes('禁') || normalized.includes('重症')) {
    return 'danger' as const;
  }
  if (normalized.includes('アレルギー') || normalized.includes('注意')) {
    return 'warning' as const;
  }
  return 'info' as const;
};

const calculateAge = (birthday?: string) => {
  if (!birthday) {
    return null;
  }
  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

export const PatientHeaderBar = forwardRef<HTMLInputElement, PatientHeaderBarProps>(
  (
    {
      patient,
      chiefComplaint,
      onChiefComplaintChange,
      diagnosisTags,
      onAddDiagnosisTag,
      onRemoveDiagnosisTag,
      cautionFlags,
      onToggleLock,
      isLockedByMe,
      isLockedByOther,
      isLockPending,
      onOpenSearch,
      canEdit,
    },
    complaintInputRef,
  ) => {
    const [tagDraft, setTagDraft] = useState('');

    const age = useMemo(() => calculateAge(patient?.birthday), [patient?.birthday]);

    const handleAddTag = () => {
      const value = tagDraft.trim();
      if (!value) {
        return;
      }
      onAddDiagnosisTag(value);
      setTagDraft('');
    };

    return (
      <Header role="banner" aria-label="患者情報ヘッダー">
        <PatientBlock>
          <PatientName>{patient ? patient.fullName : '患者未選択'}</PatientName>
          <PatientMeta>
            {patient
              ? [
                  patient.patientId ? `ID: ${patient.patientId}` : null,
                  age !== null ? `${age}歳` : null,
                  patient.gender ?? null,
                ]
                  .filter(Boolean)
                  .join(' / ')
              : '受付リストから患者を選択してください'}
          </PatientMeta>
        </PatientBlock>

        <ComplaintBlock>
          <ComplaintLabel>主訴</ComplaintLabel>
          <InlineInput
            ref={complaintInputRef}
            value={chiefComplaint}
            onChange={(event) => onChiefComplaintChange(event.currentTarget.value)}
            placeholder="例：動悸がする、咳が続く"
            aria-label="主訴"
            disabled={!canEdit}
          />
          <InlineButton type="button" variant="secondary" onClick={onOpenSearch}>
            検索 (F3)
          </InlineButton>
        </ComplaintBlock>

        <TagsBlock>
          <TagsRow role="list" aria-label="病名タグ">
            {diagnosisTags.map((tag) => (
              <StatusBadge key={tag} tone="info" role="listitem">
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveDiagnosisTag(tag)}
                  aria-label={`${tag} を削除`}
                  style={{
                    marginLeft: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                  }}
                >
                  ×
                </button>
              </StatusBadge>
            ))}
            <InlineInput
              value={tagDraft}
              onChange={(event) => setTagDraft(event.currentTarget.value)}
              placeholder="病名を追加"
              aria-label="病名タグを追加"
              disabled={!canEdit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <InlineButton type="button" variant="ghost" onClick={handleAddTag} disabled={!canEdit}>
              追加
            </InlineButton>
          </TagsRow>
          <TagsRow role="list" aria-label="注意フラグ">
            {cautionFlags.length > 0 ? (
              cautionFlags.map((flag) => (
                <StatusBadge key={flag} tone={cautionTone(flag)} role="listitem">
                  {flag}
                </StatusBadge>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>注意フラグはありません</span>
            )}
          </TagsRow>
          <TagsRow>
            <InlineButton
              type="button"
              variant={isLockedByMe ? 'secondary' : 'primary'}
              onClick={onToggleLock}
              disabled={!canEdit || isLockPending || isLockedByOther}
            >
              {isLockedByMe ? '診察終了' : '診察開始'}
            </InlineButton>
            {isLockedByOther ? (
              <StatusBadge tone="danger">他端末で編集中</StatusBadge>
            ) : null}
          </TagsRow>
        </TagsBlock>
      </Header>
    );
  },
);

PatientHeaderBar.displayName = 'PatientHeaderBar';
