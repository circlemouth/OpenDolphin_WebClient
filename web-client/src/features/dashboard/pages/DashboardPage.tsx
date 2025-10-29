import styled from '@emotion/styled';

const PlaceholderCard = styled.section`
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  padding: 24px;
  display: grid;
  gap: 12px;
`;

const Heading = styled.h2`
  font-size: ${({ theme }) => theme.typography.headingMd};
  font-weight: 600;
`;

const Copy = styled.p`
  color: ${({ theme }) => theme.palette.textMuted};
`;

export const DashboardPage = () => (
  <PlaceholderCard aria-labelledby="dashboard-heading">
    <Heading id="dashboard-heading">ダッシュボード（仮）</Heading>
    <Copy>
      フェーズ1では認証・HTTP クライアント・アプリシェルの基盤整備に注力します。フェーズ2以降で患者検索やカルテ
      UI を段階的に組み込みます。
    </Copy>
    <Copy>
      現時点ではダミー API 連携と UI スケルトンを準備中です。進捗は
      <code>docs/web-client/planning/phase1/PHASE1_FOUNDATION.md</code>
      を参照してください。
    </Copy>
  </PlaceholderCard>
);
