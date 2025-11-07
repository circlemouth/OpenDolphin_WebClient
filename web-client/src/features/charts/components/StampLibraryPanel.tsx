import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, SurfaceCard, TextField } from '@/components';
import type { StampDefinition } from '@/features/charts/types/stamp';
import { groupStampsByCategory } from '@/features/charts/utils/stamp-tree';

const PanelHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StampSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
`;

const StampList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StampRow = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const StampInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StampName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
  word-break: break-word;
`;

const StampMeta = styled.span`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.palette.textMuted};
  word-break: break-word;
`;

const FavoriteButton = styled.button<{ $active: boolean }>`
  border: none;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.palette.warning : theme.palette.textMuted)};
  cursor: pointer;
  padding: 4px;
  font-size: 1.1rem;
  line-height: 1;
  transition: color 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const InlineMessage = styled.p`
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const InlineError = styled.p`
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.danger};
`;

const FAVORITES_STORAGE_KEY = 'opd.web.stampFavorites.v1';

type StampLibraryPanelProps = {
  stamps: StampDefinition[];
  isLoading: boolean;
  isFetching: boolean;
  error?: unknown;
  onReload: () => void;
  onInsert: (stamp: StampDefinition) => void;
  disabled?: boolean;
};

const normalize = (value: unknown) => (value ?? '').toString().toLowerCase();

export const StampLibraryPanel = ({
  stamps,
  isLoading,
  isFetching,
  error,
  onReload,
  onInsert,
  disabled,
}: StampLibraryPanelProps) => {
  const [query, setQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteIds(new Set(parsed.filter((value) => typeof value === 'string')));
        }
      }
    } catch (storageError) {
      console.error('お気に入りスタンプの読み込みに失敗しました', storageError);
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesLoaded || typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch (storageError) {
      console.error('お気に入りスタンプの保存に失敗しました', storageError);
    }
  }, [favoriteIds, favoritesLoaded]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const set = favoriteIds;
    return stamps.filter((stamp) => {
      if (showFavoritesOnly) {
        if (!stamp.stampId || !set.has(stamp.stampId)) {
          return false;
        }
      }
      if (!keyword) {
        return true;
      }
      const haystack = [
        stamp.name,
        stamp.memo,
        stamp.entity,
        stamp.path.join(' / '),
        stamp.originTreeName,
      ]
        .filter(Boolean)
        .map(normalize)
        .join(' ');
      return haystack.includes(keyword);
    });
  }, [favoriteIds, query, showFavoritesOnly, stamps]);

  const grouped = useMemo(() => groupStampsByCategory(filtered), [filtered]);

  const toggleFavorite = (stamp: StampDefinition) => {
    if (!stamp.stampId) {
      return;
    }
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(stamp.stampId!)) {
        next.delete(stamp.stampId!);
      } else {
        next.add(stamp.stampId!);
      }
      return next;
    });
  };

  const renderStateMessage = () => {
    if (isLoading && !isFetching) {
      return <InlineMessage>スタンプ情報を読み込み中です…</InlineMessage>;
    }
    if (error) {
      return <InlineError>スタンプの取得に失敗しました。再読込をお試しください。</InlineError>;
    }
    if (!grouped.length) {
      return <InlineMessage>条件に一致するスタンプがありません。</InlineMessage>;
    }
    return null;
  };

  return (
    <SurfaceCard>
      <Stack gap={16}>
        <PanelHeader>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>スタンプライブラリ</h2>
            <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.9rem' }}>
              個人スタンプおよび購読スタンプを検索し、Planに挿入できます。お気に入り登録で優先表示が可能です。
            </p>
          </div>
          <TextField
            label="スタンプ検索"
            placeholder="名称・メモ・カテゴリで検索"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <ActionsRow>
            <Button
              type="button"
              size="sm"
              variant={showFavoritesOnly ? 'primary' : 'ghost'}
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
            >
              {showFavoritesOnly ? 'お気に入りのみ表示中' : 'お気に入りのみ表示'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onReload} isLoading={isFetching}>
              再読込
            </Button>
          </ActionsRow>
        </PanelHeader>

        {renderStateMessage()}

        {grouped.map((group) => (
          <StampSection key={group.category}>
            <SectionTitle>{group.category}</SectionTitle>
            <StampList>
              {group.stamps.map((stamp) => {
                const isFavorite = Boolean(stamp.stampId && favoriteIds.has(stamp.stampId));
                const isPlaceholder = !stamp.stampId;
                return (
                  <StampRow key={`${stamp.path.join('>')}|${stamp.stampId ?? stamp.name}`} $disabled={disabled && !isPlaceholder}>
                    <StampInfo>
                      <StampName>{stamp.name}</StampName>
                      <StampMeta>
                        {stamp.path.slice(1).join(' / ') || 'ルート直下'} | {stamp.entity ?? 'エンティティ未設定'}
                      </StampMeta>
                      {stamp.memo ? <StampMeta>{stamp.memo}</StampMeta> : null}
                    </StampInfo>
                    <Stack direction="row" gap={8} align="center">
                      <FavoriteButton
                        type="button"
                        aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                        onClick={() => toggleFavorite(stamp)}
                        disabled={!stamp.stampId}
                        $active={isFavorite}
                      >
                        {isFavorite ? '★' : '☆'}
                      </FavoriteButton>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onInsert(stamp)}
                        disabled={disabled || isPlaceholder}
                      >
                        挿入
                      </Button>
                    </Stack>
                  </StampRow>
                );
              })}
            </StampList>
          </StampSection>
        ))}
      </Stack>
    </SurfaceCard>
  );
};
