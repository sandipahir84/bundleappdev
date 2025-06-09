import { Controller, useFormContext } from 'react-hook-form';
import { Box, Avatar, DropZone, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function RHFUploadAvatar({ name, slotProps, ...other }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const onDrop = (acceptedFiles) => {
          const value = acceptedFiles[0];

          setValue(name, value, { shouldValidate: true });
        };

        return (
          <Box {...slotProps?.wrapper}>
            <DropZone onDrop={onDrop} accept="image/*" {...other}>
              {field.value ? (
                <Avatar size="large" source={URL.createObjectURL(field.value)} />
              ) : (
                <p>Drag & drop an image or click to upload</p>
              )}
            </DropZone>

            {error && <InlineError message={error?.message} fieldID={name} />}
          </Box>
        );
      }}
    />
  );
}
