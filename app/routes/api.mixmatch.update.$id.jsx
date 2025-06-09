import { json } from '@remix-run/node';
import prisma from '../db.server';
import { STATUS_CODES, STATUS_CODES_MESSAGES } from '../constants/status-codes';
// import { createDiscountAutomaticApp, getDiscountAutomaticApp, updateDiscountAutomaticApp } from '../utils/shopify';
import { uploadFiles } from '../utils/file-upload';
// import { authenticate } from '../shopify.server';

/**
 * Update an existing mixmatch product
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} JSON response with updated mixmatch product
 */
export async function action({ request, params }) {
  console.log("inn");
  try {
    // const { session } = await authenticate.admin(request);
    // // Check if shop exists
    // if (!session) {
    //   return json(
    //     {
    //       error: STATUS_CODES_MESSAGES.unauthorised,
    //       message: "No shop found"
    //     },
    //     { status: STATUS_CODES.UNAUTHORIZED }
    //   );
    // }

    const { id } = params;
    // const id = form.get('id');
    if (!id) {
      return json(
        { message: 'Mixmatch ID is required for update.' },
        { status: STATUS_CODES.WARNING }
      );
    }
    const form = await request.formData();
    const sectionsRaw = form.get('sections');
    const sections = sectionsRaw ? JSON.parse(sectionsRaw) : [];

    const collectionSections = sections
      .filter(section => section.type === 'collection')
      .flatMap(section => section.items.map(item => item.id));

    const mediaFiles = form.getAll('media');
    const origin = new URL(request.url).origin;
    const mediaUrls = await uploadFiles(mediaFiles, 'mixmatch', origin);

    let uploadMedia = null;
    if (mediaUrls?.length > 0) {
      uploadMedia = mediaUrls?.[0].fileName;
    } else {
      const existingBundleMedia = await prisma.mix_match_bundle.findUnique({
        where: { id: parseInt(id) },
        select: { media: true },
      });
      uploadMedia = existingBundleMedia?.media;
    }

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

    const sessionData = await prisma.session.findFirst({
      where: { shop: process.env.REACT_APP_SHOP_DOMAIN },
    });

    if (!sessionData) {
      return json(
        { error: STATUS_CODES_MESSAGES.warning, message: "Session not found." },
        { status: STATUS_CODES.WARNING }
      );
    }

    const existingBundle = await prisma.mix_match_bundle.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBundle) {
      return json(
        { error: STATUS_CODES_MESSAGES.warning, message: "Mixmatch bundle not found." },
        { status: STATUS_CODES.WARNING }
      );
    }

    let shopifyApiResponse = null;
    // let discountId = existingBundle.discountId;
    let discountId = null;

    // if (discountId) {
    //   // --- Updating Existing Discount ---

    //   // Fetch discount from Shopify
    //   const fetchResponse = await getDiscountAutomaticApp({ id: discountId }, sessionData);
    //   const metafieldId = fetchResponse?.data?.discountNode?.metafield?.id;

    //   if (!metafieldId) {
    //     return json(
    //       { error: STATUS_CODES_MESSAGES.warning, message: "Discount Node not found." },
    //       { status: STATUS_CODES.WARNING }
    //     );
    //   }

    //   // Prepare update variables
    //   const updateDiscountVariables = {
    //     id: discountId,
    //     automaticAppDiscount: {
    //       metafields: [
    //         {
    //           id: metafieldId,
    //           value: JSON.stringify(json_table),
    //         },
    //       ],
    //       title: data.title,
    //     },
    //   };
    //   // console.log(updateDiscountVariables, updateDiscountVariables?.automaticAppDiscount?.metafields);

    //   // Update the discount in Shopify
    //   const updateResponse = await updateDiscountAutomaticApp(updateDiscountVariables, sessionData);

    //   // Handle user errors
    //   const userErrors = [
    //     ...(updateResponse?.errors?.map(error => error.message) || []),
    //     ...(updateResponse?.data?.discountAutomaticAppUpdate?.userErrors?.map(err => err.message) || []),
    //   ].join(', ') || null;

    //   if (userErrors) {
    //     return json(
    //       { error: STATUS_CODES_MESSAGES.warning, message: userErrors },
    //       { status: STATUS_CODES.WARNING }
    //     );
    //   }
    // } else {
    //   const graphqlVariables = {
    //     automaticAppDiscount: {
    //       combinesWith: {
    //         orderDiscounts: true,
    //         productDiscounts: true,
    //         shippingDiscounts: true,
    //       },
    //       functionId: process.env.REACT_APP_FUNCTION_ID,
    //       metafields: [
    //         {
    //           key: "product-discount-bundleapp",
    //           namespace: "bundle-discount",
    //           type: "json",
    //           value: JSON.stringify(json_table),
    //         },
    //       ],
    //       startsAt: new Date().toISOString(),
    //       title: data.title,
    //     },
    //     id: discountId
    //   };
    //   // 👇 Create new Shopify Discount
    //   shopifyApiResponse = await createDiscountAutomaticApp(graphqlVariables, sessionData);

    //   const userErrors = shopifyApiResponse?.errors?.map(error => error.message).join(', ') ||
    //     shopifyApiResponse?.data?.discountAutomaticAppCreate?.userErrors?.map(err => err.message).join(', ');

    //   discountId = shopifyApiResponse?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;

    //   if (!discountId) {
    //     return json(
    //       { error: STATUS_CODES_MESSAGES.warning, message: userErrors || "Failed to create discount in Shopify." },
    //       { status: STATUS_CODES.WARNING }
    //     );
    //   }
    // }
    const updatedMixMatch = await prisma.mix_match_bundle.update({
      where: { id: parseInt(id) },
      data: {
        ...dataAll,
        discountId,
      },
    });

    return json(
      {
        message: STATUS_CODES_MESSAGES.update,
        data: { ...updatedMixMatch, id: updatedMixMatch.id.toString() },
        shopifyApiResponse,
      },
      { status: STATUS_CODES.SUCCESS }
    );
  } catch (error) {
    console.error("❌ Error updating MixMatch:", error);
    return json(
      {
        error: STATUS_CODES_MESSAGES.server_error,
        message: error?.message || "An unexpected error occurred",
      },
      { status: STATUS_CODES.SERVER_ERROR }
    );
  }
}
