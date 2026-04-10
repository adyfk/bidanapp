import { createPlatformMetadata } from '@marketplace/web/platform';
import { resolvePlatformContext } from '@marketplace/web/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, platform] = await Promise.all([props.params, resolvePlatformContext('bidan')]);
  return createPlatformMetadata(platform, locale);
}

export default async function BidanLocaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
