import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { TextField } from '@/components/TextField';
import type { TextFieldProps } from '@/components/TextField';

type WithoutValueProps = Omit<TextFieldProps, 'value' | 'onChange' | 'onBlur' | 'name'>;

export interface ControlledTextFieldProps<TFieldValues extends FieldValues>
  extends WithoutValueProps {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
}

export const ControlledTextField = <TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  ...props
}: ControlledTextFieldProps<TFieldValues>) => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field, fieldState }) => (
      <TextField
        {...props}
        {...field}
        errorMessage={props.errorMessage ?? fieldState.error?.message}
      />
    )}
  />
);
