import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { readStoredAuth } from '../../libs/auth/storedAuth';
import type { OrderBundleItem } from './orderBundleApi';
import { fetchStampDetail, fetchStampTree, fetchUserProfile, type StampBundleJson, type StampTree } from './stampApi';
import {
  loadLocalStamps,
  loadStampClipboard,
  saveStampClipboard,
  type LocalStampEntry,
  type StampClipboardEntry,
} from './stampStorage';

type StampLibraryPanelProps = {
  phase: 1 | 2;
  onOpenOrderEdit?: () => void;
};

type EntityFilter = 'all' | string;

type ServerStampListItem = {
  source: 'server';
  treeName: string;
  entity: string;
  stampId: string;
  name: string;
  memo?: string;
};

type LocalStampListItem = {
  source: 'local';
  category: string;
  target: string;
  entity: string;
  id: string;
  name: string;
  stamp: LocalStampEntry;
};

type StampListItem = ServerStampListItem | LocalStampListItem;

const toClipboardEntryFromLocalStamp = (stamp: LocalStampEntry): StampClipboardEntry => ({
  savedAt: new Date().toISOString(),
  source: 'local',
  stampId: stamp.id,
  name: stamp.name,
  category: stamp.category,
  target: stamp.target,
  entity: stamp.entity,
  bundle: stamp.bundle,
});

const toClipboardEntryFromStamp = (
  stamp: StampBundleJson,
  today: string,
  meta: { name?: string; category?: string; target: string; entity: string; stampId?: string },
): StampClipboardEntry => ({
  savedAt: new Date().toISOString(),
  source: 'server',
  stampId: meta.stampId,
  name: meta.name ?? stamp.orderName ?? stamp.className ?? '',
  category: meta.category ?? '',
  target: meta.target,
  entity: meta.entity,
  bundle: {
    bundleName: stamp.orderName ?? stamp.className ?? '',
    admin: stamp.admin ?? '',
    bundleNumber: stamp.bundleNumber ?? '1',
    classCode: stamp.classCode,
    classCodeSystem: stamp.classCodeSystem,
    className: stamp.className,
    adminMemo: stamp.adminMemo ?? '',
    memo: stamp.memo ?? '',
    startDate: today,
    items:
      stamp.claimItem && stamp.claimItem.length > 0
        ? stamp.claimItem.map(
            (item): OrderBundleItem => ({
              name: item.name ?? '',
              quantity: item.number ?? '',
              unit: item.unit ?? '',
              memo: item.memo ?? '',
            }),
          )
        : [],
  },
});

const matchesQuery = (candidate: string, query: string) => {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return candidate.toLowerCase().includes(needle);
};

const normalizeTreeName = (treeName?: string | null) => (treeName && treeName.trim() ? treeName.trim() : '（未分類）');

const collectStampTreeEntities = (trees: StampTree[]) =>
  Array.from(new Set(trees.map((tree) => tree.entity).filter((value) => value && value.trim()))).sort();

const groupByKey = <T,>(items: T[], keyOf: (item: T) => string) => {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyOf(item) || '（未分類）';
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  });
  return map;
};

export function StampLibraryPanel({ phase, onOpenOrderEdit }: StampLibraryPanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storedAuth = useMemo(() => readStoredAuth(), []);
  const userName = storedAuth ? `${storedAuth.facilityId}:${storedAuth.userId}` : null;
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [selected, setSelected] = useState<StampListItem | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const userProfileQuery = useQuery({
    queryKey: ['stamp-library-profile', userName],
    queryFn: () => {
      if (!userName) throw new Error('userName is required');
      return fetchUserProfile(userName);
    },
    enabled: Boolean(userName),
    staleTime: 5 * 60 * 1000,
  });

  const userPk = userProfileQuery.data?.id;
  const stampTreeQuery = useQuery({
    queryKey: ['stamp-library-tree', userPk],
    queryFn: () => {
      if (!userPk) throw new Error('userPk is required');
      return fetchStampTree(userPk);
    },
    enabled: typeof userPk === 'number',
  });

  const selectedStampId = selected?.source === 'server' ? selected.stampId : null;
  const stampDetailQuery = useQuery({
    queryKey: ['stamp-library-detail', selectedStampId],
    queryFn: () => {
      if (!selectedStampId) throw new Error('stampId is required');
      return fetchStampDetail(selectedStampId);
    },
    enabled: Boolean(selectedStampId),
  });

  const trees = stampTreeQuery.data?.trees ?? [];
  const entities = useMemo(() => collectStampTreeEntities(trees), [trees]);

  const serverItems = useMemo((): ServerStampListItem[] => {
    const list: ServerStampListItem[] = [];
    trees.forEach((tree) => {
      const treeName = normalizeTreeName(tree.treeName);
      const stamps = Array.isArray(tree.stampList) ? tree.stampList : [];
      stamps.forEach((stamp) => {
        list.push({
          source: 'server',
          treeName,
          entity: tree.entity,
          stampId: stamp.stampId,
          name: stamp.name,
          memo: stamp.memo,
        });
      });
    });
    return list;
  }, [trees]);

  const localStamps = useMemo(() => (userName ? loadLocalStamps(userName) : []), [userName]);
  const localItems = useMemo((): LocalStampListItem[] => {
    return localStamps.map((stamp) => ({
      source: 'local',
      category: stamp.category?.trim() ? stamp.category : '（未分類）',
      target: stamp.target,
      entity: stamp.entity,
      id: stamp.id,
      name: stamp.name,
      stamp,
    }));
  }, [localStamps]);

  const filteredServerItems = useMemo(() => {
    return serverItems
      .filter((item) => (entityFilter === 'all' ? true : item.entity === entityFilter))
      .filter((item) => matchesQuery(item.name, query) || matchesQuery(item.memo ?? '', query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entityFilter, query, serverItems]);

  const filteredLocalItems = useMemo(() => {
    return localItems
      .filter((item) => (entityFilter === 'all' ? true : item.target === entityFilter || item.entity === entityFilter))
      .filter((item) => matchesQuery(item.name, query) || matchesQuery(item.stamp.bundle.memo ?? '', query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entityFilter, localItems, query]);

  const groupedServer = useMemo(() => groupByKey(filteredServerItems, (item) => item.treeName), [filteredServerItems]);
  const groupedLocal = useMemo(() => groupByKey(filteredLocalItems, (item) => item.category), [filteredLocalItems]);

  const clipboard = useMemo(() => (userName ? loadStampClipboard(userName) : null), [userName, copyNotice]);

  const handleSelect = (item: StampListItem) => {
    setSelected(item);
    setCopyNotice(null);
  };

  const handleCopy = () => {
    if (!userName) {
      setCopyNotice('ログイン情報が取得できないためコピーできません。');
      return;
    }
    if (!selected) {
      setCopyNotice('コピー対象を選択してください。');
      return;
    }
    if (phase < 2) {
      setCopyNotice('Phase2 で有効です（VITE_STAMPBOX_MVP=2）。');
      return;
    }
    if (selected.source === 'local') {
      saveStampClipboard(userName, toClipboardEntryFromLocalStamp(selected.stamp));
      setCopyNotice(`コピーしました（ローカル）: ${selected.name}`);
      return;
    }
    const detail = stampDetailQuery.data;
    if (!detail?.ok || !detail.stamp) {
      setCopyNotice('スタンプ詳細が未取得のためコピーできません。');
      return;
    }
    const entry = toClipboardEntryFromStamp(detail.stamp, today, {
      stampId: selected.stampId,
      name: selected.name,
      category: selected.treeName,
      target: selected.entity,
      entity: selected.entity,
    });
    saveStampClipboard(userName, entry);
    setCopyNotice(`コピーしました（サーバー）: ${selected.name}`);
  };

  const renderPreviewItems = (items?: Array<{ name?: string; number?: string; unit?: string; memo?: string }>) => {
    if (!items || items.length === 0) return <p className="charts-side-panel__message">項目なし</p>;
    return (
      <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
        {items.map((item, idx) => {
          const parts = [item.number, item.unit].filter(Boolean).join('');
          const left = [item.name, parts ? `(${parts})` : ''].filter(Boolean).join(' ');
          return (
            <li key={`${item.name ?? 'item'}-${idx}`}>
              <span>{left || '（名称なし）'}</span>
              {item.memo?.trim() ? <small style={{ color: '#64748b', marginLeft: '0.5rem' }}>memo: {item.memo}</small> : null}
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <div className="charts-side-panel__content" data-test-id="stamp-library-panel">
      <header>
        <p className="charts-side-panel__message">StampBox 相当の閲覧導線（Phase{phase}）</p>
        <p className="charts-side-panel__message">
          Phase1: 閲覧/検索/プレビュー。Phase2: クリップボードへコピーし、オーダー編集でペーストできます。
        </p>
      </header>

      <section>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontWeight: 700 }}>検索（名称/memo）</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例: 降圧 / アムロジピン"
            aria-label="スタンプ検索"
          />
        </label>
      </section>

      <section>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontWeight: 700 }}>対象（entity）</span>
          <select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value as EntityFilter)}
            aria-label="entityフィルタ"
          >
            <option value="all">すべて</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!userName ? (
        <p className="charts-side-panel__message">ログイン情報が取得できないため、サーバースタンプは表示できません。</p>
      ) : userProfileQuery.isError ? (
        <p className="charts-side-panel__message">ユーザープロファイルの取得に失敗しました。ローカルのみ利用できます。</p>
      ) : userProfileQuery.isSuccess && (!userProfileQuery.data?.ok || typeof userProfileQuery.data?.id !== 'number') ? (
        <p className="charts-side-panel__message">ユーザー情報が見つからず、サーバースタンプは利用できません。</p>
      ) : null}

      <section>
        <div className="charts-side-panel__actions" role="group" aria-label="スタンプ操作">
          <button type="button" onClick={handleCopy} disabled={phase < 2 || !selected}>
            クリップボードへコピー（Phase2）
          </button>
          {phase >= 2 && onOpenOrderEdit ? (
            <button type="button" onClick={() => onOpenOrderEdit()} disabled={!selected}>
              オーダー編集を開く
            </button>
          ) : null}
        </div>
        {copyNotice ? (
          <p className="charts-side-panel__message" role="status">
            {copyNotice}
          </p>
        ) : null}
        {clipboard ? (
          <p className="charts-side-panel__message">
            クリップボード: {clipboard.name}（{clipboard.source} / {clipboard.category || '—'} / savedAt={clipboard.savedAt}）
          </p>
        ) : (
          <p className="charts-side-panel__message">クリップボード: （空）</p>
        )}
      </section>

      <section aria-label="サーバースタンプ（treeName分類）">
        <h3 style={{ margin: 0, fontSize: '1rem' }}>サーバースタンプ</h3>
        {stampTreeQuery.isFetching ? (
          <p className="charts-side-panel__message">読み込み中…</p>
        ) : groupedServer.size === 0 ? (
          <p className="charts-side-panel__message">該当するスタンプがありません。</p>
        ) : (
          Array.from(groupedServer.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([treeName, list]) => (
              <details key={treeName} open>
                <summary>
                  {treeName} <small style={{ color: '#64748b' }}>({list.length})</small>
                </summary>
                <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0.5rem 0 0', display: 'grid', gap: '0.25rem' }}>
                  {list.map((item) => {
                    const isActive = selected?.source === 'server' && selected.stampId === item.stampId;
                    return (
                      <li key={item.stampId}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          aria-pressed={isActive}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            borderRadius: 10,
                            border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.55)' : 'rgba(148, 163, 184, 0.35)'}`,
                            background: isActive ? '#eff6ff' : '#ffffff',
                            padding: '0.45rem 0.6rem',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{item.name}</span>{' '}
                          <small style={{ color: '#64748b' }}>{item.entity}</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))
        )}
      </section>

      <section aria-label="ローカルスタンプ">
        <h3 style={{ margin: 0, fontSize: '1rem' }}>ローカルスタンプ</h3>
        {groupedLocal.size === 0 ? (
          <p className="charts-side-panel__message">該当するスタンプがありません。</p>
        ) : (
          Array.from(groupedLocal.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([category, list]) => (
              <details key={`local-${category}`}>
                <summary>
                  {category} <small style={{ color: '#64748b' }}>({list.length})</small>
                </summary>
                <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0.5rem 0 0', display: 'grid', gap: '0.25rem' }}>
                  {list.map((item) => {
                    const isActive = selected?.source === 'local' && selected.id === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          aria-pressed={isActive}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            borderRadius: 10,
                            border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.55)' : 'rgba(148, 163, 184, 0.35)'}`,
                            background: isActive ? '#eff6ff' : '#ffffff',
                            padding: '0.45rem 0.6rem',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{item.name}</span>{' '}
                          <small style={{ color: '#64748b' }}>{item.target}</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))
        )}
      </section>

      <section aria-label="選択スタンプのプレビュー">
        <h3 style={{ margin: 0, fontSize: '1rem' }}>プレビュー</h3>
        {!selected ? (
          <p className="charts-side-panel__message">スタンプを選択してください。</p>
        ) : selected.source === 'local' ? (
          <>
            <p className="charts-side-panel__message">
              {selected.name}（local / {selected.target}）
            </p>
            {selected.stamp.bundle.memo?.trim() ? (
              <p className="charts-side-panel__message">memo: {selected.stamp.bundle.memo}</p>
            ) : (
              <p className="charts-side-panel__message">memo: （なし）</p>
            )}
            <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
              {(selected.stamp.bundle.items ?? []).slice(0, 20).map((item, idx) => {
                const parts = [item.quantity, item.unit].filter(Boolean).join('');
                const left = [item.name, parts ? `(${parts})` : ''].filter(Boolean).join(' ');
                return (
                  <li key={`${item.name ?? 'item'}-${idx}`}>
                    <span>{left || '（名称なし）'}</span>
                    {item.memo?.trim() ? <small style={{ color: '#64748b', marginLeft: '0.5rem' }}>memo: {item.memo}</small> : null}
                  </li>
                );
              })}
            </ol>
            {(selected.stamp.bundle.items?.length ?? 0) > 20 ? (
              <p className="charts-side-panel__message">他 {(selected.stamp.bundle.items?.length ?? 0) - 20} 件</p>
            ) : null}
          </>
        ) : stampDetailQuery.isFetching ? (
          <p className="charts-side-panel__message">詳細を取得中…</p>
        ) : !stampDetailQuery.data?.ok || !stampDetailQuery.data?.stamp ? (
          <p className="charts-side-panel__message">詳細を取得できませんでした。</p>
        ) : (
          <>
            <p className="charts-side-panel__message">
              {selected.name}（server / {selected.entity} / {selected.treeName}）
            </p>
            {stampDetailQuery.data.stamp.memo?.trim() ? (
              <p className="charts-side-panel__message">memo: {stampDetailQuery.data.stamp.memo}</p>
            ) : (
              <p className="charts-side-panel__message">memo: （なし）</p>
            )}
            {renderPreviewItems(stampDetailQuery.data.stamp.claimItem)}
          </>
        )}
      </section>
    </div>
  );
}

