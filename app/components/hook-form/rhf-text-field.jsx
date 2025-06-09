import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@shopify/polaris';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared';

export function RHFTextField({ name, helperText, type = 'text', label, ...other }) {
  const { control } = useFormContext();
  const isNumberType = type === 'number';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const value = isNumberType ? transformValue(field.value) : field.value;

        return (
          <TextField
            label={label}
            value={value}
            type={isNumberType ? 'text' : type}
            onChange={(val) => {
              const transformed = isNumberType
                ? transformValueOnChange(val)
                : val;
              field.onChange(transformed);
            }}
            onBlur={() => {
              const transformed = isNumberType
                ? transformValueOnBlur(field.value)
                : field.value;
              field.onChange(transformed);
            }}
            error={Boolean(error)}
            helpText={
              error ? (
                <span style={{ color: 'var(--p-color-text-critical)' }}>
                  {error?.message ?? helperText}
                </span>
              ) : (
                helperText
              )
            }
            autoComplete="off"
            inputMode={isNumberType ? 'decimal' : undefined}
            {...other}
          />
        );
      }}
    />
  );
}
