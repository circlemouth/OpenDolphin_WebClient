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

const encodeBase64 = (value: string): string => {
  const buffer = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;

  if (buffer) {
    return buffer.from(value, 'utf-8').toString('base64');
  }

  if (typeof globalThis.btoa === 'function') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return globalThis.btoa(binary);
  }

  throw new Error('Base64 エンコードに対応していない環境です。');
};

export interface StampTreeBaseNode {
  key: string;
  name: string;
  entity?: string;
  role?: string;
  extraAttributes: Record<string, string>;
}

export interface StampTreeFolderNode extends StampTreeBaseNode {
  type: 'folder';
  isRoot: boolean;
  children: StampTreeNode[];
}

export interface StampTreeStampNode extends StampTreeBaseNode {
  type: 'stamp';
  stampId?: string | null;
  editable: boolean;
  memo?: string;
}

export type StampTreeNode = StampTreeFolderNode | StampTreeStampNode;

export interface ParsedStampTree {
  rootAttributes: Record<string, string>;
  nodes: StampTreeNode[];
}

const createNodeKey = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `stamp-node-${counter}`;
  };
})();

const FOLDER_ATTRIBUTES = new Set(['name', 'entity', 'role']);
const STAMP_ATTRIBUTES = new Set(['name', 'entity', 'role', 'stampId', 'editable', 'memo']);

const collectExtraAttributes = (element: Element, handled: Set<string>) => {
  const extras: Record<string, string> = {};
  Array.from(element.attributes).forEach((attr) => {
    if (!handled.has(attr.name)) {
      extras[attr.name] = attr.value;
    }
  });
  return extras;
};

const parseFolder = (element: Element, isRoot: boolean): StampTreeFolderNode => {
  const name = element.getAttribute('name')?.trim() ?? '未分類';
  const entity = element.getAttribute('entity') ?? undefined;
  const role = element.getAttribute('role') ?? undefined;
  const extraAttributes = collectExtraAttributes(element, FOLDER_ATTRIBUTES);
  const children = Array.from(element.childNodes)
    .filter(isElementNode)
    .map((child) => parseStampTreeNode(child))
    .filter((child): child is StampTreeNode => Boolean(child));
  return {
    type: 'folder',
    key: createNodeKey(),
    name,
    entity,
    role,
    isRoot,
    extraAttributes,
    children,
  };
};

const parseStamp = (element: Element): StampTreeStampNode => {
  const name = element.getAttribute('name')?.trim() ?? '名称未設定スタンプ';
  const entity = element.getAttribute('entity') ?? undefined;
  const role = element.getAttribute('role') ?? undefined;
  const stampId = element.getAttribute('stampId');
  const editableAttr = element.getAttribute('editable');
  const editable = editableAttr ? editableAttr.toLowerCase() !== 'false' : true;
  const memo = element.getAttribute('memo') ?? undefined;
  const extraAttributes = collectExtraAttributes(element, STAMP_ATTRIBUTES);
  return {
    type: 'stamp',
    key: createNodeKey(),
    name,
    entity,
    role,
    stampId: stampId ?? undefined,
    editable,
    memo,
    extraAttributes,
  };
};

const parseStampTreeNode = (element: Element): StampTreeNode | null => {
  if (element.tagName === 'root') {
    return parseFolder(element, true);
  }
  if (element.tagName === 'node') {
    return parseFolder(element, false);
  }
  if (element.tagName === 'stampInfo') {
    return parseStamp(element);
  }
  if (element.tagName === 'stampTree' || element.tagName === 'stampBox') {
    return parseFolder(element, element.tagName === 'stampBox');
  }
  return null;
};

const collectRootAttributes = (element: Element) => {
  const attributes: Record<string, string> = {};
  Array.from(element.attributes).forEach((attr) => {
    attributes[attr.name] = attr.value;
  });
  return attributes;
};

export const parseStampTreeForEditor = (xml: string): ParsedStampTree => {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const error = document.querySelector('parsererror');
  if (error) {
    throw new Error(error.textContent ?? 'スタンプツリーの解析に失敗しました。');
  }
  const root = document.documentElement;
  if (!root) {
    return {
      rootAttributes: {},
      nodes: [],
    };
  }
  if (root.tagName === 'stampBox') {
    return {
      rootAttributes: collectRootAttributes(root),
      nodes: Array.from(root.childNodes)
        .filter(isElementNode)
        .map((child) => parseStampTreeNode(child))
        .filter((child): child is StampTreeNode => Boolean(child)),
    };
  }
  return {
    rootAttributes: {},
    nodes: [parseStampTreeNode(root)].filter((child): child is StampTreeNode => Boolean(child)),
  };
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const renderAttributes = (attributes: Record<string, string | undefined | null>) => {
  const rendered = Object.entries(attributes)
    .filter(([, val]) => val !== undefined && val !== null && String(val).length > 0)
    .map(([key, val]) => `${key}="${escapeXml(String(val))}"`)
    .join(' ');
  return rendered ? ` ${rendered}` : '';
};

const renderNode = (node: StampTreeNode, depth: number): string => {
  const indent = '  '.repeat(depth);
  if (node.type === 'folder') {
    const tag = node.isRoot ? 'root' : 'node';
    const attributes = renderAttributes({
      name: node.name,
      entity: node.entity,
      role: node.role,
      ...node.extraAttributes,
    });
    if (!node.children.length) {
      return `${indent}<${tag}${attributes} />`;
    }
    const children = node.children.map((child) => renderNode(child, depth + 1)).join('\n');
    return `${indent}<${tag}${attributes}>\n${children}\n${indent}</${tag}>`;
  }
  const attributes = renderAttributes({
    name: node.name,
    entity: node.entity,
    role: node.role,
    stampId: node.stampId ?? undefined,
    editable: node.editable ? undefined : 'false',
    memo: node.memo,
    ...node.extraAttributes,
  });
  return `${indent}<stampInfo${attributes} />`;
};

export const serializeStampTree = (input: ParsedStampTree): string => {
  const attributes = renderAttributes(input.rootAttributes);
  const body = input.nodes.map((node) => renderNode(node, 1)).join('\n');
  if (!body) {
    return `<stampBox${attributes}>\n</stampBox>`;
  }
  return `<stampBox${attributes}>\n${body}\n</stampBox>`;
};

export const encodeStampTreeXml = (input: ParsedStampTree): string => {
  const xml = serializeStampTree(input);
  return encodeBase64(xml);
};

export const cloneStampTreeNodes = (nodes: StampTreeNode[]): StampTreeNode[] =>
  nodes.map((node) => {
    if (node.type === 'folder') {
      return {
        ...node,
        children: cloneStampTreeNodes(node.children),
      };
    }
    return { ...node };
  });

export const resetStampTreeNodeKeys = (nodes: StampTreeNode[]): StampTreeNode[] =>
  nodes.map((node) => {
    if (node.type === 'folder') {
      return {
        ...node,
        key: createNodeKey(),
        children: resetStampTreeNodeKeys(node.children),
      };
    }
    return {
      ...node,
      key: createNodeKey(),
    };
  });

export const stampTreeNodesEqual = (left: StampTreeNode[], right: StampTreeNode[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a.type !== b.type || a.name !== b.name || a.entity !== b.entity || a.role !== b.role) {
      return false;
    }
    if (a.type === 'stamp' && b.type === 'stamp') {
      if (a.stampId !== b.stampId || a.editable !== b.editable || a.memo !== b.memo) {
        return false;
      }
    }
    if (a.type === 'folder' && b.type === 'folder') {
      if (!stampTreeNodesEqual(a.children, b.children)) {
        return false;
      }
    }
    const aExtras = Object.entries(a.extraAttributes).sort();
    const bExtras = Object.entries(b.extraAttributes).sort();
    if (aExtras.length !== bExtras.length) {
      return false;
    }
    for (let extraIndex = 0; extraIndex < aExtras.length; extraIndex += 1) {
      const [aKey, aValue] = aExtras[extraIndex];
      const [bKey, bValue] = bExtras[extraIndex];
      if (aKey !== bKey || aValue !== bValue) {
        return false;
      }
    }
  }
  return true;
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
