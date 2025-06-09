import { json } from '@remix-run/node';
import prisma from '../db.server';
import { STATUS_CODES, STATUS_CODES_MESSAGES } from '../constants/status-codes';

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || undefined;

    const skip = (page - 1) * limit;

    const where = {
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { short_description: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
      ...(status ? { status } : {}),
    };

    const total = await prisma.mix_match_bundle.count({ where });

    const bundles = await prisma.mix_match_bundle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const formattedBundles = bundles.map(bundle => ({
      ...bundle,
      id: String(bundle.id),
    }));

    console.log(`✅ Found ${formattedBundles.length} mixmatch products`);

    const lastPage = Math.ceil(total / limit);
    const from = total === 0 ? 0 : skip + 1;
    const to = Math.min(skip + limit, total);

    const origin = new URL(request.url).origin;

    return json({
      application_url: origin,
      message: STATUS_CODES_MESSAGES.fetch,
      data: formattedBundles,        // 👈 Laravel uses `data`
      current_page: page,
      per_page: limit,
      total,
      last_page: lastPage,
      from,
      to
    }, { status: STATUS_CODES.SUCCESS });

  } catch (error) {
    console.error(error);
    return json(
      {
        error: STATUS_CODES_MESSAGES.server_error,
        message: error.message
      },
      { status: STATUS_CODES.SERVER_ERROR }
    );
  }
}
