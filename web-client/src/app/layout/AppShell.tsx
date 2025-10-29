import { Fragment } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, Stack } from '@/components';

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
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.elevation.level1};
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
`;

const Sidebar = styled.aside`
  display: grid;
  gap: 12px;
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
  '再診シナリオのクリックパスをフェーズ2で検証予定',
  'カルテ排他制御（clientUUID）は SDK で提供予定',
  'Storybook でフォームコンポーネントを設計中',
];

export const AppShell = () => (
  <Fragment>
    <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
    <Shell>
      <Header>
        <Logo>
          <span>OpenDolphin Web Client</span>
          <span>フェーズ1 プラットフォーム基盤</span>
        </Logo>
        <HeaderActions>
          <StatusBadge tone="info">α prebuild</StatusBadge>
          <Button variant="ghost" size="sm" aria-label="通知センター（準備中）">
            通知
          </Button>
        </HeaderActions>
      </Header>

      <Body>
        <Navigation aria-label="主要ナビゲーション">
          <NavTitle>Primary</NavTitle>
          <NavItem to="/" end>
            ダッシュボード
          </NavItem>
          <NavItem to="/patients" aria-disabled>
            患者リスト（準備中）
          </NavItem>
          <NavItem to="/charts" aria-disabled>
            カルテ（準備中）
          </NavItem>
          <NavItem to="/orca" aria-disabled>
            ORCA 連携（準備中）
          </NavItem>
        </Navigation>

        <Main id="main-content">
          <Outlet />
        </Main>

        <Sidebar aria-label="進捗メモ">
          <SurfaceCard tone="muted" padding="sm">
            <Stack gap={8}>
              <SidebarHeading>フェーズ1 トピック</SidebarHeading>
              <Stack gap={8}>
                {sidebarTips.map((tip) => (
                  <SidebarText key={tip}>{tip}</SidebarText>
                ))}
              </Stack>
            </Stack>
          </SurfaceCard>
        </Sidebar>
      </Body>

      <Footer>© {new Date().getFullYear()} OpenDolphin</Footer>
    </Shell>
  </Fragment>
);
