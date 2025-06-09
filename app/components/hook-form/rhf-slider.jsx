import { Controller, useFormContext } from 'react-hook-form';
import { RangeSlider, FormLayout, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFSlider({ name, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout {...slotProps?.wrapper}>
          {/* Slider Component */}
          <RangeSlider
            {...field}
            value={field.value || 0} // Ensure a default value is set
            onChange={(value) => field.onChange(value)}
            {...other}
          />

          {/* Error Handling */}
          {error && (
            <InlineError message={error.message || helperText} fieldID={name} />
          )}
        </FormLayout>
      )}
    />
  );
}
