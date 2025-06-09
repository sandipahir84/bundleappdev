import { Controller, useFormContext } from 'react-hook-form';
import {
  RadioButton,
  RadioButtonGroup,
  FormLayout,
  InlineError,
  Box
} from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFRadioGroup({
  name,
  label,
  options,
  helperText,
  slotProps,
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout {...slotProps?.wrapper}>
          {label && (
            <Box paddingBlockEnd="2">
              <p style={{ fontWeight: 600 }}>{label}</p>
            </Box>
          )}

          <RadioButtonGroup
            {...field}
            name={name}
            {...other}
            value={field.value}
            onChange={field.onChange}
          >
            {options.map((option) => (
              <RadioButton
                key={option.value}
                value={option.value}
                label={option.label}
                id={`${name}-radio-${option.value}`}
                {...slotProps?.radio}
              />
            ))}
          </RadioButtonGroup>

          {error && (
            <InlineError
              message={error.message || helperText}
              fieldID={name}
            />
          )}
        </FormLayout>
      )}
    />
  );
}
