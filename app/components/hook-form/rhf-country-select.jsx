import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Select, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFCountrySelect({ name, helperText, countryOptions = [], ...other }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <Select
            id={`${name}-rhf-country-select`}
            label="Country"
            value={field.value || ''}
            onChange={(newValue) => setValue(name, newValue, { shouldValidate: true })}
            error={!!error}
            {...other}
          >
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </Select>

          {error && <InlineError message={error?.message ?? helperText} />}
        </div>
      )}
    />
  );
}
