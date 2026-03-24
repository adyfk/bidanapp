#!/usr/bin/env node

import process from 'node:process';
import { parseEnvFile, resolveEnvFile } from './lib/env-file.mjs';

const DEFAULT_ADMIN_PASSWORD_HASH = '$2a$12$VUpiMPsu6djn6JDj.a0a8OACtyvGtGninz4/ZwTsPGGQOK0CL./1C';
const PRODUCTION_LIKE_ENVS = new Set(['staging', 'production']);
const VALID_APP_ENVS = new Set(['development', 'staging', 'production', 'test']);
const VALID_LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const VALID_LOG_FORMATS = new Set(['text', 'json']);
const VALID_SAME_SITE = new Set(['lax', 'strict', 'none']);
const VALID_DATA_SOURCES = new Set(['api', 'local']);
const VALID_FOCUS_AREAS = new Set(['catalog', 'ops', 'reviews', 'support']);

main();

function main() {
  const envFileArg = process.argv[2];
  if (!envFileArg) {
    printUsage();
    process.exit(1);
  }

  const envFile = resolveEnvFile(envFileArg);
  const env = parseEnvFile(envFile);
  const issues = [];
  const warnings = [];

  const appEnv = requireValue(env, 'APP_ENV', issues);
  const projectName = requireValue(env, 'COMPOSE_PROJECT_NAME', issues);
  const appVersion = requireValue(env, 'APP_VERSION', issues);
  const backendImage = requireValue(env, 'BACKEND_IMAGE', issues);
  const frontendImage = requireValue(env, 'FRONTEND_IMAGE', issues);
  const publicSiteUrl = readURL(env, 'PUBLIC_SITE_URL', issues);
  const publicApiBaseUrl = readURL(env, 'PUBLIC_API_BASE_URL', issues);
  const databaseUrl = readURL(env, 'DATABASE_URL', issues);
  const redisUrl = readURL(env, 'REDIS_URL', issues);
  const backendPort = readPort(env, 'BACKEND_PORT', issues);
  const frontendPort = readPort(env, 'FRONTEND_PORT', issues);
  const corsOrigins = readOrigins(env, 'CORS_ALLOWED_ORIGINS', issues);
  const authCookieDomain = readOptionalText(env, 'AUTH_COOKIE_DOMAIN');
  const authCookiePath = requireValue(env, 'AUTH_COOKIE_PATH', issues);
  const authCookieSecure = readBoolean(env, 'AUTH_COOKIE_SECURE', issues);
  const authCookieSameSite = readEnum(env, 'AUTH_COOKIE_SAME_SITE', VALID_SAME_SITE, issues);
  const logLevel = readEnum(env, 'LOG_LEVEL', VALID_LOG_LEVELS, issues);
  const logFormat = readEnum(env, 'LOG_FORMAT', VALID_LOG_FORMATS, issues);
  const portalDataSource = readEnum(env, 'NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE', VALID_DATA_SOURCES, issues);
  const appStateDataSource = readEnum(env, 'NEXT_PUBLIC_APP_STATE_DATA_SOURCE', VALID_DATA_SOURCES, issues);
  const adminConsoleEnabled = readBoolean(env, 'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED', issues);

  requireValue(env, 'POSTGRES_DB', issues);
  readPort(env, 'POSTGRES_PORT', issues);
  requireValue(env, 'POSTGRES_USER', issues);
  requireValue(env, 'POSTGRES_PASSWORD', issues);
  requireValue(env, 'ADMIN_AUTH_COOKIE_NAME', issues);
  requireValue(env, 'CUSTOMER_AUTH_COOKIE_NAME', issues);
  requireValue(env, 'PROFESSIONAL_AUTH_COOKIE_NAME', issues);
  requireValue(env, 'AUTH_RATE_LIMIT_WINDOW', issues);
  requireValue(env, 'AUTH_RATE_LIMIT_MAX_ATTEMPTS', issues);
  requireValue(env, 'ADMIN_AUTH_SESSION_TTL', issues);
  requireValue(env, 'CUSTOMER_AUTH_SESSION_TTL', issues);
  requireValue(env, 'PROFESSIONAL_AUTH_SESSION_TTL', issues);

  if (!VALID_APP_ENVS.has(appEnv)) {
    issues.push(`APP_ENV must be one of ${Array.from(VALID_APP_ENVS).join(', ')} (got ${quote(appEnv)})`);
  }

  if (backendPort !== null && frontendPort !== null && backendPort === frontendPort) {
    issues.push('BACKEND_PORT and FRONTEND_PORT must not use the same port');
  }

  if (publicApiBaseUrl && !publicApiBaseUrl.pathname.endsWith('/api/v1')) {
    issues.push(`PUBLIC_API_BASE_URL must end with /api/v1 (got ${quote(publicApiBaseUrl.toString())})`);
  }

  if (publicSiteUrl && corsOrigins.length > 0 && !corsOrigins.includes(normalizeOrigin(publicSiteUrl))) {
    issues.push(
      `CORS_ALLOWED_ORIGINS must include the frontend public origin ${quote(normalizeOrigin(publicSiteUrl))}`,
    );
  }

  if (authCookiePath && !authCookiePath.startsWith('/')) {
    issues.push(`AUTH_COOKIE_PATH must start with / (got ${quote(authCookiePath)})`);
  }

  if (authCookieSameSite === 'none' && authCookieSecure !== true) {
    issues.push('AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE=none');
  }

  if (portalDataSource === 'local') {
    issues.push('NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE must be api for deploy environments');
  }

  if (appStateDataSource === 'local') {
    issues.push('NEXT_PUBLIC_APP_STATE_DATA_SOURCE must be api for deploy environments');
  }

  if (PRODUCTION_LIKE_ENVS.has(appEnv)) {
    assertHTTPS(publicSiteUrl, 'PUBLIC_SITE_URL', issues);
    assertHTTPS(publicApiBaseUrl, 'PUBLIC_API_BASE_URL', issues);

    for (const origin of corsOrigins) {
      if (!origin.startsWith('https://')) {
        issues.push(`CORS_ALLOWED_ORIGINS must use https in ${appEnv} (got ${quote(origin)})`);
      }
    }

    if (authCookieSecure !== true) {
      issues.push(`AUTH_COOKIE_SECURE must be true in ${appEnv}`);
    }

    if (!authCookieDomain) {
      issues.push(`AUTH_COOKIE_DOMAIN must not be empty in ${appEnv}`);
    }

    const sensitiveValues = [
      ['PUBLIC_SITE_URL', env.PUBLIC_SITE_URL],
      ['PUBLIC_API_BASE_URL', env.PUBLIC_API_BASE_URL],
      ['POSTGRES_PASSWORD', env.POSTGRES_PASSWORD],
      ['AUTH_COOKIE_DOMAIN', env.AUTH_COOKIE_DOMAIN],
    ];
    for (const [name, value] of sensitiveValues) {
      if (looksLikePlaceholder(value)) {
        issues.push(`${name} still contains a placeholder-looking value`);
      }
    }
  }

  if (databaseUrl && !['postgres', 'postgresql'].includes(databaseUrl.protocol.replace(':', ''))) {
    issues.push(`DATABASE_URL must use postgres:// or postgresql:// (got ${quote(databaseUrl.protocol)})`);
  }

  if (redisUrl && !['redis', 'rediss'].includes(redisUrl.protocol.replace(':', ''))) {
    issues.push(`REDIS_URL must use redis:// or rediss:// (got ${quote(redisUrl.protocol)})`);
  }

  const credentialsRaw = env.ADMIN_CONSOLE_CREDENTIALS_JSON?.trim() ?? '';
  if (PRODUCTION_LIKE_ENVS.has(appEnv) && credentialsRaw === '') {
    issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON is required in ${appEnv}`);
  }

  if (credentialsRaw !== '') {
    validateAdminCredentials(credentialsRaw, issues);
  } else if (appEnv === 'development') {
    warnings.push('ADMIN_CONSOLE_CREDENTIALS_JSON is empty; backend development defaults will be used');
  }

  if (!projectName || !appVersion || !backendImage || !frontendImage || !logLevel || !logFormat) {
    // The specific missing-key errors are already recorded above.
  }

  if (issues.length > 0) {
    process.stderr.write(`deploy env validation failed for ${envFile}\n`);
    for (const issue of issues) {
      process.stderr.write(`- ${issue}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(`deploy env ok: ${envFile}\n`);
  process.stdout.write(`- APP_ENV=${appEnv}\n`);
  process.stdout.write(`- PUBLIC_SITE_URL=${env.PUBLIC_SITE_URL}\n`);
  process.stdout.write(`- PUBLIC_API_BASE_URL=${env.PUBLIC_API_BASE_URL}\n`);
  process.stdout.write(`- admin console enabled=${String(adminConsoleEnabled)}\n`);
  if (warnings.length > 0) {
    for (const warning of warnings) {
      process.stdout.write(`warning: ${warning}\n`);
    }
  }
}

function printUsage() {
  process.stderr.write('usage: node ./scripts/deploy/check-env.mjs <env-file>\n');
}

function requireValue(env, key, issues) {
  const value = env[key]?.trim() ?? '';
  if (value === '') {
    issues.push(`${key} must not be empty`);
    return '';
  }

  return value;
}

function readOptionalText(env, key) {
  return env[key]?.trim() ?? '';
}

function readPort(env, key, issues) {
  const value = requireValue(env, key, issues);
  if (value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    issues.push(`${key} must be a valid port between 1 and 65535 (got ${quote(value)})`);
    return null;
  }

  return parsed;
}

function readBoolean(env, key, issues) {
  const value = requireValue(env, key, issues).toLowerCase();
  if (value === '') {
    return null;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  issues.push(`${key} must be either true or false (got ${quote(env[key])})`);
  return null;
}

function readEnum(env, key, allowedValues, issues) {
  const value = requireValue(env, key, issues).toLowerCase();
  if (value === '') {
    return '';
  }

  if (!allowedValues.has(value)) {
    issues.push(`${key} must be one of ${Array.from(allowedValues).join(', ')} (got ${quote(env[key])})`);
    return '';
  }

  return value;
}

function readURL(env, key, issues) {
  const rawValue = requireValue(env, key, issues);
  if (rawValue === '') {
    return null;
  }

  try {
    return new URL(rawValue);
  } catch {
    issues.push(`${key} must be a valid absolute URL (got ${quote(rawValue)})`);
    return null;
  }
}

function readOrigins(env, key, issues) {
  const rawValue = requireValue(env, key, issues);
  if (rawValue === '') {
    return [];
  }

  const origins = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    issues.push(`${key} must contain at least one origin`);
    return [];
  }

  for (const origin of origins) {
    if (origin === '*') {
      issues.push(`${key} must not include *`);
      continue;
    }

    try {
      const normalized = new URL(origin);
      if (normalized.pathname !== '/' && normalized.pathname !== '') {
        issues.push(`${key} must not include paths (got ${quote(origin)})`);
      }
    } catch {
      issues.push(`${key} must contain valid origins (got ${quote(origin)})`);
    }
  }

  return origins.map((origin) => {
    try {
      return normalizeOrigin(new URL(origin));
    } catch {
      return origin;
    }
  });
}

function normalizeOrigin(url) {
  return `${url.protocol}//${url.host}`;
}

function assertHTTPS(url, key, issues) {
  if (!url) {
    return;
  }

  if (url.protocol !== 'https:') {
    issues.push(`${key} must use https (got ${quote(url.toString())})`);
  }
}

function validateAdminCredentials(rawValue, issues) {
  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON must be valid JSON: ${error.message}`);
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    issues.push('ADMIN_CONSOLE_CREDENTIALS_JSON must contain at least one credential');
    return;
  }

  const adminIds = new Set();
  const emails = new Set();

  for (const [index, credential] of parsed.entries()) {
    const adminId = String(credential?.adminId ?? '').trim();
    const email = String(credential?.email ?? '')
      .trim()
      .toLowerCase();
    const passwordHash = String(credential?.passwordHash ?? '').trim();
    const focusArea = String(credential?.focusArea ?? '').trim();

    if (adminId === '') {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].adminId must not be empty`);
    } else if (adminIds.has(adminId)) {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].adminId must be unique (got ${quote(adminId)})`);
    } else {
      adminIds.add(adminId);
    }

    if (email === '') {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].email must not be empty`);
    } else if (emails.has(email)) {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].email must be unique (got ${quote(email)})`);
    } else {
      emails.add(email);
    }

    if (passwordHash === '') {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].passwordHash must not be empty`);
    } else if (passwordHash === DEFAULT_ADMIN_PASSWORD_HASH) {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].passwordHash must not use the development default`);
    } else if (looksLikePlaceholder(passwordHash)) {
      issues.push(`ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].passwordHash still looks like a placeholder`);
    }

    if (!VALID_FOCUS_AREAS.has(focusArea)) {
      issues.push(
        `ADMIN_CONSOLE_CREDENTIALS_JSON[${index}].focusArea must be one of ${Array.from(VALID_FOCUS_AREAS).join(', ')}`,
      );
    }
  }
}

function looksLikePlaceholder(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (normalized === '') {
    return true;
  }

  return (
    normalized.includes('replace_with') ||
    normalized.includes('replace-with') ||
    normalized.includes('change-me') ||
    normalized.includes('example.com')
  );
}

function quote(value) {
  return `"${value}"`;
}
