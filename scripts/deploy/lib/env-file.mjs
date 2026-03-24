import fs from 'node:fs';
import path from 'node:path';

export function resolveEnvFile(rawPath) {
  if (!rawPath) {
    throw new Error('env file path is required');
  }

  const resolved = path.resolve(process.cwd(), rawPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`env file not found: ${resolved}`);
  }

  return resolved;
}

export function parseEnvFile(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    env[key] = stripQuotes(rawValue);
  }

  return env;
}

function stripQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
    return value.slice(1, -1);
  }

  return value;
}
