import type { ProfessionalPortalDataSource } from '@/features/professional-portal/lib/contracts';
import { APP_BRANDING } from '@/lib/app-config';

type PublicEnv = {
  appVersion: string;
  siteUrl: string;
  apiBaseUrl: string;
  professionalPortalDataSource: ProfessionalPortalDataSource;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

export const PUBLIC_ENV: PublicEnv = loadPublicEnv();

function loadPublicEnv(): PublicEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    appVersion: readText('NEXT_PUBLIC_APP_VERSION', 'dev'),
    siteUrl: readUrl('NEXT_PUBLIC_SITE_URL', APP_BRANDING.baseUrl),
    apiBaseUrl: readUrl('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080/api/v1'),
    professionalPortalDataSource: readEnum('NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE', ['local', 'api'], 'local'),
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  };
}

function readText(name: string, fallback: string): string {
  const rawValue = (process.env[name] ?? fallback).trim();
  if (rawValue.length === 0) {
    throw new Error(`${name} must not be empty.`);
  }

  return rawValue;
}

function readUrl(name: string, fallback: string): string {
  const rawValue = process.env[name] ?? fallback;

  try {
    const parsed = new URL(rawValue);
    return normalizeUrl(parsed);
  } catch {
    throw new Error(`${name} must be a valid absolute URL. Received: ${rawValue}`);
  }
}

function readEnum<const T extends string>(name: string, allowedValues: readonly T[], fallback: T): T {
  const rawValue = (process.env[name] ?? fallback).trim() as T;

  if (!allowedValues.includes(rawValue)) {
    throw new Error(`${name} must be one of: ${allowedValues.join(', ')}. Received: ${rawValue}`);
  }

  return rawValue;
}

function normalizeUrl(value: URL): string {
  const path = value.pathname === '/' ? '' : value.pathname.replace(/\/$/, '');
  return `${value.origin}${path}${value.search}${value.hash}`;
}
