import { v4 as uuidv4 } from 'uuid';

import type {
  OrderSetDefinition,
  OrderSetDocumentPreset,
  OrderSetInput,
  OrderSetPlanItem,
  OrderSetPlanType,
  OrderSetProgressNote,
} from '@/features/charts/types/order-set';

export interface OrderSetSharePlanItem {
  type: OrderSetPlanType;
  title: string;
  detail: string;
  note?: string;
}

export interface OrderSetShareItem {
  name: string;
  description?: string;
  tags?: string[];
  progressNote?: OrderSetProgressNote;
  planItems: OrderSetSharePlanItem[];
  documentPreset?: OrderSetDocumentPreset | null;
}

export interface OrderSetSharePackage {
  version: number;
  exportedAt: string;
  facilityName?: string;
  author?: string;
  items: OrderSetShareItem[];
}

export const ORDER_SET_SHARE_VERSION = 1;

const sanitizeText = (value: string | undefined | null) => value?.trim() ?? '';

const sanitizeTags = (tags: string[] | undefined | null) =>
  Array.isArray(tags)
    ? tags
        .map((tag) => tag.trim())
        .filter((tag, index, array) => tag.length > 0 && array.indexOf(tag) === index)
    : [];

export const toShareItem = (definition: OrderSetDefinition): OrderSetShareItem => ({
  name: definition.name,
  description: sanitizeText(definition.description),
  tags: sanitizeTags(definition.tags),
  progressNote: definition.progressNote
    ? {
        subjective: sanitizeText(definition.progressNote.subjective),
        objective: sanitizeText(definition.progressNote.objective),
        assessment: sanitizeText(definition.progressNote.assessment),
      }
    : undefined,
  planItems: definition.planItems.map((item) => ({
    type: item.type,
    title: sanitizeText(item.title),
    detail: sanitizeText(item.detail),
    note: sanitizeText(item.note) || undefined,
  })),
  documentPreset: definition.documentPreset
    ? {
        templateId: definition.documentPreset.templateId,
        memo: sanitizeText(definition.documentPreset.memo) || undefined,
        extraNote: sanitizeText(definition.documentPreset.extraNote) || undefined,
      }
    : null,
});

export const buildSharePackage = (
  orderSets: OrderSetDefinition[],
  metadata?: { facilityName?: string; author?: string },
): OrderSetSharePackage => ({
  version: ORDER_SET_SHARE_VERSION,
  exportedAt: new Date().toISOString(),
  facilityName: metadata?.facilityName || undefined,
  author: metadata?.author || undefined,
  items: orderSets.map(toShareItem),
});

const assignPlanItemIds = (items: OrderSetSharePlanItem[]): OrderSetPlanItem[] =>
  items.map((item) => ({
    id: uuidv4(),
    type: item.type,
    title: sanitizeText(item.title),
    detail: sanitizeText(item.detail),
    note: sanitizeText(item.note),
  }));

export const toOrderSetInput = (item: OrderSetShareItem): OrderSetInput => ({
  name: sanitizeText(item.name),
  description: sanitizeText(item.description) || undefined,
  tags: sanitizeTags(item.tags),
  progressNote: item.progressNote
    ? {
        subjective: sanitizeText(item.progressNote.subjective) || undefined,
        objective: sanitizeText(item.progressNote.objective) || undefined,
        assessment: sanitizeText(item.progressNote.assessment) || undefined,
      }
    : undefined,
  planItems: assignPlanItemIds(item.planItems ?? []),
  documentPreset: item.documentPreset
    ? {
        templateId: item.documentPreset.templateId,
        memo: sanitizeText(item.documentPreset.memo) || undefined,
        extraNote: sanitizeText(item.documentPreset.extraNote) || undefined,
      }
    : null,
});

export class OrderSetShareParseError extends Error {}

export const parseSharePackage = (raw: string): OrderSetSharePackage => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OrderSetShareParseError('共有ファイルが正しい JSON 形式ではありません。');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new OrderSetShareParseError('共有ファイルの形式が不正です。');
  }

  const packageCandidate = parsed as Partial<OrderSetSharePackage>;
  if (packageCandidate.version !== ORDER_SET_SHARE_VERSION) {
    throw new OrderSetShareParseError('対応していない共有ファイルのバージョンです。');
  }

  if (!Array.isArray(packageCandidate.items)) {
    throw new OrderSetShareParseError('共有ファイルにテンプレートが含まれていません。');
  }

  const sanitizedItems = packageCandidate.items.map((item) => ({
    ...item,
    tags: sanitizeTags(item.tags),
    planItems: Array.isArray(item.planItems)
      ? item.planItems.map((plan) => ({
          type: plan.type as OrderSetPlanType,
          title: sanitizeText(plan.title),
          detail: sanitizeText(plan.detail),
          note: sanitizeText(plan.note) || undefined,
        }))
      : [],
  }));

  return {
    version: ORDER_SET_SHARE_VERSION,
    exportedAt: packageCandidate.exportedAt ?? new Date().toISOString(),
    facilityName: packageCandidate.facilityName || undefined,
    author: packageCandidate.author || undefined,
    items: sanitizedItems,
  };
};

export interface OrderSetImportResult {
  created: number;
  updated: number;
  replaced: number;
}

export const mergeDefinitions = (
  current: OrderSetDefinition[],
  imported: OrderSetInput[],
  strategy: 'merge' | 'replace',
): { next: OrderSetDefinition[]; result: OrderSetImportResult } => {
  const timestamp = new Date().toISOString();
  const createdDefinitions: OrderSetDefinition[] = imported.map((input) => ({
    id: uuidv4(),
    name: input.name,
    description: sanitizeText(input.description),
    tags: sanitizeTags(input.tags),
    progressNote: input.progressNote,
    planItems: input.planItems.map((item) => ({ ...item, id: item.id || uuidv4() })),
    documentPreset: input.documentPreset ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUsedAt: null,
  }));

  if (strategy === 'replace') {
    return {
      next: createdDefinitions,
      result: { created: createdDefinitions.length, updated: 0, replaced: current.length },
    };
  }

  const mapByName = new Map(current.map((set) => [set.name, set] as const));
  let updatedCount = 0;

  const merged = current.map((set) => {
    const replacement = createdDefinitions.find((definition) => definition.name === set.name);
    if (!replacement) {
      return set;
    }
    updatedCount += 1;
    return {
      ...set,
      description: replacement.description,
      tags: replacement.tags,
      progressNote: replacement.progressNote,
      planItems: replacement.planItems,
      documentPreset: replacement.documentPreset,
      updatedAt: timestamp,
      lastUsedAt: null,
    } satisfies OrderSetDefinition;
  });

  const existingNames = new Set(mapByName.keys());
  const additions = createdDefinitions.filter((definition) => !existingNames.has(definition.name));

  return {
    next: [...merged, ...additions],
    result: { created: additions.length, updated: updatedCount, replaced: 0 },
  };
};
