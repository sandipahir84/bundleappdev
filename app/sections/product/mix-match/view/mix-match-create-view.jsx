import { Page } from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';
import MixMatchForm from '../mix-match-form';
import { paths } from '../../../../routes/paths';

export function MixMatchCreateView() {
  const navigate = useNavigate();

  // const breadcrumbs = [
  //   { content: 'Dashboard', onAction: () => navigate(paths.dashboard.root) },
  //   { content: 'MixMatchs', onAction: () => navigate(paths.dashboard.products.list) },
  // ];

  return (
    <Page
      fullWidth={false}
      title="Create MixMatch"
      backAction={{ content: 'Mix & Match Bundles', onAction: () => navigate(paths.dashboard.mixmatch.list) }}
    >
      <MixMatchForm />
    </Page>
  );
}
