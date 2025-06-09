import { TextContainer, InlineError } from '@shopify/polaris';

// ----------------------------------------------------------------------

export function HelperText({ sx, helperText, errorMessage, disableGutters, ...other }) {
  if (errorMessage || helperText) {
    return (
      <TextContainer
        {...other}
        style={{
          marginLeft: disableGutters ? 0 : '14px',
          marginRight: disableGutters ? 0 : '14px',
          ...sx,
        }}
      >
        {errorMessage ? (
          <InlineError message={errorMessage} />
        ) : (
          <p>{helperText}</p>
        )}
      </TextContainer>
    );
  }

  return null;
}
