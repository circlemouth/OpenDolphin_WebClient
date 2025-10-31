import { useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, SurfaceCard, TextArea, TextField } from '@/components';
import {
  buildNewObservation,
  useObservationMutations,
  useObservations,
} from '@/features/charts/hooks/useObservations';
import type { ObservationModel } from '@/features/charts/types/observation';

type ObservationPanelProps = {
  karteId: number | null;
  userModelId: number | null;
};

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

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const ObservationList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const ObservationRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  align-items: center;

  &:first-of-type {
    border-top: none;
  }

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const ObservationHeaderRow = styled(ObservationRow)`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const FeedbackBox = styled.div<{ $tone: 'info' | 'danger' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.primary : theme.palette.danger ?? '#b91c1c')};
  background: ${({ theme, $tone }) =>
    $tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2'};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#7f1d1d')};
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.85rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '---';
  }
  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const valueLabel = (observation: ObservationModel): string => {
  if (observation.value && observation.unit) {
    return `${observation.value} ${observation.unit}`;
  }
  return observation.value ?? '---';
};

export const ObservationPanel = ({ karteId, userModelId }: ObservationPanelProps) => {
  const [observationFilter, setObservationFilter] = useState('vital');
  const [phenomenonFilter, setPhenomenonFilter] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newPhenomenon, setNewPhenomenon] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const observationsQuery = useObservations({
    karteId,
    observation: observationFilter || null,
    phenomenon: phenomenonFilter || null,
    enabled: Boolean(karteId && (observationFilter || phenomenonFilter)),
  });

  const { createMutation, deleteMutation } = useObservationMutations(
    karteId,
    observationFilter || null,
    phenomenonFilter || null,
    undefined,
  );

  const observations = observationsQuery.data ?? [];

  const sortedObservations = useMemo(
    () =>
      [...observations].sort((a, b) => {
        const left = a.started ? new Date(a.started).getTime() : 0;
        const right = b.started ? new Date(b.started).getTime() : 0;
        return right - left;
      }),
    [observations],
  );

  const handleSubmit = async () => {
    if (!karteId || !userModelId) {
      setFormError('カルテ情報またはユーザー情報が不足しています。');
      return;
    }
    if (!newObservation.trim() || !newPhenomenon.trim()) {
      setFormError('Observation と Phenomenon を入力してください。');
      return;
    }
    setFormError(null);
    const payload = buildNewObservation({
      karteId,
      userModelId,
      observation: newObservation.trim(),
      phenomenon: newPhenomenon.trim(),
      value: newValue.trim() || undefined,
      unit: newUnit.trim() || undefined,
      memo: newMemo.trim() || undefined,
    });
    try {
      await createMutation.mutateAsync([payload]);
      setObservationFilter(newObservation.trim());
      setPhenomenonFilter(newPhenomenon.trim());
      setNewObservation('');
      setNewPhenomenon('');
      setNewValue('');
      setNewUnit('');
      setNewMemo('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '観察記録の登録に失敗しました。';
      setFormError(message);
    }
  };

  const handleDelete = async (observation: ObservationModel) => {
    if (!observation.id) {
      return;
    }
    if (!window.confirm('選択した観察記録を削除しますか？')) {
      return;
    }
    await deleteMutation.mutateAsync([observation.id]);
  };

  return (
    <PanelCard>
      <PanelHeader>
        <h3>隕ｳ蟇溯ｨ倬鹸</h3>
        <p>バイタルなどの観察記録を参照・登録できます。</p>
      </PanelHeader>
      <FilterRow>
        <TextField
          label="Observation"
          value={observationFilter}
          onChange={(event) => setObservationFilter(event.currentTarget.value)}
          placeholder="例: vital, symptom"
        />
        <TextField
          label="Phenomenon"
          value={phenomenonFilter}
          onChange={(event) => setPhenomenonFilter(event.currentTarget.value)}
          placeholder="例: BT, HR"
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => observationsQuery.refetch()}
          isLoading={observationsQuery.isFetching}
        >
          蜀崎ｪｭ霎ｼ
        </Button>
      </FilterRow>
      <SurfaceCard tone="muted">
        <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>譁ｰ縺励＞隕ｳ蟇溘ｒ逋ｻ骭ｲ</h4>
        <FormGrid>
          <TextField
            label="Observation"
            value={newObservation}
            onChange={(event) => setNewObservation(event.currentTarget.value)}
            placeholder="例: vital"
          />
          <TextField
            label="Phenomenon"
            value={newPhenomenon}
            onChange={(event) => setNewPhenomenon(event.currentTarget.value)}
            placeholder="例: BT"
          />
          <TextField
            label="蛟､"
            value={newValue}
            onChange={(event) => setNewValue(event.currentTarget.value)}
            placeholder="例: 36.8"
          />
          <TextField
            label="単位"
            value={newUnit}
            onChange={(event) => setNewUnit(event.currentTarget.value)}
            placeholder="例: ℃"
          />
        </FormGrid>
        <TextArea
          label="繝｡繝｢"
          value={newMemo}
          onChange={(event) => setNewMemo(event.currentTarget.value)}
          rows={2}
        />
        {formError ? <FeedbackBox $tone="danger">{formError}</FeedbackBox> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="button" variant="ghost" onClick={() => {
            setNewObservation('');
            setNewPhenomenon('');
            setNewValue('');
            setNewUnit('');
            setNewMemo('');
            setFormError(null);
          }}>
            繧ｯ繝ｪ繧｢
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!newObservation.trim() || !newPhenomenon.trim()}
            isLoading={createMutation.isPending}
          >
            逋ｻ骭ｲ
          </Button>
        </div>
      </SurfaceCard>
      {observationsQuery.isLoading ? (
        <FeedbackBox $tone="info">観察記録を読み込んでいます…</FeedbackBox>
      ) : observationsQuery.error ? (
        <FeedbackBox $tone="danger">観察記録の取得に失敗しました。</FeedbackBox>
      ) : sortedObservations.length === 0 ? (
        <FeedbackBox $tone="info">該当する観察記録はありません。</FeedbackBox>
      ) : (
        <ObservationList>
          <ObservationHeaderRow>
            <span>観察</span>
            <span>蛟､</span>
            <span>日時</span>
          </ObservationHeaderRow>
          {sortedObservations.map((item) => (
            <ObservationRow key={item.id ?? `${item.observation}-${item.recorded}`}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.observation}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.phenomenon}</div>
                {item.memo ? (
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{item.memo}</div>
                ) : null}
              </div>
              <div>{valueLabel(item)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>{formatDateTime(item.started ?? item.confirmed)}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(item)}
                >
                  蜑企勁
                </Button>
              </div>
            </ObservationRow>
          ))}
        </ObservationList>
      )}
    </PanelCard>
  );
};

