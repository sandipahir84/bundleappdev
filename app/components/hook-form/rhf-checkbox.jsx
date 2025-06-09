import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox, FormLayout, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFCheckbox({ sx, name, label, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout>
          <Checkbox
            {...field}
            label={label}
            checked={field.value}
            onChange={(checked) => field.onChange(checked)}
            id={`${name}-checkbox`}
            {...other}
          />
          {error && <InlineError message={error?.message ?? helperText} />}
        </FormLayout>
      )}
    />
  );
}
