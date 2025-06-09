import { json } from '@remix-run/node';
import prisma from '../db.server';
import { STATUS_CODES, STATUS_CODES_MESSAGES } from '../constants/status-codes';
import { deleteMultipleDiscountsAutomaticApp } from '../utils/shopify';

/**
 * Delete one or more mixmatch products
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} JSON response confirming deletion
 */
export async function action({ request }) {
  try {
    const body = await request.json();
    const ids = body.ids;

    // Validate required fields
    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      return json(
        { message: 'Mixmatch product IDs are required' },
        { status: STATUS_CODES.WARNING }
      );
    }

    const idArray = Array.isArray(ids) ? ids : [ids];
    const bigIntIds = idArray.map(id => parseInt(id));

    // Find bundles with discountId
    const bundles = await prisma.mix_match_bundle.findMany({
      where: { id: { in: bigIntIds } },
      select: { discountId: true },
    });

    const discountIds = bundles
      .map(bundle => bundle.discountId)
      .filter(id => id !== null);

    let shopifyApiResponse = null;
    let deletedMixMatch = null;

    const session = await prisma.session.findFirst({
      where: { shop: process.env.REACT_APP_SHOP_DOMAIN },
    });

    // if (session && discountIds.length > 0) {
    if (session) {
      // 1. Try to delete discounts on Shopify
      deletedMixMatch = await prisma.mix_match_bundle.deleteMany({
        where: { id: { in: bigIntIds } },
      });

      // shopifyApiResponse = await deleteMultipleDiscountsAutomaticApp(session, discountIds);

      // // 2. Check if Shopify delete was successful (you can customize based on your deleteMultipleDiscountsAutomaticApp)
      // const hasErrors = shopifyApiResponse?.some(apiRes => apiRes?.data?.errors?.length > 0 || apiRes?.data?.userErrors?.length > 0);

      // if (!hasErrors) {
      //   // ✅ Shopify deletion success, now delete from DB
      //   deletedMixMatch = await prisma.mix_match_bundle.deleteMany({
      //     where: { id: { in: bigIntIds } },
      //   });
      // } else {
      //   // ❌ Shopify deletion had errors — don't delete DB
      //   return json(
      //     {
      //       error: STATUS_CODES_MESSAGES.warning,
      //       message: "Failed to delete discounts from Shopify. Database not updated.",
      //       shopifyApiResponse,
      //     },
      //     { status: STATUS_CODES.WARNING }
      //   );
      // }
    } else {
      return json(
        {
          error: STATUS_CODES_MESSAGES.warning,
          message: "Session not found or no discounts to delete.",
        },
        { status: STATUS_CODES.WARNING }
      );
    }

    if (deletedMixMatch?.count > 0) {
      return json(
        {
          message: `${deletedMixMatch.count} bundle(s) deleted successfully`,
          data: {
            deletedIds: bigIntIds.map(id => id.toString()),
          },
          shopifyApiResponse,
        },
        { status: STATUS_CODES.SUCCESS }
      );
    }

    return json(
      {
        error: STATUS_CODES_MESSAGES.warning,
        message: "Nothing deleted. Please try again.",
      },
      { status: STATUS_CODES.WARNING }
    );
  } catch (error) {
    console.error('❌ Error deleting MixMatch bundle(s):', error);
    return json(
      {
        error: STATUS_CODES_MESSAGES.server_error,
        message: error?.message || 'Something went wrong',
      },
      { status: STATUS_CODES.SERVER_ERROR }
    );
  }
}
