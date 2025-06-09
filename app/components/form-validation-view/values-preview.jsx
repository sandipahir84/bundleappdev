import { useCallback, useState } from 'react';
import {
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Icon,
  InlineGrid,
  InlineStack,
  LegacyCard,
  LegacyStack,
  Scrollable,
  Text,
} from '@shopify/polaris';
import { useFormContext } from 'react-hook-form';
import {
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@shopify/polaris-icons';

const classes = {
  item: 'item',
  key: 'item__key',
  value: 'item__value',
};

export function ValuesPreview({ onCloseDebug }) {
  const { watch, formState } = useFormContext();
  const values = watch();

  const totalValues = Object.keys(values || {}).length;
  const totalErrors = Object.keys(formState.errors || {}).length;

  const [openGroups, setOpenGroups] = useState({
    state: true,
    values: true,
    errors: true,
    dirty: true,
    touched: true,
  });

  const toggleGroup = useCallback((key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const renderGroup = (key, label, children) => {
    const open = openGroups[key];
    const icon = open ? ChevronDownIcon : ChevronRightIcon;

    return (
      <LegacyCard sectioned key={key}>
        <LegacyStack vertical>
          <Button
            onClick={() => toggleGroup(key)}
            ariaExpanded={open}
            ariaControls={`group-${key}`}
            plain
            icon={<Icon source={icon} />}
            textAlign="start"
            fullWidth
          >
            <Text as="span" fontWeight="semibold">
              {label}
            </Text>
          </Button>

          <Collapsible
            open={open}
            id={`group-${key}`}
            transition={{ duration: '300ms', timingFunction: 'ease-in-out' }}
            expandOnPrint
          >
            <Box padding="2">{children}</Box>
          </Collapsible>
        </LegacyStack>
      </LegacyCard>
    );
  };

  return (
    <Box
      padding="4"
      background="bg-surface"
      borderRadius="3"
      shadow
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        width: '320px',
        maxHeight: '100vh',
        backgroundColor: 'var(--p-color-bg-surface)',
        color: 'var(--p-color-text)',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
        borderLeft: '1px solid var(--p-color-border-subdued)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BlockStack gap="200">
        <InlineGrid columns="1fr auto">
          <Text as="h2" variant="headingSm">
            Debug
          </Text>
          <Button
            onClick={onCloseDebug}
            icon={XIcon}
          />
        </InlineGrid>
        <Scrollable style={{ flexGrow: 1 }}>
          {renderGroup(
            'state',
            'State',
            [
              'submitCount',
              'isDirty',
              'isValid',
              'disabled',
              'isLoading',
              'isSubmitted',
              'isSubmitting',
              'isValidating',
              'isSubmitSuccessful',
            ].map((item) => <DisplayItem key={item} label={item} value={JSON.stringify(formState[item], null, 2)} />)
          )}

          {renderGroup(
            'values',
            `Values (${totalValues})`,
            Object.keys(values).map((key) => {
              // const value = values[key];

              return <DisplayItem key={key} label={key} value={parseValue(values, key)} />;
            })
          )}

          {renderGroup(
            'errors',
            `Errors (${totalErrors})`,
            <Text as="span">{JSON.stringify(Object.keys(formState.errors), null, 2)}</Text>
          )}

          {renderGroup(
            'dirty',
            'Dirty Fields',
            <Text as="span">{JSON.stringify(Object.keys(formState.dirtyFields), null, 2)}</Text>
          )}

          {renderGroup(
            'touched',
            'Touched Fields',
            <Text as="span">{JSON.stringify(Object.keys(formState.touchedFields), null, 2)}</Text>
          )}
        </Scrollable>
      </BlockStack>
    </Box>
  );
}

function DisplayItem({ label, value }) {
  let color = 'base';
  if (value === null || value === undefined) color = 'critical';
  if (typeof value === 'number') color = 'highlight';

  return (
    <Box
      display="flex"
      // justifyContent="space-between"
      padding="1"
      background="bg-surface-secondary"
      borderRadius="2"
    // marginBlockEnd="2"
    >
      <Text as="span" fontWeight="semibold">
        {label}:
      </Text>
      <Text as="span" color={color} breakWord>
        {value}
      </Text>
    </Box>
  );
}

function parseValue(values, key) {
  if (values[key] === undefined) {
    return 'undefined';
  }

  if (key === 'singleUpload') {
    return JSON.stringify(values.singleUpload && fileData(values.singleUpload), null, 2);
  }

  if (key === 'media') {
    return JSON.stringify(values.media && fileData(values.media), null, 2);
  }

  if (key === 'multiUpload') {
    // Check if values[key] is an array and not empty, otherwise fallback to an empty array
    return JSON.stringify(
      Array.isArray(values[key]) && values[key].length > 0
        ? values[key].map((file) => fileData(file))
        : (Array.isArray(values[key]) ? [] : [values[key]]).map((file) => fileData(file) || []),
      null,
      2
    );
  }

  return JSON.stringify(values[key], null, 2) || '---';
}
// ----------------------------------------------------------------------

export function fileTypeByUrl(fileUrl) {
  return (fileUrl && fileUrl.split('.').pop()) || '';
}

// ----------------------------------------------------------------------

export function fileNameByUrl(fileUrl) {
  return fileUrl.split('/').pop();
}

// ----------------------------------------------------------------------

export function fileData(file) {
  // From url
  if (typeof file === 'string') {
    return {
      preview: file,
      name: fileNameByUrl(file),
      type: fileTypeByUrl(file),
      size: undefined,
      path: file,
      lastModified: undefined,
      lastModifiedDate: undefined,
    };
  }

  // From file
  return {
    name: file.name,
    size: file.size,
    path: file.path,
    type: file.type,
    preview: file.preview,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
  };
}
