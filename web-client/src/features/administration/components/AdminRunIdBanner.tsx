import styled from '@emotion/styled';

import { Button, Stack, StatusBadge, SurfaceCard } from '@/components';
import {
  ADMIN_CHARTS_LOG_ADMIN_ANCHOR,
  ADMIN_CHARTS_LOG_CHARTS_ANCHOR,
  ADMIN_CHARTS_RUN_ID,
} from '@/features/administration/constants/adminChartsSync';

const BannerShell = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  border-style: dashed;
  border-width: 1px;
  border-color: ${({ theme }) => theme.palette.primaryStrong};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const BannerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const BannerDescription = styled.div`
  min-width: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
`;

const BannerActions = styled(Stack)`
  width: 100%;
  justify-content: flex-start;
  flex-wrap: wrap;
`

export const AdminRunIdBanner = () => (
  <BannerShell data-run-id={ADMIN_CHARTS_RUN_ID} aria-label="RUN_ID バナー">
    <BannerRow>
      <BannerDescription>
        <strong>RUN_ID を明示した監査証跡</strong>
        <p style={{ margin: '4px 0 0', color: '#475569' }}>
          StatusBadge とログ deep link を SystemPreferences/UserAdministration で共通表示して、Charts 右ペインのショートカットからも証跡へ戻れるようにしています。
        </p>
      </BannerDescription>
      <StatusBadge tone="info" size="sm">
        {ADMIN_CHARTS_RUN_ID}
      </StatusBadge>
    </BannerRow>
    <BannerActions gap={8} direction="row">
      <Button
        as="a"
        href={ADMIN_CHARTS_LOG_ADMIN_ANCHOR}
        target="_blank"
        rel="noreferrer"
        variant="ghost"
        size="sm"
      >
        管理ログ (Danger 操作)
      </Button>
      <Button
        as="a"
        href={ADMIN_CHARTS_LOG_CHARTS_ANCHOR}
        target="_blank"
        rel="noreferrer"
        variant="ghost"
        size="sm"
      >
        Charts 右ペイン証跡
      </Button>
    </BannerActions>
  </BannerShell>
);
