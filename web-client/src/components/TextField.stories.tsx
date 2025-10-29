import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';

import { ControlledTextField } from '@/components/ControlledTextField';
import { TextField } from '@/components/TextField';

const meta: Meta<typeof TextField> = {
  title: 'Design System/TextField',
  component: TextField,
  args: {
    label: '施設ID',
    placeholder: '0001',
  },
};

export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'ORCA の施設 ID と一致させてください',
  },
};

export const WithError: Story = {
  args: {
    errorMessage: '施設 ID を入力してください',
    required: true,
  },
};

const ControlledExample = () => {
  const { control } = useForm({
    defaultValues: {
      facilityId: '',
    },
  });

  return (
    <ControlledTextField
      control={control}
      name="facilityId"
      label="施設ID"
      placeholder="0001"
      rules={{ required: '施設IDは必須です' }}
    />
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};
