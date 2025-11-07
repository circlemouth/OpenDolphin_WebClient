import styled from '@emotion/styled';
import { useMemo } from 'react';

import { Button, Stack, SurfaceCard } from '@/components';
import type { ReceptionColumnKey } from '@/features/reception/hooks/useReceptionPreferences';

const ColumnList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const Checkbox = styled.input`
  margin-top: 4px;
`;

const Description = styled.span`
  display: block;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.8rem;
`;

const columnOptions: Array<{
  key: ReceptionColumnKey;
  label: string;
  description: string;
}> = [
  {
    key: 'status',
    label: 'ステータス',
    description: '待機／呼出／診察中の状態バッジを表示します。',
  },
  {
    key: 'patientId',
    label: '患者ID',
    description: '診察券番号・患者IDを表示します。',
  },
  {
    key: 'kanaName',
    label: 'ふりがな',
    description: '患者名のふりがなを表示します。',
  },
  {
    key: 'visitDate',
    label: '来院日時',
    description: '受付日時や予約日時を表示します。',
  },
  {
    key: 'memo',
    label: '受付メモ',
    description: '受付メモ欄の内容を一覧に表示します。',
  },
  {
    key: 'safetyNotes',
    label: '安全メモ',
    description: '安全メモ・注意事項のバッジを表示します。',
  },
  {
    key: 'insurance',
    label: '保険情報',
    description: '受付時に選択された保険名を表示します。',
  },
  {
    key: 'doctor',
    label: '担当医',
    description: '担当医コード／氏名を表示します。',
  },
  {
    key: 'owner',
    label: '編集中端末',
    description: 'どの端末がカルテを開いているかを表示します。',
  },
];

interface ColumnConfiguratorProps {
  selected: ReceptionColumnKey[];
  onChange: (columns: ReceptionColumnKey[]) => void;
  onClose?: () => void;
}

export const ColumnConfigurator = ({ selected, onChange, onClose }: ColumnConfiguratorProps) => {
  const selection = useMemo(() => new Set(selected), [selected]);

  const handleToggle = (key: ReceptionColumnKey) => {
    const next = new Set(selection);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    if (next.size === 0) {
      return;
    }
    onChange(Array.from(next));
  };

  return (
    <SurfaceCard tone="muted" padding="lg" role="dialog" aria-label="受付一覧の表示項目設定">
      <Stack gap={16}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>表示項目を選択</h2>
          <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: '0.85rem' }}>
            チェックした項目が受付一覧に表示されます。最低1項目は選択してください。
          </p>
        </div>
        <ColumnList>
          {columnOptions.map((option) => (
            <CheckboxLabel key={option.key}>
              <Checkbox
                type="checkbox"
                checked={selection.has(option.key)}
                onChange={() => handleToggle(option.key)}
              />
              <span>
                {option.label}
                <Description>{option.description}</Description>
              </span>
            </CheckboxLabel>
          ))}
        </ColumnList>
        {onClose ? (
          <div>
            <Button type="button" variant="secondary" onClick={onClose}>
              閉じる
            </Button>
          </div>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
};
