import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker, TextField, InlineError } from '@shopify/polaris';
import dayjs from 'dayjs';
// import { formatPatterns } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function RHFDatePicker({ name, slotProps, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <DatePicker
            {...field}
            selected={field.value ? dayjs(field.value).toDate() : null}
            onChange={(newValue) => field.onChange(dayjs(newValue).format())}
            label="Select Date"
            error={!!error}
            helperText={error?.message ?? helperText}
            {...other}
            {...slotProps}
          />

          {error && <InlineError message={error?.message ?? helperText} />}
        </div>
      )}
    />
  );
}
