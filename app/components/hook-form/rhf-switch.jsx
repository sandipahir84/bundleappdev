import { Controller, useFormContext } from 'react-hook-form';
import { Switch, FormLayout, InlineError, Label } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFSwitch({ name, helperText, label, slotProps, sx, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout {...slotProps?.wrapper}>
          <Switch
            label={label}
            checked={field.value}
            onChange={(checked) => field.onChange(checked)}
            id={name}
            {...slotProps?.switch}
            {...other}
          />

          {error && (
            <InlineError message={error.message || helperText} fieldID={name} />
          )}
        </FormLayout>
      )}
    />
  );
}

export function RHFMultiSwitch({ name, label, options, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  const getSelected = (selectedItems, item) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormLayout {...slotProps?.wrapper}>
          {label && <Label>{label}</Label>}

          <FormLayout.Group>
            {options.map((option) => (
              <div key={option.value}>
                <Switch
                  label={option.label}
                  checked={field.value.includes(option.value)}
                  onChange={() => field.onChange(getSelected(field.value, option.value))}
                  id={`${option.value}-switch`}
                  {...slotProps?.switch}
                />
              </div>
            ))}
          </FormLayout.Group>

          {error && (
            <InlineError message={error.message || helperText} fieldID={name} />
          )}
        </FormLayout>
      )}
    />
  );
}
