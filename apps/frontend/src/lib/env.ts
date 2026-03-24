import type { ProfessionalPortalDataSource } from '@/features/professional-portal/lib/contracts';
import { APP_BRANDING } from '@/lib/app-config';

type PublicEnv = {
  appVersion: string;
  siteUrl: string;
  apiBaseUrl: string;
  professionalPortalDataSource: ProfessionalPortalDataSource;
  appStateDataSource: 'local' | 'api';
  adminConsoleEnabled: boolean;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

type PublicEnvKey =
  | 'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED'
  | 'NEXT_PUBLIC_API_BASE_URL'
  | 'NEXT_PUBLIC_APP_STATE_DATA_SOURCE'
  | 'NEXT_PUBLIC_APP_VERSION'
  | 'NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE'
  | 'NEXT_PUBLIC_SITE_URL';

export const PUBLIC_ENV: PublicEnv = loadPublicEnv();

function loadPublicEnv(): PublicEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    appVersion: readText('NEXT_PUBLIC_APP_VERSION', 'dev'),
    siteUrl: readUrl('NEXT_PUBLIC_SITE_URL', APP_BRANDING.baseUrl),
    apiBaseUrl: readUrl('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080/api/v1'),
    professionalPortalDataSource: readEnum('NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE', ['local', 'api'], 'api'),
    appStateDataSource: readEnum('NEXT_PUBLIC_APP_STATE_DATA_SOURCE', ['local', 'api'], 'api'),
    adminConsoleEnabled: readBool('NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED', nodeEnv !== 'production'),
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  };
}

function readText(name: string, fallback: string): string {
  const rawValue = (readPublicEnvValue(name as PublicEnvKey, fallback) ?? fallback).trim();
  if (rawValue.length === 0) {
    throw new Error(`${name} must not be empty.`);
  }

  return rawValue;
}

function readUrl(name: string, fallback: string): string {
  const rawValue = readPublicEnvValue(name as PublicEnvKey, fallback) ?? fallback;

  try {
    const parsed = new URL(rawValue);
    return normalizeUrl(parsed);
  } catch {
    throw new Error(`${name} must be a valid absolute URL. Received: ${rawValue}`);
  }
}

function readEnum<const T extends string>(name: string, allowedValues: readonly T[], fallback: T): T {
  const rawValue = (readPublicEnvValue(name as PublicEnvKey, fallback) ?? fallback).trim() as T;

  if (!allowedValues.includes(rawValue)) {
    throw new Error(`${name} must be one of: ${allowedValues.join(', ')}. Received: ${rawValue}`);
  }

  return rawValue;
}

function readBool(name: string, fallback: boolean): boolean {
  const rawValue = readPublicEnvValue(name as PublicEnvKey);
  if (typeof rawValue === 'undefined') {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(`${name} must be either true or false. Received: ${rawValue}`);
}

function normalizeUrl(value: URL): string {
  const path = value.pathname === '/' ? '' : value.pathname.replace(/\/$/, '');
  return `${value.origin}${path}${value.search}${value.hash}`;
}

function readPublicEnvValue(name: PublicEnvKey, fallback?: string): string | undefined {
  switch (name) {
    case 'NEXT_PUBLIC_APP_VERSION':
      return process.env.NEXT_PUBLIC_APP_VERSION ?? fallback;
    case 'NEXT_PUBLIC_SITE_URL':
      return process.env.NEXT_PUBLIC_SITE_URL ?? fallback;
    case 'NEXT_PUBLIC_API_BASE_URL':
      return process.env.NEXT_PUBLIC_API_BASE_URL ?? fallback;
    case 'NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE':
      return process.env.NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE ?? fallback;
    case 'NEXT_PUBLIC_APP_STATE_DATA_SOURCE':
      return process.env.NEXT_PUBLIC_APP_STATE_DATA_SOURCE ?? fallback;
    case 'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED':
      return process.env.NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED ?? fallback;
    default:
      return fallback;
  }
}
