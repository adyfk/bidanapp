import {
  getServicePlatformConfig,
  resolveServicePlatformByHost,
  type ServicePlatformConfig,
  type ServicePlatformId,
} from '@marketplace/platform-config';
import { headers } from 'next/headers';

export async function resolvePlatformContext(defaultPlatformId: ServicePlatformId): Promise<ServicePlatformConfig> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost ?? requestHeaders.get('host') ?? '';
  return resolveServicePlatformByHost(host) ?? getServicePlatformConfig(defaultPlatformId);
}
