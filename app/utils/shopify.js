import axios from 'axios';

export async function createDiscountAutomaticApp(graphqlVariables, session) {
  const SHOPIFY_API_URL = `https://${session.shop}/admin/api/2025-04/graphql.json`;
  const ACCESS_TOKEN = session?.accessToken;

  const query = `
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          automaticAppDiscount {
            discountId
            status
            title
            updatedAt
            startsAt
            endsAt
            discountClass
            createdAt,
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
            asyncUsageCount
          }
          userErrors {
            code
            field
            message
          }
        }
      }
    `;

  try {
    const response = await axios.post(
      SHOPIFY_API_URL,
      { query, variables: graphqlVariables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN,
        }
      }
    );

    if (response.data?.errors) {
      console.error("❌ Shopify API GraphQL errors:", response.data.errors);
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error calling Shopify API:", error.response?.data || error.message);
    throw new Error('Failed to create automatic discount on Shopify');
  }
}

export async function getDiscountAutomaticApp(graphqlVariables, session) {
  const SHOPIFY_API_URL = `https://${session.shop}/admin/api/2025-04/graphql.json`;
  const ACCESS_TOKEN = session?.accessToken;

  const query = `
    query getDiscountNode($id: ID!) {
      shop {
        name
      }
      discountNode(id: $id) {
        id
        metafield(namespace: "bundle-discount", key: "product-discount-bundleapp") {
          id
          value
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      SHOPIFY_API_URL,
      {
        query, variables: {
          id: graphqlVariables?.id
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN,
        }
      }
    );

    if (response.data?.errors) {
      console.error("❌ Shopify API GraphQL errors:", response.data.errors);
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error calling Shopify API:", error.response?.data || error.message);
    throw new Error('Failed to fetch discount automatic app info from Shopify');
  }
}

export async function updateDiscountAutomaticApp(graphqlVariables, session) {
  const SHOPIFY_API_URL = `https://${session.shop}/admin/api/2025-04/graphql.json`;
  const ACCESS_TOKEN = session?.accessToken;

  const query = `
    mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
      discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
        automaticAppDiscount {
          discountId
          title
          startsAt
          endsAt
          status
          appDiscountType {
            appKey
            functionId
          }
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      SHOPIFY_API_URL,
      { query, variables: graphqlVariables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN,
        }
      }
    );

    if (response.data?.errors) {
      console.error("❌ Shopify API GraphQL errors:", response.data.errors);
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error calling Shopify API:", error.response?.data || error.message);
    throw new Error('Failed to create automatic discount on Shopify');
  }
}

/**
 * Deletes multiple automatic discounts using the Shopify Admin API
 * @param {Object} session - The session object with shop and accessToken
 * @param {Array<string>} discountIds - Array of discount IDs to delete
 * @returns {Promise<Array<Object>>} - List of delete responses
 */
export async function deleteMultipleDiscountsAutomaticApp(session, discountIds) {
  const SHOPIFY_API_URL = `https://${session.shop}/admin/api/2025-04/graphql.json`;
  const ACCESS_TOKEN = session?.accessToken;

  const query = `
      mutation discountAutomaticDelete($id: ID!) {
        discountAutomaticDelete(id: $id) {
          deletedAutomaticDiscountId
          userErrors {
            field
            code
            message
          }
        }
      }
    `;

  const results = [];

  for (const discountId of discountIds) {
    try {
      const response = await axios.post(
        SHOPIFY_API_URL,
        { query, variables: { id: discountId } },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ACCESS_TOKEN,
          },
        }
      );

      if (response.data?.errors) {
        console.error(`❌ Shopify API GraphQL errors for ID ${discountId}:`, response.data.errors);
      }

      results.push({
        discountId,
        success: true,
        data: response.data,
      });

    } catch (error) {
      console.error(`❌ Error deleting discount ID ${discountId}:`, error.response?.data || error.message);

      results.push({
        discountId,
        success: false,
        error: error.response?.data || error.message,
      });
    }
  }

  return results;
}

export async function discountAutomaticBasicCreate(session, graphqlVariables) {
  const SHOPIFY_API_URL = `https://${session.shop}/admin/api/2025-04/graphql.json`;
  const ACCESS_TOKEN = session?.accessToken;

  // Define the GraphQL query for creating a discount
  const query = `
    mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
        automaticDiscountNode {
          id
          automaticDiscount {
            ... on DiscountAutomaticBasic {
              title
              startsAt
              combinesWith { productDiscounts shippingDiscounts orderDiscounts }
              minimumRequirement {
                ... on DiscountMinimumSubtotal {
                  greaterThanOrEqualToSubtotal {
                    amount
                    currencyCode
                  }
                }
              }
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
                items {
                  ... on AllDiscountItems {
                    allItems
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          code
          message
        }
      }
    }
  `;

  try {
    // Make the POST request to Shopify GraphQL API
    const response = await axios.post(
      SHOPIFY_API_URL,
      { query, variables: graphqlVariables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN,
        },
      }
    );

    if (response.data?.errors) {
      console.error("❌ Shopify API GraphQL errors:", response.data.errors);
    }
    return response.data;
  } catch (error) {
    // Handle errors from the request
    console.error(`❌ Error creating discount:`, error.response?.data || error.message);
    throw new Error(`Failed to create automatic discount on Shopify ${error?.message}`);
  }
}
