import { Page, Spinner } from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';
import MixMatchForm from '../mix-match-form';
import { paths } from '../../../../routes/paths';

export function MixMatchEditView({ currentMixMatch, applicationUrl, mediaUrl }) {
  const navigate = useNavigate();
  return (
    <Page
      title="Edit MixMatch"
      backAction={{
        content: 'MixMatchs',
        onAction: () => navigate(paths.dashboard.mixmatch.list),
      }}
    >
      {!currentMixMatch ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spinner accessibilityLabel="Loading MixMatch" size="large" />
        </div>
      ) : (
        <MixMatchForm currentMixMatch={currentMixMatch} applicationUrl={applicationUrl} mediaUrl={mediaUrl} />
      )}
    </Page>
  );
}
