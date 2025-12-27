import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchOrderBundles, mutateOrderBundles, type OrderBundle, type OrderBundleItem } from './orderBundleApi';
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
            items: payload.items.filter((item) => item.name.trim().length > 0),
          },
        ],
      });
    },
    onSuccess: (result, payload) => {
      const operation = payload.documentId ? 'update' : 'create';
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
            operation,
            entity,
            patientId,
            documentId: payload.documentId,
            bundleName: payload.bundleName,
            bundleNumber: payload.bundleNumber,
            itemCount: payload.items.length,
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
            operation: payload.documentId ? 'update' : 'create',
            entity,
            patientId,
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
            operation: 'delete',
            entity,
            patientId,
            documentId: bundle.documentId,
            bundleName: bundle.bundleName,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error: unknown, bundle) => {
      const message = error instanceof Error ? error.message : String(error);
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
            operation: 'delete',
            entity,
            patientId,
            documentId: bundle.documentId,
            error: message,
          },
        },
      });
    },
  });

  const bundles = bundleQuery.data?.bundles ?? [];

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
        >
          新規入力
        </button>
      </header>

      {notice && <div className={`charts-side-panel__notice charts-side-panel__notice--${notice.tone}`}>{notice.message}</div>}

      <form
        className="charts-side-panel__form"
        onSubmit={(event) => {
          event.preventDefault();
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
            />
          </div>
          <div className="charts-side-panel__field">
            <label htmlFor={`${entity}-bundle-number`}>回数</label>
            <input
              id={`${entity}-bundle-number`}
              value={form.bundleNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, bundleNumber: event.target.value }))}
              placeholder="1"
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
          />
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-memo`}>メモ</label>
          <textarea
            id={`${entity}-memo`}
            value={form.memo}
            onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
            placeholder="コメントを入力"
          />
        </div>

        <div className="charts-side-panel__subsection">
          <div className="charts-side-panel__subheader">
            <strong>薬剤/項目</strong>
            <button
              type="button"
              className="charts-side-panel__ghost"
              onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, buildEmptyItem()] }))}
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
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="charts-side-panel__actions">
          <button type="submit" disabled={mutation.isPending}>
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
                  >
                    編集
                  </button>
                  <button type="button" onClick={() => deleteMutation.mutate(bundle)} disabled={deleteMutation.isPending}>
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
