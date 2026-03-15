import createClient from 'openapi-fetch';
import type { components, operations, paths } from './generated/types';

export type BidanappApiClient = ReturnType<typeof createBidanappApiClient>;
export type BidanappComponents = components;
export type BidanappOperations = operations;
export type BidanappPaths = paths;

export function createBidanappApiClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl,
  });
}
