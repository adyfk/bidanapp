import settingsData from "@/data/simulation/settings.json";
import type { AppSettingsFile } from "@/types/settings";

const settings = settingsData as AppSettingsFile;

type PublicEnv = {
  siteUrl: string;
  apiBaseUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

export const PUBLIC_ENV: PublicEnv = loadPublicEnv();

function loadPublicEnv(): PublicEnv {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return {
    siteUrl: readUrl("NEXT_PUBLIC_SITE_URL", settings.branding.baseUrl),
    apiBaseUrl: readUrl("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1"),
    nodeEnv,
    isDevelopment: nodeEnv === "development",
    isProduction: nodeEnv === "production",
  };
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

function normalizeUrl(value: URL): string {
  const path = value.pathname === "/" ? "" : value.pathname.replace(/\/$/, "");
  return `${value.origin}${path}${value.search}${value.hash}`;
}
