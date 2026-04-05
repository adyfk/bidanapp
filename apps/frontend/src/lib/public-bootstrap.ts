import { cache } from 'react';
import type { PublicBootstrapData } from '@/lib/public-bootstrap-source';
import { fetchPublicBootstrapData } from '@/lib/public-bootstrap-source';

export type {
  PublicBootstrapData,
  PublicHomeFeedData,
} from '@/lib/public-bootstrap-source';

export const getPublicBootstrapData = cache(async (): Promise<PublicBootstrapData> => await fetchPublicBootstrapData());
