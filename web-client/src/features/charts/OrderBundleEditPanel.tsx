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

type OrderBundleSubmitAction = 'save' | 'expand' | 'expand_continue';

type OrderBundleSubmitPayload = {
  form: BundleFormState;
  action: OrderBundleSubmitAction;
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

  const queryKey = ['charts-order-bundles', patientId, entity];
  const bundleQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!patientId) throw new Error('patientId is required');
      return fetchOrderBundles({ patientId, entity });
    },
    enabled: !!patientId,
  });

  const resolveActionMessage = (action: OrderBundleSubmitAction, ok: boolean) => {
    if (action === 'save') {
      return ok ? 'オーダーを保存しました。' : 'オーダーの保存に失敗しました。';
    }
    if (action === 'expand') {
      return ok ? 'オーダーを展開しました。' : 'オーダーの展開に失敗しました。';
    }
    return ok ? 'オーダーを展開し、編集を継続します。' : 'オーダーの展開継続に失敗しました。';
  };

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
    mutationFn: async (payload: OrderBundleSubmitPayload) => {
      if (!patientId) throw new Error('patientId is required');
      const filteredItems = payload.form.items.filter((item) => item.name.trim().length > 0);
      return mutateOrderBundles({
        patientId,
        operations: [
          {
            operation: payload.form.documentId ? 'update' : 'create',
            documentId: payload.form.documentId,
            moduleId: payload.form.moduleId,
            entity,
            bundleName: payload.form.bundleName,
            bundleNumber: payload.form.bundleNumber,
            admin: payload.form.admin,
            adminMemo: payload.form.adminMemo,
            memo: payload.form.memo,
            startDate: payload.form.startDate,
            items: filteredItems,
          },
        ],
      });
    },
    onSuccess: (result, payload) => {
      const operation = payload.form.documentId ? 'update' : 'create';
      const itemCount = countItems(payload.form.items);
      const operationPhase = payload.action === 'save' ? 'save' : payload.action;
      setNotice({ tone: result.ok ? 'success' : 'error', message: resolveActionMessage(payload.action, result.ok) });
      recordOutpatientFunnel('charts_action', {
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit ?? false,
        missingMaster: meta.missingMaster ?? false,
        dataSourceTransition: meta.dataSourceTransition ?? 'server',
        fallbackUsed: meta.fallbackUsed ?? false,
        action: payload.action === 'save' ? operation : payload.action,
        outcome: result.ok ? 'success' : 'error',
        note: payload.form.bundleName,
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
            operationPhase,
            operation,
            entity,
            patientId,
            documentId: payload.form.documentId,
            moduleId: payload.form.moduleId,
            bundleName: payload.form.bundleName,
            bundleNumber: payload.form.bundleNumber,
            itemCount,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
        if (payload.action !== 'expand_continue') {
          setForm(buildEmptyForm(today));
        }
      }
    },
    onError: (error: unknown, payload: OrderBundleSubmitPayload) => {
      const message = error instanceof Error ? error.message : String(error);
      const itemCount = countItems(payload.form.items);
      const operationPhase = payload.action === 'save' ? 'save' : payload.action;
      setNotice({ tone: 'error', message: `${resolveActionMessage(payload.action, false)}: ${message}` });
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
            operationPhase,
            operation: payload.form.documentId ? 'update' : 'create',
            entity,
            patientId,
            documentId: payload.form.documentId,
            moduleId: payload.form.moduleId,
            bundleName: payload.form.bundleName,
            bundleNumber: payload.form.bundleNumber,
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
  const submitAction = (action: OrderBundleSubmitAction) => {
    if (isBlocked) {
      return;
    }
    if (!form.bundleName.trim()) {
      setNotice({ tone: 'error', message: `${bundleLabel}を入力してください。` });
      return;
    }
    mutation.mutate({ form, action });
  };

  if (!patientId) {
    return <p className="charts-side-panel__empty">患者IDが未選択のため {title} を開始できません。</p>;
  }

  return (
    <section className="charts-side-panel__section" data-test-id={`${entity}-edit-panel`}>
      <header className="charts-side-panel__section-header">
        <div>
          <strong>{title}</strong>
          <p>RP単位/オーダー束を編集し、カルテ展開/保存の導線で反映します。</p>
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
          submitAction('save');
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

        <p className="charts-side-panel__message">
          展開: カルテへ反映 / 展開継続: 反映後に入力を保持 / 保存: オーダー束を保存
        </p>
        <div className="charts-side-panel__actions">
          <button
            type="button"
            onClick={() => submitAction('expand')}
            disabled={mutation.isPending || isBlocked}
          >
            展開する
          </button>
          <button
            type="button"
            onClick={() => submitAction('expand_continue')}
            disabled={mutation.isPending || isBlocked}
          >
            展開継続する
          </button>
          <button type="submit" disabled={mutation.isPending || isBlocked}>
            {form.documentId ? '保存して更新' : '保存して追加'}
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
