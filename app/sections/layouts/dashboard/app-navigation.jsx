import { Navigation } from "@shopify/polaris";
import { useLocation } from "@remix-run/react";

export default function AppNavigation() {
  const location = useLocation();

  const navigationItems = [
    { label: "Home", url: "/app" },
    { label: "Products", url: "/app/products/list" },
    { label: "Additional", url: "/app/additional" },
  ];

  return (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={navigationItems.map((item) => ({
          ...item,
          selected: location.pathname === item.url || location.pathname.startsWith(item.url + "/"),
        }))}
      />
    </Navigation>
  );
}
