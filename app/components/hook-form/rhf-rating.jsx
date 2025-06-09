import { Controller, useFormContext } from 'react-hook-form';
import { ChoiceList, InlineError, FormLayout, Box } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFRating({
  name,
  helperText,
  slotProps,
  options = [1, 2, 3, 4, 5], // Default rating options
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout {...slotProps?.wrapper}>
          {/* Rating Label */}
          {slotProps?.label && (
            <Box paddingBlockEnd="2">
              <p style={{ fontWeight: 600 }}>{slotProps?.label}</p>
            </Box>
          )}

          <ChoiceList
            {...field}
            title={slotProps?.title || 'Rating'}
            choices={options.map((option) => ({
              label: `${option} Star${option > 1 ? 's' : ''}`,
              value: option.toString(),
            }))}
            selected={field.value ? [field.value.toString()] : []}
            onChange={(value) => field.onChange(Number(value[0]))}
            {...other}
          />

          {/* Display Error Message */}
          {error && (
            <InlineError message={error.message || helperText} fieldID={name} />
          )}
        </FormLayout>
      )}
    />
  );
}
