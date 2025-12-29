import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { readStoredAuth } from '../../libs/auth/storedAuth';
import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchOrderBundles, mutateOrderBundles, type OrderBundle, type OrderBundleItem } from './orderBundleApi';
import { fetchStampDetail, fetchStampTree, fetchUserProfile, type StampBundleJson, type StampTreeEntry } from './stampApi';
import { loadLocalStamps, saveLocalStamp, type LocalStampEntry } from './stampStorage';
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

type BundleFormItem = OrderBundleItem & { rowId: string };

type BundleFormState = {
  documentId?: number;
  moduleId?: number;
  bundleName: string;
  admin: string;
  bundleNumber: string;
  adminMemo: string;
  memo: string;
  startDate: string;
  items: BundleFormItem[];
};

type OrderBundleSubmitAction = 'save' | 'expand' | 'expand_continue';

type OrderBundleSubmitPayload = {
  form: BundleFormState;
  action: OrderBundleSubmitAction;
};

type BundleValidationIssue = {
  key: string;
  message: string;
};

type BundleValidationRule = {
  itemLabel: string;
  requiresItems: boolean;
  requiresUsage: boolean;
};

type StampNotice = { tone: 'info' | 'success' | 'error'; message: string };

type StampSelection = {
  source: 'local' | 'server';
  id: string;
};

type StampFormState = {
  name: string;
  category: string;
  target: string;
};

const createRowId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildFormItem = (item?: Partial<OrderBundleItem>): BundleFormItem => ({
  rowId: createRowId(),
  name: item?.name ?? '',
  quantity: item?.quantity ?? '',
  unit: item?.unit ?? '',
  memo: item?.memo ?? '',
});

const buildEmptyItem = (): BundleFormItem => buildFormItem();

const countItems = (items?: BundleFormItem[]) =>
  items ? items.filter((item) => item.name.trim().length > 0).length : 0;

const DEFAULT_VALIDATION_RULE: BundleValidationRule = {
  itemLabel: '項目',
  requiresItems: true,
  requiresUsage: false,
};

const BASE_EDITOR_ENTITIES = [
  'generalOrder',
  'treatmentOrder',
  'testOrder',
  'laboTest',
  'physiologyOrder',
  'bacteriaOrder',
  'instractionChargeOrder',
  'surgeryOrder',
  'otherOrder',
  'radiologyOrder',
  'baseChargeOrder',
];

const BUNDLE_NAME_REQUIRED_ENTITIES = new Set([...BASE_EDITOR_ENTITIES, 'medOrder']);

const BASE_EDITOR_RULE: BundleValidationRule = {
  itemLabel: '項目',
  requiresItems: true,
  requiresUsage: false,
};

const VALIDATION_RULES_BY_ENTITY: Record<string, BundleValidationRule> = {
  medOrder: {
    itemLabel: '薬剤/項目',
    requiresItems: true,
    requiresUsage: true,
  },
  ...Object.fromEntries(BASE_EDITOR_ENTITIES.map((entity) => [entity, BASE_EDITOR_RULE])),
};

const buildEmptyForm = (today: string): BundleFormState => ({
  bundleName: '',
  admin: '',
  bundleNumber: '1',
  adminMemo: '',
  memo: '',
  startDate: today,
  items: [buildFormItem()],
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
  items:
    bundle.items && bundle.items.length > 0
      ? bundle.items.map((item) => buildFormItem(item))
      : [buildFormItem()],
});

const toFormStateFromStamp = (stamp: StampBundleJson, today: string): BundleFormState => ({
  bundleName: stamp.orderName ?? stamp.className ?? '',
  admin: stamp.admin ?? '',
  bundleNumber: stamp.bundleNumber ?? '1',
  adminMemo: stamp.adminMemo ?? '',
  memo: stamp.memo ?? '',
  startDate: today,
  items:
    stamp.claimItem && stamp.claimItem.length > 0
      ? stamp.claimItem.map((item) =>
          buildFormItem({
            name: item.name ?? '',
            quantity: item.number ?? '',
            unit: item.unit ?? '',
            memo: item.memo ?? '',
          }),
        )
      : [buildFormItem()],
});

const toFormStateFromLocalStamp = (stamp: LocalStampEntry): BundleFormState => ({
  bundleName: stamp.bundle.bundleName,
  admin: stamp.bundle.admin,
  bundleNumber: stamp.bundle.bundleNumber,
  adminMemo: stamp.bundle.adminMemo,
  memo: stamp.bundle.memo,
  startDate: stamp.bundle.startDate,
  items: stamp.bundle.items.length > 0 ? stamp.bundle.items.map((item) => buildFormItem(item)) : [buildFormItem()],
});

const formatBundleName = (bundle: OrderBundle) => bundle.bundleName ?? '名称未設定';

export const validateBundleForm = ({
  form,
  entity,
  bundleLabel,
}: {
  form: BundleFormState;
  entity: string;
  bundleLabel: string;
}): BundleValidationIssue[] => {
  const issues: BundleValidationIssue[] = [];
  const rule = VALIDATION_RULES_BY_ENTITY[entity] ?? DEFAULT_VALIDATION_RULE;
  const itemCount = countItems(form.items);
  if (rule.requiresItems && itemCount === 0) {
    issues.push({ key: 'missing_items', message: `${rule.itemLabel}を1件以上入力してください。` });
  }
  if (rule.requiresUsage && !form.admin.trim()) {
    issues.push({ key: 'missing_usage', message: '用法を入力してください。' });
  }
  if (BUNDLE_NAME_REQUIRED_ENTITIES.has(entity) && !form.bundleName.trim()) {
    issues.push({ key: 'missing_bundle_name', message: `${bundleLabel}を入力してください。` });
  }
  return issues;
};

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
  const [stampNotice, setStampNotice] = useState<StampNotice | null>(null);
  const [stampForm, setStampForm] = useState<StampFormState>({ name: '', category: '', target: entity });
  const [selectedStamp, setSelectedStamp] = useState<string>('');
  const [localStamps, setLocalStamps] = useState<LocalStampEntry[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
  const guardReasonKeys = useMemo(() => {
    const reasons: string[] = [];
    if (meta.readOnly) reasons.push('read_only');
    if (meta.missingMaster) reasons.push('missing_master');
    if (meta.fallbackUsed) reasons.push('fallback_used');
    return reasons;
  }, [meta.fallbackUsed, meta.missingMaster, meta.readOnly]);
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

  const storedAuth = useMemo(() => readStoredAuth(), []);
  const userName = storedAuth ? `:` : null;

  useEffect(() => {
    if (!userName) return;
    setLocalStamps(loadLocalStamps(userName));
  }, [userName]);

  useEffect(() => {
    setStampForm((prev) => ({ ...prev, target: entity }));
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

  const userProfileQuery = useQuery({
    queryKey: ['charts-user-profile', userName],
    queryFn: () => {
      if (!userName) throw new Error('userName is required');
      return fetchUserProfile(userName);
    },
    enabled: !!userName,
    staleTime: 5 * 60 * 1000,
  });

  const userPk = userProfileQuery.data?.id;

  const stampTreeQuery = useQuery({
    queryKey: ['charts-stamp-tree', userPk],
    queryFn: () => {
      if (!userPk) throw new Error('userPk is required');
      return fetchStampTree(userPk);
    },
    enabled: typeof userPk === 'number',
  });

  const stampTreeEntries = useMemo(() => {
    const trees = stampTreeQuery.data?.trees ?? [];
    return trees
      .filter((tree) => tree.entity === entity)
      .flatMap((tree) =>
        (Array.isArray(tree.stampList) ? tree.stampList : []).map((stamp) => ({
          ...stamp,
          treeName: tree.treeName,
          treeEntity: tree.entity,
        })),
      );
  }, [entity, stampTreeQuery.data?.trees]);

  const stampCategories = useMemo(() => {
    const fromServer = stampTreeEntries.map((entry) => entry.treeName).filter((name) => name && name.trim().length > 0);
    const fromLocal = localStamps.map((stamp) => stamp.category).filter((name) => name && name.trim().length > 0);
    return Array.from(new Set([...fromServer, ...fromLocal])).sort();
  }, [localStamps, stampTreeEntries]);

  const stampTargets = useMemo(
    () => [
      { value: 'medOrder', label: '処方' },
      { value: 'generalOrder', label: '処置/検査/指示' },
      { value: 'injectionOrder', label: '注射' },
      { value: 'treatmentOrder', label: '処置' },
      { value: 'surgeryOrder', label: '手術' },
      { value: 'testOrder', label: '検査' },
      { value: 'physiologyOrder', label: '生理検査' },
      { value: 'bacteriaOrder', label: '細菌検査' },
      { value: 'radiologyOrder', label: '放射線' },
      { value: 'otherOrder', label: 'その他' },
    ],
    [],
  );
  const resolvedStampTargets = useMemo(() => {
    if (stampTargets.some((option) => option.value === entity)) {
      return stampTargets;
    }
    return [...stampTargets, { value: entity, label: entity }];
  }, [entity, stampTargets]);

  const localStampOptions = useMemo(
    () => localStamps.filter((stamp) => stamp.target === entity),
    [entity, localStamps],
  );

  const parseStampSelection = (value: string): StampSelection | null => {
    if (!value) return null;
    const [source, id] = value.split('::');
    if ((source !== 'local' && source !== 'server') || !id) return null;
    return { source, id };
  };

  const mutation = useMutation({
    mutationFn: async (payload: OrderBundleSubmitPayload) => {
      if (!patientId) throw new Error('patientId is required');
      const filteredItems = payload.form.items
        .filter((item) => item.name.trim().length > 0)
        .map(({ rowId, ...rest }) => rest);
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
      setNotice({ tone: 'error', message: '編集ガード中のため保存できません。' });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: 'blocked',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operation: form.documentId ? 'update' : 'create',
            entity,
            patientId,
            bundleName: form.bundleName,
            bundleNumber: form.bundleNumber,
            itemCount: countItems(form.items),
            blockedReasons: guardReasonKeys.length > 0 ? guardReasonKeys : ['edit_guard'],
            operationPhase: 'lock',
          },
        },
      });
      return;
    }
    const validationIssues = validateBundleForm({ form, entity, bundleLabel });
    if (validationIssues.length > 0) {
      setNotice({ tone: 'error', message: validationIssues[0].message });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_ORDER_BUNDLE_MUTATION',
          outcome: 'blocked',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operation: form.documentId ? 'update' : 'create',
            entity,
            patientId,
            bundleName: form.bundleName,
            bundleNumber: form.bundleNumber,
            itemCount: countItems(form.items),
            blockedReasons: validationIssues.map((issue) => issue.key),
            validationMessages: validationIssues.map((issue) => issue.message),
            operationPhase: 'lock',
          },
        },
      });
      return;
    }
    mutation.mutate({ form, action });
  };

  const canReorderItems = !isBlocked && form.items.length > 1;

  const resetDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragStart = (index: number, event: DragEvent<HTMLButtonElement>) => {
    if (!canReorderItems) return;
    setDraggedIndex(index);
    setDragOverIndex(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, event: DragEvent<HTMLDivElement>) => {
    if (!canReorderItems) return;
    if (index < 0 || index >= form.items.length) return;
    event.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number, event: DragEvent<HTMLDivElement>) => {
    if (!canReorderItems) return;
    event.preventDefault();
    if (index < 0 || index >= form.items.length) {
      resetDragState();
      return;
    }
    const fromIndexRaw = draggedIndex ?? Number(event.dataTransfer.getData('text/plain'));
    if (!Number.isFinite(fromIndexRaw)) {
      resetDragState();
      return;
    }
    const fromIndex = Number(fromIndexRaw);
    if (fromIndex < 0 || fromIndex >= form.items.length) {
      resetDragState();
      return;
    }
    if (fromIndex === index) {
      resetDragState();
      return;
    }
    setForm((prev) => {
      const nextItems = [...prev.items];
      const [moved] = nextItems.splice(fromIndex, 1);
      nextItems.splice(index, 0, moved);
      return { ...prev, items: nextItems };
    });
    resetDragState();
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const clearItems = () => {
    if (isBlocked) return;
    const confirmed = window.confirm('入力中の行をすべてクリアします。よろしいですか？');
    if (!confirmed) return;
    setForm((prev) => ({ ...prev, items: [buildFormItem()] }));
    setNotice({ tone: 'info', message: '入力行を全てクリアしました。' });
  };

  const stampImportMutation = useMutation({
    mutationFn: async (stampId: string) => fetchStampDetail(stampId),
    onSuccess: (result, stampId) => {
      if (!result.ok || !result.stamp) {
        setStampNotice({ tone: 'error', message: result.message ?? 'スタンプの取り込みに失敗しました。' });
        logAuditEvent({
          runId: result.runId ?? meta.runId,
          cacheHit: meta.cacheHit,
          missingMaster: meta.missingMaster,
          fallbackUsed: meta.fallbackUsed,
          dataSourceTransition: meta.dataSourceTransition,
          payload: {
            action: 'CHARTS_STAMP_IMPORT',
            outcome: 'error',
            subject: 'charts',
            details: {
              ...auditMetaDetails,
              runId: result.runId ?? meta.runId,
              operationPhase: 'import',
            entity,
            patientId,
            stampId,
            stampSource: 'server',
            reason: result.message ?? 'stamp_import_failed',
          },
        },
      });
        return;
      }
      const nextForm = toFormStateFromStamp(result.stamp, today);
      setForm((prev) => ({
        ...nextForm,
        documentId: prev.documentId,
        moduleId: prev.moduleId,
      }));
      setStampNotice({ tone: 'success', message: 'スタンプを取り込みました。内容を確認して反映してください。' });
      logAuditEvent({
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_STAMP_IMPORT',
          outcome: 'success',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: result.runId ?? meta.runId,
            operationPhase: 'import',
            entity,
            patientId,
            stampId,
            stampSource: 'server',
            bundleName: nextForm.bundleName,
            itemCount: countItems(nextForm.items),
          },
        },
      });
    },
    onError: (error: unknown, stampId: string) => {
      const message = error instanceof Error ? error.message : String(error);
      setStampNotice({ tone: 'error', message: `スタンプの取り込みに失敗しました: ${message}` });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_STAMP_IMPORT',
          outcome: 'error',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operationPhase: 'import',
            entity,
            patientId,
            stampId,
            stampSource: 'server',
            error: message,
          },
        },
      });
    },
  });

  const saveStamp = () => {
    if (isBlocked) {
      setStampNotice({ tone: 'error', message: '編集ガード中のためスタンプ保存はできません。' });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_STAMP_SAVE',
          outcome: 'blocked',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operationPhase: 'save',
            entity,
            patientId,
            blockedReasons: blockReasons,
          },
        },
      });
      return;
    }
    if (!userName) {
      setStampNotice({ tone: 'error', message: 'ログイン情報が取得できないためスタンプ保存ができません。' });
      return;
    }
    if (!stampForm.name.trim()) {
      setStampNotice({ tone: 'error', message: 'スタンプ名称を入力してください。' });
      return;
    }
    if (!stampForm.target) {
      setStampNotice({ tone: 'error', message: '対象を選択してください。' });
      return;
    }
    const entry = saveLocalStamp(userName, {
      name: stampForm.name.trim(),
      category: stampForm.category.trim(),
      target: stampForm.target,
      entity,
      bundle: {
        bundleName: form.bundleName,
        admin: form.admin,
        bundleNumber: form.bundleNumber,
        adminMemo: form.adminMemo,
        memo: form.memo,
        startDate: form.startDate,
        items: form.items.filter((item) => item.name.trim().length > 0).map(({ rowId, ...rest }) => rest),
      },
    });
    setLocalStamps(loadLocalStamps(userName));
    setStampNotice({ tone: 'success', message: 'スタンプを保存しました。' });
    setSelectedStamp(`local::${entry.id}`);
    logAuditEvent({
      runId: meta.runId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      payload: {
        action: 'CHARTS_STAMP_SAVE',
        outcome: 'success',
        subject: 'charts',
        details: {
          ...auditMetaDetails,
          runId: meta.runId,
          operationPhase: 'save',
          entity,
          patientId,
          stampName: stampForm.name.trim(),
          stampCategory: stampForm.category.trim(),
          stampTarget: stampForm.target,
          stampSource: 'local',
          bundleName: form.bundleName,
          itemCount: countItems(form.items),
        },
      },
    });
  };

  const importStamp = () => {
    if (isBlocked) {
      setStampNotice({ tone: 'error', message: '編集ガード中のためスタンプ取り込みはできません。' });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_STAMP_IMPORT',
          outcome: 'blocked',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operationPhase: 'import',
            entity,
            patientId,
            blockedReasons: blockReasons,
          },
        },
      });
      return;
    }
    const selection = parseStampSelection(selectedStamp);
    if (!selection) {
      setStampNotice({ tone: 'error', message: '取り込むスタンプを選択してください。' });
      return;
    }
    if (selection.source === 'local') {
      const local = localStamps.find((stamp) => stamp.id === selection.id);
      if (!local) {
        setStampNotice({ tone: 'error', message: 'ローカルスタンプが見つかりません。' });
        return;
      }
      const nextForm = toFormStateFromLocalStamp(local);
      setForm((prev) => ({
        ...nextForm,
        documentId: prev.documentId,
        moduleId: prev.moduleId,
      }));
      setStampNotice({ tone: 'success', message: 'ローカルスタンプを取り込みました。内容を確認して反映してください。' });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_STAMP_IMPORT',
          outcome: 'success',
          subject: 'charts',
          details: {
            ...auditMetaDetails,
            runId: meta.runId,
            operationPhase: 'import',
            entity,
            patientId,
            stampId: selection.id,
            stampSource: 'local',
            bundleName: nextForm.bundleName,
            itemCount: countItems(nextForm.items),
          },
        },
      });
      return;
    }
    stampImportMutation.mutate(selection.id);
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
            setStampNotice(null);
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

      <div className="charts-side-panel__subsection">
        <div className="charts-side-panel__subheader">
          <strong>スタンプ保存/取り込み</strong>
        </div>
        {stampNotice && (
          <div className={`charts-side-panel__notice charts-side-panel__notice--${stampNotice.tone}`}>{stampNotice.message}</div>
        )}
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-stamp-name`}>スタンプ名称</label>
          <input
            id={`${entity}-stamp-name`}
            value={stampForm.name}
            onChange={(event) => setStampForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="例: 降圧薬セット"
            disabled={isBlocked}
          />
        </div>
        <div className="charts-side-panel__field-row">
          <div className="charts-side-panel__field">
            <label htmlFor={`${entity}-stamp-category`}>分類</label>
            <input
              id={`${entity}-stamp-category`}
              list={`${entity}-stamp-category-list`}
              value={stampForm.category}
              onChange={(event) => setStampForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="例: 院内セット"
              disabled={isBlocked}
            />
            <datalist id={`${entity}-stamp-category-list`}>
              {stampCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
          <div className="charts-side-panel__field">
            <label htmlFor={`${entity}-stamp-target`}>対象</label>
            <select
              id={`${entity}-stamp-target`}
              value={stampForm.target}
              onChange={(event) => setStampForm((prev) => ({ ...prev, target: event.target.value }))}
              disabled={isBlocked}
            >
              {resolvedStampTargets.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor={`${entity}-stamp-select`}>既存スタンプ</label>
          <select
            id={`${entity}-stamp-select`}
            value={selectedStamp}
            onChange={(event) => setSelectedStamp(event.target.value)}
            disabled={isBlocked}
          >
            <option value="">選択してください</option>
            {localStampOptions.length > 0 && (
              <optgroup label={`ローカル (${localStampOptions.length}件)`}>
                {localStampOptions.map((stamp) => (
                  <option key={stamp.id} value={`local::${stamp.id}`}>
                    {stamp.name || '名称未設定'}
                    {stamp.category ? ` / ${stamp.category}` : ''}
                  </option>
                ))}
              </optgroup>
            )}
            {stampTreeEntries.length > 0 && (
              <optgroup label={`サーバー (${stampTreeEntries.length}件)`}>
                {stampTreeEntries.map((stamp: StampTreeEntry & { treeName?: string }) => (
                  <option key={stamp.stampId} value={`server::${stamp.stampId}`}>
                    {stamp.name}
                    {stamp.treeName ? ` / ${stamp.treeName}` : ''}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="charts-side-panel__actions">
          <button type="button" onClick={saveStamp} disabled={isBlocked}>
            スタンプ保存
          </button>
          <button
            type="button"
            onClick={importStamp}
            disabled={stampImportMutation.isPending || isBlocked}
          >
            スタンプ取り込み
          </button>
        </div>
        <p className="charts-side-panel__message">
          取り込み後は内容を確認し、必要に応じて編集してから「展開する」「展開継続する」または「保存して追加」で反映してください。
        </p>
      </div>

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
            <div className="charts-side-panel__subheader-actions">
              <button
                type="button"
                className="charts-side-panel__ghost"
                onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, buildEmptyItem()] }))}
                disabled={isBlocked}
              >
                追加
              </button>
              <button
                type="button"
                className="charts-side-panel__ghost charts-side-panel__ghost--danger"
                onClick={clearItems}
                disabled={isBlocked}
              >
                全クリア
              </button>
            </div>
          </div>
          {form.items.map((item, index) => (
            <div
              key={item.rowId}
              data-testid="order-bundle-item-row"
              data-rowid={item.rowId}
              className={`charts-side-panel__item-row${
                dragOverIndex === index ? ' charts-side-panel__item-row--drag-over' : ''
              }${draggedIndex === index ? ' charts-side-panel__item-row--dragging' : ''}`}
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
            >
              <button
                type="button"
                className="charts-side-panel__drag-handle"
                draggable={canReorderItems}
                onDragStart={(event) => handleDragStart(index, event)}
                onDragEnd={handleDragEnd}
                disabled={!canReorderItems}
                aria-label="ドラッグして並べ替え"
                title={canReorderItems ? 'ドラッグして並べ替え' : '並べ替えは複数行が必要です'}
              >
                ≡
              </button>
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
                className="charts-side-panel__row-delete"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  items:
                    prev.items.length > 1
                      ? prev.items.filter((_, idx) => idx !== index)
                      : [buildFormItem()],
                }));
              }}
                disabled={isBlocked}
              >
                行削除
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
