import type { BidanappApiClient, BidanappComponents } from '../client';

export type PublicDirectoryCatalog = BidanappComponents['schemas']['CatalogData'];
export type PublicDirectoryProfessional = BidanappComponents['schemas']['Professional'];

export async function fetchCatalog(client: BidanappApiClient): Promise<PublicDirectoryCatalog> {
  const result = await client.GET('/catalog');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load public directory catalog');
  }

  return result.data.data;
}

export async function fetchProfessionalBySlug(
  client: BidanappApiClient,
  slug: string,
): Promise<PublicDirectoryProfessional> {
  const result = await client.GET('/professionals/{slug}', {
    params: {
      path: {
        slug,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load public professional profile');
  }

  return result.data.data;
}
