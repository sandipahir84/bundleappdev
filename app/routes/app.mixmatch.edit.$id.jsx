

// ----------------------------------------------------------------------

import { useLoaderData, useParams } from "@remix-run/react";
import { MixMatchEditView } from "../sections/product/mix-match/view";
import { STATUS_CODES, STATUS_CODES_MESSAGES } from "../constants/status-codes";
import prisma from "../db.server";
import { json } from '@remix-run/node';

export async function loader({ request, params }) {
  const { id } = params;

  if (!id) {
    return json(
      {
        message: STATUS_CODES_MESSAGES.warning,
      },
      { status: STATUS_CODES.WARNING }
    );
  }
  const url = new URL(request.url);
  const origin = url?.origin

  const bundle = await prisma.mix_match_bundle.findUnique({
    where: { id: parseInt(id) },
  });

  if (!bundle) {
    return json(
      {
        message: STATUS_CODES_MESSAGES.warning,
      },
      { status: STATUS_CODES.WARNING }
    );
  }
  return json(
    {
      application_url: origin,
      media_url: `${origin}/uploads/mixmatch`,
      message: STATUS_CODES_MESSAGES.fetch,
      data: {
        ...bundle,
        id: String(bundle.id),
      },
    },
    { status: STATUS_CODES.SUCCESS }
  );
}

export default function MixMatchEditPage() {
  const { data: currentMixMatch, application_url: applicationUrl, media_url: mediaUrl } = useLoaderData();
  console.log("currentMixMatch",currentMixMatch);
  return (
    <>
      <MixMatchEditView currentMixMatch={currentMixMatch} applicationUrl={applicationUrl} mediaUrl={mediaUrl} />
    </>
  );
}
