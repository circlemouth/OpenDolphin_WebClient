import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import type {
  DiseaseMasterEntry,
  DrugInteractionEntry,
  GeneralNameEntry,
  TensuMasterEntry,
} from '@/features/charts/types/orca';
import {
  useDiseaseSearch,
  useGeneralNameLookup,
  useTensuPointSearch,
  useTensuSearch,
} from '@/features/charts/hooks/useOrcaMasterSearch';
import { useInteractionCheck } from '@/features/charts/hooks/useInteractionCheck';
import type { DecisionSupportMessage } from '@/features/charts/types/decision-support';
import { recordOperationEvent } from '@/libs/audit';
import { shouldBlockOrderBySeverity } from '@/features/charts/utils/interactionSeverity';

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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ResultMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  margin-top: 4px;
  white-space: pre-wrap;
`;

const SeverityBadge = styled(StatusBadge)`
  text-transform: none;
  font-size: 0.75rem;
  letter-spacing: normal;
`;

const AlertSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
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

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  font-size: 0.85rem;
  border: 1px solid ${({ theme }) => theme.palette.border};
`;

type OrcaSearchMode = 'tensu' | 'disease' | 'general';

type Selection = {
  code: string;
  name: string;
};

type OrcaOrderPanelProps = {
  disabled?: boolean;
  onCreateOrder?: (selection: Selection) => Promise<void>;
  initialMode?: OrcaSearchMode;
  onDecisionSupportUpdate?: (messages: DecisionSupportMessage[]) => void;
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

const severityToneMap: Record<NonNullable<DrugInteractionEntry['severity']>, 'danger' | 'warning' | 'info'> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

const severityLabelMap: Record<NonNullable<DrugInteractionEntry['severity']>, string> = {
  critical: '重大',
  warning: '注意',
  info: '参考',
};

export const OrcaOrderPanel = ({
  disabled,
  onCreateOrder,
  initialMode = 'tensu',
  onDecisionSupportUpdate,
}: OrcaOrderPanelProps) => {
  const [mode, setMode] = useState<OrcaSearchMode>(initialMode);
  const [keyword, setKeyword] = useState('');
  const [partialMatch, setPartialMatch] = useState(true);
  const [tensuResults, setTensuResults] = useState<TensuMasterEntry[]>([]);
  const [diseaseResults, setDiseaseResults] = useState<DiseaseMasterEntry[]>([]);
  const [generalResult, setGeneralResult] = useState<GeneralNameEntry | null>(null);
  const [pointMin, setPointMin] = useState('0');
  const [pointMax, setPointMax] = useState('300');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [pointError, setPointError] = useState<string | null>(null);
  const [lastSearchMode, setLastSearchMode] = useState<OrcaSearchMode>('tensu');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [existingSelections, setExistingSelections] = useState<Selection[]>([]);
  const [candidateSelections, setCandidateSelections] = useState<Selection[]>([]);
  const [showMinorAlerts, setShowMinorAlerts] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const tensuSearch = useTensuSearch();
  const tensuPointSearch = useTensuPointSearch();
  const diseaseSearch = useDiseaseSearch();
  const generalLookup = useGeneralNameLookup();
  const interactionCheck = useInteractionCheck();

  const resetResults = () => {
    setTensuResults([]);
    setDiseaseResults([]);
    setGeneralResult(null);
    setSearchError(null);
    setPointError(null);
  };

  const parsePointInput = (value: string) => {
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
      return null;
    }
    const clamped = Math.max(0, Math.min(9999, Math.floor(numeric)));
    return clamped;
  };

  const buildEffectiveDate = () => {
    if (!effectiveDate) {
      return null;
    }
    const parsed = new Date(effectiveDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  const handlePointSearch = async () => {
    const minValue = parsePointInput(pointMin);
    const maxValue = parsePointInput(pointMax);
    const dateValue = buildEffectiveDate();

    if (minValue === null && maxValue === null) {
      setPointError('点数帯を入力してください（0〜9999）');
      return;
    }
    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      setPointError('下限が上限を超えています');
      return;
    }

    setPointError(null);
    setLastSearchMode('tensu');
    resetResults();

    try {
      const results = await tensuPointSearch.mutateAsync({ min: minValue, max: maxValue, date: dateValue });
      setTensuResults(results);
      if (results.length === 0) {
        setSearchError('該当する診療行為が見つかりませんでした');
      }
    } catch (error) {
      console.error('ORCA 点数帯検索に失敗しました', error);
      setSearchError('検索中にエラーが発生しました。時間をおいて再試行してください');
    }
  };

  const applyPointPreset = (preset: { min: number | null; max: number | null }) => {
    if (preset.min !== null) {
      setPointMin(String(preset.min));
    } else {
      setPointMin('');
    }
    if (preset.max !== null) {
      setPointMax(String(preset.max));
    } else {
      setPointMax('');
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
    setShowMinorAlerts(false);
    const result = await interactionCheck.mutateAsync({
      existingCodes: existingSelections.map((item) => item.code),
      candidateCodes: candidateSelections.map((item) => item.code),
    });
    const criticalCount = result.filter((entry) => shouldBlockOrderBySeverity(entry.severity ?? 'info')).length;
    const severity: 'critical' | 'warning' | 'info' =
      criticalCount > 0 ? 'critical' : result.length > 0 ? 'warning' : 'info';
    recordOperationEvent('orca', severity, 'interaction_check', '併用禁忌チェックを実行しました', {
      existingSelections: existingSelections.length,
      candidateSelections: candidateSelections.length,
      totalAlerts: result.length,
      criticalAlerts: criticalCount,
    });
  };

  const handleCreateOrder = async (item: Selection) => {
    if (!onCreateOrder) {
      return;
    }
    try {
      setPendingCode(item.code);
      setOrderError(null);
      await onCreateOrder(item);
      recordOperationEvent('orca', 'info', 'order_create', 'ORCA 検索結果からオーダを追加しました', {
        code: item.code,
      });
    } catch (error) {
      console.error('ORCA オーダの追加に失敗しました', error);
      setOrderError(
        error instanceof Error
          ? error.message
          : 'オーダの追加に失敗しました。ネットワーク状況を確認して再試行してください。',
      );
    } finally {
      setPendingCode(null);
    }
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
            {onCreateOrder ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => void handleCreateOrder({ code: entry.code, name: entry.name })}
                disabled={disabled || pendingCode === entry.code}
                isLoading={pendingCode === entry.code}
              >
                カルテに追加
              </Button>
            ) : null}
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

  const visibleInteractions = useMemo(() => {
    if (!interactionCheck.data) {
      return [];
    }
    if (showMinorAlerts) {
      return interactionCheck.data;
    }
    return interactionCheck.data.filter((entry) => shouldBlockOrderBySeverity(entry.severity ?? 'info'));
  }, [interactionCheck.data, showMinorAlerts]);

  const criticalAlertCount = useMemo(
    () => (interactionCheck.data ?? []).filter((entry) => shouldBlockOrderBySeverity(entry.severity ?? 'info')).length,
    [interactionCheck.data],
  );
  const totalAlerts = interactionCheck.data?.length ?? 0;
  const hasCriticalAlerts = criticalAlertCount > 0;
  const nonCriticalCount = totalAlerts - criticalAlertCount;

  useEffect(() => {
    if (!onDecisionSupportUpdate) {
      return;
    }
    if (!interactionCheck.data || interactionCheck.data.length === 0) {
      onDecisionSupportUpdate([]);
      return () => {
        onDecisionSupportUpdate([]);
      };
    }
    const selections = [...existingSelections, ...candidateSelections];
    const messages: DecisionSupportMessage[] = interactionCheck.data.map((entry) => ({
      id: `${entry.code1}-${entry.code2}-${entry.symptomCode ?? 'none'}`,
      severity: severityToneMap[entry.severity ?? 'info'],
      category: 'interaction',
      headline: formatInteractionLabel(entry, selections),
      detail: entry.symptomDescription ?? undefined,
    }));
    onDecisionSupportUpdate(messages);
    return () => {
      onDecisionSupportUpdate([]);
    };
  }, [candidateSelections, existingSelections, interactionCheck.data, onDecisionSupportUpdate]);

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
              isLoading={
                tensuSearch.isPending || diseaseSearch.isPending || generalLookup.isPending || tensuPointSearch.isPending
              }
            >
              検索
            </Button>
          </Stack>
          {mode === 'tensu' ? (
            <SurfaceCard tone="muted">
              <Stack gap={12}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>点数帯フィルタ（/orca/tensu/ten）</div>
                <Stack direction="row" gap={12} wrap>
                  <TextField
                    label="点数下限"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9999}
                    value={pointMin}
                    onChange={(event) => setPointMin(event.currentTarget.value)}
                    errorMessage={pointError ?? undefined}
                  />
                  <TextField
                    label="点数上限"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9999}
                    value={pointMax}
                    onChange={(event) => setPointMax(event.currentTarget.value)}
                  />
                  <TextField
                    label="評価日 (任意)"
                    type="date"
                    value={effectiveDate}
                    onChange={(event) => setEffectiveDate(event.currentTarget.value)}
                    description="未指定時は本日扱い"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePointSearch}
                    disabled={disabled}
                    isLoading={tensuPointSearch.isPending}
                  >
                    点数帯で検索
                  </Button>
                </Stack>
                <ToggleRow>
                  <Button type="button" size="sm" variant="ghost" onClick={() => applyPointPreset({ min: null, max: 50 })}>
                    50 点以下
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => applyPointPreset({ min: 50, max: 100 })}>
                    50–100 点
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => applyPointPreset({ min: 100, max: 300 })}>
                    100–300 点
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => applyPointPreset({ min: 300, max: null })}>
                    300 点以上
                  </Button>
                </ToggleRow>
                <ToggleRow>
                  {parsePointInput(pointMin) !== null || parsePointInput(pointMax) !== null ? (
                    <FilterBadge>
                      点数帯:{' '}
                      {parsePointInput(pointMin) ?? '-'}–{parsePointInput(pointMax) ?? '上限なし'}
                      点
                    </FilterBadge>
                  ) : null}
                  {effectiveDate ? <FilterBadge>評価日: {effectiveDate}</FilterBadge> : null}
                </ToggleRow>
              </Stack>
            </SurfaceCard>
          ) : null}
          {searchError ? <InlineError>{searchError}</InlineError> : null}
        </SectionHeader>

        {renderedResults ? <ResultList>{renderedResults}</ResultList> : null}

        {orderError && onCreateOrder ? <InlineError>{orderError}</InlineError> : null}

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
            {interactionCheck.isError ? (
              <InlineError>併用禁忌チェックに失敗しました。後ほど再試行してください。</InlineError>
            ) : null}
            {interactionCheck.data ? (
              totalAlerts === 0 ? (
                <InlineMessage>併用禁忌は見つかりませんでした。</InlineMessage>
              ) : (
                <Stack gap={12}>
                  <AlertSummary role="status" aria-live="polite">
                    <div style={{ fontWeight: 600 }}>
                      重大通知 {criticalAlertCount} 件 / 軽微通知 {nonCriticalCount} 件
                    </div>
                    <div>
                      重大通知のみ入力遮断を適用します。
                      {hasCriticalAlerts
                        ? '重大通知に対応後、処方操作を継続してください。'
                        : '軽微通知は情報提供のみで処方操作を遮断しません。'}
                    </div>
                    {nonCriticalCount > 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowMinorAlerts((prev) => !prev)}
                      >
                        {showMinorAlerts ? '重大通知のみ表示' : `軽微な通知 ${nonCriticalCount} 件も表示`}
                      </Button>
                    ) : null}
                  </AlertSummary>
                  {visibleInteractions.length > 0 ? (
                    <ResultList>
                      {visibleInteractions.map((entry) => (
                        <ResultCard key={`${entry.code1}-${entry.code2}-${entry.symptomCode ?? ''}`}>
                          <ResultTitle>
                            <SeverityBadge tone={severityToneMap[entry.severity ?? 'info']}>
                              {severityLabelMap[entry.severity ?? 'info']}
                            </SeverityBadge>
                            <span>
                              {formatInteractionLabel(entry, [...existingSelections, ...candidateSelections])}
                            </span>
                          </ResultTitle>
                          <ResultMeta>
                            {entry.symptomDescription ?? '詳細不明'}
                            {entry.symptomCode ? ` / 症状コード: ${entry.symptomCode}` : ''}
                          </ResultMeta>
                        </ResultCard>
                      ))}
                    </ResultList>
                  ) : (
                    <InlineMessage>
                      重大通知は存在しません。軽微な通知のみが発生しているため処方操作は継続可能です。
                    </InlineMessage>
                  )}
                </Stack>
              )
            ) : null}
          </Stack>
        </SurfaceCard>
      </Stack>
    </SurfaceCard>
  );
};
