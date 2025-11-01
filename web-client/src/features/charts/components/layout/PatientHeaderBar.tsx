import { forwardRef, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { determineSafetyTone } from '@/features/charts/utils/caution-tone';

interface PatientHeaderBarProps {
  patient: PatientVisitSummary | null;
  chiefComplaint: string;
  onChiefComplaintChange: (value: string) => void;
  primaryDiagnosis: string;
  onPrimaryDiagnosisChange: (value: string) => void;
  onPrimaryDiagnosisCommit: (value: string) => void;
  diagnosisTags: string[];
  onAddDiagnosisTag: (value: string) => void;
  onRemoveDiagnosisTag: (value: string) => void;
  visitPurpose?: string | null;
  paymentCategory?: string | null;
  emergencyContact?: string | null;
  patientPhotoUrl?: string | null;
  cautionFlags: string[];
  onToggleLock: () => void;
  isLockedByMe: boolean;
  isLockedByOther: boolean;
  isLockPending: boolean;
  onOpenSearch: () => void;
  elapsedTimeLabel: string;
  isTimerRunning: boolean;
  searchShortcutHint?: string;
  canEdit: boolean;
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: var(--charts-header-height, 76px);
  display: grid;
  grid-template-columns: clamp(240px, 24%, 320px) minmax(0, 1fr) clamp(320px, 28%, 380px);
  grid-template-rows: auto auto;
  align-items: start;
  gap: 12px 24px;
  padding: 12px 32px;
  background: ${({ theme }) => theme.palette.surface};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  box-shadow: 0 2px 12px rgba(20, 31, 44, 0.08);

  @media (max-width: 1240px) {
    grid-template-columns: clamp(220px, 30%, 300px) minmax(0, 1fr) clamp(280px, 30%, 340px);
    padding: 12px 24px;
  }

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(3, auto);
    gap: 16px;
  }
`;

const IdentitySection = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-row: auto;
  }
`;

const PhotoFrame = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.08);
`;

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PhotoFallback = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.primary};
`;

const IdentityContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
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

const InfoList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const InfoItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  font-size: 0.78rem;
  color: ${({ theme }) => theme.palette.textMuted};
  max-width: 100%;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.primary};
  white-space: nowrap;
`;

const InfoValue = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContextSection = styled.div`
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`;

const FieldLabel = styled.span`
  flex: 0 0 auto;
  width: 64px;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const InlineButton = styled(Button)`
  min-width: 0;
  height: 36px;
  padding: 0 14px;
  font-size: 0.9rem;
`;

const UtilitiesBlock = styled.div`
  grid-column: 3;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-column: 1;
    grid-row: auto;
  }
`;

const TimerDisplay = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 0.85rem;
  color: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.textMuted)};
  font-weight: 600;

  @media (max-width: 1100px) {
    justify-content: flex-start;
  }
`;

const TimerDot = styled.span<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  box-shadow: ${({ $active }) => ($active ? '0 0 0 6px rgba(59, 130, 246, 0.12)' : 'none')};
`;

const SearchRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;

  @media (max-width: 1100px) {
    justify-content: flex-start;
  }
`;

const SearchButton = styled(Button)`
  height: 36px;
  padding: 0 16px;
  font-size: 0.9rem;
`;

const ShortcutHint = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const UtilitiesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SectionTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  text-align: right;

  @media (max-width: 1100px) {
    text-align: left;
  }
`;

const CautionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;

  @media (max-width: 1100px) {
    justify-content: flex-start;
  }
`;

const CautionPlaceholder = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const LockRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;

  @media (max-width: 1100px) {
    justify-content: flex-start;
  }
`;

const LockButton = styled(Button)`
  height: 36px;
  min-width: 120px;
  padding: 0 18px;
  font-size: 0.9rem;
  font-weight: 600;
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
      primaryDiagnosis,
      onPrimaryDiagnosisChange,
      onPrimaryDiagnosisCommit,
      diagnosisTags,
      onAddDiagnosisTag,
      onRemoveDiagnosisTag,
      visitPurpose,
      paymentCategory,
      emergencyContact,
      patientPhotoUrl,
      cautionFlags,
      onToggleLock,
      isLockedByMe,
      isLockedByOther,
      isLockPending,
      onOpenSearch,
      elapsedTimeLabel,
      isTimerRunning,
      searchShortcutHint,
      canEdit,
    },
    complaintInputRef,
  ) => {
    const [tagDraft, setTagDraft] = useState('');

    const age = useMemo(() => calculateAge(patient?.birthday), [patient?.birthday]);
    const initials = useMemo(() => {
      const name = patient?.fullName?.trim();
      if (!name) {
        return '??';
      }
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        const first = parts[0]?.charAt(0) ?? '';
        const second = parts[1]?.charAt(0) ?? '';
        const combined = `${first}${second}`.trim();
        return combined || name.slice(0, Math.min(2, name.length));
      }
      return name.slice(0, Math.min(2, name.length));
    }, [patient?.fullName]);
    const infoEntries = useMemo(
      () => [
        { label: '来院目的', value: visitPurpose?.trim() || '未登録' },
        { label: '支払区分', value: paymentCategory?.trim() || '未登録' },
        { label: '緊急連絡先', value: emergencyContact?.trim() || '未登録' },
      ],
      [emergencyContact, paymentCategory, visitPurpose],
    );
    const searchHint = (searchShortcutHint?.trim() || 'F3').toUpperCase();

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
        <IdentitySection>
          <PhotoFrame>
            {patientPhotoUrl ? (
              <PhotoImage src={patientPhotoUrl} alt={`${patient?.fullName ?? '患者'}の顔写真`} />
            ) : (
              <PhotoFallback aria-hidden="true">{initials}</PhotoFallback>
            )}
          </PhotoFrame>
          <IdentityContent>
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
            <InfoList>
              {infoEntries.map((entry) => (
                <InfoItem key={entry.label} title={entry.value}>
                  <InfoLabel>{entry.label}</InfoLabel>
                  <InfoValue>{entry.value}</InfoValue>
                </InfoItem>
              ))}
            </InfoList>
          </IdentityContent>
        </IdentitySection>

        <ContextSection>
          <FieldStack>
            <FieldRow>
              <FieldLabel>主訴</FieldLabel>
              <InlineInput
                ref={complaintInputRef}
                value={chiefComplaint}
                onChange={(event) => onChiefComplaintChange(event.currentTarget.value)}
                placeholder="例：動悸がする、咳が続く"
                aria-label="主訴"
                disabled={!canEdit}
              />
            </FieldRow>
            <FieldRow>
              <FieldLabel>主病名</FieldLabel>
              <InlineInput
                value={primaryDiagnosis}
                onChange={(event) => onPrimaryDiagnosisChange(event.currentTarget.value)}
                onBlur={(event) => onPrimaryDiagnosisCommit(event.currentTarget.value)}
                onKeyDown={(event) => {
                  const composing =
                    'isComposing' in event.nativeEvent &&
                    Boolean((event.nativeEvent as { isComposing?: boolean }).isComposing);
                  if (event.key === 'Enter' && !composing) {
                    event.preventDefault();
                    onPrimaryDiagnosisCommit(event.currentTarget.value);
                  }
                }}
                placeholder="例：細菌性肺炎"
                aria-label="主病名"
                disabled={!canEdit}
              />
            </FieldRow>
          </FieldStack>
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
                  const composing =
                    'isComposing' in event.nativeEvent &&
                    Boolean((event.nativeEvent as { isComposing?: boolean }).isComposing);
                  if (event.key === 'Enter' && !composing) {
                    event.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <InlineButton type="button" variant="ghost" onClick={handleAddTag} disabled={!canEdit}>
                追加
              </InlineButton>
            </TagsRow>
          </TagsBlock>
        </ContextSection>

        <UtilitiesBlock>
          <TimerDisplay $active={isTimerRunning} aria-live="polite">
            <TimerDot $active={isTimerRunning} />
            <span>診察経過 {elapsedTimeLabel}</span>
          </TimerDisplay>
          <SearchRow>
            <SearchButton type="button" variant="secondary" onClick={onOpenSearch}>
              グローバル検索
            </SearchButton>
            <ShortcutHint>ショートカット: {searchHint}</ShortcutHint>
          </SearchRow>
          <UtilitiesSection>
            <SectionTitle>注意</SectionTitle>
            <CautionRow role="list" aria-label="注意フラグ">
              {cautionFlags.length > 0 ? (
                cautionFlags.map((flag) => (
                  <StatusBadge key={flag} tone={determineSafetyTone(flag)} role="listitem">
                    {flag}
                  </StatusBadge>
                ))
              ) : (
                <CautionPlaceholder>注意フラグはありません</CautionPlaceholder>
              )}
            </CautionRow>
          </UtilitiesSection>
          <LockRow>
            <LockButton
              type="button"
              variant={isLockedByMe ? 'secondary' : 'primary'}
              onClick={onToggleLock}
              disabled={!canEdit || isLockPending || isLockedByOther}
            >
              {isLockedByMe ? '診察終了' : '診察開始'}
            </LockButton>
            {isLockedByOther ? <StatusBadge tone="danger">他端末で編集中</StatusBadge> : null}
          </LockRow>
        </UtilitiesBlock>
      </Header>
    );
  },
);

PatientHeaderBar.displayName = 'PatientHeaderBar';
