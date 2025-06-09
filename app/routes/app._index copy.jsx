import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Box,
  Button,
  Grid,
  Icon,
  Badge,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import {
  ProductListIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { paths } from "./paths";
import { STATUS_CODES, STATUS_CODES_MESSAGES } from "../constants/status-codes";
import prisma from "../db.server";
// import { useEffect } from "react";

/**
 * Dashboard API endpoint
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} JSON response with dashboard stats
 */
export async function loader({ request }) {
  try {
    // Authenticate the request
    const { session } = await authenticate.admin(request);

    // Check if shop exists
    if (!session) {
      return json(
        {
          error: STATUS_CODES_MESSAGES.unauthorised,
          message: "No shop found"
        },
        { status: STATUS_CODES.UNAUTHORIZED }
      );
    }

    // Fetch mix match bundle count
    const mixMatchBundle = await prisma.mix_match_bundle.count({
      where: {
        status: 'active' // Only count active bundles
      }
    });

    // Return the stats data
    return json({
      message: STATUS_CODES_MESSAGES.fetch,
      data: {
        stats: {
          products: 0, // Default value since products count is commented out
          bundles: {
            mixMatchBundle
          }
        }
      }
    }, { status: STATUS_CODES.SUCCESS });

  } catch (error) {
    console.error("[Dashboard] Error in loader:", error);
    return json(
      {
        error: STATUS_CODES_MESSAGES.server_error,
        message: error.message
      },
      { status: STATUS_CODES.SERVER_ERROR }
    );
  }
}

export default function Index() {
  const { data } = useLoaderData();
  // const navigate = useNavigate();
  const stats = data?.stats;

  // useEffect(() => {
  //   // Redirect immediately on load
  //   navigate("/app/mixmatch/list");
  // }, [navigate]);

  const quickActions = [
    {
      title: "Mix Match Bundles",
      icon: ProductListIcon,
      count: stats?.bundles?.mixMatchBundle ?? 0,
      url: paths.dashboard.mixmatch.list,
      description: "Manage your Mix Match Bundles",
    },
  ];

  return (
    <Page
      title="Dashboard"
      subtitle="Welcome to your store dashboard"
    >
      <Layout>
        <Layout.Section>
          <Grid gap="4">
            {quickActions.map((action) => (
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }} key={action.title}>
                <Card>
                  <Box padding="5">
                    <BlockStack gap="4">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="3" blockAlign="center">
                          <Box
                            background="bg-surface-secondary"
                            borderRadius="base"
                            padding="3"
                          >
                            <Icon source={action.icon} color="base" />
                          </Box>
                          <BlockStack gap="1">
                            <Text variant="headingMd" as="h3" fontWeight="bold">
                              {action.title}
                            </Text>
                            {action.count !== undefined && (
                              <Badge status="success" size="small">
                                {action.count} items
                              </Badge>
                            )}
                          </BlockStack>
                        </InlineStack>
                      </InlineStack>
                      <Text variant="bodyMd" as="p" color="subdued">
                        {action.description}
                      </Text>
                      <Button
                        url={action.url}
                        size="medium"
                        fullWidth
                        variant="primary"
                      >
                        View {action.title}
                      </Button>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>
            ))}
          </Grid>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
