import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

import { Button } from '@/components';
import { useAuth } from '@/libs/auth';
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
  grid-template-rows: ${({ theme }) => theme.layout.headerHeight} 1fr ${({ theme }) =>
        theme.layout.footerHeight};
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
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  /* layout tokens drive main viewport height for nested scroll containers */
  --app-shell-main-height: calc(
    100dvh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.layout.footerHeight}
  );
  height: calc(
    100vh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.layout.footerHeight}
  );
  height: var(--app-shell-main-height);
  min-height: 0;
  overflow: hidden;
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

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: ${({ theme }) => theme.typography.caption};
  border-top: 1px solid ${({ theme }) => theme.palette.border};
`;

export const AppShell = () => {
  const navigate = useNavigate();
  const { session, logout, hasRole } = useAuth();
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

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen((prev) => !prev);
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
              <NavItem to="/patients">
                患者一覧
              </NavItem>
              <NavItem to="/reception">
                受付一覧
              </NavItem>
              <NavItem to="/facility-schedule">
                施設スケジュール
              </NavItem>
              <NavItem to="/charts">
                カルテ閲覧
              </NavItem>
            </NavList>
          </Navigation>

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

        <SidebarContext.Provider value={sidebarController}>
          <Body>
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

        <Footer>© {new Date().getFullYear()} OpenDolphin</Footer>
      </Shell>
    </Fragment>
  );
};
