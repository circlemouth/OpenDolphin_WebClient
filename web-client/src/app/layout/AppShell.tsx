import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

import { Button, ReplayGapBanner, ReplayGapToast, SurfaceCard } from '@/components';
import { useAuth } from '@/libs/auth';
import { useReceptionReplayGap } from '@/features/reception/hooks/useReceptionReplayGap';
import { useReplayGapContext } from '@/features/replay-gap/ReplayGapContext';
import { SidebarContext } from './SidebarContext';

const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: calc(50% - 80px);
  z-index: 1000;
  padding: 8px 16px;
  background: ${({ theme }) => theme.palette.primary};
  color: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: top 0.2s ease;

  &:focus {
    top: 16px;
  }
`;

const Shell = styled.div`
  display: grid;
  grid-template-rows: ${({ theme }) => theme.layout.headerHeight} 1fr;
  min-height: 100dvh;
  color: ${({ theme }) => theme.palette.text};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.layout.gutter};
  padding: 0 ${({ theme }) => theme.layout.gutter};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  position: sticky;
  top: 0;
  z-index: 20;
  flex-wrap: nowrap;
  min-width: 0;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  span:first-of-type {
    font-weight: 700;
    font-size: ${({ theme }) => theme.typography.headingSm};
  }

  span:last-of-type {
    font-size: ${({ theme }) => theme.typography.caption};
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
`;

const UserProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
`;

const UserName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const UserMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.layout.gutter};
  padding: ${({ theme }) => theme.layout.gutter};
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  /* layout tokens drive main viewport height for nested scroll containers */
  --app-shell-main-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  height: var(--app-shell-main-height);
  min-height: 0;
  overflow: hidden;

  &[data-app-section='charts'] {
    padding-top: 0;
  }

  &[data-replay-gap='true'] {
    filter: saturate(0.85);
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  padding: 0;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const NavList = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 0 4px;
`;

const NavItem = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.palette.textMuted};
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  flex-shrink: 0;

  &[aria-current='page'] {
    background: ${({ theme }) => theme.palette.primary};
    color: ${({ theme }) => theme.palette.onPrimary};
    box-shadow: 0 0 0 1px transparent;
  }

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    color: ${({ theme }) => theme.palette.text};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.palette.accent};
  }

  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.45;
  }
`;

type SseIndicatorTone = 'info' | 'warning' | 'danger';

const SseStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
`;

const SseLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SseValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const GaugeTrack = styled.div`
  width: 100%;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.xs};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  overflow: hidden;
`;

const GaugeFill = styled.div<{ $percent: number; $tone: SseIndicatorTone }>`
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
  background: ${({ theme, $tone }) => {
    if ($tone === 'danger') {
      return theme.palette.danger;
    }
    if ($tone === 'warning') {
      return theme.palette.warning;
    }
    return theme.palette.primary;
  }};
`;

const AdminMenuWrapper = styled.div`
  position: relative;
`;

const AdminMenuList = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  min-width: 200px;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  border: 1px solid ${({ theme }) => theme.palette.border};
  z-index: 40;
`;

const AdminMenuItem = styled(NavLink)`
  display: block;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.palette.text};
  font-size: ${({ theme }) => theme.typography.body};
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;

  &[aria-current='page'] {
    background: ${({ theme }) => theme.palette.primary};
    color: ${({ theme }) => theme.palette.onPrimary};
  }

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    outline: none;
  }

  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.45;
  }
`;

const FailoverBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 60;
`;

const FailoverDialog = styled(SurfaceCard)`
  width: min(420px, 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FailoverTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const FailoverBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.text};
  font-size: 0.9rem;
`;

const FailoverActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const FailoverLinks = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.82rem;
`;

const FailoverLink = styled.a`
  color: ${({ theme }) => theme.palette.primary};
  text-decoration: underline;
`;

const ContentRegion = styled.div<{ hasSidebar: boolean }>`
  display: grid;
  grid-template-columns: ${({ hasSidebar }) =>
    hasSidebar ? 'minmax(0, 1fr) minmax(260px, 340px)' : 'minmax(0, 1fr)'};
  gap: ${({ theme }) => theme.layout.gutter};
  flex: 1;
  min-height: 0;
  height: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'scrollLocked',
})<{ scrollLocked: boolean }>`
  --app-shell-sticky-offset: ${({ theme, scrollLocked }) =>
    scrollLocked ? '0px' : theme.layout.headerHeight};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.layout.gutter};
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: ${({ scrollLocked }) => (scrollLocked ? 'hidden' : 'auto')};
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
`;

const BannerSlot = styled.div`
  padding: 8px ${({ theme }) => theme.layout.gutter};
  background: ${({ theme }) => theme.palette.background};
`;

export const AppShell = () => {
  const navigate = useNavigate();
  const { session, logout, hasRole } = useAuth();
  const receptionReplayGap = useReceptionReplayGap();
  const [sidebarContent, setSidebarContent] = useState<React.ReactNode | null>(null);
  const sidebarController = useMemo(
    () => ({
      setSidebar: (content: React.ReactNode | null) => {
        setSidebarContent(content);
      },
      clearSidebar: () => {
        setSidebarContent(null);
      },
    }),
    [],
  );

  const location = useLocation();
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuId = useId();

  const {
    state: replayGapState,
    gapDetails,
    manualResync,
    manualResyncDisabled,
    runbookHref,
    supportHref,
  } = useReplayGapContext();
  const [showFailoverModal, setShowFailoverModal] = useState(false);

  const canAccessAdministration = hasRole('admin') || hasRole('manager') || hasRole('system');

  const userDisplay = useMemo(() => {
    if (session?.userProfile?.displayName) {
      return session.userProfile.displayName;
    }
    if (session) {
      return `${session.credentials.facilityId}:${session.credentials.userId}`;
    }
    return 'サインイン済みユーザー';
  }, [session]);

  const userMeta = useMemo(() => {
    if (!session) {
      return '';
    }
    const { facilityId, userId } = session.credentials;
    return `施設 ${facilityId} / ユーザー ${userId}`;
  }, [session]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAdminMenuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminMenuOpen]);

  const normalizedGapSize = Math.min(100, Math.max(0, gapDetails.gapSize ?? 0));
  const gaugeTone: SseIndicatorTone =
    normalizedGapSize >= 90 ? 'danger' : normalizedGapSize >= 70 ? 'warning' : 'info';

  useEffect(() => {
    if (normalizedGapSize >= 90 && replayGapState.phase !== 'reloading') {
      setShowFailoverModal(true);
      return;
    }
    if (normalizedGapSize < 70) {
      setShowFailoverModal(false);
    }
  }, [normalizedGapSize, replayGapState.phase]);

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen((prev) => !prev);
  };

  const handleFailoverClose = () => {
    setShowFailoverModal(false);
  };

  const handleFailoverResync = () => {
    setShowFailoverModal(false);
    void manualResync();
  };

  const handleAdminMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsAdminMenuOpen(false);
      const target = event.target as HTMLElement;
      if (typeof target.blur === 'function') {
        target.blur();
      }
    }
  };

  const handleAdminMenuItemSelect = () => {
    setIsAdminMenuOpen(false);
  };

  const hasSidebar = Boolean(sidebarContent);
  const isChartsView = location.pathname.startsWith('/charts');

  return (
    <Fragment>
      <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
      <Shell>
        <Header>
          <Logo>
            <span>OpenDolphin Web Client</span>
            <span>フェーズ4 品質・安全性強化</span>
          </Logo>

          <Navigation aria-label="主要ナビゲーション">
            <NavList>
              <NavItem to="/reception">
                受付一覧
              </NavItem>
              <NavItem to="/patients">
                患者一覧
              </NavItem>
              <NavItem to="/facility-schedule">
                施設スケジュール
              </NavItem>
              <NavItem to="/charts">
                カルテ閲覧
              </NavItem>
            </NavList>
          </Navigation>

          <SseStatus aria-live="polite" aria-label="SSE バッファ使用状況">
            <SseLabelRow>
              <span>SSE バッファ</span>
              <SseValue>{normalizedGapSize.toFixed(0)} / 100 件</SseValue>
            </SseLabelRow>
            <GaugeTrack role="img" aria-label={`バッファ ${normalizedGapSize.toFixed(0)} 件使用中`}>
              <GaugeFill $percent={normalizedGapSize} $tone={gaugeTone} />
            </GaugeTrack>
          </SseStatus>

          <HeaderActions>
            <UserProfile aria-label="サインインユーザー情報">
              <UserName>{userDisplay}</UserName>
              <UserMeta>{userMeta}</UserMeta>
            </UserProfile>
            <Button variant="ghost" size="sm" aria-label="通知センター（準備中）">
              通知
            </Button>
            {canAccessAdministration ? (
              <AdminMenuWrapper ref={adminMenuRef} onKeyDown={handleAdminMenuKeyDown}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAdminMenu}
                  aria-expanded={isAdminMenuOpen}
                  aria-haspopup="menu"
                  aria-controls={adminMenuId}
                >
                  管理メニュー
                </Button>
                {isAdminMenuOpen ? (
                  <AdminMenuList id={adminMenuId} role="menu" aria-label="管理者メニュー">
                    <AdminMenuItem
                      to="/orca"
                      role="menuitem"
                      aria-disabled
                      tabIndex={-1}
                    >
                      ORCA 連携（準備中）
                    </AdminMenuItem>
                    <AdminMenuItem to="/administration/users" role="menuitem" onClick={handleAdminMenuItemSelect}>
                      ユーザー管理
                    </AdminMenuItem>
                    <AdminMenuItem to="/administration/patients" role="menuitem" onClick={handleAdminMenuItemSelect}>
                      患者データ出力
                    </AdminMenuItem>
                    <AdminMenuItem to="/administration/system" role="menuitem" onClick={handleAdminMenuItemSelect}>
                      システム設定
                    </AdminMenuItem>
                    <AdminMenuItem to="/administration/stamps" role="menuitem" onClick={handleAdminMenuItemSelect}>
                      スタンプ管理
                    </AdminMenuItem>
                  </AdminMenuList>
                ) : null}
              </AdminMenuWrapper>
            ) : null}
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </HeaderActions>
        </Header>
        {receptionReplayGap.banner.visible ? (
          <BannerSlot>
            <ReplayGapBanner {...receptionReplayGap.banner} placement="global" />
          </BannerSlot>
        ) : null}

        <SidebarContext.Provider value={sidebarController}>
          <Body
            data-app-section={isChartsView ? 'charts' : 'default'}
            data-replay-gap={receptionReplayGap.dimContent ? 'true' : 'false'}
            aria-busy={receptionReplayGap.ariaBusy}
          >
            <ContentRegion hasSidebar={hasSidebar}>
              <Main
                id="main-content"
                scrollLocked={isChartsView}
                data-app-shell-section={isChartsView ? 'charts' : 'default'}
              >
                <Outlet />
              </Main>
              {hasSidebar ? (
                <Sidebar aria-label="コンテキストサイドバー">{sidebarContent}</Sidebar>
              ) : null}
            </ContentRegion>
          </Body>
        </SidebarContext.Provider>
      </Shell>
      {showFailoverModal ? (
        <FailoverBackdrop role="dialog" aria-modal="true" aria-label="SSE フェールオーバー">
          <FailoverDialog tone="warning">
            <FailoverTitle>リアルタイム SSE バッファが逼迫</FailoverTitle>
            <FailoverBody>
              SSE バッファの {normalizedGapSize.toFixed(0)} / 100 件が予約されており、チャート同期が遅延しています。Runbook を確認しつつ再取得をお試しください。
            </FailoverBody>
            <FailoverActions>
              <Button variant="danger" size="sm" disabled={manualResyncDisabled} onClick={handleFailoverResync}>
                {manualResyncDisabled ? '再同期中…' : '手動再取得'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleFailoverClose}>
                後で閉じる
              </Button>
            </FailoverActions>
            <FailoverLinks>
              <FailoverLink href={runbookHref} target="_blank" rel="noreferrer">
                Runbook
              </FailoverLink>
              <FailoverLink href={supportHref} target="_blank" rel="noreferrer">
                Ops 連絡
              </FailoverLink>
            </FailoverLinks>
          </FailoverDialog>
        </FailoverBackdrop>
      ) : null}
      <ReplayGapToast
        visible={receptionReplayGap.toast.visible}
        phaseLabel={receptionReplayGap.toast.phaseLabel}
        message={receptionReplayGap.toast.message}
        runbookHref={receptionReplayGap.toast.runbookHref}
      />
    </Fragment>
  );
};
