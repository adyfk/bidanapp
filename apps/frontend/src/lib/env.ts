import { APP_BRANDING } from '@/lib/app-config';

type PublicEnv = {
  appVersion: string;
  siteUrl: string;
  apiBaseUrl: string;
  adminConsoleEnabled: boolean;
  adminStudioEnabled: boolean;
  webPushPublicKey: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

type PublicEnvKey =
  | 'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED'
  | 'NEXT_PUBLIC_ADMIN_STUDIO_ENABLED'
  | 'NEXT_PUBLIC_API_BASE_URL'
  | 'NEXT_PUBLIC_APP_VERSION'
  | 'NEXT_PUBLIC_SITE_URL'
  | 'NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY';

export const PUBLIC_ENV: PublicEnv = loadPublicEnv();

function loadPublicEnv(): PublicEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const adminConsoleEnabled = readBool('NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED', nodeEnv !== 'production');
  const adminStudioEnabled =
    adminConsoleEnabled && readBool('NEXT_PUBLIC_ADMIN_STUDIO_ENABLED', nodeEnv !== 'production');

  return {
    appVersion: readText('NEXT_PUBLIC_APP_VERSION', 'dev'),
    siteUrl: readUrl('NEXT_PUBLIC_SITE_URL', APP_BRANDING.baseUrl),
    apiBaseUrl: readUrl('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080/api/v1'),
    adminConsoleEnabled,
    adminStudioEnabled,
    webPushPublicKey: readOptionalText('NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY'),
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

function readOptionalText(name: string): string {
  return (readPublicEnvValue(name as PublicEnvKey, '') ?? '').trim();
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
    case 'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED':
      return process.env.NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED ?? fallback;
    case 'NEXT_PUBLIC_ADMIN_STUDIO_ENABLED':
      return process.env.NEXT_PUBLIC_ADMIN_STUDIO_ENABLED ?? fallback;
    case 'NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY':
      return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? fallback;
    default:
      return fallback;
  }
}
