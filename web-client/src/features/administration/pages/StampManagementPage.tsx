import { Fragment, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { Button, Stack, SurfaceCard, TextArea, TextField } from '@/components';
import {
  fetchStampTreeHolder,
  createStampTree,
  syncStampTree,
  saveStampModel,
  deleteStampModels,
  fetchStampModule,
} from '@/features/charts/api/stamp-api';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import {
  cloneStampTreeNodes,
  decodeStampTreeBytes,
  encodeStampTreeXml,
  parseStampTreeForEditor,
  resetStampTreeNodeKeys,
  stampTreeNodesEqual,
  type ParsedStampTree,
  type StampTreeFolderNode,
  type StampTreeNode,
  type StampTreeStampNode,
} from '@/features/charts/utils/stamp-tree';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import type { StampDefinition } from '@/features/charts/types/stamp';
import { useAuth } from '@/libs/auth';

interface StampTreeMetadata {
  id: number | null;
  name: string;
  category?: string | null;
  publishType?: string | null;
  partyName?: string | null;
  url?: string | null;
  description?: string | null;
  published?: string | null;
  publishedDate?: string | null;
  lastUpdated?: string | null;
  versionNumber?: string | null;
}

interface StampTreeSnapshot {
  nodes: StampTreeNode[];
  rootAttributes: Record<string, string>;
  metadata: StampTreeMetadata;
}

type TreeUpdateResult = {
  nodes: StampTreeNode[];
  removed?: StampTreeNode;
};

interface LocatedNode {
  node: StampTreeNode;
  parent: StampTreeFolderNode | null;
}

const PageLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(360px, 1fr) minmax(320px, 360px);
  gap: 16px;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(300px, 1fr) minmax(340px, 1fr);
    grid-template-areas:
      'tree tree'
      'details library';
  }

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'meta'
      'tree'
      'details'
      'library';
  }
`;

const SectionCard = styled(SurfaceCard)<{ area?: string }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  ${({ area }) => (area ? `grid-area: ${area};` : '')}
`;

const TreeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TreeItem = styled.li`
  margin: 0;
  padding: 0;
`;

const TreeNodeRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radius.xs};
  background: ${({ theme, $selected }) => ($selected ? theme.palette.surfaceStrong : 'transparent')};
  color: ${({ theme, $selected }) => ($selected ? theme.palette.text : theme.palette.textMuted)};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceStrong};
    color: ${({ theme }) => theme.palette.text};
  }
`;

const CollapseButton = styled.button`
  border: none;
  background: transparent;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.palette.textMuted};
  border-radius: ${({ theme }) => theme.radius.xs};

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceStrong};
    color: ${({ theme }) => theme.palette.text};
  }
`;

const NodeLabel = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InlineActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const HelperText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const SuccessText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.success};
  font-size: 0.9rem;
`;

const FieldGroup = styled(Stack)`
  max-width: 420px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const SubTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
`;

const findNodeWithParent = (
  nodes: StampTreeNode[],
  key: string,
  parent: StampTreeFolderNode | null = null,
): LocatedNode | null => {
  for (const node of nodes) {
    if (node.key === key) {
      return { node, parent };
    }
    if (node.type === 'folder') {
      const located = findNodeWithParent(node.children, key, node);
      if (located) {
        return located;
      }
    }
  }
  return null;
};

const mapNodes = (
  nodes: StampTreeNode[],
  key: string,
  updater: (node: StampTreeNode) => StampTreeNode,
): StampTreeNode[] =>
  nodes.map((node) => {
    if (node.key === key) {
      return updater(node);
    }
    if (node.type === 'folder') {
      const children = mapNodes(node.children, key, updater);
      if (children !== node.children) {
        return { ...node, children };
      }
    }
    return node;
  });

const removeNodeByKey = (nodes: StampTreeNode[], key: string): TreeUpdateResult => {
  const next: StampTreeNode[] = [];
  let removed: StampTreeNode | undefined;
  nodes.forEach((node) => {
    if (node.key === key) {
      removed = node;
      return;
    }
    if (node.type === 'folder') {
      const childResult = removeNodeByKey(node.children, key);
      if (childResult.removed) {
        removed = childResult.removed;
      }
      next.push(
        childResult.removed
          ? {
              ...node,
              children: childResult.nodes,
            }
          : node,
      );
    } else {
      next.push(node);
    }
  });

  return {
    nodes: removed ? next : nodes,
    removed,
  };
};

const insertNodeUnder = (
  nodes: StampTreeNode[],
  parentKey: string | null,
  node: StampTreeNode,
  index?: number,
): StampTreeNode[] => {
  if (parentKey === null) {
    const copy = [...nodes];
    if (index === undefined || index < 0 || index > copy.length) {
      copy.push(node);
    } else {
      copy.splice(index, 0, node);
    }
    return copy;
  }
  return nodes.map((current) => {
    if (current.key === parentKey && current.type === 'folder') {
      const children = [...current.children];
      if (index === undefined || index < 0 || index > children.length) {
        children.push(node);
      } else {
        children.splice(index, 0, node);
      }
      return {
        ...current,
        children,
      };
    }
    if (current.type === 'folder') {
      return {
        ...current,
        children: insertNodeUnder(current.children, parentKey, node, index),
      };
    }
    return current;
  });
};

const moveNodeRelative = (
  nodes: StampTreeNode[],
  key: string,
  direction: 'up' | 'down',
): StampTreeNode[] => {
  const located = findNodeWithParent(nodes, key);
  if (!located) {
    return nodes;
  }
  const siblings = located.parent ? located.parent.children : nodes;
  const currentIndex = siblings.findIndex((item) => item.key === key);
  if (currentIndex === -1) {
    return nodes;
  }
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return nodes;
  }
  const reordered = [...siblings];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, moved);

  if (!located.parent) {
    return reordered;
  }
  return mapNodes(nodes, located.parent.key, (parentNode) => ({
    ...parentNode,
    children: reordered,
  }));
};

export const StampManagementPage = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userPk = session?.userProfile?.userModelId ?? null;

  const [treeNodes, setTreeNodes] = useState<StampTreeNode[]>([]);
  const [rootAttributes, setRootAttributes] = useState<Record<string, string>>({
    project: 'open.dolphin',
    version: '1.0',
  });
  const [metadata, setMetadata] = useState<StampTreeMetadata>({
    id: null,
    name: '個人スタンプ',
    category: null,
    publishType: null,
    partyName: null,
    url: null,
    description: null,
    published: null,
    publishedDate: null,
    lastUpdated: null,
    versionNumber: null,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [snapshot, setSnapshot] = useState<StampTreeSnapshot | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stampTreeQuery = useQuery({
    queryKey: ['stamp-tree', userPk ?? 'none'],
    enabled: Boolean(userPk),
    queryFn: () => {
      if (!userPk) {
        return Promise.resolve(null);
      }
      return fetchStampTreeHolder(userPk);
    },
  });

  const stampLibraryQuery = useStampLibrary(userPk);

  const treeMutation = useMutation({
    mutationFn: async (input: { payload: ParsedStampTree; metadata: StampTreeMetadata }) => {
      if (!userPk) {
        throw new Error('ユーザー情報が取得できませんでした。');
      }
      const treeBytes = encodeStampTreeXml(input.payload);
      const requestPayload = {
        id: input.metadata.id,
        userModel: {
          id: userPk,
        },
        name: input.metadata.name || '個人スタンプ',
        category: input.metadata.category ?? null,
        publishType: input.metadata.publishType ?? null,
        partyName: input.metadata.partyName ?? null,
        url: input.metadata.url ?? null,
        description: input.metadata.description ?? null,
        published: input.metadata.published ?? null,
        publishedDate: input.metadata.publishedDate ?? null,
        lastUpdated: input.metadata.lastUpdated ?? null,
        versionNumber: input.metadata.versionNumber ?? null,
        treeBytes,
      };
      if (!input.metadata.id) {
        const id = await createStampTree(requestPayload);
        return { id, versionNumber: '0' };
      }
      const result = await syncStampTree(requestPayload);
      return result;
    },
    onSuccess: (result) => {
      setMetadata((prev) => ({
        ...prev,
        id: result.id,
        versionNumber: result.versionNumber,
      }));
      setSnapshot({
        nodes: cloneStampTreeNodes(treeNodes),
        rootAttributes: { ...rootAttributes },
        metadata: {
          ...metadata,
          id: result.id,
          versionNumber: result.versionNumber,
        },
      });
      setFeedback({ type: 'success', message: 'スタンプツリーを保存しました。' });
      if (userPk) {
        queryClient.invalidateQueries({ queryKey: ['stamp-library', userPk] });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'スタンプツリーの保存に失敗しました。時間をおいて再度お試しください。';
      setFeedback({ type: 'error', message });
    },
  });

  const deleteStampMutation = useMutation({
    mutationFn: async (stampId: string) => deleteStampModels([stampId]),
    onSuccess: () => {
      if (userPk) {
        queryClient.invalidateQueries({ queryKey: ['stamp-library', userPk] });
      }
    },
  });

  const insertStampMutation = useMutation({
    mutationFn: async (input: { definition: StampDefinition; folderKey: string }) => {
      if (!userPk) {
        throw new Error('ユーザー情報が取得できませんでした。');
      }
      const { definition } = input;
      if (!definition.stampId) {
        throw new Error('スタンプIDが存在しないスタンプは登録できません。');
      }
      let stampId = definition.stampId;
      if (definition.source !== 'personal') {
        const module = await fetchStampModule(definition.stampId);
        const newId = uuidv4();
        await saveStampModel({
          id: newId,
          userId: userPk,
          entity: module.entity,
          stampBytes: module.stampBytes,
        });
        stampId = newId;
      }
      return {
        stampId,
        definition,
        folderKey: input.folderKey,
      };
    },
    onSuccess: (result) => {
      const newNode: StampTreeStampNode = {
        type: 'stamp',
        key: `stamp-${uuidv4()}`,
        name: result.definition.name,
        entity: result.definition.entity,
        role: result.definition.role,
        stampId: result.stampId,
        editable: result.definition.editable,
        memo: result.definition.memo,
        extraAttributes: {},
      };
      setTreeNodes((prev) => insertNodeUnder(prev, result.folderKey, newNode));
      setSelectedKey(newNode.key);
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.add(result.folderKey);
        return next;
      });
      setFeedback({ type: 'success', message: 'スタンプを追加しました。' });
      if (userPk) {
        queryClient.invalidateQueries({ queryKey: ['stamp-library', userPk] });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'スタンプの追加に失敗しました。';
      setFeedback({ type: 'error', message });
    },
  });

  useEffect(() => {
    if (!userPk) {
      setTreeNodes([]);
      setMetadata({
        id: null,
        name: '個人スタンプ',
        category: null,
        publishType: null,
        partyName: null,
        url: null,
        description: null,
        published: null,
        publishedDate: null,
        lastUpdated: null,
        versionNumber: null,
      });
      setSnapshot(null);
      return;
    }
    const holder = stampTreeQuery.data;
    if (!holder) {
      return;
    }
    const personal = holder.personalTree;
    if (!personal) {
      const initialNodes: StampTreeNode[] = [];
      setTreeNodes(initialNodes);
      setRootAttributes({
        project: 'open.dolphin',
        version: '1.0',
      });
      const initialMetadata: StampTreeMetadata = {
        id: null,
        name: '個人スタンプ',
        category: null,
        publishType: null,
        partyName: null,
        url: null,
        description: null,
        published: null,
        publishedDate: null,
        lastUpdated: null,
        versionNumber: null,
      };
      setMetadata(initialMetadata);
      setSnapshot({
        nodes: cloneStampTreeNodes(initialNodes),
        rootAttributes: {
          project: 'open.dolphin',
          version: '1.0',
        },
        metadata: initialMetadata,
      });
      setExpandedKeys(new Set());
      setSelectedKey(null);
      return;
    }

    const xml = decodeStampTreeBytes(personal.treeBytes ?? undefined);
    let parsedTree: ParsedStampTree = {
      nodes: [],
      rootAttributes: {
        project: 'open.dolphin',
        version: '1.0',
      },
    };
    if (xml) {
      try {
        parsedTree = parseStampTreeForEditor(xml);
      } catch (error) {
        console.error('スタンプツリーの解析に失敗しました。', error);
        setFeedback({
          type: 'error',
          message: 'スタンプツリーの解析に失敗しました。スタンプツリー表示を初期化しました。',
        });
        parsedTree = {
          nodes: [],
          rootAttributes: {
            project: 'open.dolphin',
            version: '1.0',
          },
        };
      }
    }
    const keyedNodes = resetStampTreeNodeKeys(parsedTree.nodes);
    setTreeNodes(keyedNodes);
    setRootAttributes({
      project: parsedTree.rootAttributes.project ?? 'open.dolphin',
      version: parsedTree.rootAttributes.version ?? parsedTree.rootAttributes['version'],
      ...parsedTree.rootAttributes,
    });
    const nextMetadata: StampTreeMetadata = {
      id: personal.id ?? null,
      name: personal.name ?? '個人スタンプ',
      category: personal.category ?? null,
      publishType: personal.publishType ?? null,
      partyName: personal.partyName ?? null,
      url: personal.url ?? null,
      description: personal.description ?? null,
      published: personal.published ?? null,
      publishedDate: personal.publishedDate ?? null,
      lastUpdated: personal.lastUpdated ?? null,
      versionNumber: personal.versionNumber ?? null,
    };
    setMetadata(nextMetadata);
    setSnapshot({
      nodes: cloneStampTreeNodes(keyedNodes),
      rootAttributes: { ...parsedTree.rootAttributes },
      metadata: nextMetadata,
    });
    setExpandedKeys(new Set(keyedNodes.filter((node) => node.type === 'folder').map((node) => node.key)));
    setSelectedKey(null);
  }, [stampTreeQuery.data, userPk]);

  const locatedNode = useMemo(() => {
    if (!selectedKey) {
      return null;
    }
    return findNodeWithParent(treeNodes, selectedKey);
  }, [treeNodes, selectedKey]);

  const isDirty = useMemo(() => {
    if (!snapshot) {
      return treeNodes.length > 0;
    }
    if (!stampTreeNodesEqual(treeNodes, snapshot.nodes)) {
      return true;
    }
    const currentAttributes = rootAttributes;
    const snapshotAttributes = snapshot.rootAttributes;
    const attributeKeys = new Set([...Object.keys(currentAttributes), ...Object.keys(snapshotAttributes)]);
    for (const key of attributeKeys) {
      if ((currentAttributes[key] ?? '') !== (snapshotAttributes[key] ?? '')) {
        return true;
      }
    }
    const keys: (keyof StampTreeMetadata)[] = [
      'id',
      'name',
      'category',
      'publishType',
      'partyName',
      'url',
      'description',
      'published',
      'publishedDate',
      'lastUpdated',
      'versionNumber',
    ];
    for (const key of keys) {
      if ((metadata[key] ?? '') !== (snapshot.metadata[key] ?? '')) {
        return true;
      }
    }
    return false;
  }, [metadata, rootAttributes, snapshot, treeNodes]);

  const handleToggleFolder = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectNode = (key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  const handleAddRootFolder = () => {
    const newFolder: StampTreeFolderNode = {
      type: 'folder',
      key: `folder-${uuidv4()}`,
      name: '新規フォルダ',
      entity: undefined,
      role: undefined,
      isRoot: true,
      extraAttributes: {},
      children: [],
    };
    setTreeNodes((prev) => [...prev, newFolder]);
    setExpandedKeys((prev) => new Set(prev).add(newFolder.key));
    setSelectedKey(newFolder.key);
  };

  const handleAddChildFolder = (parent: StampTreeFolderNode) => {
    const newFolder: StampTreeFolderNode = {
      type: 'folder',
      key: `folder-${uuidv4()}`,
      name: '新規フォルダ',
      entity: parent.entity,
      role: parent.role,
      isRoot: false,
      extraAttributes: {},
      children: [],
    };
    setTreeNodes((prev) => insertNodeUnder(prev, parent.key, newFolder));
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.add(parent.key);
      next.add(newFolder.key);
      return next;
    });
    setSelectedKey(newFolder.key);
  };

  const handleMoveNode = (direction: 'up' | 'down') => {
    if (!selectedKey) {
      return;
    }
    setTreeNodes((prev) => moveNodeRelative(prev, selectedKey, direction));
  };

  const handleRemoveNode = (node: StampTreeNode, removePermanently: boolean) => {
    if (node.type === 'folder' && node.children.length > 0 && !removePermanently) {
      const confirmed = window.confirm('フォルダ内のスタンプも含めてフォルダを削除します。よろしいですか？');
      if (!confirmed) {
        return;
      }
    }
    setTreeNodes((prev) => removeNodeByKey(prev, node.key).nodes);
    setSelectedKey(null);
  };

  const handleDeleteStamp = (node: StampTreeStampNode) => {
    if (!node.stampId) {
      handleRemoveNode(node, false);
      return;
    }
    const confirmed = window.confirm('スタンプを完全に削除します。ツリーからの削除だけでなく、スタンプデータも削除されます。よろしいですか？');
    if (!confirmed) {
      return;
    }
    deleteStampMutation.mutate(node.stampId, {
      onSuccess: () => {
        handleRemoveNode(node, true);
        setFeedback({ type: 'success', message: 'スタンプを削除しました。' });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'スタンプの削除に失敗しました。';
        setFeedback({ type: 'error', message });
      },
    });
  };

  const handleUpdateFolder = (changes: Partial<StampTreeFolderNode>) => {
    if (!selectedKey) {
      return;
    }
    setTreeNodes((prev) =>
      mapNodes(prev, selectedKey, (node) => {
        if (node.type !== 'folder') {
          return node;
        }
        return {
          ...node,
          ...changes,
        };
      }),
    );
  };

  const handleUpdateStamp = (changes: Partial<StampTreeStampNode>) => {
    if (!selectedKey) {
      return;
    }
    setTreeNodes((prev) =>
      mapNodes(prev, selectedKey, (node) => {
        if (node.type !== 'stamp') {
          return node;
        }
        return {
          ...node,
          ...changes,
        };
      }),
    );
  };

  const handleReset = () => {
    if (!snapshot) {
      setTreeNodes([]);
      setRootAttributes({
        project: 'open.dolphin',
        version: '1.0',
      });
      setMetadata({
        id: null,
        name: '個人スタンプ',
        category: null,
        publishType: null,
        partyName: null,
        url: null,
        description: null,
        published: null,
        publishedDate: null,
        lastUpdated: null,
        versionNumber: null,
      });
      setExpandedKeys(new Set());
      setSelectedKey(null);
      return;
    }
    setTreeNodes(resetStampTreeNodeKeys(snapshot.nodes));
    setRootAttributes({ ...snapshot.rootAttributes });
    setMetadata({ ...snapshot.metadata });
    setExpandedKeys(new Set(snapshot.nodes.filter((node) => node.type === 'folder').map((node) => node.key)));
    setSelectedKey(null);
    setFeedback({ type: 'success', message: '変更を破棄しました。' });
  };

  const handleSave = () => {
    if (!userPk) {
      setFeedback({ type: 'error', message: 'ユーザー情報が確認できません。再ログインしてください。' });
      return;
    }
    const payload: ParsedStampTree = {
      rootAttributes,
      nodes: treeNodes,
    };
    treeMutation.mutate({ payload, metadata });
  };

  const currentFolderForInsert = () => {
    if (locatedNode?.node.type === 'folder') {
      return locatedNode.node;
    }
    if (locatedNode?.parent) {
      return locatedNode.parent;
    }
    if (treeNodes.length) {
      const firstFolder = treeNodes.find(
        (node): node is StampTreeFolderNode => node.type === 'folder',
      );
      return firstFolder ?? null;
    }
    return null;
  };

  const handleInsertStamp = (definition: StampDefinition) => {
    const parentFolder = currentFolderForInsert();
    if (!parentFolder) {
      setFeedback({
        type: 'error',
        message: 'スタンプの追加先フォルダを選択してください。',
      });
      return;
    }
    insertStampMutation.mutate({ definition, folderKey: parentFolder.key });
  };

  useEffect(() => {
    if (!isDirty) {
      setFeedback(null);
    }
  }, [isDirty]);

  const renderTree = (nodes: StampTreeNode[], depth = 0) =>
    nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedKeys.has(node.key);
      const indentStyle = { marginLeft: depth * 16 };
      return (
        <TreeItem key={node.key}>
          <TreeNodeRow
            style={indentStyle}
            $selected={selectedKey === node.key}
            onClick={() => handleSelectNode(node.key)}
            role="treeitem"
            aria-selected={selectedKey === node.key}
            aria-expanded={isFolder ? isExpanded : undefined}
          >
            {isFolder ? (
              <CollapseButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleFolder(node.key);
                }}
                aria-label={isExpanded ? 'フォルダを閉じる' : 'フォルダを開く'}
              >
                {isExpanded ? '▾' : '▸'}
              </CollapseButton>
            ) : (
              <span style={{ width: 24 }} />
            )}
            <NodeLabel>
              {node.name || (isFolder ? '名称未設定フォルダ' : '名称未設定スタンプ')}
            </NodeLabel>
          </TreeNodeRow>
          {isFolder && isExpanded ? <TreeList>{renderTree(node.children, depth + 1)}</TreeList> : null}
        </TreeItem>
      );
    });

  return (
    <Stack gap={24}>
      <SectionCard area="meta">
        <Stack gap={12}>
          <SectionTitle>スタンプツリー管理</SectionTitle>
          <HelperText>
            個人スタンプツリーを編集し、保存すると `/stamp/tree` と `/stamp/tree/sync` の API を通じてサーバーへ反映されます。
          </HelperText>
          {feedback ? (
            feedback.type === 'error' ? (
              <ErrorText>{feedback.message}</ErrorText>
            ) : (
              <SuccessText>{feedback.message}</SuccessText>
            )
          ) : null}
        </Stack>
        <FieldGroup gap={12}>
          <TextField
            label="ツリー名称"
            value={metadata.name}
            onChange={(event) =>
              setMetadata((prev) => ({
                ...prev,
                name: event.currentTarget.value,
              }))
            }
          />
          <TextField
            label="分類"
            value={metadata.category ?? ''}
            onChange={(event) =>
              setMetadata((prev) => ({
                ...prev,
                category: event.currentTarget.value || null,
              }))
            }
          />
        </FieldGroup>
        <InlineActions>
          <Button type="button" variant="secondary" onClick={handleAddRootFolder}>
            ルートフォルダを追加
          </Button>
          <Button type="button" variant="ghost" onClick={handleReset} disabled={!isDirty}>
            変更を破棄
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={treeMutation.isPending}
            disabled={!isDirty || treeNodes.length === 0}
            onClick={handleSave}
          >
            保存
          </Button>
        </InlineActions>
      </SectionCard>

      <PageLayout>
        <SectionCard area="tree">
          <Stack gap={12}>
            <SectionTitle>スタンプツリー</SectionTitle>
            {treeNodes.length ? (
              <TreeList role="tree">{renderTree(treeNodes)}</TreeList>
            ) : (
              <HelperText>ルートフォルダを追加してスタンプツリーを構成してください。</HelperText>
            )}
          </Stack>
        </SectionCard>

        <SectionCard area="details">
          <Stack gap={12}>
            <SectionTitle>詳細</SectionTitle>
            {locatedNode ? (
              <Fragment>
                {locatedNode.node.type === 'folder'
                  ? (() => {
                      const folderNode = locatedNode.node;
                      return (
                        <Stack gap={12}>
                          <SubTitle>フォルダ設定</SubTitle>
                          <FieldGroup gap={12}>
                            <TextField
                              label="フォルダ名"
                              value={folderNode.name}
                              onChange={(event) =>
                                handleUpdateFolder({
                                  name: event.currentTarget.value,
                                })
                              }
                            />
                            <TextField
                              label="Entity"
                              value={folderNode.entity ?? ''}
                              onChange={(event) =>
                                handleUpdateFolder({
                                  entity: event.currentTarget.value || undefined,
                                })
                              }
                            />
                            <TextField
                              label="Role"
                              value={folderNode.role ?? ''}
                              onChange={(event) =>
                                handleUpdateFolder({
                                  role: event.currentTarget.value || undefined,
                                })
                              }
                            />
                          </FieldGroup>
                          <Divider />
                          <InlineActions>
                            <Button type="button" size="sm" onClick={() => handleAddChildFolder(folderNode)}>
                              子フォルダを追加
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveNode('up')}>
                              上へ
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveNode('down')}>
                              下へ
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => handleRemoveNode(folderNode, false)}
                            >
                              フォルダを削除
                            </Button>
                          </InlineActions>
                        </Stack>
                      );
                    })()
                  : (() => {
                      const stampNode = locatedNode.node;
                      return (
                        <Stack gap={12}>
                          <SubTitle>スタンプ設定</SubTitle>
                          <FieldGroup gap={12}>
                            <TextField
                              label="スタンプ名"
                              value={stampNode.name}
                              onChange={(event) =>
                                handleUpdateStamp({
                                  name: event.currentTarget.value,
                                })
                              }
                            />
                            <TextField
                              label="Entity"
                              value={stampNode.entity ?? ''}
                              onChange={(event) =>
                                handleUpdateStamp({
                                  entity: event.currentTarget.value || undefined,
                                })
                              }
                            />
                            <TextField
                              label="Role"
                              value={stampNode.role ?? ''}
                              onChange={(event) =>
                                handleUpdateStamp({
                                  role: event.currentTarget.value || undefined,
                                })
                              }
                            />
                            <TextArea
                              label="メモ"
                              value={stampNode.memo ?? ''}
                              rows={3}
                              onChange={(event) =>
                                handleUpdateStamp({
                                  memo: event.currentTarget.value || undefined,
                                })
                              }
                            />
                            <TextField label="スタンプID" value={stampNode.stampId ?? ''} disabled />
                          </FieldGroup>
                          <Divider />
                          <InlineActions>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveNode('up')}>
                              上へ
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleMoveNode('down')}>
                              下へ
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRemoveNode(stampNode, false)}
                            >
                              ツリーから外す
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              isLoading={deleteStampMutation.isPending}
                              onClick={() => handleDeleteStamp(stampNode)}
                            >
                              スタンプを削除
                            </Button>
                          </InlineActions>
                        </Stack>
                      );
                    })()}
              </Fragment>
            ) : (
              <HelperText>編集したいフォルダまたはスタンプを選択してください。</HelperText>
            )}
          </Stack>
        </SectionCard>

        <SectionCard area="library">
          <Stack gap={12}>
            <SectionTitle>スタンプライブラリ</SectionTitle>
            <HelperText>
              ライブラリからスタンプを選択して「挿入」すると、選択中のフォルダ配下にスタンプが追加されます。購読スタンプは自動的に個人スタンプへ複製されます。
            </HelperText>
            <StampLibraryPanel
              stamps={stampLibraryQuery.data ?? []}
              isLoading={stampLibraryQuery.isPending}
              isFetching={stampLibraryQuery.isFetching}
              error={stampLibraryQuery.error}
              onReload={() => stampLibraryQuery.refetch()}
              onInsert={handleInsertStamp}
              disabled={insertStampMutation.isPending}
            />
          </Stack>
        </SectionCard>
      </PageLayout>
    </Stack>
  );
};
