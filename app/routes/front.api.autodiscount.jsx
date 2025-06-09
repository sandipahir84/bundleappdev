import { json } from "@remix-run/node";
import prisma from "../db.server";
import { STATUS_CODES, STATUS_CODES_MESSAGES } from "../constants/status-codes";
import { discountAutomaticBasicCreate } from "../utils/shopify";

// Utility function for setting common response headers
const setCorsHeaders = (status) => ({
  status,
  headers: {
    "Access-Control-Allow-Origin": "*", // Adjust the origin if needed for security
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Define allowed HTTP methods
    "Access-Control-Allow-Headers": "Content-Type", // Allowed headers
  },
});

// Utility function to convert BigInt to String for serialization
const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

function generateRandomCouponCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let couponCode = '';
  for (let i = 0; i < 10; i++) {
    couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return couponCode;
}


export const action = async ({ request }) => {
  if (request.method === "POST") {
    try {
      // Parsing the form data
      // const formData = await request.formData();
      // const mixMatchBundleId = formData.get("mix_match_bundle_id");
      // const variants = JSON.parse(formData.get("variants"));
      // const total = formData.get("total");

      const body = await request.json(); // Parses raw JSON body

      const mixMatchBundleId = body.mix_match_bundle_id;
      const variants = body.variants;
      const total = body.total;

      // Check if mix_match_bundle_id is provided
      if (!mixMatchBundleId) {
        return json(
          {
            message: STATUS_CODES_MESSAGES.warning,
          },
          { status: STATUS_CODES.WARNING }
        );
      }

      // Fetch the bundle from the database using the id
      const bundle = await prisma.mix_match_bundle.findUnique({
        where: { id: parseInt(mixMatchBundleId) }, // Ensure it's an integer
      });

      // If bundle is not found
      if (!bundle) {
        return json(
          {
            message: STATUS_CODES_MESSAGES.warning,
          },
          { status: STATUS_CODES.WARNING }
        );
      }

      // Serialize the BigInt values to strings
      // const serializedBundle = serializeBigInt(bundle);

      // const session = {
      //   shop: 'php-app-checkout.myshopify.com',
      //   accessToken: 'shpua_03177c9d3c263a254eeb389564fac5cf',
      // };

      const session = await prisma.session.findFirst({
        where: { shop: process.env.REACT_APP_SHOP_DOMAIN },
      });

      if (!session) {
        return json(
          { error: STATUS_CODES_MESSAGES.warning, message: "Session not found." },
          { status: STATUS_CODES.WARNING }
        );
      }

      // Generate a random coupon code
      const couponCode = generateRandomCouponCode();

      // Get the current date and time (start date)
      const currentDate = new Date();
      const startDate = currentDate.toISOString();

      // Calculate the end date (1 hour after start date)
      const endDate = new Date(currentDate.getTime() + 60 * 60 * 1000).toISOString();

      const title = `Bundleapp - ${bundle?.title} - ${couponCode}`; //PER, FIX, SET
      const discountType = bundle?.discount_type; //PER, FIX, SET
      const discountValue = bundle?.discount_value;

      if (parseFloat(total) < parseFloat(discountValue)) {
        return json(
          {
            message: `Total amount (${total}) is less than the required discount value (${discountValue}). Discount cannot be applied.`,
          },
          setCorsHeaders(STATUS_CODES.ERROR)
        );
      }
      // Base structure for the GraphQL mutation
      let graphqlVariables = {
        automaticBasicDiscount: {
          title, // Random coupon code in title
          startsAt: startDate,
          endsAt: endDate,
          minimumRequirement: {
            subtotal: {
              greaterThanOrEqualToSubtotal: Number((parseFloat(total)).toFixed(2)), // Minimum purchase amount
            },
          },
          customerGets: {
            appliesOnOneTimePurchase: true,
            value: {},
            items: {
              products: {
                productVariantsToAdd: variants
              }
            },
          },
          combinesWith: {
            productDiscounts: true, // Disable combinability with product discounts
            shippingDiscounts: true, // Disable combinability with shipping discounts
            orderDiscounts: true,  // Allow combinability with order discounts
          },
        },
      };

      // Set the discount value based on discountType
      // if (discountType === 'FIX') {
      //   // Fixed amount discount
      //   graphqlVariables.automaticBasicDiscount.customerGets.value.discountAmount = {
      //     amount: parseFloat(discountValue).toFixed(2), // Fixed amount discount
      //     appliesOnEachItem: false,
      //   };
      // } else if (discountType === 'PER') {
      //   // Percentage discount
      //   graphqlVariables.automaticBasicDiscount.customerGets.value.percentage = Number(parseFloat(discountValue).toFixed(2));
      // } else if (discountType === 'SET') {
      //   // Custom discount logic for SET type (if needed)
      //   // This part should be customized as per your logic for SET type discounts
      //   // For example, you might have additional logic or structure to handle SET
      //   graphqlVariables.automaticBasicDiscount.customerGets.value.discountAmount = {
      //     amount: parseFloat(discountValue).toFixed(2), // Set the custom discount value
      //     appliesOnEachItem: false,
      //   };
      // }

      graphqlVariables.automaticBasicDiscount.customerGets.value.discountAmount = {
        amount: Number((parseFloat(total) - parseFloat(discountValue)).toFixed(2)), // Set the custom discount value
        appliesOnEachItem: false,
      };

      const shopifyApiResponse = await discountAutomaticBasicCreate(session, graphqlVariables);

      const userErrors = shopifyApiResponse?.errors?.map(error => error.message).join(', ') ||
        shopifyApiResponse?.data?.discountAutomaticBasicCreate?.userErrors?.map(err => err.message).join(', ') ||
        null;

      if (userErrors) {
        return json(
          {
            message: userErrors || "Shopify API error",
            data: shopifyApiResponse,
            error: shopifyApiResponse?.[0]?.error || "Unknown error",
            graphqlVariables
          },
          setCorsHeaders(STATUS_CODES.ERROR)
        );
      }
      const shopifyData = shopifyApiResponse?.[0]?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.automaticDiscount;
      // If found, return the bundle data
      return json(
        { message: "Fetched successfully", data: title, shopifyApiResponse: shopifyData },
        setCorsHeaders(STATUS_CODES.SUCCESS)
      );
    } catch (error) {
      // Logging the error and sending a response with the error details
      console.error("Error fetching bundles:", error);
      return json(
        { message: "Error fetching bundles", error: error.message },
        setCorsHeaders(STATUS_CODES.SERVER_ERROR)
      );
    }
  }

  // If method is not POST, return Method Not Allowed with a more informative message
  return json(
    { message: "Method Not Allowed. Please use POST method." },
    setCorsHeaders(STATUS_CODES.FORBIDDEN)
  );
};
