import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { readStoredAuth } from '../../libs/auth/storedAuth';
import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchOrderBundles, mutateOrderBundles, type OrderBundle, type OrderBundleItem } from './orderBundleApi';
import {
  fetchOrderMasterSearch,
  type OrderMasterSearchItem,
  type OrderMasterSearchType,
} from './orderMasterSearchApi';
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
  materialItems: OrderBundleItem[];
  commentItems: OrderBundleItem[];
  bodyPart?: OrderBundleItem | null;
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

type OrderBundleItemWithRowId = OrderBundleItem & { rowId?: string };

const createRowId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureRowId = (item: OrderBundleItem): OrderBundleItemWithRowId => ({
  ...item,
  rowId: (item as OrderBundleItemWithRowId).rowId ?? createRowId(),
});

const stripRowMeta = (item: OrderBundleItem): OrderBundleItem => {
  const { rowId, ...rest } = item as OrderBundleItemWithRowId;
  return rest;
};

const buildEmptyItem = (): OrderBundleItem => ensureRowId({ name: '', quantity: '', unit: '', memo: '' });

const NO_PROCEDURE_CHARGE_TEXT = '手技料なし';
const MATERIAL_CODE_PREFIX = '7';
const BODY_PART_CODE_PREFIX = '002';
const COMMENT_CODE_PATTERN = /^(008[1-6]|8[1-6]|098|099|98|99)/;
const USAGE_FILTER_OPTIONS = [
  { value: '', label: '用法選択', pattern: '' },
  { value: '0010001', label: '内服1回等(100)', pattern: '0010001' },
  { value: '0010002', label: '内服2回等(200)', pattern: '0010002' },
  { value: '0010003', label: '内服3回等(300)', pattern: '0010003' },
  { value: '0010004', label: '内服4回等(400)', pattern: '0010004' },
  { value: '(0010005|0010007)', label: '点眼等(500,700)', pattern: '(0010005|0010007)' },
  { value: '0010006', label: '塗布等(600)', pattern: '0010006' },
  { value: '0010008', label: '頓用等(800)', pattern: '0010008' },
  { value: '0010009', label: '吸入等(900)', pattern: '0010009' },
  { value: '001', label: '全て', pattern: '001' },
];
const DEFAULT_USAGE_LIMIT = 50;

const countItems = (items?: OrderBundleItem[]) =>
  items ? items.filter((item) => item.name.trim().length > 0).length : 0;

const splitBundleItems = (items?: OrderBundleItem[]) => {
  const normal: OrderBundleItem[] = [];
  const material: OrderBundleItem[] = [];
  const comment: OrderBundleItem[] = [];
  let bodyPart: OrderBundleItem | null = null;
  (items ?? []).forEach((item) => {
    const code = item.code?.trim();
    if (code && code.startsWith(BODY_PART_CODE_PREFIX)) {
      if (!bodyPart) {
        bodyPart = { ...item };
      } else {
        normal.push({ ...item });
      }
      return;
    }
    if (code && code.startsWith(MATERIAL_CODE_PREFIX)) {
      material.push({ ...item });
      return;
    }
    if (code && COMMENT_CODE_PATTERN.test(code)) {
      comment.push({ ...item });
      return;
    }
    normal.push({ ...item });
  });
  return { normal, material, comment, bodyPart };
};

const collectBundleItems = (form: BundleFormState) => {
  const merged = [
    ...(form.bodyPart && form.bodyPart.name.trim() ? [form.bodyPart] : []),
    ...form.items,
    ...form.materialItems,
    ...form.commentItems,
  ];
  return merged;
};

const countMainItems = (form: BundleFormState) => countItems([...form.items, ...form.materialItems]);

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
  items: [buildEmptyItem()],
  materialItems: [],
  commentItems: [],
  bodyPart: null,
});

const toFormState = (bundle: OrderBundle, today: string): BundleFormState => {
  const { normal, material, comment, bodyPart } = splitBundleItems(bundle.items);
  return {
    documentId: bundle.documentId,
    moduleId: bundle.moduleId,
    bundleName: bundle.bundleName ?? '',
    admin: bundle.admin ?? '',
    bundleNumber: bundle.bundleNumber ?? '1',
    adminMemo: bundle.adminMemo ?? '',
    memo: bundle.memo ?? '',
    startDate: bundle.started ?? today,
    items: normal.length > 0 ? normal.map(ensureRowId) : [buildEmptyItem()],
    materialItems: material.map(ensureRowId),
    commentItems: comment.map(ensureRowId),
    bodyPart,
  };
};

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
          ensureRowId({
            name: item.name ?? '',
            quantity: item.number ?? '',
            unit: item.unit ?? '',
            memo: item.memo ?? '',
          }),
        )
      : [buildEmptyItem()],
  materialItems: [],
  commentItems: [],
  bodyPart: null,
});

const toFormStateFromLocalStamp = (stamp: LocalStampEntry): BundleFormState => {
  const { normal, material, comment, bodyPart } = splitBundleItems(stamp.bundle.items);
  return {
    bundleName: stamp.bundle.bundleName,
    admin: stamp.bundle.admin,
    bundleNumber: stamp.bundle.bundleNumber,
    adminMemo: stamp.bundle.adminMemo,
    memo: stamp.bundle.memo,
    startDate: stamp.bundle.startDate,
    items: normal.length > 0 ? normal.map(ensureRowId) : [buildEmptyItem()],
    materialItems: material.map(ensureRowId),
    commentItems: comment.map(ensureRowId),
    bodyPart,
  };
};

const formatBundleName = (bundle: OrderBundle) => bundle.bundleName ?? '名称未設定';
const formatMasterLabel = (item: OrderMasterSearchItem) => (item.code ? `${item.code} ${item.name}` : item.name);
const formatUsageLabel = (item: OrderMasterSearchItem) => formatMasterLabel(item);
const resolveUsagePattern = (value: string) =>
  USAGE_FILTER_OPTIONS.find((option) => option.value === value)?.pattern ?? '';
const matchesUsagePattern = (code: string | undefined, pattern: string) => {
  if (!pattern) return true;
  if (!code) return false;
  try {
    const regex = new RegExp(`^${pattern}`);
    return regex.test(code);
  } catch {
    return code.startsWith(pattern);
  }
};

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
  const hasAnyValue = (item: OrderBundleItem) =>
    Boolean(
      item.name?.trim() ||
        item.code?.trim() ||
        item.quantity?.trim() ||
        item.unit?.trim() ||
        item.memo?.trim(),
    );
  const rule = VALIDATION_RULES_BY_ENTITY[entity] ?? DEFAULT_VALIDATION_RULE;
  const itemCount = countMainItems(form);
  if (rule.requiresItems && itemCount === 0) {
    issues.push({ key: 'missing_items', message: `${rule.itemLabel}を1件以上入力してください。` });
  }
  if (rule.requiresUsage && !form.admin.trim()) {
    issues.push({ key: 'missing_usage', message: '用法を入力してください。' });
  }
  if (BUNDLE_NAME_REQUIRED_ENTITIES.has(entity) && !form.bundleName.trim()) {
    issues.push({ key: 'missing_bundle_name', message: `${bundleLabel}を入力してください。` });
  }
  if (entity === 'radiologyOrder' && !form.bodyPart?.name?.trim()) {
    issues.push({ key: 'missing_body_part', message: '部位を入力してください。' });
  }
  const invalidMaterial = form.materialItems.some(
    (item) => hasAnyValue(item) && !item.name?.trim(),
  );
  if (invalidMaterial) {
    issues.push({ key: 'invalid_material_item', message: '材料名を入力してください。' });
  }
  const commentIssues = form.commentItems.reduce(
    (acc, item) => {
      const hasCode = Boolean(item.code?.trim());
      const hasName = Boolean(item.name?.trim());
      const hasValue = hasAnyValue(item);
      if (hasValue && (!hasCode || !hasName)) acc.incomplete = true;
      if (hasCode && !COMMENT_CODE_PATTERN.test(item.code!.trim())) acc.invalidCode = true;
      return acc;
    },
    { incomplete: false, invalidCode: false },
  );
  if (commentIssues.incomplete) {
    issues.push({ key: 'invalid_comment_item', message: 'コメントコードと内容を入力してください。' });
  }
  if (commentIssues.invalidCode) {
    issues.push({ key: 'invalid_comment_code', message: 'コメントコードが不正です。' });
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
  const [masterKeyword, setMasterKeyword] = useState('');
  const [masterSearchType, setMasterSearchType] = useState<OrderMasterSearchType>('generic-class');
  const [usageKeyword, setUsageKeyword] = useState('');
  const [usageFilter, setUsageFilter] = useState(USAGE_FILTER_OPTIONS[0].value);
  const [usagePartialMatch, setUsagePartialMatch] = useState(false);
  const [usageLimit, setUsageLimit] = useState(DEFAULT_USAGE_LIMIT);
  const [materialKeyword, setMaterialKeyword] = useState('');
  const [bodyPartKeyword, setBodyPartKeyword] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedItemRowId, setSelectedItemRowId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<OrderBundleItem>({
    code: '',
    name: '',
    quantity: '',
    unit: '',
    memo: '',
  });
  const isInjectionOrder = entity === 'injectionOrder';
  const isRadiologyOrder = entity === 'radiologyOrder';
  const supportsBodyPartSearch = isRadiologyOrder || entity === 'generalOrder';
  const supportsCommentCodes = BASE_EDITOR_ENTITIES.includes(entity);
  const supportsMaterials = ['generalOrder', 'treatmentOrder', 'testOrder', 'instractionChargeOrder'].includes(entity);
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

  const masterSearchQuery = useQuery({
    queryKey: ['charts-order-master-search', masterSearchType, masterKeyword],
    queryFn: () => fetchOrderMasterSearch({ type: masterSearchType, keyword: masterKeyword }),
    enabled: masterKeyword.trim().length > 0,
    staleTime: 30 * 1000,
  });

  const usagePattern = useMemo(() => resolveUsagePattern(usageFilter), [usageFilter]);
  const usageSearchQuery = useQuery({
    queryKey: ['charts-order-usage-search', usageKeyword],
    queryFn: () =>
      fetchOrderMasterSearch({
        type: 'youhou',
        keyword: usageKeyword,
        allowEmpty: Boolean(usagePattern),
      }),
    enabled: usageKeyword.trim().length > 0 || Boolean(usagePattern),
    staleTime: 30 * 1000,
  });

  const materialSearchQuery = useQuery({
    queryKey: ['charts-order-material-search', materialKeyword],
    queryFn: () => fetchOrderMasterSearch({ type: 'material', keyword: materialKeyword }),
    enabled: supportsMaterials && materialKeyword.trim().length > 0,
    staleTime: 30 * 1000,
  });

  const bodyPartSearchQuery = useQuery({
    queryKey: ['charts-order-bodypart-search', bodyPartKeyword],
    queryFn: () => fetchOrderMasterSearch({ type: 'bodypart', keyword: bodyPartKeyword }),
    enabled: false,
    staleTime: 30 * 1000,
  });

  const usageItems = useMemo(() => {
    if (!usageSearchQuery.data?.ok) return [];
    const keyword = usageKeyword.trim().toLowerCase();
    return usageSearchQuery.data.items.filter((item) => {
      if (!matchesUsagePattern(item.code, usagePattern)) return false;
      if (!usagePartialMatch || !keyword) return true;
      const name = item.name.toLowerCase();
      const code = item.code?.toLowerCase() ?? '';
      return name.includes(keyword) || code.includes(keyword);
    });
  }, [usageKeyword, usagePartialMatch, usagePattern, usageSearchQuery.data]);

  const usageItemsLimited = useMemo(
    () => usageItems.slice(0, Math.max(1, usageLimit)),
    [usageItems, usageLimit],
  );

  const parseStampSelection = (value: string): StampSelection | null => {
    if (!value) return null;
    const [source, id] = value.split('::');
    if ((source !== 'local' && source !== 'server') || !id) return null;
    return { source, id };
  };

  const appendItem = (item: OrderBundleItem) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      const emptyIndex = nextItems.findIndex((row) => row.name.trim().length === 0);
      if (emptyIndex >= 0) {
        nextItems[emptyIndex] = ensureRowId({ ...nextItems[emptyIndex], ...item });
      } else {
        nextItems.push(ensureRowId(item));
      }
      return { ...prev, items: nextItems };
    });
  };

  const applyUsage = (item: OrderMasterSearchItem) => {
    const label = formatUsageLabel(item);
    setForm((prev) => ({
      ...prev,
      admin: label,
      adminMemo: item.code ?? prev.adminMemo,
    }));
  };

  const appendMaterialItem = (item: OrderBundleItem) => {
    setForm((prev) => ({ ...prev, materialItems: [...prev.materialItems, ensureRowId(item)] }));
  };

  const applyBodyPart = (item: OrderMasterSearchItem) => {
    setForm((prev) => ({
      ...prev,
      bodyPart: {
        code: item.code,
        name: item.name,
        quantity: '',
        unit: item.unit ?? '',
        memo: item.note ?? '',
      },
    }));
  };

  const isNoProcedureCharge = isInjectionOrder && form.memo === NO_PROCEDURE_CHARGE_TEXT;

  const mutation = useMutation({
    mutationFn: async (payload: OrderBundleSubmitPayload) => {
      if (!patientId) throw new Error('patientId is required');
      const filteredItems = collectBundleItems(payload.form)
        .filter((item) => item.name.trim().length > 0)
        .map(stripRowMeta);
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
      const allItems = collectBundleItems(payload.form);
      const itemCount = countItems(allItems);
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
            materialItemCount: countItems(payload.form.materialItems),
            commentItemCount: countItems(payload.form.commentItems),
            bodyPart: payload.form.bodyPart?.name ?? null,
            noProcedureCharge: payload.form.memo === NO_PROCEDURE_CHARGE_TEXT,
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
      const allItems = collectBundleItems(payload.form);
      const itemCount = countItems(allItems);
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
            materialItemCount: countItems(payload.form.materialItems),
            commentItemCount: countItems(payload.form.commentItems),
            bodyPart: payload.form.bodyPart?.name ?? null,
            noProcedureCharge: payload.form.memo === NO_PROCEDURE_CHARGE_TEXT,
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
            itemCount: countItems(collectBundleItems(form)),
            materialItemCount: countItems(form.materialItems),
            commentItemCount: countItems(form.commentItems),
            bodyPart: form.bodyPart?.name ?? null,
            noProcedureCharge: form.memo === NO_PROCEDURE_CHARGE_TEXT,
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
            itemCount: countItems(collectBundleItems(form)),
            materialItemCount: countItems(form.materialItems),
            commentItemCount: countItems(form.commentItems),
            bodyPart: form.bodyPart?.name ?? null,
            noProcedureCharge: form.memo === NO_PROCEDURE_CHARGE_TEXT,
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
        items: collectBundleItems(form)
          .filter((item) => item.name.trim().length > 0)
          .map(stripRowMeta),
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
          itemCount: countItems(collectBundleItems(form)),
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

  const reorderItems = (items: OrderBundleItem[], fromIndex: number, toIndex: number) => {
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    return nextItems;
  };

  const clearItemRows = () => {
    if (!window.confirm('薬剤/項目・材料・コメントの入力をすべてクリアしますか？')) return;
    setForm((prev) => ({
      ...prev,
      items: [buildEmptyItem()],
      materialItems: [],
      commentItems: [],
    }));
    setCommentDraft({ code: '', name: '', quantity: '', unit: '', memo: '' });
  };

  const removeItemRowById = (rowId?: string | null) => {
    if (!rowId) return;
    setForm((prev) => {
      const nextItems =
        prev.items.length > 1
          ? prev.items.filter((item) => (item as OrderBundleItemWithRowId).rowId !== rowId)
          : [buildEmptyItem()];
      return { ...prev, items: nextItems };
    });
  };

  const removeSelectedItemRow = () => removeItemRowById(selectedItemRowId);

  useEffect(() => {
    const rows = form.items;
    if (rows.length === 0) {
      setSelectedItemRowId(null);
      return;
    }
    const exists = selectedItemRowId
      ? rows.some((item) => (item as OrderBundleItemWithRowId).rowId === selectedItemRowId)
      : false;
    if (!exists) {
      setSelectedItemRowId((rows[0] as OrderBundleItemWithRowId).rowId ?? null);
    }
  }, [form.items, selectedItemRowId]);

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
            setMasterKeyword('');
            setUsageKeyword('');
            setUsageFilter(USAGE_FILTER_OPTIONS[0].value);
            setUsagePartialMatch(false);
            setUsageLimit(DEFAULT_USAGE_LIMIT);
            setMaterialKeyword('');
            setBodyPartKeyword('');
            setCommentDraft({
              code: '',
              name: '',
              quantity: '',
              unit: '',
              memo: '',
            });
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
              onChange={(event) =>
                setForm((prev) => ({ ...prev, admin: event.target.value, adminMemo: '' }))
              }
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
        <div className="charts-side-panel__subsection charts-side-panel__subsection--search">
          <div className="charts-side-panel__subheader">
            <strong>用法検索</strong>
            <span className="charts-side-panel__search-count">
              {usageSearchQuery.isFetching
                ? '検索中...'
                : usageSearchQuery.data?.ok
                  ? usageItems.length > usageItemsLimited.length
                    ? `${usageItems.length}件 (表示: ${usageItemsLimited.length}件)`
                    : `${usageItems.length}件`
                  : ''}
            </span>
          </div>
          <div className="charts-side-panel__field-row">
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-usage-keyword`}>キーワード</label>
              <input
                id={`${entity}-usage-keyword`}
                value={usageKeyword}
                onChange={(event) => setUsageKeyword(event.target.value)}
                placeholder="例: 1日1回"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-usage-filter`}>用法フィルタ</label>
              <select
                id={`${entity}-usage-filter`}
                value={usageFilter}
                onChange={(event) => setUsageFilter(event.target.value)}
                disabled={isBlocked}
              >
                {USAGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="charts-side-panel__field-row">
            <div className="charts-side-panel__field">
              <label className="charts-side-panel__toggle">
                <input
                  type="checkbox"
                  checked={usagePartialMatch}
                  onChange={(event) => setUsagePartialMatch(event.target.checked)}
                  disabled={isBlocked}
                />
                部分一致
              </label>
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-usage-limit`}>件数上限</label>
              <select
                id={`${entity}-usage-limit`}
                value={usageLimit}
                onChange={(event) => setUsageLimit(Number(event.target.value))}
                disabled={isBlocked}
              >
                {[20, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}件
                  </option>
                ))}
              </select>
            </div>
          </div>
          {usageSearchQuery.data && !usageSearchQuery.data.ok && (
            <div className="charts-side-panel__notice charts-side-panel__notice--error">
              {usageSearchQuery.data.message ?? '用法マスタの検索に失敗しました。'}
            </div>
          )}
          {usageSearchQuery.data?.ok && usageItemsLimited.length > 0 && (
            <div className="charts-side-panel__search-table">
              <div className="charts-side-panel__search-header">
                <span>コード</span>
                <span>名称</span>
                <span>単位</span>
                <span>分類</span>
                <span>備考</span>
              </div>
              {usageItemsLimited.map((item) => (
                <button
                  key={`usage-${item.code ?? item.name}`}
                  type="button"
                  className="charts-side-panel__search-row"
                  onClick={() => applyUsage(item)}
                  disabled={isBlocked}
                >
                  <span>{item.code ?? '-'}</span>
                  <span>{item.name}</span>
                  <span>{item.unit ?? '-'}</span>
                  <span>{item.category ?? '-'}</span>
                  <span>{item.note ?? '-'}</span>
                </button>
              ))}
            </div>
          )}
          {usageSearchQuery.data?.ok && usageItemsLimited.length === 0 && (usageKeyword.trim() || usagePattern) && (
            <p className="charts-side-panel__empty">該当する用法が見つかりません。</p>
          )}
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
        {isInjectionOrder ? (
          <div className="charts-side-panel__field">
            <label className="charts-side-panel__toggle">
              <input
                type="checkbox"
                checked={isNoProcedureCharge}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    memo: event.target.checked ? NO_PROCEDURE_CHARGE_TEXT : '',
                  }))
                }
                disabled={isBlocked}
              />
              手技料なし
            </label>
            <p className="charts-side-panel__message">注射オーダーのメモに「手技料なし」を反映します。</p>
          </div>
        ) : (
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
        )}

        {supportsBodyPartSearch && (
          <div className="charts-side-panel__subsection charts-side-panel__subsection--search">
            <div className="charts-side-panel__subheader">
              <strong>{isRadiologyOrder ? '部位' : 'リハビリ部位'}</strong>
              {isRadiologyOrder && (
                <span
                  className={`charts-side-panel__status ${
                    form.bodyPart?.name?.trim() ? 'charts-side-panel__status--ok' : 'charts-side-panel__status--warn'
                  }`}
                >
                  {form.bodyPart?.name?.trim() ? '入力済み' : '未入力'}
                </span>
              )}
            </div>
            <div className="charts-side-panel__field-row">
              <div className="charts-side-panel__field">
                <label htmlFor={`${entity}-bodypart`}>部位</label>
                <input
                  id={`${entity}-bodypart`}
                  value={form.bodyPart?.name ?? ''}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      bodyPart: {
                        code: prev.bodyPart?.code,
                        name: event.target.value,
                        quantity: prev.bodyPart?.quantity ?? '',
                        unit: prev.bodyPart?.unit ?? '',
                        memo: prev.bodyPart?.memo ?? '',
                      },
                    }))
                  }
                  placeholder="例: 胸部"
                  disabled={isBlocked}
                />
              </div>
              <div className="charts-side-panel__field">
                <label htmlFor={`${entity}-bodypart-keyword`}>部位検索</label>
                <input
                  id={`${entity}-bodypart-keyword`}
                  value={bodyPartKeyword}
                  onChange={(event) => setBodyPartKeyword(event.target.value)}
                  placeholder="例: 胸"
                  disabled={isBlocked}
                />
              </div>
            </div>
            <div className="charts-side-panel__actions">
              <button
                type="button"
                onClick={() => bodyPartSearchQuery.refetch()}
                disabled={isBlocked || bodyPartSearchQuery.isFetching}
              >
                部位検索
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, bodyPart: null }))}
                disabled={isBlocked || !form.bodyPart?.name}
              >
                部位クリア
              </button>
            </div>
            {!isRadiologyOrder && (
              <p className="charts-side-panel__message">
                リハビリ部位は任意入力です。部位マスタから選択するか、手入力で補足できます。
              </p>
            )}
            {bodyPartSearchQuery.data && !bodyPartSearchQuery.data.ok && (
              <div className="charts-side-panel__notice charts-side-panel__notice--error">
                {bodyPartSearchQuery.data.message ?? '部位マスタの検索に失敗しました。'}
              </div>
            )}
            {bodyPartSearchQuery.data?.ok && (
              <>
                <div className="charts-side-panel__search-count">
                  {bodyPartSearchQuery.isFetching ? '検索中...' : `${bodyPartSearchQuery.data.totalCount ?? 0}件`}
                </div>
                {bodyPartSearchQuery.data.items.length === 0 ? (
                  <p className="charts-side-panel__empty">該当する部位が見つかりません。</p>
                ) : (
                  <div className="charts-side-panel__search-table">
                    <div className="charts-side-panel__search-header">
                      <span>コード</span>
                      <span>名称</span>
                      <span>単位</span>
                      <span>分類</span>
                      <span>備考</span>
                    </div>
                    {bodyPartSearchQuery.data.items.map((item) => (
                      <button
                        key={`bodypart-${item.code ?? item.name}`}
                        type="button"
                        className="charts-side-panel__search-row"
                        onClick={() => applyBodyPart(item)}
                        disabled={isBlocked}
                      >
                        <span>{item.code ?? '-'}</span>
                        <span>{item.name}</span>
                        <span>{item.unit ?? '-'}</span>
                        <span>{item.category ?? '-'}</span>
                        <span>{item.note ?? '-'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="charts-side-panel__subsection charts-side-panel__subsection--search">
          <div className="charts-side-panel__subheader">
            <strong>マスタ検索</strong>
            <span className="charts-side-panel__search-count">
              {masterSearchQuery.isFetching
                ? '検索中...'
                : masterSearchQuery.data?.ok
                  ? `${masterSearchQuery.data.totalCount ?? 0}件`
                  : ''}
            </span>
          </div>
          <div className="charts-side-panel__field-row">
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-master-keyword`}>キーワード</label>
              <input
                id={`${entity}-master-keyword`}
                value={masterKeyword}
                onChange={(event) => setMasterKeyword(event.target.value)}
                placeholder="例: アムロジピン"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-master-type`}>検索種別</label>
              <select
                id={`${entity}-master-type`}
                value={masterSearchType}
                onChange={(event) => setMasterSearchType(event.target.value as OrderMasterSearchType)}
                disabled={isBlocked}
              >
                <option value="generic-class">医薬品（一般）</option>
                <option value="youhou">用法</option>
                <option value="material">材料</option>
                <option value="kensa-sort">検査区分</option>
                <option value="etensu">点数</option>
              </select>
            </div>
          </div>
          {masterSearchQuery.data && !masterSearchQuery.data.ok && (
            <div className="charts-side-panel__notice charts-side-panel__notice--error">
              {masterSearchQuery.data.message ?? 'マスタ検索に失敗しました。'}
            </div>
          )}
          {masterSearchQuery.data?.ok && masterSearchQuery.data.items.length > 0 && (
            <div className="charts-side-panel__search-table">
              <div className="charts-side-panel__search-header">
                <span>コード</span>
                <span>名称</span>
                <span>単位</span>
                <span>分類</span>
                <span>備考</span>
              </div>
              {masterSearchQuery.data.items.map((item) => (
                <button
                  key={`master-${item.code ?? item.name}`}
                  type="button"
                  className="charts-side-panel__search-row"
                  onClick={() => {
                    if (item.type === 'youhou' || masterSearchType === 'youhou') {
                      applyUsage(item);
                      return;
                    }
                    appendItem({
                      code: item.code,
                      name: formatMasterLabel(item),
                      quantity: '',
                      unit: item.unit ?? '',
                      memo: item.note ?? '',
                    });
                  }}
                  disabled={isBlocked}
                >
                  <span>{item.code ?? '-'}</span>
                  <span>{item.name}</span>
                  <span>{item.unit ?? '-'}</span>
                  <span>{item.category ?? '-'}</span>
                  <span>{item.note ?? '-'}</span>
                </button>
              ))}
            </div>
          )}
          {masterSearchQuery.data?.ok && masterSearchQuery.data.items.length === 0 && masterKeyword.trim() && (
            <p className="charts-side-panel__empty">該当するマスタが見つかりません。</p>
          )}
        </div>

        <div className="charts-side-panel__subsection">
          <div className="charts-side-panel__subheader">
            <strong>薬剤/項目</strong>
            <div className="charts-side-panel__subheader-actions">
              <button
                type="button"
                className="charts-side-panel__ghost"
                onClick={() => {
                  const nextItem = buildEmptyItem();
                  setForm((prev) => ({ ...prev, items: [...prev.items, nextItem] }));
                  setSelectedItemRowId((nextItem as OrderBundleItemWithRowId).rowId ?? null);
                }}
                disabled={isBlocked}
              >
                追加
              </button>
              <button
                type="button"
                className="charts-side-panel__row-delete"
                onClick={removeSelectedItemRow}
                disabled={isBlocked || !selectedItemRowId}
              >
                選択行削除
              </button>
              <button
                type="button"
                className="charts-side-panel__ghost charts-side-panel__ghost--danger"
                onClick={clearItemRows}
                disabled={isBlocked}
              >
                全クリア
              </button>
            </div>
          </div>
          {form.items.map((item, index) => (
            <div
              key={(item as OrderBundleItemWithRowId).rowId ?? `${entity}-item-${index}`}
              className={`charts-side-panel__item-row${
                dragOverIndex === index ? ' charts-side-panel__item-row--drag-over' : ''
              }${draggingIndex === index ? ' charts-side-panel__item-row--dragging' : ''}${
                selectedItemRowId === (item as OrderBundleItemWithRowId).rowId
                  ? ' charts-side-panel__item-row--selected'
                  : ''
              }`}
              data-testid="order-bundle-item-row"
              data-rowid={(item as OrderBundleItemWithRowId).rowId ?? ''}
              onClick={() => setSelectedItemRowId((item as OrderBundleItemWithRowId).rowId ?? null)}
              onDragOver={(event) => {
                if (isBlocked) return;
                event.preventDefault();
                setDragOverIndex(index);
              }}
              onDrop={(event) => {
                if (isBlocked) return;
                event.preventDefault();
                const fromIndex = Number(event.dataTransfer.getData('text/plain'));
                if (Number.isNaN(fromIndex) || fromIndex === index) {
                  setDragOverIndex(null);
                  setDraggingIndex(null);
                  return;
                }
                setForm((prev) => ({
                  ...prev,
                  items: reorderItems(prev.items, fromIndex, index),
                }));
                setDragOverIndex(null);
                setDraggingIndex(null);
              }}
            >
              <button
                type="button"
                className="charts-side-panel__drag-handle"
                aria-label={`行 ${index + 1} をドラッグして並べ替え`}
                draggable={!isBlocked}
                onDragStart={(event) => {
                  if (isBlocked) return;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(index));
                  setDraggingIndex(index);
                }}
                onDragEnd={() => {
                  setDragOverIndex(null);
                  setDraggingIndex(null);
                }}
                onFocus={() => setSelectedItemRowId((item as OrderBundleItemWithRowId).rowId ?? null)}
                disabled={isBlocked}
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
                onFocus={() => setSelectedItemRowId((item as OrderBundleItemWithRowId).rowId ?? null)}
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
                onFocus={() => setSelectedItemRowId((item as OrderBundleItemWithRowId).rowId ?? null)}
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
                onFocus={() => setSelectedItemRowId((item as OrderBundleItemWithRowId).rowId ?? null)}
                placeholder="単位"
                disabled={isBlocked}
              />
              <button
                type="button"
                className="charts-side-panel__icon"
                aria-label={`行 ${index + 1} を削除`}
                onClick={() => removeItemRowById((item as OrderBundleItemWithRowId).rowId)}
                disabled={isBlocked}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {supportsMaterials && (
          <div className="charts-side-panel__subsection charts-side-panel__subsection--search">
            <div className="charts-side-panel__subheader">
              <strong>材料</strong>
              <button
                type="button"
                className="charts-side-panel__ghost"
                onClick={() =>
                  setForm((prev) => ({ ...prev, materialItems: [...prev.materialItems, buildEmptyItem()] }))
                }
                disabled={isBlocked}
              >
                追加
              </button>
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor={`${entity}-material-keyword`}>材料キーワード</label>
              <input
                id={`${entity}-material-keyword`}
                value={materialKeyword}
                onChange={(event) => setMaterialKeyword(event.target.value)}
                placeholder="例: ガーゼ"
                disabled={isBlocked}
              />
            </div>
            {materialSearchQuery.data && !materialSearchQuery.data.ok && (
              <div className="charts-side-panel__notice charts-side-panel__notice--error">
                {materialSearchQuery.data.message ?? '材料マスタの検索に失敗しました。'}
              </div>
            )}
            {materialSearchQuery.data?.ok && materialSearchQuery.data.items.length > 0 && (
              <div className="charts-side-panel__search-table">
                <div className="charts-side-panel__search-header">
                  <span>コード</span>
                  <span>名称</span>
                  <span>単位</span>
                  <span>分類</span>
                  <span>備考</span>
                </div>
                {materialSearchQuery.data.items.map((item) => (
                  <button
                    key={`material-${item.code ?? item.name}`}
                    type="button"
                    className="charts-side-panel__search-row"
                    onClick={() =>
                      appendMaterialItem({
                        code: item.code,
                        name: formatMasterLabel(item),
                        quantity: '',
                        unit: item.unit ?? '',
                        memo: item.note ?? '',
                      })
                    }
                    disabled={isBlocked}
                  >
                    <span>{item.code ?? '-'}</span>
                    <span>{item.name}</span>
                    <span>{item.unit ?? '-'}</span>
                    <span>{item.category ?? '-'}</span>
                    <span>{item.note ?? '-'}</span>
                  </button>
                ))}
              </div>
            )}
            {materialSearchQuery.data?.ok && materialSearchQuery.data.items.length === 0 && materialKeyword.trim() && (
              <p className="charts-side-panel__empty">該当する材料が見つかりません。</p>
            )}
            {form.materialItems.map((item, index) => (
              <div key={`${entity}-material-${index}`} className="charts-side-panel__item-row">
                <input
                  value={item.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.materialItems];
                      next[index] = { ...next[index], name: value };
                      return { ...prev, materialItems: next };
                    });
                  }}
                  placeholder="材料名"
                  disabled={isBlocked}
                />
                <input
                  value={item.quantity ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.materialItems];
                      next[index] = { ...next[index], quantity: value };
                      return { ...prev, materialItems: next };
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
                      const next = [...prev.materialItems];
                      next[index] = { ...next[index], unit: value };
                      return { ...prev, materialItems: next };
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
                      materialItems:
                        prev.materialItems.length > 1
                          ? prev.materialItems.filter((_, idx) => idx !== index)
                          : [],
                    }));
                  }}
                  disabled={isBlocked}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {supportsCommentCodes && (
          <div className="charts-side-panel__subsection">
            <div className="charts-side-panel__subheader">
              <strong>コメントコード</strong>
            </div>
            <p className="charts-side-panel__message">
              コメントコードは指示/コメントをコード行として登録します。自由記述は上部のメモ欄を使用してください。
            </p>
            <div className="charts-side-panel__item-row charts-side-panel__item-row--comment">
              <input
                value={commentDraft.code ?? ''}
                onChange={(event) => setCommentDraft((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="コード"
                disabled={isBlocked}
              />
              <input
                value={commentDraft.name}
                onChange={(event) => setCommentDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="コメント内容"
                disabled={isBlocked}
              />
              <input
                value={commentDraft.quantity ?? ''}
                onChange={(event) => setCommentDraft((prev) => ({ ...prev, quantity: event.target.value }))}
                placeholder="数量"
                disabled={isBlocked}
              />
              <input
                value={commentDraft.unit ?? ''}
                onChange={(event) => setCommentDraft((prev) => ({ ...prev, unit: event.target.value }))}
                placeholder="単位"
                disabled={isBlocked}
              />
              <button
                type="button"
                className="charts-side-panel__ghost"
                onClick={() => {
                  if (!commentDraft.code?.trim() || !commentDraft.name.trim()) return;
                  setForm((prev) => ({
                    ...prev,
                    commentItems: [
                      ...prev.commentItems,
                      {
                        code: commentDraft.code?.trim(),
                        name: commentDraft.name.trim(),
                        quantity: commentDraft.quantity ?? '',
                        unit: commentDraft.unit ?? '',
                        memo: commentDraft.memo ?? '',
                      },
                    ],
                  }));
                  setCommentDraft({ code: '', name: '', quantity: '', unit: '', memo: '' });
                }}
                disabled={isBlocked || !commentDraft.code?.trim() || !commentDraft.name.trim()}
              >
                追加
              </button>
            </div>
            {form.commentItems.map((item, index) => (
              <div key={`${entity}-comment-${index}`} className="charts-side-panel__item-row charts-side-panel__item-row--comment">
                <input
                  value={item.code ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.commentItems];
                      next[index] = { ...next[index], code: value };
                      return { ...prev, commentItems: next };
                    });
                  }}
                  placeholder="コード"
                  disabled={isBlocked}
                />
                <input
                  value={item.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.commentItems];
                      next[index] = { ...next[index], name: value };
                      return { ...prev, commentItems: next };
                    });
                  }}
                  placeholder="コメント内容"
                  disabled={isBlocked}
                />
                <input
                  value={item.quantity ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.commentItems];
                      next[index] = { ...next[index], quantity: value };
                      return { ...prev, commentItems: next };
                    });
                  }}
                  placeholder="数量"
                  disabled={isBlocked}
                />
                <input
                  value={item.unit ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => {
                      const next = [...prev.commentItems];
                      next[index] = { ...next[index], unit: value };
                      return { ...prev, commentItems: next };
                    });
                  }}
                  placeholder="単位"
                  disabled={isBlocked}
                />
                <button
                  type="button"
                  className="charts-side-panel__icon"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      commentItems: prev.commentItems.filter((_, idx) => idx !== index),
                    }))
                  }
                  disabled={isBlocked}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

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
