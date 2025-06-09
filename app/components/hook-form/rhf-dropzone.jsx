import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Box,
  DropZone,
  InlineError,
  Thumbnail,
  Button,
  Text,
  Checkbox,
} from '@shopify/polaris';

export function RHFDropzone({
  name,
  multiple = true,
  helperText,
  slotProps,
  ...other
}) {
  const { control, setValue } = useFormContext();
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={multiple ? [] : null}
      render={({ field, fieldState: { error } }) => {

        const files = multiple
          ? Array.isArray(field.value)
            ? field.value
            : []
          : field.value
            ? [field.value]
            : [];

        const handleDrop = (acceptedFiles) => {
          const value = multiple
            ? [...files, ...acceptedFiles]
            : acceptedFiles[0];
          setValue(name, value, { shouldValidate: true });
        };

        const toggleCheckbox = (index) => {
          setSelectedIndexes((prev) =>
            prev.includes(index)
              ? prev.filter((i) => i !== index)
              : [...prev, index]
          );
        };

        const handleRemoveSelected = () => {
          const updated = files.filter((_, i) => !selectedIndexes.includes(i));
          setValue(name, multiple ? updated : null, { shouldValidate: true });
          setSelectedIndexes([]);
        };

        return (
          <Box {...slotProps?.wrapper}>
            <DropZone
              onDrop={handleDrop}
              accept="image/*"
              allowMultiple={multiple}
              {...other}
            >
              <div style={{ textAlign: 'center', padding: '12px' }}>
                {(!multiple && files.length > 0) ? (
                  <>
                    <img
                      src={files[0] instanceof File ? URL.createObjectURL(files[0]) : files[0]}
                      alt="uploaded-image"
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '200px',
                        borderRadius: '8px',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    }}>
                      Click or Drag to Replace
                    </div>
                  </>
                ) : (
                  <>
                    <Text variant="bodyMd">
                      Drag & drop images or click to upload
                    </Text>
                    {helperText && (
                      <Text variant="bodySm" color="subdued">
                        {helperText}
                      </Text>
                    )}
                  </>
                )}
              </div>
            </DropZone>

            {multiple && files.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '16px',
                  }}
                >
                  {files.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: selectedIndexes.includes(index)
                          ? '2px solid #bf0711'
                          : '1px solid #dfe3e8',
                        padding: '8px',
                        borderRadius: '6px',
                        width: '120px',
                      }}
                    >
                      <Thumbnail
                        size="large"
                        source={file instanceof File ? URL.createObjectURL(file) : file}
                        alt={`upload-${index}`}
                      />
                      <Text variant="bodySm" truncate>
                        {file.name}
                      </Text>
                      {multiple && (
                        <Checkbox
                          label="Select"
                          checked={selectedIndexes.includes(index)}
                          onChange={() => toggleCheckbox(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {multiple && selectedIndexes.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <Button destructive onClick={handleRemoveSelected}>
                      Remove Selected
                    </Button>
                  </div>
                )}
              </>
            )}

            {error && <InlineError message={error.message} fieldID={name} />}
          </Box>
        );
      }}
    />
  );
}
