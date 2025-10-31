import { Fragment, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, Stack } from '@/components';
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
  min-height: 100vh;
  color: ${({ theme }) => theme.palette.text};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.layout.gutter};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  position: sticky;
  top: 0;
  z-index: 20;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;

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
  gap: 12px;
  align-items: center;
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
  display: grid;
  grid-template-columns: ${({ theme }) => theme.layout.navWidth} minmax(0, 1fr) ${({ theme }) =>
        theme.layout.sidebarWidth};
  gap: ${({ theme }) => theme.layout.gutter};
  padding: ${({ theme }) => theme.layout.gutter};
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  height: calc(
    100vh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.layout.footerHeight}
  );
  min-height: 0;

  @media (max-width: 1280px) {
    grid-template-columns: ${({ theme }) => theme.layout.navWidth} minmax(0, 1fr);
  }

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  position: sticky;
  top: ${({ theme }) => theme.layout.gutter};
  align-self: start;

  @media (max-width: 960px) {
    order: -1;
    position: static;
  }
`;

const NavTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const NavItem = styled(NavLink)`
  display: block;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.palette.textMuted};
  transition: background 0.2s ease, color 0.2s ease;
  font-weight: 500;

  &[aria-current='page'] {
    background: ${({ theme }) => theme.palette.primary};
    color: ${({ theme }) => theme.palette.surface};
  }

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    color: ${({ theme }) => theme.palette.text};
  }

  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.45;
  }
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.layout.gutter};
  min-width: 0;
  min-height: 0;
  overflow: auto;

  @media (max-width: 960px) {
    order: 2;
    overflow: visible;
  }
`;

const Sidebar = styled.aside`
  display: grid;
  gap: 12px;
  position: sticky;
  top: ${({ theme }) => theme.layout.gutter};
  align-self: start;

  @media (max-width: 960px) {
    order: 1;
    position: static;
  }
`;

const SidebarHeading = styled.h3`
  font-size: ${({ theme }) => theme.typography.headingSm};
  font-weight: 600;
  margin: 0;
`;

const SidebarText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: ${({ theme }) => theme.typography.body};
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

const sidebarTips = [
  'HTTPS・CSP・CSRF を含む前面セキュリティ対策を適用しました',
  '患者検索・カルテ取得・ORCA マスター検索に性能計測と監査ログを追加しました',
  '30 クライアント同時接続を想定した負荷テストスクリプトを提供しています',
];

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

  return (
    <Fragment>
      <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
      <Shell>
        <Header>
          <Logo>
            <span>OpenDolphin Web Client</span>
            <span>フェーズ4 品質・安全性強化</span>
          </Logo>
          <HeaderActions>
            <UserProfile aria-label="サインインユーザー情報">
              <UserName>{userDisplay}</UserName>
              <UserMeta>{userMeta}</UserMeta>
            </UserProfile>
            <StatusBadge tone="info">Phase4 QA</StatusBadge>
            <Button variant="ghost" size="sm" aria-label="通知センター（準備中）">
              通知
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </HeaderActions>
        </Header>

        <SidebarContext.Provider value={sidebarController}>
          <Body>
            <Navigation aria-label="主要ナビゲーション">
            <NavTitle>Primary</NavTitle>
            <NavItem to="/patients">
              患者リスト
            </NavItem>
            <NavItem to="/reception">
              受付一覧
            </NavItem>
            <NavItem to="/facility-schedule">
              施設予約一覧
            </NavItem>
            <NavItem to="/dashboard">
              ダッシュボード
            </NavItem>
            <NavItem to="/charts">
              カルテ編集
            </NavItem>
            <NavItem to="/orca" aria-disabled>
              ORCA 連携（準備中）
            </NavItem>
            {canAccessAdministration ? (
              <Fragment>
                <NavTitle>Administration</NavTitle>
                <NavItem to="/administration/users">
                  ユーザー管理
                </NavItem>
                <NavItem to="/administration/patients">
                  患者データ出力
                </NavItem>
                <NavItem to="/administration/system">
                  システム設定
                </NavItem>
                <NavItem to="/administration/stamps">
                  繧ｹ繧ｿ繝ｳ繝励Λ繧､繝悶Λ繝ｪ
                </NavItem>
              </Fragment>
            ) : null}
          </Navigation>

            <Main id="main-content">
              <Outlet />
            </Main>

            <Sidebar aria-label={sidebarContent ? 'コンテキストサイドバー' : 'フェーズ進捗メモ'}>
              {sidebarContent ? (
                sidebarContent
              ) : (
                <SurfaceCard tone="muted" padding="sm">
                  <Stack gap={8}>
                    <SidebarHeading>フェーズ4 ハイライト</SidebarHeading>
                    <Stack gap={8}>
                      {sidebarTips.map((tip) => (
                        <SidebarText key={tip}>{tip}</SidebarText>
                      ))}
                    </Stack>
                  </Stack>
                </SurfaceCard>
              )}
            </Sidebar>
          </Body>
        </SidebarContext.Provider>

        <Footer>© {new Date().getFullYear()} OpenDolphin</Footer>
      </Shell>
    </Fragment>
  );
};
