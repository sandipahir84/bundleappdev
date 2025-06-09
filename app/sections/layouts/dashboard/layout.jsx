import { Frame, Page, Layout, BlockStack, Toast } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "@remix-run/react";
import AppTopBar from "./app-top-bar";
import AppNavigation from "./app-navigation";
import useToast from "../../../components/toast/use-toast";
// import { useInitAppBridge } from "../../../lib/use-init-app-bridge";

export default function DashboardLayout() {
  // useInitAppBridge();

  const { toastActive, toastContent, toastAction, hideToast } = useToast();
  const location = useLocation();
  const [mobileNavActive, setMobileNavActive] = useState(false);

  const toggleMobileNavigation = useCallback(
    () => setMobileNavActive((prev) => !prev),
    []
  );

  const topBarMarkup = <AppTopBar onToggleNavigation={toggleMobileNavigation} />;
  const navigationMarkup = <AppNavigation />;

  const logo = {
    topBarSource:
      'https://cdn.shopify.com/s/files/1/2376/3301/files/Shopify_Secondary_Inverted.png',
    width: 86,
    url: '#',
    accessibilityLabel: 'Shopify',
  };

  return (
    <Frame
      topBar={topBarMarkup}
    // logo={logo}
    // navigation={navigationMarkup}
    // showMobileNavigation={mobileNavActive}
    // onNavigationDismiss={toggleMobileNavigation}
    >
      <Page fullWidth>
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Outlet />
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>

      {toastActive && toastContent && (
        <Toast
          content={toastContent}
          onDismiss={hideToast}
          duration={5000}
          {...(typeof toastAction === "function" && {
            action: {
              content: "Undo",
              onAction: toastAction,
            },
          })}
        />
      )}
    </Frame>
  );
}
