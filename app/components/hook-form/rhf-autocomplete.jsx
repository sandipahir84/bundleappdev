import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Select, Option, FormLayout, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFAutocomplete({ name, label, helperText, placeholder, options, ...other }) {
  const { control, setValue } = useFormContext();
  const [selectedOption, setSelectedOption] = useState('');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout>
          <Select
            {...field}
            id={`rhf-autocomplete-${name}`}
            label={label}
            value={selectedOption || field.value}
            onChange={(newValue) => {
              setValue(name, newValue, { shouldValidate: true });
              setSelectedOption(newValue);
            }}
            placeholder={placeholder}
            error={!!error}
            {...other}
          >
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          {error && <InlineError message={error?.message ?? helperText} />}
        </FormLayout>
      )}
    />
  );
}
