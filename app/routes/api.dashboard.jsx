import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { STATUS_CODES, STATUS_CODES_MESSAGES } from "../constants/status-codes";

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
                shopId: session.shop,
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
