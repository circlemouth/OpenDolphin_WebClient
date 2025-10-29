import type { Meta, StoryObj } from '@storybook/react';

import { Stack } from '@/components/Stack';
import { StatusBadge } from '@/components/StatusBadge';
import { SurfaceCard } from '@/components/SurfaceCard';

const meta: Meta<typeof SurfaceCard> = {
  title: 'Design System/SurfaceCard',
  component: SurfaceCard,
  args: {
    children: (
      <Stack gap={12}>
        <h3 style={{ margin: 0 }}>サマリーカード</h3>
        <p style={{ margin: 0 }}>
          レイアウトの左右カラムで利用する情報ボックスや、患者アラートの表示に利用します。
        </p>
        <StatusBadge tone="warning">注意事項あり</StatusBadge>
      </Stack>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof SurfaceCard>;

export const Default: Story = {};

export const Muted: Story = {
  args: {
    tone: 'muted',
  },
};

export const Elevated: Story = {
  args: {
    tone: 'elevated',
  },
};
