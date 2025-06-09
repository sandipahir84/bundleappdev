import { Box, Button, ButtonGroup, Label, Layout } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function FormActions({ disabled, onReset, loading, ...other }) {
  return (
    <ButtonGroup {...other}>
      <Button
        disabled={disabled}
        onClick={onReset}
        variant="tertiary"
        loading={loading}
      >
        Reset
      </Button>
      <Button
        submit
        variant="primary"
        loading={loading}
      >
        Submit to check
      </Button>
    </ButtonGroup>
  );
}

// ----------------------------------------------------------------------

export function FormGrid({ children, ...other }) {
  return (
    <Layout>
      <Layout.Section oneHalf>{children}</Layout.Section>
    </Layout>
  );
}

// ----------------------------------------------------------------------

export function FieldContainer({ label = 'Field', children, sx, ...other }) {
  return (
    <Box {...other} sx={sx}>
      <Label>{label}</Label>
      {children}
    </Box>
  );
}
