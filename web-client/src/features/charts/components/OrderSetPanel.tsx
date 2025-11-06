import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { v4 as uuidv4 } from 'uuid';

import { Button, SelectField, Stack, SurfaceCard, TextArea, TextField, StatusBadge } from '@/components';
import type {
  OrderSetDefinition,
  OrderSetInput,
  OrderSetPlanItem,
  OrderSetPlanType,
} from '@/features/charts/types/order-set';
import { TEMPLATE_DEFINITIONS } from '@/features/charts/components/patientDocumentTemplates';
import {
  buildSharePackage,
  ORDER_SET_SHARE_VERSION,
  OrderSetShareParseError,
  type OrderSetImportResult,
  type OrderSetShareItem,
  parseSharePackage,
} from '@/features/charts/utils/order-set-sharing';

const PanelHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const OrderSetList = styled.div`
  display: grid;
  gap: 12px;
`;

const OrderSetCard = styled.article<{ $active: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surface};
  padding: 14px 16px;
  display: grid;
  gap: 10px;
  box-shadow: ${({ $active }) => ($active ? '0 0 0 3px rgba(58, 122, 254, 0.15)' : 'none')};
`;

const OrderSetTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text};
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
  white-space: pre-wrap;
`;

const TagList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.li`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PlanSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
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

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
`;

const DialogShell = styled.div`
  width: min(920px, 100%);
  max-height: calc(100vh - 64px);
  overflow: auto;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  display: grid;
  gap: 16px;
  padding: 24px 28px;
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
`;

const PlanItemRow = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  display: grid;
  gap: 8px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const PlanRowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const planTypeOptions: { value: OrderSetPlanType; label: string }[] = [
  { value: 'medication', label: '処方' },
  { value: 'injection', label: '注射' },
  { value: 'procedure', label: '処置' },
  { value: 'exam', label: '検査' },
  { value: 'guidance', label: '指導料' },
  { value: 'followup', label: 'フォローアップ' },
];

const documentOptions = [
  { value: '', label: '文書なし' },
  ...TEMPLATE_DEFINITIONS.map((template) => ({ value: template.id, label: template.label })),
];

const planTypeLabel = (type: OrderSetPlanType) => planTypeOptions.find((option) => option.value === type)?.label ?? type;

interface OrderSetEditorDialogProps {
  mode: 'create' | 'edit';
  initialValue?: OrderSetDefinition | null;
  onSubmit: (input: OrderSetInput) => void;
  onClose: () => void;
}

interface OrderSetPanelProps {
  orderSets: OrderSetDefinition[];
  onApply: (definition: OrderSetDefinition) => void;
  onCreate: (input: OrderSetInput) => void;
  onUpdate: (id: string, input: OrderSetInput) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
  lastAppliedId?: string | null;
  onImportShared: (items: OrderSetShareItem[], strategy: 'merge' | 'replace') => OrderSetImportResult;
  shareMetadata?: { facilityName?: string; author?: string };
}

type EditorState = {
  name: string;
  description: string;
  tagsText: string;
  subjective: string;
  objective: string;
  assessment: string;
  documentTemplate: string;
  documentMemo: string;
  documentExtra: string;
  planItems: OrderSetPlanItem[];
};

const createEmptyPlanItem = (): OrderSetPlanItem => ({
  id: uuidv4(),
  type: 'followup',
  title: '',
  detail: '',
  note: '',
});

const createInitialState = (definition?: OrderSetDefinition | null): EditorState => ({
  name: definition?.name ?? '',
  description: definition?.description ?? '',
  tagsText: definition?.tags?.join(', ') ?? '',
  subjective: definition?.progressNote?.subjective ?? '',
  objective: definition?.progressNote?.objective ?? '',
  assessment: definition?.progressNote?.assessment ?? '',
  documentTemplate: definition?.documentPreset?.templateId ?? '',
  documentMemo: definition?.documentPreset?.memo ?? '',
  documentExtra: definition?.documentPreset?.extraNote ?? '',
  planItems: definition?.planItems?.length ? definition.planItems.map((item) => ({ ...item })) : [createEmptyPlanItem()],
});

const parseTags = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item, index, array) => item && array.indexOf(item) === index);

const buildInputPayload = (state: EditorState): OrderSetInput => ({
  name: state.name.trim(),
  description: state.description.trim(),
  tags: parseTags(state.tagsText),
  progressNote:
    state.subjective || state.objective || state.assessment
      ? {
          subjective: state.subjective.trim() || undefined,
          objective: state.objective.trim() || undefined,
          assessment: state.assessment.trim() || undefined,
        }
      : undefined,
  planItems: state.planItems.map((item) => ({
    ...item,
    title: item.title.trim(),
    detail: item.detail.trim(),
    note: item.note.trim(),
  })),
  documentPreset: state.documentTemplate
    ? {
        templateId: state.documentTemplate,
        memo: state.documentMemo.trim() || undefined,
        extraNote: state.documentExtra.trim() || undefined,
      }
    : null,
});

const OrderSetEditorDialog = ({ mode, initialValue, onSubmit, onClose }: OrderSetEditorDialogProps) => {
  const [state, setState] = useState<EditorState>(() => createInitialState(initialValue));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(createInitialState(initialValue));
    setError(null);
  }, [initialValue, mode]);

  const handlePlanItemChange = useCallback(
    (id: string, patch: Partial<OrderSetPlanItem>) => {
      setState((prev) => ({
        ...prev,
        planItems: prev.planItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }));
    },
    [],
  );

  const handlePlanItemRemove = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      planItems: prev.planItems.length > 1 ? prev.planItems.filter((item) => item.id !== id) : prev.planItems,
    }));
  }, []);

  const handlePlanItemMove = useCallback((id: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const index = prev.planItems.findIndex((item) => item.id === id);
      if (index === -1) {
        return prev;
      }
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.planItems.length) {
        return prev;
      }
      const next = [...prev.planItems];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...prev, planItems: next };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const payload = buildInputPayload(state);
    if (!payload.name) {
      setError('セット名を入力してください');
      return;
    }
    if (payload.planItems.length === 0) {
      setError('少なくとも1つのオーダ内容を登録してください');
      return;
    }
    onSubmit(payload);
  }, [onSubmit, state]);

  return (
    <DialogOverlay role="dialog" aria-modal aria-label="オーダセット編集">
      <DialogShell>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新規オーダセット' : 'オーダセットを編集'}</DialogTitle>
          <Button type="button" variant="ghost" onClick={onClose}>
            閉じる
          </Button>
        </DialogHeader>

        <Stack gap={16}>
          <TextField
            label="セット名"
            placeholder="例: 高血圧 再診セット"
            value={state.name}
            onChange={(event) => setState((prev) => ({ ...prev, name: event.currentTarget.value }))}
            required
          />
          <TextArea
            label="説明"
            placeholder="このセットの目的やメモ"
            value={state.description}
            onChange={(event) => setState((prev) => ({ ...prev, description: event.currentTarget.value }))}
            rows={3}
          />
          <TextField
            label="タグ"
            placeholder="内科, 慢性疾患 などカンマ区切り"
            value={state.tagsText}
            onChange={(event) => setState((prev) => ({ ...prev, tagsText: event.currentTarget.value }))}
          />

          <SurfaceCard tone="muted">
            <Stack gap={12}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>カルテ記載テンプレート</h3>
              <TextArea
                label="Subjective"
                placeholder="問診内容"
                value={state.subjective}
                onChange={(event) => setState((prev) => ({ ...prev, subjective: event.currentTarget.value }))}
                rows={2}
              />
              <TextArea
                label="Objective"
                placeholder="診察所見・バイタル"
                value={state.objective}
                onChange={(event) => setState((prev) => ({ ...prev, objective: event.currentTarget.value }))}
                rows={2}
              />
              <TextArea
                label="Assessment"
                placeholder="評価・診断"
                value={state.assessment}
                onChange={(event) => setState((prev) => ({ ...prev, assessment: event.currentTarget.value }))}
                rows={2}
              />
            </Stack>
          </SurfaceCard>

          <SurfaceCard tone="muted">
            <Stack gap={12}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>オーダ内容</h3>
              {state.planItems.map((item, index) => (
                <PlanItemRow key={item.id}>
                  <PlanRowHeader>
                    <SelectField
                      label={`種別 ${index + 1}`}
                      options={planTypeOptions}
                      value={item.type}
                      onChange={(event) =>
                        handlePlanItemChange(item.id, {
                          type: event.currentTarget.value as OrderSetPlanType,
                        })
                      }
                    />
                    <HeaderActions>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlanItemMove(item.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlanItemMove(item.id, 'down')}
                        disabled={index === state.planItems.length - 1}
                      >
                        ↓
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => handlePlanItemRemove(item.id)}>
                        削除
                      </Button>
                    </HeaderActions>
                  </PlanRowHeader>
                  <TextField
                    label="タイトル"
                    placeholder="例: アムロジピン 5mg"
                    value={item.title}
                    onChange={(event) => handlePlanItemChange(item.id, { title: event.currentTarget.value })}
                  />
                  <TextArea
                    label="詳細"
                    placeholder="用量・実施内容など"
                    value={item.detail}
                    onChange={(event) => handlePlanItemChange(item.id, { detail: event.currentTarget.value })}
                    rows={2}
                  />
                  <TextArea
                    label="メモ"
                    placeholder="フォロー指示や注意事項"
                    value={item.note}
                    onChange={(event) => handlePlanItemChange(item.id, { note: event.currentTarget.value })}
                    rows={2}
                  />
                </PlanItemRow>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    planItems: [...prev.planItems, createEmptyPlanItem()],
                  }))
                }
              >
                オーダを追加
              </Button>
            </Stack>
          </SurfaceCard>

          <SurfaceCard tone="muted">
            <Stack gap={12}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>文書テンプレート</h3>
              <SelectField
                label="テンプレート選択"
                options={documentOptions}
                value={state.documentTemplate}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    documentTemplate: event.currentTarget.value,
                  }))
                }
              />
              {state.documentTemplate ? (
                <>
                  <TextArea
                    label="文書メモ"
                    placeholder="文書本文への追記"
                    value={state.documentMemo}
                    onChange={(event) => setState((prev) => ({ ...prev, documentMemo: event.currentTarget.value }))}
                    rows={3}
                  />
                  <TextField
                    label="備考"
                    placeholder="備考欄の追記"
                    value={state.documentExtra}
                    onChange={(event) => setState((prev) => ({ ...prev, documentExtra: event.currentTarget.value }))}
                  />
                </>
              ) : null}
            </Stack>
          </SurfaceCard>

          {error ? <InlineError>{error}</InlineError> : null}
        </Stack>

        <HeaderActions style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {mode === 'create' ? '登録する' : '更新する'}
          </Button>
        </HeaderActions>
      </DialogShell>
    </DialogOverlay>
  );
};

const ConfirmDialog = ({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <DialogOverlay role="dialog" aria-modal aria-label="オーダセット削除確認">
    <DialogShell>
      <Stack gap={16}>
        <DialogTitle>「{name}」を削除しますか？</DialogTitle>
        <InlineMessage>この操作は取り消せません。セットを再作成する必要があります。</InlineMessage>
        <HeaderActions style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            削除する
          </Button>
        </HeaderActions>
      </Stack>
    </DialogShell>
  </DialogOverlay>
);

export const OrderSetPanel = ({
  orderSets,
  onApply,
  onCreate,
  onUpdate,
  onDelete,
  disabled,
  lastAppliedId,
  onImportShared,
  shareMetadata,
}: OrderSetPanelProps) => {
  const [query, setQuery] = useState('');
  const [editorMode, setEditorMode] = useState<{ mode: 'create' | 'edit'; target?: OrderSetDefinition } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderSetDefinition | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareJson, setShareJson] = useState('');
  const [shareExportedAt, setShareExportedAt] = useState('');
  const [importText, setImportText] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return orderSets;
    }
    return orderSets.filter((set) => {
      const haystack = [set.name ?? '', set.description ?? '', set.tags.join(' ')]
        .map((value) => value.toLowerCase())
        .join(' ');
      return haystack.includes(keyword);
    });
  }, [orderSets, query]);

  const handleSubmit = useCallback(
    (input: OrderSetInput) => {
      if (!editorMode) {
        return;
      }
      if (editorMode.mode === 'create') {
        onCreate(input);
      } else if (editorMode.target) {
        onUpdate(editorMode.target.id, input);
      }
      setEditorMode(null);
    },
    [editorMode, onCreate, onUpdate],
  );

  const handleOpenShareDialog = useCallback(() => {
    const sharePackage = buildSharePackage(orderSets, {
      facilityName: shareMetadata?.facilityName,
      author: shareMetadata?.author,
    });
    setShareJson(JSON.stringify(sharePackage, null, 2));
    setShareExportedAt(new Date(sharePackage.exportedAt).toLocaleString('ja-JP'));
    setImportText('');
    setShareFeedback(null);
    setShareError(null);
    setIsShareDialogOpen(true);
  }, [orderSets, shareMetadata]);

  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
  }, []);

  const handleCopyShare = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setShareError('クリップボード API が利用できません。ブラウザの設定をご確認ください。');
      setShareFeedback(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(shareJson);
      setShareFeedback('共有 JSON をクリップボードへコピーしました。');
      setShareError(null);
    } catch (error) {
      console.error('共有 JSON のコピーに失敗しました', error);
      setShareError('共有 JSON のコピーに失敗しました。権限設定をご確認ください。');
      setShareFeedback(null);
    }
  }, [shareJson]);

  const handleDownloadShare = useCallback(() => {
    if (typeof window === 'undefined') {
      setShareError('ブラウザ環境でのみダウンロードできます。');
      setShareFeedback(null);
      return;
    }
    try {
      const blob = new Blob([shareJson], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = `order-sets_${Date.now()}.json`;
      anchor.rel = 'noopener';
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      setShareFeedback('共有 JSON をダウンロードしました。');
      setShareError(null);
    } catch (error) {
      console.error('共有 JSON のダウンロードに失敗しました', error);
      setShareError('共有 JSON のダウンロードに失敗しました。ブラウザの設定をご確認ください。');
      setShareFeedback(null);
    }
  }, [shareJson]);

  const handleImportShare = useCallback(
    (strategy: 'merge' | 'replace') => {
      const source = importText.trim();
      if (!source) {
        setShareError('インポートする共有 JSON を貼り付けてください。');
        setShareFeedback(null);
        return;
      }
      try {
        const sharePackage = parseSharePackage(source);
        if (sharePackage.items.length === 0) {
          setShareError('共有 JSON にオーダセットが含まれていません。');
          setShareFeedback(null);
          return;
        }
        const result = onImportShared(sharePackage.items, strategy);
        const action = strategy === 'replace' ? '置き換え' : '統合';
        const replacedText =
          strategy === 'replace' && result.replaced
            ? ` / 置換 ${result.replaced} 件`
            : '';
        setShareFeedback(
          `共有テンプレートを${action}しました（新規 ${result.created} 件 / 更新 ${result.updated} 件${replacedText}）。`,
        );
        setShareError(null);
        setImportText('');
      } catch (error) {
        console.error('共有 JSON のインポートに失敗しました', error);
        if (error instanceof OrderSetShareParseError) {
          setShareError(error.message);
        } else {
          setShareError('共有 JSON の解析に失敗しました。内容をご確認ください。');
        }
        setShareFeedback(null);
      }
    },
    [importText, onImportShared],
  );

  return (
    <SurfaceCard tone="muted">
      <Stack gap={16}>
        <PanelHeader>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>オーダセット</h2>
            <InlineMessage>
              よく使うカルテ記載とオーダをまとめて適用できます。検索やタグで素早く呼び出せます。
            </InlineMessage>
          </div>
          <HeaderActions>
            <Button type="button" variant="ghost" onClick={handleOpenShareDialog}>
              共有 / インポート
            </Button>
            <TextField
              label="検索"
              placeholder="セット名やタグで検索"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <Button type="button" variant="secondary" onClick={() => setEditorMode({ mode: 'create' })}>
              新規セットを作成
            </Button>
          </HeaderActions>
        </PanelHeader>

        {!isShareDialogOpen && shareFeedback ? <InlineMessage>{shareFeedback}</InlineMessage> : null}
        {!isShareDialogOpen && shareError ? <InlineError role="alert">{shareError}</InlineError> : null}

        {filtered.length === 0 ? (
          <InlineMessage>登録済みのオーダセットがありません。新規作成してください。</InlineMessage>
        ) : (
          <OrderSetList>
            {filtered.map((set) => (
              <OrderSetCard key={set.id} $active={set.id === lastAppliedId}>
                <OrderSetTitle>{set.name}</OrderSetTitle>
                {set.description ? <Description>{set.description}</Description> : null}
                {set.tags.length > 0 ? (
                  <TagList>
                    {set.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </TagList>
                ) : null}
                <PlanSummary>
                  {set.progressNote ? (
                    <InlineMessage>
                      SOAP: {[
                        set.progressNote.subjective ? 'S' : null,
                        set.progressNote.objective ? 'O' : null,
                        set.progressNote.assessment ? 'A' : null,
                      ]
                        .filter(Boolean)
                        .join(' / ')}
                    </InlineMessage>
                  ) : null}
                  {set.planItems.map((item) => (
                    <InlineMessage key={item.id}>
                      {planTypeLabel(item.type)}: {item.title || item.detail}
                    </InlineMessage>
                  ))}
                  {set.documentPreset ? (
                    <InlineMessage>
                      文書: {
                        TEMPLATE_DEFINITIONS.find((template) => template.id === set.documentPreset?.templateId)?.label ??
                        set.documentPreset.templateId
                      }
                    </InlineMessage>
                  ) : null}
                </PlanSummary>
                <HeaderActions>
                  {set.lastUsedAt ? (
                    <StatusBadge tone="info">最終適用: {new Date(set.lastUsedAt).toLocaleString('ja-JP')}</StatusBadge>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApply(set)}
                    disabled={disabled}
                  >
                    適用
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditorMode({ mode: 'edit', target: set })}
                  >
                    編集
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmTarget(set)}>
                    削除
                  </Button>
                </HeaderActions>
                {disabled ? <InlineMessage>カルテをロックすると適用できます。</InlineMessage> : null}
              </OrderSetCard>
            ))}
          </OrderSetList>
        )}
      </Stack>

      {isShareDialogOpen ? (
        <DialogOverlay role="dialog" aria-modal aria-label="オーダセット共有">
          <DialogShell>
            <DialogHeader>
              <DialogTitle>オーダセットの共有 / インポート</DialogTitle>
              <Button type="button" variant="ghost" onClick={handleCloseShareDialog}>
                閉じる
              </Button>
            </DialogHeader>

            <Stack gap={16}>
              <InlineMessage>
                共有フォーマット v{ORDER_SET_SHARE_VERSION} でエクスポートします。施設内・他院で共有する場合は JSON ファイルを配布してください。
              </InlineMessage>

              <SurfaceCard tone="muted">
                <Stack gap={12}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>エクスポート</h3>
                  <InlineMessage>
                    {shareMetadata?.facilityName ? `施設: ${shareMetadata.facilityName} / ` : ''}
                    {shareMetadata?.author ? `作成者: ${shareMetadata.author} / ` : ''}
                    出力時刻: {shareExportedAt || '---'}
                  </InlineMessage>
                  <TextArea label="共有 JSON" value={shareJson} readOnly rows={8} />
                  <HeaderActions style={{ justifyContent: 'flex-end' }}>
                    <Button type="button" variant="secondary" onClick={handleCopyShare}>
                      JSON をコピー
                    </Button>
                    <Button type="button" onClick={handleDownloadShare}>
                      JSON をダウンロード
                    </Button>
                  </HeaderActions>
                </Stack>
              </SurfaceCard>

              <SurfaceCard tone="muted">
                <Stack gap={12}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>インポート</h3>
                  <TextArea
                    label="共有 JSON を貼り付け"
                    placeholder="共有された JSON を貼り付けてください"
                    value={importText}
                    onChange={(event) => setImportText(event.currentTarget.value)}
                    rows={8}
                  />
                  <InlineMessage>
                    統合は同名のセットを更新し、新規セットを追加します。置き換えは既存セットをすべて削除して共有内容に差し替えます。
                  </InlineMessage>
                  <HeaderActions style={{ justifyContent: 'flex-end' }}>
                    <Button type="button" variant="secondary" onClick={() => handleImportShare('merge')}>
                      統合インポート
                    </Button>
                    <Button type="button" variant="danger" onClick={() => handleImportShare('replace')}>
                      置き換えインポート
                    </Button>
                  </HeaderActions>
                </Stack>
              </SurfaceCard>

              {shareFeedback ? <InlineMessage>{shareFeedback}</InlineMessage> : null}
              {shareError ? <InlineError role="alert">{shareError}</InlineError> : null}
            </Stack>
          </DialogShell>
        </DialogOverlay>
      ) : null}

      {editorMode ? (
        <OrderSetEditorDialog
          mode={editorMode.mode}
          initialValue={editorMode.target}
          onSubmit={handleSubmit}
          onClose={() => setEditorMode(null)}
        />
      ) : null}

      {confirmTarget ? (
        <ConfirmDialog
          name={confirmTarget.name}
          onConfirm={() => {
            onDelete(confirmTarget.id);
            setConfirmTarget(null);
          }}
          onCancel={() => setConfirmTarget(null)}
        />
      ) : null}
    </SurfaceCard>
  );
};
