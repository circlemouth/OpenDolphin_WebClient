import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/components/Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  args: {
    children: '操作',
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '重要な操作',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: '送信中',
  },
};

export const AsLink: Story = {
  args: {
    as: 'a',
    href: '#',
    children: '詳細を開く',
  },
};
