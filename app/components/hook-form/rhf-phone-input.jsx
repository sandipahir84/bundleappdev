import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Box, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFPhoneInput({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box {...other}>
          <TextField
            {...field}
            type="tel"
            label="Phone Number"
            fullWidth
            error={!!error}
            helperText={error?.message ?? helperText}
            onChange={(value) => field.onChange(value)} // Update value on change
          />
          {error && (
            <InlineError message={error.message ?? helperText} fieldID={name} />
          )}
        </Box>
      )}
    />
  );
}
