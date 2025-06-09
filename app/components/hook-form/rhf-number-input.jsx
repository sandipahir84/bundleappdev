import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFNumberInput({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <TextField
            {...field}
            type="number" // Ensures the field accepts numeric input
            error={!!error} // Display error if there is one
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
            {...other} // Pass any other props to TextField
          />
          {/* Inline error display */}
          {/* {error && <InlineError message={error?.message ?? helperText} />} */}
        </div>
      )}
    />
  );
}
