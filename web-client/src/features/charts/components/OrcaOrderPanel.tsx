import { useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, SurfaceCard, TextField } from '@/components';
import type {
  DiseaseMasterEntry,
  DrugInteractionEntry,
  GeneralNameEntry,
  TensuMasterEntry,
} from '@/features/charts/types/orca';
import { useDiseaseSearch, useGeneralNameLookup, useTensuSearch } from '@/features/charts/hooks/useOrcaMasterSearch';
import { useInteractionCheck } from '@/features/charts/hooks/useInteractionCheck';

const SectionHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ToggleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ResultCard = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px;
  background: ${({ theme }) => theme.palette.surface};
`;

const ResultTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const ResultMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  margin-top: 4px;
  white-space: pre-wrap;
`;

const SelectionList = styled.ul`
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.palette.text};
`;

const InlineMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

type OrcaSearchMode = 'tensu' | 'disease' | 'general';

type Selection = {
  code: string;
  name: string;
};

type OrcaOrderPanelProps = {
  disabled?: boolean;
};

const formatTensuMeta = (entry: TensuMasterEntry) => {
  const parts = [
    entry.kana ? `カナ: ${entry.kana}` : null,
    entry.unitName ? `単位: ${entry.unitName}` : null,
    entry.point !== null && entry.point !== undefined ? `点数: ${entry.point}` : null,
    entry.routeFlag ? `経路区分: ${entry.routeFlag}` : null,
    entry.inpatientFlag ? `入院区分: ${entry.inpatientFlag}` : null,
    entry.startDate ? `適用開始: ${entry.startDate}` : null,
    entry.endDate ? `適用終了: ${entry.endDate}` : null,
  ].filter(Boolean);
  return parts.join(' / ');
};

const formatDiseaseMeta = (entry: DiseaseMasterEntry) => {
  const parts = [
    entry.kana ? `カナ: ${entry.kana}` : null,
    entry.icd10 ? `ICD10: ${entry.icd10}` : null,
    entry.validUntil ? `廃止日: ${entry.validUntil}` : null,
  ].filter(Boolean);
  return parts.join(' / ');
};

const formatInteractionLabel = (interaction: DrugInteractionEntry, selections: Selection[]) => {
  const fromName = selections.find((item) => item.code === interaction.code1)?.name ?? interaction.code1;
  const toName = selections.find((item) => item.code === interaction.code2)?.name ?? interaction.code2;
  return `${fromName} × ${toName}`;
};

export const OrcaOrderPanel = ({ disabled }: OrcaOrderPanelProps) => {
  const [mode, setMode] = useState<OrcaSearchMode>('tensu');
  const [keyword, setKeyword] = useState('');
  const [partialMatch, setPartialMatch] = useState(true);
  const [tensuResults, setTensuResults] = useState<TensuMasterEntry[]>([]);
  const [diseaseResults, setDiseaseResults] = useState<DiseaseMasterEntry[]>([]);
  const [generalResult, setGeneralResult] = useState<GeneralNameEntry | null>(null);
  const [lastSearchMode, setLastSearchMode] = useState<OrcaSearchMode>('tensu');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [existingSelections, setExistingSelections] = useState<Selection[]>([]);
  const [candidateSelections, setCandidateSelections] = useState<Selection[]>([]);

  const tensuSearch = useTensuSearch();
  const diseaseSearch = useDiseaseSearch();
  const generalLookup = useGeneralNameLookup();
  const interactionCheck = useInteractionCheck();

  const resetResults = () => {
    setTensuResults([]);
    setDiseaseResults([]);
    setGeneralResult(null);
    setSearchError(null);
  };

  const handleSearch = async () => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearchError('検索キーワードを入力してください');
      return;
    }

    setLastSearchMode(mode);
    resetResults();

    try {
      if (mode === 'tensu') {
        const results = await tensuSearch.mutateAsync({ keyword: trimmed, options: { partialMatch } });
        setTensuResults(results);
        if (results.length === 0) {
          setSearchError('該当する診療行為が見つかりませんでした');
        }
      } else if (mode === 'disease') {
        const results = await diseaseSearch.mutateAsync({ keyword: trimmed, options: { partialMatch } });
        setDiseaseResults(results);
        if (results.length === 0) {
          setSearchError('該当する傷病名が見つかりませんでした');
        }
      } else {
        const result = await generalLookup.mutateAsync({ code: trimmed });
        setGeneralResult(result);
        if (!result) {
          setSearchError('一般名を特定できませんでした');
        }
      }
    } catch (error) {
      console.error('ORCA マスター検索に失敗しました', error);
      setSearchError('検索中にエラーが発生しました。時間をおいて再試行してください');
    }
  };

  const addSelection = (list: 'existing' | 'candidate', item: Selection) => {
    const updater = list === 'existing' ? setExistingSelections : setCandidateSelections;
    updater((prev) => {
      if (prev.some((entry) => entry.code === item.code)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeSelection = (list: 'existing' | 'candidate', code: string) => {
    const updater = list === 'existing' ? setExistingSelections : setCandidateSelections;
    updater((prev) => prev.filter((entry) => entry.code !== code));
  };

  const handleInteractionCheck = async () => {
    interactionCheck.reset();
    await interactionCheck.mutateAsync({
      existingCodes: existingSelections.map((item) => item.code),
      candidateCodes: candidateSelections.map((item) => item.code),
    });
  };

  const renderSearchResults = () => {
    if (lastSearchMode === 'tensu') {
      return tensuResults.map((entry) => (
        <ResultCard key={entry.code}>
          <ResultTitle>
            {entry.code} / {entry.name}
          </ResultTitle>
          <ResultMeta>{formatTensuMeta(entry)}</ResultMeta>
          <ToggleRow>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => addSelection('candidate', { code: entry.code, name: entry.name })}
              disabled={disabled}
            >
              追加予定に入れる
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addSelection('existing', { code: entry.code, name: entry.name })}
            >
              既存処方に追加
            </Button>
          </ToggleRow>
        </ResultCard>
      ));
    }
    if (lastSearchMode === 'disease') {
      return diseaseResults.map((entry) => (
        <ResultCard key={entry.code}>
          <ResultTitle>
            {entry.code} / {entry.name}
          </ResultTitle>
          <ResultMeta>{formatDiseaseMeta(entry)}</ResultMeta>
        </ResultCard>
      ));
    }
    if (generalResult) {
      return (
        <ResultCard key={generalResult.code}>
          <ResultTitle>
            {generalResult.code} / {generalResult.name}
          </ResultTitle>
          <ResultMeta>ORCA 一般名コード照合結果</ResultMeta>
        </ResultCard>
      );
    }
    return null;
  };

  const renderedResults = renderSearchResults();

  return (
    <SurfaceCard>
      <Stack gap={16}>
        <SectionHeader>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>ORCA マスター検索と併用禁忌チェック</h2>
            <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.9rem' }}>
              診療行為・傷病名・一般名を検索し、追加予定のオーダと既存処方を比較して併用禁忌を確認します。
            </p>
          </div>
          <ToggleRow>
            {(['tensu', 'disease', 'general'] as OrcaSearchMode[]).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={mode === value ? 'primary' : 'ghost'}
                onClick={() => setMode(value)}
              >
                {value === 'tensu' ? '診療行為' : value === 'disease' ? '傷病名' : '一般名'}
              </Button>
            ))}
            {mode !== 'general' ? (
              <Button
                type="button"
                size="sm"
                variant={partialMatch ? 'secondary' : 'ghost'}
                onClick={() => setPartialMatch((prev) => !prev)}
              >
                {partialMatch ? '部分一致検索' : '前方一致検索'}
              </Button>
            ) : null}
          </ToggleRow>
          <Stack direction="row" gap={12} wrap>
            <TextField
              label={mode === 'general' ? '一般名コード' : '検索キーワード'}
              placeholder={mode === 'general' ? '例: 6134004' : '名称・カナ・コード'}
              value={keyword}
              onChange={(event) => setKeyword(event.currentTarget.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearch}
              isLoading={tensuSearch.isPending || diseaseSearch.isPending || generalLookup.isPending}
            >
              検索
            </Button>
          </Stack>
          {searchError ? <InlineError>{searchError}</InlineError> : null}
        </SectionHeader>

        {renderedResults ? <ResultList>{renderedResults}</ResultList> : null}

        <SurfaceCard tone="muted">
          <Stack gap={12}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>併用禁忌チェック対象</h3>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>既存処方</h4>
              {existingSelections.length > 0 ? (
                <SelectionList>
                  {existingSelections.map((item) => (
                    <li key={item.code}>
                      {item.code} / {item.name}{' '}
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeSelection('existing', item.code)}>
                        削除
                      </Button>
                    </li>
                  ))}
                </SelectionList>
              ) : (
                <InlineMessage>既存処方コードを追加してください。</InlineMessage>
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>追加予定</h4>
              {candidateSelections.length > 0 ? (
                <SelectionList>
                  {candidateSelections.map((item) => (
                    <li key={item.code}>
                      {item.code} / {item.name}{' '}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSelection('candidate', item.code)}
                      >
                        削除
                      </Button>
                    </li>
                  ))}
                </SelectionList>
              ) : (
                <InlineMessage>検索結果から追加予定のオーダを選択してください。</InlineMessage>
              )}
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleInteractionCheck}
              disabled={
                disabled ||
                interactionCheck.isPending ||
                existingSelections.length === 0 ||
                candidateSelections.length === 0
              }
              isLoading={interactionCheck.isPending}
            >
              併用禁忌を確認
            </Button>
            {interactionCheck.data && interactionCheck.data.length === 0 ? (
              <InlineMessage>併用禁忌は見つかりませんでした。</InlineMessage>
            ) : null}
            {interactionCheck.isError ? (
              <InlineError>併用禁忌チェックに失敗しました。後ほど再試行してください。</InlineError>
            ) : null}
            {interactionCheck.data && interactionCheck.data.length > 0 ? (
              <ResultList>
                {interactionCheck.data.map((entry) => (
                  <ResultCard key={`${entry.code1}-${entry.code2}-${entry.symptomCode ?? ''}`}>
                    <ResultTitle>{formatInteractionLabel(entry, [...existingSelections, ...candidateSelections])}</ResultTitle>
                    <ResultMeta>
                      {entry.symptomDescription ?? '詳細不明'}
                      {entry.symptomCode ? ` / 症状コード: ${entry.symptomCode}` : ''}
                    </ResultMeta>
                  </ResultCard>
                ))}
              </ResultList>
            ) : null}
          </Stack>
        </SurfaceCard>
      </Stack>
    </SurfaceCard>
  );
};
