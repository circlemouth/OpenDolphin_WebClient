import { forwardRef, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { determineSafetyTone } from '@/features/charts/utils/caution-tone';

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
  min-height: var(--charts-header-height, 76px);
  display: grid;
  grid-template-columns: clamp(240px, 24%, 320px) minmax(0, 1fr) clamp(320px, 28%, 380px);
  align-items: center;
  gap: 24px;
  padding: 12px 32px;
  background: ${({ theme }) => theme.palette.surface};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  box-shadow: 0 2px 12px rgba(20, 31, 44, 0.08);
  position: relative;
  z-index: 10;
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
  gap: 16px;
  min-width: 0;
`;

const ComplaintLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 12px;
  font-size: 1rem;
  background: ${({ theme }) => theme.palette.surfaceMuted};
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
  gap: 8px;
  align-content: center;
  justify-items: start;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const InlineButton = styled(Button)`
  min-width: 0;
  height: 36px;
  padding: 0 14px;
  font-size: 0.9rem;
`;

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
                <StatusBadge key={flag} tone={determineSafetyTone(flag)} role="listitem">
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
