import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, SelectField, SurfaceCard, TextField } from '@/components';
import { useLaboItemTrend, useLaboModules } from '@/features/charts/hooks/useLaboModules';
import type { LaboItem, LaboModule, LaboTrendEntry } from '@/features/charts/types/labo';

interface LabResultsPanelProps {
  patientId: string | null;
  patientName?: string;
}

const PanelCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const ModuleColumn = styled.div`
  flex: 1 1 220px;
  min-width: 220px;
  display: grid;
  gap: 12px;
`;

const ModuleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
`;

const ModuleItemButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $selected }) => ($selected ? theme.palette.surfaceStrong : theme.palette.surface)};
  color: ${({ theme }) => theme.palette.text};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primaryStrong};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const DetailColumn = styled.div`
  flex: 2 1 480px;
  min-width: 360px;
  display: grid;
  gap: 12px;
`;

const ItemsTableWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const ItemsHeadCell = styled.th`
  text-align: left;
  padding: 10px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const ItemsCell = styled.td<{ $abnormal?: boolean }>`
  padding: 10px;
  font-size: 0.9rem;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  color: ${({ theme, $abnormal }) => ($abnormal ? theme.palette.danger : theme.palette.text)};
`;

const TrendCell = styled(ItemsCell)<{ $trend?: 'up' | 'down' | 'flat' }>`
  color: ${({ theme, $trend }) => {
    if ($trend === 'up') {
      return theme.palette.danger;
    }
    if ($trend === 'down') {
      return theme.palette.success;
    }
    return theme.palette.text;
  }};
  font-weight: ${({ $trend }) => ($trend && $trend !== 'flat' ? 600 : 400)};
`;

const InlineMessage = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const TrendOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
`;

const TrendDialog = styled(SurfaceCard)`
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  display: grid;
  gap: 16px;
`;

const TrendChartWrapper = styled.div`
  width: 100%;
  height: 220px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
`;

const TrendTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TrendTableCell = styled.td`
  padding: 8px;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  font-size: 0.85rem;
`;

const TrendHeadCell = styled.th`
  text-align: left;
  padding: 8px;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const formatDate = (iso: string | null | undefined, withTime = false) => {
  if (!iso) {
    return '---';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '---';
  }
  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
  });
};

const isAbnormal = (flag: string | null | undefined) => Boolean(flag && flag.trim() && flag.trim().toUpperCase() !== 'N' && flag !== '0');

const parseNumericValue = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }
  const sanitized = value.replace(/[^0-9.+-]/g, '');
  if (!sanitized) {
    return null;
  }
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDecimalPrecision = (value?: string | null): number => {
  if (!value) {
    return 0;
  }
  const match = value.match(/[0-9]+(?:\.([0-9]+))?/);
  if (!match || !match[1]) {
    return 0;
  }
  return match[1].length;
};

type TrendDirection = 'up' | 'down' | 'flat';

const formatDifferenceLabel = (
  currentText: string | null | undefined,
  previousText: string | null | undefined,
): { label: string; trend: TrendDirection } => {
  if (!previousText || !previousText.trim()) {
    return { label: '---', trend: 'flat' };
  }
  const current = parseNumericValue(currentText);
  const previous = parseNumericValue(previousText);
  if (current !== null && previous !== null) {
    const delta = current - previous;
    if (Math.abs(delta) < 1e-6) {
      return { label: '→ ±0', trend: 'flat' };
    }
    const decimals = Math.min(Math.max(getDecimalPrecision(currentText), getDecimalPrecision(previousText)), 3);
    const formatted = delta.toFixed(decimals > 0 ? decimals : 0);
    const trend: TrendDirection = delta > 0 ? 'up' : 'down';
    const arrow = trend === 'up' ? '↑ ' : '↓ ';
    const sign = delta > 0 ? '+' : '';
    return { label: `${arrow}${sign}${formatted}`, trend };
  }

  const normalizedCurrent = (currentText ?? '').trim();
  const normalizedPrevious = (previousText ?? '').trim();
  if (normalizedCurrent && normalizedCurrent === normalizedPrevious) {
    return { label: '→ 同値', trend: 'flat' };
  }
  return { label: '↺ 更新', trend: 'flat' };
};

const buildTrendPath = (entries: LaboTrendEntry[]) => {
  const numericEntries = entries.filter((entry) => entry.numericValue !== null);
  if (numericEntries.length === 0) {
    return null;
  }
  const values = numericEntries.map((entry) => entry.numericValue ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 640;
  const height = 200;
  const paddingX = 24;
  const paddingY = 24;
  const range = max - min || 1;

  return numericEntries
    .map((entry, index) => {
      const x = paddingX + (index / Math.max(numericEntries.length - 1, 1)) * (width - paddingX * 2);
      const relative = ((entry.numericValue ?? min) - min) / range;
      const y = height - paddingY - relative * (height - paddingY * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const buildItemOptions = (module: LaboModule | null) => {
  if (!module) {
    return [];
  }
  const seen = new Map<string, string>();
  module.items.forEach((item) => {
    if (!seen.has(item.itemCode)) {
      seen.set(item.itemCode, item.itemName);
    }
  });
  return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
};

export const LabResultsPanel = ({ patientId, patientName }: LabResultsPanelProps) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [trendTarget, setTrendTarget] = useState<{ itemCode: string; itemName: string; unit?: string } | null>(null);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);

  const modulesQuery = useLaboModules(patientId, 40);
  const modules = useMemo(() => modulesQuery.data ?? [], [modulesQuery.data]);
  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? modules[0] ?? null,
    [modules, selectedModuleId],
  );

  const selectedModuleIndex = useMemo(
    () => (selectedModule ? modules.findIndex((module) => module.id === selectedModule.id) : -1),
    [modules, selectedModule],
  );

  const previousModule = useMemo(() => {
    if (selectedModuleIndex < 0) {
      return null;
    }
    return modules[selectedModuleIndex + 1] ?? null;
  }, [modules, selectedModuleIndex]);

  const previousValueMap = useMemo(() => {
    if (!previousModule) {
      return new Map<string, LaboItem>();
    }
    const map = new Map<string, LaboItem>();
    previousModule.items.forEach((item) => {
      map.set(item.itemCode, item);
    });
    return map;
  }, [previousModule]);

  useEffect(() => {
    if (!selectedModule && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModule]);

  useEffect(() => {
    if (selectedModule) {
      setSelectedItemCode((prev) => {
        if (prev && selectedModule.items.some((item) => item.itemCode === prev)) {
          return prev;
        }
        return selectedModule.items[0]?.itemCode ?? null;
      });
    } else {
      setSelectedItemCode(null);
    }
  }, [selectedModule]);

  const trendQuery = useLaboItemTrend(patientId, trendTarget?.itemCode ?? null, 32);

  const filteredItems = useMemo(() => {
    if (!selectedModule) {
      return [];
    }
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return selectedModule.items;
    }
    return selectedModule.items.filter((item) =>
      [item.itemName, item.itemCode, item.valueText, item.normalRange]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [selectedModule, searchTerm]);

  const itemOptions = useMemo(() => buildItemOptions(selectedModule), [selectedModule]);

  const handleExportPdf = () => {
    if (!selectedModule) {
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }
    const title = `検査結果_${patientName ?? '患者'}_${formatDate(selectedModule.sampleDate, true)}`;
    const rows = selectedModule.items
      .map((item) => {
        const previousItem = previousValueMap.get(item.itemCode) ?? null;
        const { label: differenceLabel } = formatDifferenceLabel(item.valueText, previousItem?.valueText ?? null);
        const comment =
          item.comments.length > 0 ? item.comments.join(' / ') : item.specimenName ?? '';
        return `
          <tr>
            <td style="padding:8px;border:1px solid #d0d7e2;">${item.itemName}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${item.valueText ?? ''}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${previousItem?.valueText ?? ''}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${differenceLabel}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${item.unit ?? ''}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${item.normalRange ?? ''}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${item.abnormalFlag ?? ''}</td>
            <td style="padding:8px;border:1px solid #d0d7e2;">${comment}</td>
          </tr>`;
      })
      .join('');
    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>採取日: ${formatDate(selectedModule.sampleDate, true)}</p>
          <table>
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #d0d7e2;">項目</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">結果</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">前回値</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">変化</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">単位</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">基準値</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">判定</th>
                <th style="padding:8px;border:1px solid #d0d7e2;">備考</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleOpenTrend = (item: LaboItem) => {
    setTrendTarget({ itemCode: item.itemCode, itemName: item.itemName, unit: item.unit });
  };

  const handleCloseTrend = () => {
    setTrendTarget(null);
  };

  return (
    <PanelCard tone="default">
      <PanelHeader>
        <h2>ラボ検査履歴</h2>
        <p>
          オンプレ版 LaboTestPanel と同様に、採取日ごとの検査結果を参照・PDF 出力できます。項目を選択すると推移グラフも確認できます。
        </p>
      </PanelHeader>

      {!patientId ? (
        <InlineMessage>カルテ対象を選択すると検査結果が表示されます。</InlineMessage>
      ) : modulesQuery.isLoading ? (
        <InlineMessage>検査結果を読み込み中です…</InlineMessage>
      ) : modulesQuery.error ? (
        <InlineMessage>検査結果の取得に失敗しました。再読み込みしてください。</InlineMessage>
      ) : modules.length === 0 ? (
        <InlineMessage>検査結果が登録されていません。</InlineMessage>
      ) : null}

      <Layout>
        <ModuleColumn>
          <TextField
            label="項目検索"
            placeholder="項目名・コード・値"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <ModuleList>
            {modules.map((module) => (
              <li key={module.id}>
                <ModuleItemButton
                  type="button"
                  $selected={module.id === selectedModule?.id}
                  onClick={() => setSelectedModuleId(module.id)}
                >
                  <div style={{ fontWeight: 600 }}>{formatDate(module.sampleDate, true)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{module.itemCount} 件</div>
                </ModuleItemButton>
              </li>
            ))}
          </ModuleList>
          <Button type="button" variant="secondary" onClick={handleExportPdf} disabled={!selectedModule}>
            PDF 出力
          </Button>
        </ModuleColumn>

        <DetailColumn>
          {selectedModule ? (
            <SurfaceCard tone="muted" padding="sm">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <strong>採取日:</strong> {formatDate(selectedModule.sampleDate, true)}
                </div>
                <div>
                  <strong>検査項目数:</strong> {selectedModule.itemCount}
                </div>
                {selectedModule.centerCode ? (
                  <div>
                    <strong>検査センター:</strong> {selectedModule.centerCode}
                  </div>
                ) : null}
                {selectedModule.moduleKey ? (
                  <div>
                    <strong>モジュールキー:</strong> {selectedModule.moduleKey}
                  </div>
                ) : null}
              </div>
            </SurfaceCard>
          ) : null}

          <SelectField
            label="トレンド表示"
            value={selectedItemCode ?? ''}
            onChange={(event) => setSelectedItemCode(event.currentTarget.value || null)}
            options={[{ value: '', label: '選択してください' }, ...itemOptions]}
            disabled={!selectedModule || itemOptions.length === 0}
          />

          <ItemsTableWrapper>
            <ItemsTable>
              <thead>
                <tr>
                  <ItemsHeadCell style={{ width: '180px' }}>項目</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '120px' }}>結果</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '120px' }}>前回値</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '100px' }}>変化</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '80px' }}>単位</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '160px' }}>基準値</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '80px' }}>判定</ItemsHeadCell>
                  <ItemsHeadCell>備考</ItemsHeadCell>
                  <ItemsHeadCell style={{ width: '100px' }}>操作</ItemsHeadCell>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const previousItem = previousValueMap.get(item.itemCode) ?? null;
                  const previousAbnormal = previousItem ? isAbnormal(previousItem.abnormalFlag) : false;
                  const { label: differenceLabel, trend } = formatDifferenceLabel(
                    item.valueText,
                    previousItem?.valueText ?? null,
                  );
                  return (
                    <tr key={item.id}>
                      <ItemsCell $abnormal={isAbnormal(item.abnormalFlag)}>{item.itemName}</ItemsCell>
                      <ItemsCell $abnormal={isAbnormal(item.abnormalFlag)}>{item.valueText || '---'}</ItemsCell>
                      <ItemsCell $abnormal={previousAbnormal}>{previousItem?.valueText ?? '---'}</ItemsCell>
                      <TrendCell $trend={trend}>{differenceLabel}</TrendCell>
                      <ItemsCell>{item.unit ?? ''}</ItemsCell>
                      <ItemsCell>{item.normalRange ?? ''}</ItemsCell>
                      <ItemsCell>{item.abnormalFlag ?? ''}</ItemsCell>
                      <ItemsCell>
                        {item.comments.length > 0 ? item.comments.join(' / ') : item.specimenName ?? ''}
                      </ItemsCell>
                      <ItemsCell>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenTrend(item)}>
                          推移
                        </Button>
                      </ItemsCell>
                    </tr>
                  );
                })}
              </tbody>
            </ItemsTable>
          </ItemsTableWrapper>
        </DetailColumn>
      </Layout>

      {trendTarget ? (
        <TrendOverlay role="dialog" aria-modal>
          <TrendDialog tone="elevated" padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{trendTarget.itemName} の推移</h3>
                <InlineMessage>
                  {patientName ?? ''} / 単位: {trendTarget.unit ?? '-'}
                </InlineMessage>
              </div>
              <Button type="button" variant="ghost" onClick={handleCloseTrend}>
                閉じる
              </Button>
            </div>
            <TrendChartWrapper>
              {trendQuery.isLoading ? (
                <InlineMessage>読み込み中です…</InlineMessage>
              ) : trendQuery.error ? (
                <InlineMessage>推移の取得に失敗しました。</InlineMessage>
              ) : trendQuery.data && trendQuery.data.length > 0 ? (
                (() => {
                  const path = buildTrendPath(trendQuery.data);
                  if (!path) {
                    return <InlineMessage>数値化できるデータがありません。</InlineMessage>;
                  }
                  return (
                    <svg viewBox="0 0 640 200" role="img" aria-label="検査値の推移">
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
                          <stop offset="100%" stopColor="rgba(59,130,246,0.05)" />
                        </linearGradient>
                      </defs>
                      <path d={path} stroke="#3b82f6" strokeWidth={2} fill="none" />
                      <path d={`${path} L640,200 L0,200 Z`} fill="url(#trendGradient)" opacity={0.3} />
                    </svg>
                  );
                })()
              ) : (
                <InlineMessage>推移データがありません。</InlineMessage>
              )}
            </TrendChartWrapper>
            <TrendTable>
              <thead>
                <tr>
                  <TrendHeadCell style={{ width: '180px' }}>採取日</TrendHeadCell>
                  <TrendHeadCell style={{ width: '120px' }}>結果</TrendHeadCell>
                  <TrendHeadCell style={{ width: '80px' }}>単位</TrendHeadCell>
                  <TrendHeadCell style={{ width: '120px' }}>判定</TrendHeadCell>
                  <TrendHeadCell>基準値</TrendHeadCell>
                </tr>
              </thead>
              <tbody>
                {(trendQuery.data ?? []).map((entry) => (
                  <tr key={entry.sampleDate}>
                    <TrendTableCell>{formatDate(entry.sampleDate, true)}</TrendTableCell>
                    <TrendTableCell>{entry.valueText || '---'}</TrendTableCell>
                    <TrendTableCell>{entry.unit ?? ''}</TrendTableCell>
                    <TrendTableCell>{entry.abnormalFlag ?? ''}</TrendTableCell>
                    <TrendTableCell>{entry.normalRange ?? ''}</TrendTableCell>
                  </tr>
                ))}
              </tbody>
            </TrendTable>
          </TrendDialog>
        </TrendOverlay>
      ) : null}
    </PanelCard>
  );
};
