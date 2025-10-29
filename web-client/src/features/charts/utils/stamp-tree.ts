import type {
  RawPublishedTreeModel,
  RawStampTreeModel,
  StampCategoryGroup,
  StampDefinition,
  StampSource,
} from '@/features/charts/types/stamp';

const decodeBase64 = (value: string): string => {
  const buffer = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;

  if (buffer) {
    return buffer.from(value, 'base64').toString('utf-8');
  }

  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }

  throw new Error('Base64 をデコードできる環境が必要です');
};

const isElementNode = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE;

interface ParseContext {
  rootCategory?: string;
  entity?: string;
  path: string[];
}

const parseStampElement = (
  element: Element,
  source: StampSource,
  accumulator: StampDefinition[],
  context: ParseContext,
  originTreeName?: string,
) => {
  const tag = element.tagName;

  if (tag === 'stampInfo') {
    const name = element.getAttribute('name')?.trim() ?? '名称未設定スタンプ';
    const stampId = element.getAttribute('stampId');
    const entity = element.getAttribute('entity') ?? context.entity;
    const role = element.getAttribute('role') ?? undefined;
    const editableAttr = element.getAttribute('editable');
    const editable = editableAttr === null ? true : editableAttr.toLowerCase() !== 'false';
    const memo = element.getAttribute('memo') ?? undefined;

    accumulator.push({
      stampId,
      name,
      entity: entity ?? undefined,
      role,
      editable,
      memo,
      category: context.rootCategory,
      path: context.path,
      source,
      originTreeName,
    });
    return;
  }

  if (tag === 'node') {
    const nodeName = element.getAttribute('name')?.trim();
    const nextPath = nodeName ? [...context.path, nodeName] : [...context.path];
    Array.from(element.childNodes)
      .filter(isElementNode)
      .forEach((child) => {
        parseStampElement(child, source, accumulator, { ...context, path: nextPath }, originTreeName);
      });
    return;
  }

  if (tag === 'root') {
    const rootName = element.getAttribute('name')?.trim();
    const entity = element.getAttribute('entity') ?? undefined;
    const nextContext: ParseContext = {
      rootCategory: rootName ?? context.rootCategory,
      entity,
      path: rootName ? [rootName] : [],
    };
    Array.from(element.childNodes)
      .filter(isElementNode)
      .forEach((child) => {
        parseStampElement(child, source, accumulator, nextContext, originTreeName);
      });
    return;
  }

  if (tag === 'stampTree' || tag === 'stampBox') {
    Array.from(element.childNodes)
      .filter(isElementNode)
      .forEach((child) => {
        parseStampElement(child, source, accumulator, context, originTreeName);
      });
  }
};

export const decodeStampTreeBytes = (treeBytes?: string | null): string | null => {
  if (!treeBytes) {
    return null;
  }

  try {
    return decodeBase64(treeBytes);
  } catch (error) {
    console.error('スタンプツリーのデコードに失敗しました', error);
    return null;
  }
};

export const parseStampTreeXml = (
  xml: string,
  source: StampSource,
  originTreeName?: string,
): StampDefinition[] => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) {
    console.error('スタンプツリーXMLの解析に失敗しました', parserError.textContent);
    return [];
  }

  const accumulator: StampDefinition[] = [];
  const root = document.documentElement;
  if (!root) {
    return accumulator;
  }

  parseStampElement(root, source, accumulator, { path: [] }, originTreeName);
  return accumulator;
};

const collectFromTree = (
  model: RawStampTreeModel | RawPublishedTreeModel | null | undefined,
  source: StampSource,
): StampDefinition[] => {
  if (!model?.treeBytes) {
    return [];
  }
  const xml = decodeStampTreeBytes(model.treeBytes);
  if (!xml) {
    return [];
  }
  return parseStampTreeXml(xml, source, model.name ?? undefined);
};

export const extractStampDefinitions = (
  personal: RawStampTreeModel | null | undefined,
  subscribed: RawPublishedTreeModel[] | null | undefined,
): StampDefinition[] => {
  const personalStamps = collectFromTree(personal, 'personal');
  const subscribedStamps = (subscribed ?? []).flatMap((tree) => collectFromTree(tree, 'subscribed'));
  return [...personalStamps, ...subscribedStamps];
};

export const groupStampsByCategory = (stamps: StampDefinition[]): StampCategoryGroup[] => {
  const categoryMap = new Map<string, StampDefinition[]>();

  stamps.forEach((stamp) => {
    const key = stamp.category ?? '未分類';
    if (!categoryMap.has(key)) {
      categoryMap.set(key, []);
    }
    categoryMap.get(key)!.push(stamp);
  });

  return Array.from(categoryMap.entries())
    .map(([category, group]) => ({
      category,
      stamps: group.sort((a, b) => a.name.localeCompare(b.name, 'ja')), // 安定した表示順
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'ja'));
};
