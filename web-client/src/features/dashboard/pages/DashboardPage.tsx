import { Button, Stack, StatusBadge, SurfaceCard } from '@/components';

const SectionTitle = ({ children, id }: { children: string; id?: string }) => (
  <h2
    id={id}
    style={{
      fontSize: '1.375rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}
  >
    {children}
  </h2>
);

export const DashboardPage = () => (
  <Stack gap={24} aria-labelledby="dashboard-heading">
    <SurfaceCard as="section" aria-labelledby="dashboard-heading">
      <Stack gap={16}>
        <SectionTitle id="dashboard-heading">フェーズ1 プラットフォーム基盤</SectionTitle>
        <p>
          認証 SDK、共通 HTTP クライアント、UI コンポーネントライブラリを整備し、フェーズ2以降の開発を加速するための基盤を完成させました。
        </p>
        <Stack direction="row" align="center" gap={12} wrap>
          <StatusBadge tone="info">Auth SDK ready</StatusBadge>
          <StatusBadge tone="success">HTTP client hardened</StatusBadge>
          <StatusBadge tone="neutral">Design system α</StatusBadge>
        </Stack>
        <p>
          Storybook でデザインシステム α 版を公開しています。共通コンポーネントの仕様やアクセシビリティ属性は
          <code>docs/web-client/design-system/ALPHA_COMPONENTS.md</code> にまとめています。
        </p>
        <Stack direction="row" gap={12} wrap>
          <Button as="a" href="/storybook" aria-label="Storybook を開く" variant="primary">
            Storybook を開く
          </Button>
          <Button as="a" href="/docs/web-client/planning/phase1/PHASE1_FOUNDATION.md" variant="secondary">
            ドキュメントを見る
          </Button>
        </Stack>
      </Stack>
    </SurfaceCard>
  </Stack>
);
