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
        <SectionTitle id="dashboard-heading">フェーズ2 コア診療フロー（進捗レポート）</SectionTitle>
        <p>
          ログインフローから患者検索・カルテ履歴まで一連の体験を Web クライアントで再現するため、フェーズ2タスクの前半を完了しました。
          認証済みセッションはヘッダー連携に自動反映され、患者安全情報（アレルギー・警告メモ）が常時確認できます。
        </p>
        <Stack direction="row" align="center" gap={12} wrap>
          <StatusBadge tone="success">ログイン/ログアウト 実装済</StatusBadge>
          <StatusBadge tone="info">患者検索 + 安全情報</StatusBadge>
          <StatusBadge tone="warning">カルテ閲覧 β</StatusBadge>
        </Stack>
        <p>
          フェーズ2の要点は <code>docs/web-client/planning/phase2/PHASE2_PROGRESS.md</code> に整理しています。安全情報パネルやカルテ履歴の UX
          改善メモも随時追加予定です。
        </p>
        <Stack direction="row" gap={12} wrap>
          <Button as="a" href="/docs/web-client/planning/phase2/PHASE2_PROGRESS.md" variant="primary">
            フェーズ2進捗メモを見る
          </Button>
        </Stack>
      </Stack>
    </SurfaceCard>
  </Stack>
);
