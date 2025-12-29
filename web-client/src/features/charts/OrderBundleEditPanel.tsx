import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchOrderBundles, mutateOrderBundles, type OrderBundle, type OrderBundleItem } from './orderBundleApi';
import {
  fetchOrderMasterSearch,
  type OrderMasterSearchItem,
  type OrderMasterSearchType,
} from './orderMasterSearchApi';
import type { DataSourceTransition } from './authService';

export type OrderBundleEditPanelMeta = {
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string;
  actorRole?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
};

export type OrderBundleEditPanelProps = {
  patientId?: string;
  entity: string;
  title: string;
  bundleLabel: string;
  itemQuantityLabel: string;
  meta: OrderBundleEditPanelMeta;
};

type BundleFormState = {
  documentId?: number;
  moduleId?: number;
  bundleName: string;
  admin: string;
  bundleNumber: string;
  adminMemo: string;
  memo: string;
  startDate: string;
  items: OrderBundleItem[];
};

const buildEmptyItem = (): OrderBundleItem => ({ name: '', quantity: '', unit: '', memo: '' });

const buildEmptyForm = (today: string): BundleFormState => ({
  bundleName: '',
  admin: '',
  bundleNumber: '1',
  adminMemo: '',
  memo: '',
  startDate: today,
  items: [buildEmptyItem()],
});

const toFormState = (bundle: OrderBundle, today: string): BundleFormState => ({
  documentId: bundle.documentId,
  moduleId: bundle.moduleId,
  bundleName: bundle.bundleName ?? '',
  admin: bundle.admin ?? '',
  bundleNumber: bundle.bundleNumber ?? '1',
  adminMemo: bundle.adminMemo ?? '',
  memo: bundle.memo ?? '',
  startDate: bundle.started ?? today,
  items: bundle.items && bundle.items.length > 0 ? bundle.items.map((item) => ({ ...item })) : [buildEmptyItem()],
});

const formatBundleName = (bundle: OrderBundle) => bundle.bundleName ?? '名称未設定';

export function OrderBundleEditPanel({
  patientId,
  entity,
  title,
  bundleLabel,
  itemQuantityLabel,
  meta,
}: OrderBundleEditPanelProps) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState<BundleFormState>(() => buildEmptyForm(today));
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [masterKeywordInput, setMasterKeywordInput] = useState('');
  const [masterKeyword, setMasterKeyword] = useState('');
  const [masterType, setMasterType] = useState<OrderMasterSearchType>(() =>
    entity === 'medOrder' ? 'generic-class' : 'etensu',
  );
  const blockReasons = useMemo(() => {
    const reasons: string[] = [];
    if (meta.readOnly) {
      reasons.push(meta.readOnlyReason ?? '閲覧専用のため編集できません。');
    }
    if (meta.missingMaster) {
      reasons.push('マスター未同期のため編集できません。');
    }
    if (meta.fallbackUsed) {
      reasons.push('フォールバックデータのため編集できません。');
    }
    return reasons;
  }, [meta.fallbackUsed, meta.missingMaster, meta.readOnly, meta.readOnlyReason]);
  const isBlocked = blockReasons.length > 0;
  const auditMetaDetails = useMemo(
    () => ({
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      receptionId: meta.receptionId,
      visitDate: meta.visitDate,
      actorRole: meta.actorRole,
    }),
    [meta],
  );

  const countItems = (items?: OrderBundleItem[]) =>
    items ? items.filter((item) => item.name.trim().length > 0).length : 0;

  const masterTypeOptions = useMemo(() => {
    if (entity === 'medOrder') {
      return [
        { value: 'generic-class' as const, label: '薬効分類' },
        { value: 'youhou' as const, label: '用法' },
        { value: 'material' as const, label: '材料' },
      ];
    }
    return [
      { value: 'etensu' as const, label: '点数' },
      { value: 'kensa-sort' as const, label: '検査区分' },
      { value: 'material' as const, label: '材料' },
      { value: 'youhou' as const, label: '用法' },
    ];
  }, [entity]);

  const queryKey = ['charts-order-bundles', patientId, entity];
  const bundleQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!patientId) throw new Error('patientId is required');
      return fetchOrderBundles({ patientId, entity });
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    setMasterType(entity === 'medOrder' ? 'generic-class' : 'etensu');
  }, [entity]);

  useEffect(() => {
    logUiState({
      action: 'navigate',
      screen: `charts/${entity}-edit`,
      runId: meta.runId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      details: {
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
        entity,
      },
    });
  }, [entity, meta]);

  const mutation = useMutation({
    mutationFn: async (payload: BundleFormState) => {
      if (!patientId) throw new Error('patientId is required');
      const filteredItems = payload.items.filter((item) => item.name.trim().length > 0);
      return mutateOrderBundles({
        patientId,
        operations: [
          {
            operation: payload.documentId ? 'update' : 'create',
            documentId: payload.documentId,
            moduleId: payload.moduleId,
            entity,
            bundleName: payload.bundleName,
            bundleNumber: payload.bundleNumber,
            admin: payload.admin,
            adminMemo: payload.adminMemo,
            memo: payload.memo,
            startDate: payload.startDate,
            items: filteredItems,
          },
        ],
      });
    },
    onSuccess: (result, payload) => {
      const operation = payload.documentId ? 'update' : 'create';
      const itemCount = countItems(payload.items);
      setNotice({ tone: result.ok ? 'success' : 'error', message: result.ok ? 'オーダーを保存しました。' : 'オーダーの保存に失敗しました。' });
      recordOutpatientFunnel('charts_action', {
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit ?? false,
        missingMaster: meta.missingMaster ?? false,
        dataSourceTransition: meta.dataSourceTransition ?? 'server',
        fallbackUsed: meta.fallbackUsed ?? false,
        action: operation,
        outcome: result.ok ? 'success' : 'error',
        note: payload.bundleName,
      });
      logAuditEvent({
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: result.ok ? 'success' : 'error',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: result.runId ?? meta.runId,
            operation,
            entity,
            patientId,
            documentId: payload.documentId,
            moduleId: payload.moduleId,
            bundleName: payload.bundleName,
            bundleNumber: payload.bundleNumber,
            itemCount,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
        setForm(buildEmptyForm(today));
      }
    },
    onError: (error: unknown, payload) => {
      const message = error instanceof Error ? error.message : String(error);
      const itemCount = countItems(payload.items);
      setNotice({ tone: 'error', message: `オーダーの保存に失敗しました: ${message}` });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: 'error',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operation: payload.documentId ? 'update' : 'create',
            entity,
            patientId,
            documentId: payload.documentId,
            moduleId: payload.moduleId,
            bundleName: payload.bundleName,
            bundleNumber: payload.bundleNumber,
            itemCount,
            error: message,
          },
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bundle: OrderBundle) => {
      if (!patientId) throw new Error('patientId is required');
      return mutateOrderBundles({
        patientId,
        operations: [
          {
            operation: 'delete',
            documentId: bundle.documentId,
            moduleId: bundle.moduleId,
            entity,
          },
        ],
      });
    },
    onSuccess: (result, bundle) => {
      const itemCount = bundle.items?.length ?? 0;
      setNotice({ tone: result.ok ? 'success' : 'error', message: result.ok ? 'オーダーを削除しました。' : 'オーダーの削除に失敗しました。' });
      logAuditEvent({
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: result.ok ? 'success' : 'error',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: result.runId ?? meta.runId,
            operation: 'delete',
            entity,
            patientId,
            documentId: bundle.documentId,
            moduleId: bundle.moduleId,
            bundleName: bundle.bundleName,
            bundleNumber: bundle.bundleNumber,
            itemCount,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error: unknown, bundle) => {
      const message = error instanceof Error ? error.message : String(error);
      const itemCount = bundle.items?.length ?? 0;
      setNotice({ tone: 'error', message: `オーダーの削除に失敗しました: ${message}` });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: 'error',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operation: 'delete',
            entity,
            patientId,
            documentId: bundle.documentId,
            moduleId: bundle.moduleId,
            bundleName: bundle.bundleName,
            bundleNumber: bundle.bundleNumber,
            itemCount,
            error: message,
          },
        },
      });
    },
  });

  const bundles = bundleQuery.data?.bundles ?? [];
  const masterSearchQueryKey = ['charts-order-master-search', entity, masterType, masterKeyword];
  const masterSearchQuery = useQuery({
    queryKey: masterSearchQueryKey,
    queryFn: () =>
      fetchOrderMasterSearch({
        type: masterType,
        keyword: masterKeyword,
      }),
    enabled: masterKeyword.length > 0 && !isBlocked,
  });
  const masterResults = masterSearchQuery.data?.items ?? [];
  const masterTotalCount = masterSearchQuery.data?.totalCount ?? masterResults.length;

  const formatMasterLabel = (item: OrderMasterSearchItem) =>
    item.code ? `${item.code} ${item.name}` : item.name;

  const handleMasterSelection = (item: OrderMasterSearchItem) => {
    if (isBlocked) return;
    if (item.type === 'youhou') {
      const nextAdmin = formatMasterLabel(item);
      setForm((prev) => ({ ...prev, admin: nextAdmin }));
      setNotice({ tone: 'info', message: `用法をセットしました: ${nextAdmin}` });
      return;
    }
    setForm((prev) => {
      const nextItems = [...prev.items];
      const targetIndex = nextItems.findIndex((entry) => entry.name.trim().length === 0);
      const newItem: OrderBundleItem = {
        name: formatMasterLabel(item),
        unit: item.unit ?? '',
        quantity: '',
      };
      if (targetIndex >= 0) {
        nextItems[targetIndex] = newItem;
      } else {
        nextItems.push(newItem);
      }
      return { ...prev, items: nextItems };
    });
    setNotice({ tone: 'info', message: `${item.name} を追加しました。` });
  };

  if (!patientId) {
    return <p className="charts-side-panel__empty">患者IDが未選択のため {title} を開始できません。</p>;
  }

  return (
    <section className="charts-side-panel__section" data-test-id={`${entity}-edit-panel`}>
      <header className="charts-side-panel__section-header">
        <div>
          <strong>{title}</strong>
          <p>RP単位/オーダー束を編集し、Charts に反映します。</p>
        </div>
        <button
          type="button"
          className="charts-side-panel__ghost"
          onClick={() => {
            setForm(buildEmptyForm(today));
            setNotice(null);
          }}
          disabled={isBlocked}
        >
          新規入力
        </button>
      </header>

      {isBlocked && (
        <div className="charts-side-panel__notice charts-side-panel__notice--info">
          編集はブロックされています: {blockReasons.join(' / ')}
        </div>
      )}
      {notice && <div className={`charts-side-panel__notice charts-side-panel__notice--${notice.tone}`}>{notice.message}</div>}

      <form
        className="charts-side-panel__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (isBlocked) {
            return;
          }
          if (!form.bundleName.trim()) {
            setNotice({ tone: 'error', message: `${bundleLabel}を入力してください。` });
            return;
          }
          mutation.mutate(form);
        }}
      >
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-bundle-name`}>{bundleLabel}</label>
          <input
            id={`${entity}-bundle-name`}
            value={form.bundleName}
            onChange={(event) => setForm((prev) => ({ ...prev, bundleName: event.target.value }))}
            placeholder="例: 降圧薬RP"
            disabled={isBlocked}
          />
        </div>
        <div className="charts-side-panel__field-row">
          <div className="charts-side-panel__field">
            <label htmlFor={`${entity}-admin`}>用法</label>
            <input
              id={`${entity}-admin`}
              value={form.admin}
              onChange={(event) => setForm((prev) => ({ ...prev, admin: event.target.value }))}
              placeholder="例: 1日1回 朝"
              disabled={isBlocked}
            />
          </div>
          <div className="charts-side-panel__field">
            <label htmlFor={`${entity}-bundle-number`}>回数</label>
            <input
              id={`${entity}-bundle-number`}
              value={form.bundleNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, bundleNumber: event.target.value }))}
              placeholder="1"
              disabled={isBlocked}
            />
          </div>
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-start`}>開始日</label>
          <input
            id={`${entity}-start`}
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            disabled={isBlocked}
          />
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-memo`}>メモ</label>
          <textarea
            id={`${entity}-memo`}
            value={form.memo}
            onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
            placeholder="コメントを入力"
            disabled={isBlocked}
          />
        </div>

        <div className="charts-side-panel__subsection charts-side-panel__subsection--search">
          <div className="charts-side-panel__subheader">
            <strong>マスタ検索</strong>
            <span className="charts-side-panel__search-count">
              {masterSearchQuery.isFetching ? '検索中' : `結果 ${masterTotalCount} 件`}
            </span>
          </div>
          <div className="charts-side-panel__field-row">
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-master-type`}>検索種別</label>
              <select
                id={`${entity}-master-type`}
                value={masterType}
                onChange={(event) => setMasterType(event.target.value as OrderMasterSearchType)}
                disabled={isBlocked}
              >
                {masterTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-master-keyword`}>キーワード</label>
              <input
                id={`${entity}-master-keyword`}
                value={masterKeywordInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setMasterKeywordInput(value);
                  setMasterKeyword(value.trim());
                }}
                placeholder="例: アムロジピン / 血液検査"
                disabled={isBlocked}
              />
            </div>
          </div>
          {masterSearchQuery.isError && (
            <div className="charts-side-panel__notice charts-side-panel__notice--error">
              マスタ検索に失敗しました。
            </div>
          )}
          {masterSearchQuery.data && !masterSearchQuery.data.ok && masterSearchQuery.data.message && (
            <div className="charts-side-panel__notice charts-side-panel__notice--error">{masterSearchQuery.data.message}</div>
          )}
          {masterKeyword.length === 0 ? (
            <p className="charts-side-panel__empty">キーワードを入力すると検索結果が表示されます。</p>
          ) : masterResults.length === 0 && !masterSearchQuery.isFetching ? (
            <p className="charts-side-panel__empty">該当するマスタがありません。</p>
          ) : (
            <div className="charts-side-panel__search-table" role="table" aria-label="マスタ検索結果">
              <div className="charts-side-panel__search-header" role="row">
                <span role="columnheader">コード</span>
                <span role="columnheader">名称</span>
                <span role="columnheader">単位</span>
                <span role="columnheader">区分/点数</span>
                <span role="columnheader">有効期間</span>
              </div>
              {masterResults.map((item, index) => (
                <button
                  key={`${item.type}-${item.code ?? item.name}-${index}`}
                  type="button"
                  className="charts-side-panel__search-row"
                  role="row"
                  onClick={() => handleMasterSelection(item)}
                  disabled={isBlocked}
                >
                  <span role="cell">{item.code ?? '—'}</span>
                  <span role="cell">{item.name}</span>
                  <span role="cell">{item.unit ?? '—'}</span>
                  <span role="cell">{item.points ?? item.category ?? '—'}</span>
                  <span role="cell">
                    {item.validFrom || item.validTo ? `${item.validFrom ?? '—'}〜${item.validTo ?? '—'}` : '—'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="charts-side-panel__subsection">
          <div className="charts-side-panel__subheader">
            <strong>薬剤/項目</strong>
            <button
              type="button"
              className="charts-side-panel__ghost"
              onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, buildEmptyItem()] }))}
              disabled={isBlocked}
            >
              追加
            </button>
          </div>
          {form.items.map((item, index) => (
            <div key={`${entity}-item-${index}`} className="charts-side-panel__item-row">
              <input
                value={item.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], name: value };
                    return { ...prev, items: next };
                  });
                }}
                placeholder="項目名"
                disabled={isBlocked}
              />
              <input
                value={item.quantity ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], quantity: value };
                    return { ...prev, items: next };
                  });
                }}
                placeholder={itemQuantityLabel}
                disabled={isBlocked}
              />
              <input
                value={item.unit ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], unit: value };
                    return { ...prev, items: next };
                  });
                }}
                placeholder="単位"
                disabled={isBlocked}
              />
              <button
                type="button"
                className="charts-side-panel__icon"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    items: prev.items.length > 1 ? prev.items.filter((_, idx) => idx !== index) : [buildEmptyItem()],
                  }));
                }}
                disabled={isBlocked}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="charts-side-panel__actions">
          <button type="submit" disabled={mutation.isPending || isBlocked}>
            {form.documentId ? '更新する' : '追加する'}
          </button>
        </div>
      </form>

      <div className="charts-side-panel__list" aria-live="polite">
        <div className="charts-side-panel__list-header">
          <span>登録済み{title}</span>
          <span>{bundleQuery.isFetching ? '更新中' : `${bundles.length}件`}</span>
        </div>
        {bundleQuery.isError && <p className="charts-side-panel__empty">オーダーの取得に失敗しました。</p>}
        {bundles.length === 0 && !bundleQuery.isFetching && <p className="charts-side-panel__empty">登録はまだありません。</p>}
        {bundles.length > 0 && (
          <ul className="charts-side-panel__items">
            {bundles.map((bundle) => (
              <li key={bundle.documentId ?? `${bundle.bundleName}-${bundle.started}`}>
                <div>
                  <strong>{formatBundleName(bundle)}</strong>
                  <span>{bundle.admin ? ` / ${bundle.admin}` : ''}</span>
                  <span>{bundle.started ? ` / ${bundle.started}` : ''}</span>
                </div>
                <div className="charts-side-panel__bundle-items">
                  {bundle.items.map((item, idx) => (
                    <span key={`${bundle.documentId}-${idx}`}>{item.name}{item.quantity ? ` ${item.quantity}` : ''}{item.unit ?? ''}</span>
                  ))}
                </div>
                <div className="charts-side-panel__item-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(toFormState(bundle, today));
                      setNotice(null);
                    }}
                    disabled={isBlocked}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(bundle)}
                    disabled={deleteMutation.isPending || isBlocked}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
