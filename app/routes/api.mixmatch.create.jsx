import { json } from '@remix-run/node';
import prisma from '../db.server';
import { STATUS_CODES, STATUS_CODES_MESSAGES } from '../constants/status-codes';
// import { createDiscountAutomaticApp } from '../utils/shopify';
import { uploadFiles } from '../utils/file-upload';

/**
 * Create a new mixmatch product
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} JSON response with created mixmatch product
 */
export async function action({ request }) {
  try {
    const form = await request.formData();

    // Parse sections
    const sectionsRaw = form.get('sections');
    const sections = sectionsRaw ? JSON.parse(sectionsRaw) : [];

    // Get collection section IDs
    const collectionSections = sections
      .filter(section => section.type === 'collection')
      .flatMap(section => section.items.map(item => item.id));

    // Handle media uploads
    const mediaFiles = form.getAll('media');
    const origin = new URL(request.url).origin;
    const mediaUrls = await uploadFiles(mediaFiles, 'mixmatch', origin);
    let uploadMedia = null;
    if (mediaUrls?.length > 0) {
      uploadMedia = mediaUrls?.[0].fileName;
    }
    // Prepare common data
    const data = {
      title: form.get('title') || '',
      discount_type: form.get('discount_type') || '',
      discount_value: parseInt(form.get('discount_value'), 10) || 0,
      totalqty: parseInt(form.get('totalqty')) || 0,
      short_description: form.get('short_description') || '',
      description: form.get('description') || '',
      status: form.get('status') || 'active',
      sections,
      media: uploadMedia,
      start_datetime: form.get('start_datetime') ? new Date(form.get('start_datetime')) : null,
      end_datetime: form.get('end_datetime') ? new Date(form.get('end_datetime')) : null,
    };

    const json_table = {
      ...data,
      collectionSections: collectionSections.length > 0 ? collectionSections : undefined,
    };

    const dataAll = {
      ...data,
      json_table,
    };

    // Find the session
    const session = await prisma.session.findFirst({
      where: { shop: process.env.REACT_APP_SHOP_DOMAIN },
    });

    if (!session) {
      return json(
        { error: STATUS_CODES_MESSAGES.warning, message: "Session not found." },
        { status: STATUS_CODES.WARNING }
      );
    }

    // Prepare Shopify GraphQL variables
    // const graphqlVariables = {
    //   automaticAppDiscount: {
    //     combinesWith: {
    //       orderDiscounts: true,
    //       productDiscounts: true,
    //       shippingDiscounts: true,
    //     },
    //     functionId: process.env.REACT_APP_FUNCTION_ID,
    //     metafields: [
    //       {
    //         key: "product-discount-bundleapp",
    //         namespace: "bundle-discount",
    //         type: "json",
    //         value: JSON.stringify(json_table),
    //       },
    //     ],
    //     startsAt: new Date().toISOString(),
    //     title: data.title,
    //   },
    // };

    // // Create discount in Shopify
    // const shopifyApiResponse = await createDiscountAutomaticApp(graphqlVariables, session);

    // // console.log("shopifyApiResponse", JSON.stringify(shopifyApiResponse));

    // const userErrors = shopifyApiResponse?.errors?.map(error => error.message).join(', ') ||
    //   shopifyApiResponse?.data?.discountAutomaticAppCreate?.userErrors?.map(err => err.message).join(', ') || null;

    // const discountId = shopifyApiResponse?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;

    // if (!discountId) {
    //   return json(
    //     {
    //       error: STATUS_CODES_MESSAGES.warning,
    //       message: userErrors || "Failed to create discount in Shopify.",
    //     },
    //     { status: STATUS_CODES.WARNING }
    //   );
    // }
    const discountId = null;
    // Save to database
    const newMixMatch = await prisma.mix_match_bundle.create({
      data: {
        ...dataAll,
        discountId,
      },
    });

    return json(
      {
        message: STATUS_CODES_MESSAGES.create,
        data: { ...newMixMatch, id: newMixMatch.id.toString() }
      },
      { status: STATUS_CODES.SUCCESS }
    );

  } catch (error) {
    console.error("❌ Error creating MixMatch:", error);
    return json(
      {
        error: STATUS_CODES_MESSAGES.server_error,
        message: error?.message || "An unexpected error occurred",
      },
      { status: STATUS_CODES.SERVER_ERROR }
    );
  }
}
