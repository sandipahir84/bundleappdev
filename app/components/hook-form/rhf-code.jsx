import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, InlineStack, Box, InlineError } from '@shopify/polaris';

export function RHFCode({
  name,
  slotProps,
  helperText,
  maxSize = '3rem',
  placeholder = '-',
  length = 6,
  ...other
}) {
  const { control } = useFormContext();

  // Render individual OTP input fields
  const renderOtpInputs = (field, error) => {
    return Array.from({ length }).map((_, index) => (
      <Box key={index} minWidth={maxSize}>
        <TextField
          autoComplete="off"
          placeholder={placeholder}
          maxLength={1}
          error={!!error}
          value={field.value ? field.value[index] || '' : ''}
          onChange={(value) => {
            const currentValue = field.value || '';
            const newValue =
              currentValue.substring(0, index) + value + currentValue.substring(index + 1);
            field.onChange(newValue);
          }}
          autoFocus={index === 0}
          {...slotProps?.textfield}
        />
      </Box>
    ));
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box {...slotProps?.wrapper}>
          <InlineStack gap="200">
            {renderOtpInputs(field, error)}
          </InlineStack>

          {error && (
            <Box paddingBlockStart="2">
              <InlineError message={error?.message ?? helperText} fieldID={name} />
            </Box>
          )}
        </Box>
      )}
    />
  );
}
