import { resolvePlatformContext } from '@marketplace/web';
import { redirect } from 'next/navigation';

export default async function BidanRootPage() {
  const platform = await resolvePlatformContext('bidan');
  redirect(`/${platform.defaultLocale}`);
}
