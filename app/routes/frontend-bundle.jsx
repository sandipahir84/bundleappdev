// app/routes/bundles.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Text } from '@shopify/polaris';
import prisma from "../db.server";


// Server-side data fetching
export const loader = async () => {
  try {
    const bundles = await prisma.mix_match_bundle.findMany();

    const serializedBundles = bundles.map((bundle) => ({
      ...bundle,
      id: typeof bundle.id === "bigint" ? bundle.id.toString() : bundle.id,
    }));

    return json({ message: "Fetched successfully", data: serializedBundles });
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return json({ message: "Error fetching bundles", data: [] }, { status: 500 });
  }
};

// Client-side component rendering
export default function BundlesRoute() {
  const { data } = useLoaderData();

  return (
    <>
      {data.length > 0 ? (
        data.map((bundle) => (
          <Card key={bundle.id} sectioned>
            <Text as="h2" variant="bodyMd">
              {bundle.name || `Bundle ID: ${bundle.id}`}
            </Text>
          </Card>
        ))
      ) : (
        <Card sectioned>
          <Text as="p">No bundles found.</Text>
        </Card>
      )}
    </>
  );
}
