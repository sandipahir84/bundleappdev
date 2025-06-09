// app/routes/your-endpoint.ts (or .tsx if used in a page component)
import { json, type LoaderFunction } from "@remix-run/node";
import prisma from "../db.server";

export const loader: LoaderFunction = async ({ request }) => {
  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const origin = url?.origin

      const bundles = await prisma.mix_match_bundle.findMany();

      // Convert BigInt IDs to strings for serialization
      const serializedBundles = bundles.map((bundle: any) => ({
        ...bundle,
        id: typeof bundle.id === "bigint" ? bundle.id.toString() : bundle.id,
        media: bundle?.media ? `${origin}/uploads/mixmatch/${bundle?.media}` : null
      }));

      return json(
        { message: "Fetched successfully", data: serializedBundles },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*", // 🔥 Allow all domains (or set your frontend domain)
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // 🔥 Allow methods
            "Access-Control-Allow-Headers": "Content-Type", // 🔥 Allow headers
          },
        }
      );
    } catch (error) {
      console.error("Error fetching bundles:", error);
      return json({ message: "Error fetching bundles" }, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  return json({ message: "Method Not Allowed" }, {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
};

