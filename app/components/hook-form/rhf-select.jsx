import { Controller, useFormContext } from 'react-hook-form';
import { Select, InlineError, ChoiceList } from '@shopify/polaris';

export function RHFSelect({ name, label, options, helperText, placeholder, ...props }) {
  const { control } = useFormContext();

  const polarisOptions = options.map(opt => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <>
          <Select
            label={label}
            options={polarisOptions}
            placeholder={placeholder}
            value={field.value}
            onChange={field.onChange}
            error={error?.message}
            {...props}
          />
          {helperText && !error?.message && (
            <div style={{ marginTop: 4, color: '#6d7175', fontSize: 13 }}>{helperText}</div>
          )}
        </>
      )}
    />
  );
}

export function RHFMultiSelect({ name, label, options, helperText, ...props }) {
  const { control } = useFormContext();

  const choices = options.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <>
          <ChoiceList
            title={label}
            choices={choices}
            selected={field.value || []}
            onChange={field.onChange}
            allowMultiple
            {...props}
          />
          {error?.message && (
            <InlineError message={error.message} fieldID={name} />
          )}
          {helperText && !error?.message && (
            <div style={{ marginTop: 4, color: '#6d7175', fontSize: 13 }}>{helperText}</div>
          )}
        </>
      )}
    />
  );
}
