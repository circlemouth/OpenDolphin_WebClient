import type { Meta, StoryObj } from '@storybook/react';

import { Stack } from '@/components/Stack';
import { StatusBadge } from '@/components/StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Design System/StatusBadge',
  component: StatusBadge,
};

export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Tones: Story = {
  render: () => (
    <Stack direction="row" gap={8} wrap>
      <StatusBadge tone="info">INFO</StatusBadge>
      <StatusBadge tone="success">SUCCESS</StatusBadge>
      <StatusBadge tone="warning">WARNING</StatusBadge>
      <StatusBadge tone="danger">DANGER</StatusBadge>
      <StatusBadge tone="neutral">NEUTRAL</StatusBadge>
    </Stack>
  ),
};
