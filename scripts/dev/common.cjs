#!/usr/bin/env node

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const readline = require('node:readline');
const { spawn, spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const localPostgresContainerName = 'bidanapp-postgres';
const platformManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/platform-manifest.json'), 'utf8'));
const primaryServicePlatformId = platformManifest?.platforms?.[0]?.id || 'bidan';

const localOrigins = ['http://bidan.lvh.me:3002', 'http://admin.lvh.me:3005'];

const demoCredentials = {
  admin: {
    email: 'rani@ops.bidanapp.id',
    password: 'AdminDemo#2026',
  },
  approvedProfessional: {
    phone: '+628111111002',
    password: 'BidanDemo#2026',
  },
  customer: {
    phone: '+628111111001',
    password: 'BidanDemo#2026',
  },
  submittedProfessional: {
    phone: '+628111111003',
    password: 'BidanDemo#2026',
  },
};

const allReservedServices = [
  {
    id: 'backend',
    label: 'Backend',
    port: 8080,
    cwd: path.join(repoRoot, 'apps/backend'),
    script: 'dev:backend',
    readyChecks: [
      {
        label: 'backend health',
        run: () => checkHTTPStatus('http://api.lvh.me:8080/api/v1/health', 200),
      },
    ],
  },
  {
    id: 'bidan',
    label: 'Bidan',
    port: 3002,
    cwd: path.join(repoRoot, 'apps/bidan'),
    script: 'dev:bidan',
    readyChecks: [
      {
        label: 'bidan root redirect',
        run: () => checkRedirect('http://bidan.lvh.me:3002/', '/id'),
      },
      {
        label: 'bidan locale page',
        run: () => checkHTTPStatus('http://bidan.lvh.me:3002/id', 200),
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    port: 3005,
    cwd: path.join(repoRoot, 'apps/admin'),
    script: 'dev:admin',
    readyChecks: [
      {
        label: 'admin root redirect',
        run: () => checkRedirect('http://admin.lvh.me:3005/', '/overview'),
      },
      {
        label: 'admin login page',
        run: () => checkHTTPStatus('http://admin.lvh.me:3005/login', 200),
      },
    ],
  },
];

const managedDevServices = allReservedServices.filter((service) => ['backend', 'bidan', 'admin'].includes(service.id));

const backendRequiredKeys = [
  'DATABASE_URL',
  'REDIS_URL',
  'CORS_ALLOWED_ORIGINS',
  'AUTH_COOKIE_DOMAIN',
  'AUTH_COOKIE_PATH',
  'VIEWER_AUTH_COOKIE_NAME',
  'ADMIN_AUTH_COOKIE_NAME',
  'PAYMENT_PROVIDER',
  'ASSET_STORAGE_DIR',
];

const frontendApps = [
  { id: 'bidan', dir: path.join(repoRoot, 'apps/bidan') },
  { id: 'admin', dir: path.join(repoRoot, 'apps/admin') },
];

function info(message) {
  console.log(`[dev] ${message}`);
}

function warn(message) {
  console.warn(`[warn] ${message}`);
}

function error(message) {
  console.error(`[error] ${message}`);
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareVersions(actual, minimum) {
  const actualParts = normalizeVersion(actual);
  const minimumParts = normalizeVersion(minimum);
  const length = Math.max(actualParts.length, minimumParts.length);

  for (let index = 0; index < length; index += 1) {
    const left = actualParts[index] ?? 0;
    const right = minimumParts[index] ?? 0;
    if (left > right) {
      return 1;
    }
    if (left < right) {
      return -1;
    }
  }

  return 0;
}

function normalizeVersion(raw) {
  const sanitized = String(raw)
    .trim()
    .replace(/^[^0-9]+/, '');
  return sanitized
    .split(/[.-]/)
    .filter((segment) => /^\d+$/.test(segment))
    .map((segment) => Number.parseInt(segment, 10));
}

function runCommandSync(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: options.env ?? process.env,
    stdio: options.capture === false ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ?? null,
  };
}

function runNpmSync(args, options = {}) {
  return runCommandSync(npmCommand, args, options);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      filePath,
      lines: [],
      pairs: [],
      map: new Map(),
    };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const pairs = [];
  const map = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const value = parseEnvValue(match[2] ?? '');
    pairs.push({ key, value });
    map.set(key, value);
  }

  return {
    exists: true,
    filePath,
    content,
    lines,
    pairs,
    map,
  };
}

function parseEnvValue(raw) {
  const value = String(raw).trim();
  if (value.length >= 2) {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function syncEnvFile(targetPath, examplePath, options = {}) {
  const writeMissing = options.writeMissing === true;
  const exampleDoc = parseEnvFile(examplePath);
  if (!exampleDoc.exists) {
    throw new Error(`missing env example: ${path.relative(repoRoot, examplePath)}`);
  }

  const targetDoc = parseEnvFile(targetPath);
  if (!targetDoc.exists) {
    if (!writeMissing) {
      return {
        filePath: targetPath,
        created: false,
        missing: true,
        addedKeys: [],
        unknownKeys: [],
        targetDoc,
        exampleDoc,
      };
    }

    fs.copyFileSync(examplePath, targetPath);
    const createdDoc = parseEnvFile(targetPath);
    return {
      filePath: targetPath,
      created: true,
      missing: false,
      addedKeys: createdDoc.pairs.map((pair) => pair.key),
      unknownKeys: [],
      targetDoc: createdDoc,
      exampleDoc,
    };
  }

  const addedKeys = [];
  if (writeMissing) {
    const missingPairs = exampleDoc.pairs.filter((pair) => !targetDoc.map.has(pair.key));
    if (missingPairs.length > 0) {
      let nextContent = targetDoc.content ?? fs.readFileSync(targetPath, 'utf8');
      if (nextContent !== '' && !nextContent.endsWith('\n')) {
        nextContent += '\n';
      }
      if (nextContent !== '' && nextContent.trim() !== '') {
        nextContent += '\n';
      }

      for (const pair of missingPairs) {
        nextContent += `${pair.key}=${formatEnvValue(pair.value)}\n`;
        addedKeys.push(pair.key);
      }

      fs.writeFileSync(targetPath, nextContent, 'utf8');
    }
  }

  const refreshedDoc = parseEnvFile(targetPath);
  const exampleKeys = new Set(exampleDoc.pairs.map((pair) => pair.key));
  const unknownKeys = refreshedDoc.pairs.map((pair) => pair.key).filter((key) => !exampleKeys.has(key));

  return {
    filePath: targetPath,
    created: false,
    missing: false,
    addedKeys,
    unknownKeys,
    targetDoc: refreshedDoc,
    exampleDoc,
  };
}

function formatEnvValue(value) {
  if (value === '') {
    return '';
  }
  if (/[\s'"]/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function syncRuntimeEnvFiles(options = {}) {
  const backend = syncEnvFile(
    path.join(repoRoot, 'apps/backend/.env'),
    path.join(repoRoot, 'apps/backend/.env.example'),
    options,
  );

  const frontends = frontendApps.map((app) =>
    syncEnvFile(path.join(app.dir, '.env'), path.join(app.dir, '.env.example'), options),
  );

  return { backend, frontends };
}

function validateRuntimeEnv(syncResult) {
  const errors = [];
  const warnings = [];

  if (syncResult.backend.missing) {
    errors.push('apps/backend/.env is missing');
  }

  for (const frontend of syncResult.frontends) {
    if (frontend.missing) {
      errors.push(`${path.relative(repoRoot, frontend.filePath)} is missing`);
    }
  }

  const backendMap = syncResult.backend.targetDoc.map;
  for (const key of backendRequiredKeys) {
    if (!backendMap.has(key) || backendMap.get(key).trim() === '') {
      errors.push(`apps/backend/.env is missing ${key}`);
    }
  }

  if (!syncResult.backend.created && syncResult.backend.addedKeys.length > 0) {
    info(`added backend env keys: ${syncResult.backend.addedKeys.join(', ')}`);
  }

  if (syncResult.backend.unknownKeys.length > 0) {
    for (const key of syncResult.backend.unknownKeys) {
      warnings.push(`apps/backend/.env contains unknown key ${key}`);
    }
  }

  const appEnv = (backendMap.get('APP_ENV') || 'local').trim();
  if (!['local', 'development', 'staging', 'production', 'test'].includes(appEnv)) {
    errors.push(`apps/backend/.env has unsupported APP_ENV=${appEnv}`);
  } else if (appEnv === 'development') {
    warnings.push(
      'apps/backend/.env still uses APP_ENV=development; APP_ENV=local is now the recommended local default',
    );
  }

  if (backendMap.has('SIMULATION_DATA_DIR')) {
    warnings.push('apps/backend/.env still contains unsupported stale key SIMULATION_DATA_DIR');
  }

  const paymentProvider = (backendMap.get('PAYMENT_PROVIDER') || '').trim().toLowerCase();
  if (paymentProvider !== '' && !['manual_test', 'xendit'].includes(paymentProvider)) {
    errors.push(`apps/backend/.env has unsupported PAYMENT_PROVIDER=${paymentProvider}`);
  }

  if (['local', 'development'].includes(appEnv)) {
    const actualOrigins = new Set(
      String(backendMap.get('CORS_ALLOWED_ORIGINS') || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
    const missingOrigins = localOrigins.filter((origin) => !actualOrigins.has(origin));
    if (missingOrigins.length > 0) {
      errors.push(
        `apps/backend/.env CORS_ALLOWED_ORIGINS must include local app origins: ${missingOrigins.join(', ')}`,
      );
    }

    if ((backendMap.get('AUTH_COOKIE_DOMAIN') || '').trim() !== '.lvh.me') {
      errors.push('apps/backend/.env AUTH_COOKIE_DOMAIN must be .lvh.me for shared local subdomain auth');
    }
    if ((backendMap.get('AUTH_COOKIE_PATH') || '').trim() !== '/') {
      errors.push('apps/backend/.env AUTH_COOKIE_PATH must be / for shared local subdomain auth');
    }
  }

  for (const frontend of syncResult.frontends) {
    if (frontend.created) {
      info(`created ${path.relative(repoRoot, frontend.filePath)} from example`);
    }
    if (!frontend.created && frontend.addedKeys.length > 0) {
      info(`added ${frontend.addedKeys.join(', ')} to ${path.relative(repoRoot, frontend.filePath)}`);
    }

    const requiredKeys = frontend.exampleDoc.pairs.map((pair) => pair.key);
    for (const key of requiredKeys) {
      if (!frontend.targetDoc.map.has(key) || frontend.targetDoc.map.get(key).trim() === '') {
        errors.push(`${path.relative(repoRoot, frontend.filePath)} is missing ${key}`);
      }
    }

    for (const key of frontend.unknownKeys) {
      warnings.push(`${path.relative(repoRoot, frontend.filePath)} contains unknown key ${key}`);
    }
  }

  return {
    errors,
    warnings,
    backendEnv: Object.fromEntries(syncResult.backend.targetDoc.map),
  };
}

function checkToolchain(options = {}) {
  const pkg = readJSON(path.join(repoRoot, 'package.json'));
  const errors = [];
  const warnings = [];

  const nodeVersion = process.version.replace(/^v/, '');
  if (compareVersions(nodeVersion, pkg.engines.node.replace(/^[^\d]*/, '')) < 0) {
    errors.push(`Node.js ${pkg.engines.node} is required (found ${nodeVersion})`);
  }

  const npmVersionResult = runCommandSync(npmCommand, ['--version']);
  if (npmVersionResult.error || npmVersionResult.status !== 0) {
    errors.push('npm is not available');
  } else {
    const npmVersion = npmVersionResult.stdout.trim();
    if (compareVersions(npmVersion, pkg.engines.npm.replace(/^[^\d]*/, '')) < 0) {
      errors.push(`npm ${pkg.engines.npm} is required (found ${npmVersion})`);
    }
  }

  const goVersionResult = runCommandSync('go', ['version']);
  if (goVersionResult.error || goVersionResult.status !== 0) {
    errors.push('Go is not available');
  }

  if (options.requireDocker) {
    const dockerVersionResult = runCommandSync(dockerCommand, ['compose', 'version']);
    if (dockerVersionResult.error || dockerVersionResult.status !== 0) {
      errors.push('docker compose is required for local infra startup');
    }
  }

  return { errors, warnings };
}

function parseURLTarget(raw, fallbackPort) {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || String(fallbackPort), 10),
  };
}

function isLocalInfraTarget(host) {
  return ['localhost', '127.0.0.1', '::1', 'host.docker.internal'].includes(host);
}

function checkTCPConnection(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (ok, detail) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve({ ok, detail });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, `${host}:${port}`));
    socket.once('timeout', () => finish(false, `${host}:${port} timed out`));
    socket.once('error', (err) => finish(false, `${host}:${port} ${err.message}`));
    socket.connect(port, host);
  });
}

async function checkInfra(backendEnv) {
  const dbTarget = parseURLTarget(backendEnv.DATABASE_URL, 5432);
  const redisTarget = parseURLTarget(backendEnv.REDIS_URL, 6379);
  const database = await checkTCPConnection(dbTarget.host, dbTarget.port);
  const redis = await checkTCPConnection(redisTarget.host, redisTarget.port);

  return {
    database: {
      ...database,
      target: dbTarget,
      local: isLocalInfraTarget(dbTarget.host),
    },
    redis: {
      ...redis,
      target: redisTarget,
      local: isLocalInfraTarget(redisTarget.host),
    },
  };
}

function checkMigrationStatus() {
  const result = runNpmSync(['run', 'atlas:status', '--workspace', '@marketplace/backend']);
  const output = `${result.stdout}${result.stderr}`.trim();
  return {
    ok: result.status === 0,
    pending: /Migration Status:\s*PENDING/i.test(output),
    output,
  };
}

function applyMigrations(options = {}) {
  return runNpmSync(['run', 'atlas:apply', '--workspace', '@marketplace/backend'], {
    capture: options.capture !== false,
  });
}

function runBidanDemoSeed(options = {}) {
  return runNpmSync(['run', 'seed:bidan-demo', '--workspace', '@marketplace/backend'], {
    capture: options.capture !== false,
  });
}

function inspectPort(service) {
  const pidResult = runCommandSync('lsof', ['-nP', `-iTCP:${service.port}`, '-sTCP:LISTEN', '-t']);
  if (pidResult.status !== 0 || pidResult.stdout.trim() === '') {
    return {
      ...service,
      inUse: false,
      pid: null,
      command: '',
      cwd: '',
      matchesWorkspace: false,
      matchesService: false,
    };
  }

  const pid = pidResult.stdout
    .trim()
    .split(/\s+/)
    .map((item) => item.trim())
    .find(Boolean);
  const command = runCommandSync('ps', ['-o', 'command=', '-p', pid]).stdout.trim();
  const cwdResult = runCommandSync('lsof', ['-a', '-p', pid, '-d', 'cwd', '-Fn']);
  const cwd =
    cwdResult.stdout
      .split(/\r?\n/)
      .find((line) => line.startsWith('n'))
      ?.slice(1)
      ?.trim() ?? '';
  const resolvedCwd = cwd ? path.resolve(cwd) : '';

  return {
    ...service,
    inUse: true,
    pid,
    command,
    cwd: resolvedCwd,
    matchesWorkspace: resolvedCwd.startsWith(repoRoot),
    matchesService: resolvedCwd === service.cwd,
  };
}

function inspectPorts(services = allReservedServices) {
  return services.map(inspectPort);
}

function printPortDiagnostics(portStates) {
  for (const portState of portStates) {
    if (!portState.inUse) {
      info(`${portState.label} port ${portState.port} is free`);
      continue;
    }

    const cwdText = portState.cwd ? ` cwd=${portState.cwd}` : '';
    info(
      `${portState.label} port ${portState.port} is in use by pid=${portState.pid} command=${portState.command || 'unknown'}${cwdText}`,
    );
  }
}

function findBlockingPorts(portStates, services = managedDevServices) {
  const requiredIDs = new Set(services.map((service) => service.id));
  return portStates.filter((portState) => {
    if (!requiredIDs.has(portState.id)) {
      return false;
    }
    if (!portState.inUse) {
      return false;
    }
    return !portState.matchesService;
  });
}

function attachPrefixedOutput(label, stream, writer) {
  if (!stream) {
    return;
  }

  const lineReader = readline.createInterface({ input: stream });
  lineReader.on('line', (line) => writer(`[${label}] ${line}`));
}

function startService(service) {
  const child = spawn(npmCommand, ['run', service.script], {
    cwd: repoRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  attachPrefixedOutput(service.id, child.stdout, console.log);
  attachPrefixedOutput(service.id, child.stderr, console.error);
  return child;
}

async function checkHTTPStatus(url, expectedStatus) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(2_500) });
    if (response.status !== expectedStatus) {
      return { ok: false, detail: `${url} returned ${response.status}, expected ${expectedStatus}` };
    }
    return { ok: true, detail: `${url} -> ${response.status}` };
  } catch (err) {
    return { ok: false, detail: `${url} ${err.message}` };
  }
}

async function checkRedirect(url, expectedLocation) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(2_500) });
    const location = response.headers.get('location') || '';
    if (response.status !== 307 || location !== expectedLocation) {
      return {
        ok: false,
        detail: `${url} returned ${response.status} with location ${location || '<none>'}`,
      };
    }
    return { ok: true, detail: `${url} -> 307 ${location}` };
  } catch (err) {
    return { ok: false, detail: `${url} ${err.message}` };
  }
}

async function runServiceReadinessChecks(services = managedDevServices) {
  const results = [];
  for (const service of services) {
    for (const check of service.readyChecks) {
      const outcome = await check.run();
      results.push({
        service: service.id,
        label: check.label,
        ...outcome,
      });
    }
  }
  return results;
}

async function waitForReadiness(options = {}) {
  const services = options.services ?? managedDevServices;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const startedAt = Date.now();
  let latestResults = [];

  while (Date.now() - startedAt < timeoutMs) {
    latestResults = await runServiceReadinessChecks(services);
    if (latestResults.every((result) => result.ok)) {
      return { ok: true, results: latestResults };
    }
    await sleep(1_000);
  }

  return { ok: false, results: latestResults };
}

async function runSmokeChecks() {
  const readiness = await runServiceReadinessChecks();
  const failingServices = [...new Set(readiness.filter((result) => !result.ok).map((result) => result.service))];
  if (failingServices.length > 0) {
    return [
      {
        ok: false,
        detail: `local runtime is not ready for smoke checks (${failingServices.join(', ')}). Start it with npm run dev, wait for the local URLs summary, then rerun npm run dev:smoke.`,
      },
    ];
  }

  const results = [];
  results.push(await checkHTTPStatus('http://api.lvh.me:8080/api/v1/health', 200));
  results.push(await checkRedirect('http://bidan.lvh.me:3002/', '/id'));
  results.push(await checkHTTPStatus('http://bidan.lvh.me:3002/id', 200));
  results.push(await checkHTTPStatus('http://bidan.lvh.me:3002/id/login', 200));
  results.push(await checkRedirect('http://localhost:3002/id/login', 'http://bidan.lvh.me:3002/id/login'));
  results.push(await checkRedirect('http://admin.lvh.me:3005/', '/overview'));
  results.push(await checkHTTPStatus('http://admin.lvh.me:3005/login', 200));
  results.push(await checkRedirect('http://localhost:3005/login', 'http://admin.lvh.me:3005/login'));
  results.push(await checkCORS('http://api.lvh.me:8080/api/v1/health', 'http://bidan.lvh.me:3002'));
  results.push(...(await checkSeededViewerSSO()));
  results.push(...(await checkViewerSessionManagement()));
  results.push(...(await checkViewerRecoveryChallenge()));
  results.push(...(await checkSeededCustomerOrders()));
  results.push(...(await checkCustomerOrderPaymentSupportFlow()));
  results.push(...(await checkCustomerChatFlow()));
  results.push(...(await checkProfessionalWorkspaceFlow()));
  results.push(...(await checkSeededDirectory()));
  results.push(...(await checkSeededAdminQueue()));
  return results;
}

async function checkCORS(url, origin) {
  try {
    const response = await fetch(url, {
      headers: { Origin: origin },
      redirect: 'manual',
      signal: AbortSignal.timeout(2_500),
    });
    const allowedOrigin = response.headers.get('access-control-allow-origin');
    if (allowedOrigin !== origin) {
      return {
        ok: false,
        detail: `${url} did not echo Access-Control-Allow-Origin for ${origin} (got ${allowedOrigin || '<none>'})`,
      };
    }
    return { ok: true, detail: `${url} allows ${origin}` };
  } catch (err) {
    return { ok: false, detail: `${url} ${err.message}` };
  }
}

async function loginViewerWithCredentials({ origin = 'http://bidan.lvh.me:3002', password, phone }) {
  const loginResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
    },
    body: JSON.stringify({
      password,
      phone,
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (loginResponse.error) {
    return {
      ok: false,
      detail: `seeded customer login failed: ${loginResponse.error.message || 'unknown error'}`,
      cookieHeader: '',
    };
  }

  if (!loginResponse.response.ok) {
    const body = await loginResponse.response.text();
    return {
      ok: false,
      detail: `seeded customer login returned ${loginResponse.response.status}: ${body.slice(0, 240)}`,
      cookieHeader: '',
    };
  }

  const cookieHeader = buildCookieHeader(extractSetCookies(loginResponse.response.headers));
  if (!cookieHeader) {
    return {
      ok: false,
      detail: 'seeded customer login did not return a viewer session cookie',
      cookieHeader: '',
    };
  }

  return {
    ok: true,
    detail: 'viewer login succeeded',
    cookieHeader,
  };
}

async function loginSeededViewer() {
  return loginViewerWithCredentials({
    password: demoCredentials.customer.password,
    phone: demoCredentials.customer.phone,
  });
}

async function loginSeededProfessional(kind = 'approvedProfessional') {
  const credentials = demoCredentials[kind];
  if (!credentials) {
    return {
      ok: false,
      detail: `unknown seeded professional account ${kind}`,
      cookieHeader: '',
    };
  }

  return loginViewerWithCredentials({
    password: credentials.password,
    phone: credentials.phone,
  });
}

async function checkSeededViewerSSO() {
  const login = await loginSeededViewer();
  if (!login.ok) {
    return [{ ok: false, detail: login.detail }];
  }

  const nativeAccountResponse = await fetchWithResult('http://bidan.lvh.me:3002/id/security', {
    headers: {
      cookie: login.cookieHeader,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (nativeAccountResponse.error) {
    return [
      {
        ok: false,
        detail: `native account security probe failed: ${nativeAccountResponse.error.message || 'unknown error'}`,
      },
    ];
  }

  if (nativeAccountResponse.response.status !== 200) {
    return [
      {
        ok: false,
        detail: `native account security probe returned ${nativeAccountResponse.response.status}`,
      },
    ];
  }

  const nativeAccountHtml = await nativeAccountResponse.response.text();
  if (!nativeAccountHtml.includes('Alya Pratama')) {
    return [
      {
        ok: false,
        detail: 'native account security SSR did not reflect the signed-in viewer account',
      },
    ];
  }

  const logoutResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/session', {
    method: 'DELETE',
    headers: {
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (logoutResponse.error) {
    return [
      {
        ok: false,
        detail: `viewer logout failed from Bidan origin: ${logoutResponse.error.message || 'unknown error'}`,
      },
    ];
  }

  if (!logoutResponse.response.ok) {
    const body = await logoutResponse.response.text();
    return [
      {
        ok: false,
        detail: `viewer logout returned ${logoutResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const sessionResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/session', {
    headers: {
      cookie: login.cookieHeader,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (sessionResponse.error) {
    return [
      {
        ok: false,
        detail: `viewer post-logout session probe failed: ${sessionResponse.error.message || 'unknown error'}`,
      },
    ];
  }

  const sessionPayload = await sessionResponse.response.json();
  if (sessionPayload?.data?.isAuthenticated !== false) {
    return [
      {
        ok: false,
        detail: 'viewer logout did not clear the current session',
      },
    ];
  }

  return [
    {
      ok: true,
      detail: 'seeded viewer account opens normally from native Bidan security routes',
    },
    {
      ok: true,
      detail: 'seeded viewer logout clears the current session globally',
    },
  ];
}

async function checkViewerSessionManagement() {
  const loginOne = await loginSeededViewer();
  if (!loginOne.ok) {
    return [{ ok: false, detail: loginOne.detail }];
  }

  const loginTwo = await loginSeededViewer();
  if (!loginTwo.ok) {
    return [{ ok: false, detail: loginTwo.detail }];
  }

  const sessionsResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/sessions', {
    headers: {
      cookie: loginTwo.cookieHeader,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (sessionsResponse.error) {
    return [
      { ok: false, detail: `viewer session list probe failed: ${sessionsResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!sessionsResponse.response.ok) {
    const body = await sessionsResponse.response.text();
    return [
      { ok: false, detail: `viewer session list returned ${sessionsResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const sessionsPayload = await sessionsResponse.response.json();
  const sessionItems = sessionsPayload?.data?.items;
  if (!Array.isArray(sessionItems) || sessionItems.length < 2) {
    return [{ ok: false, detail: 'viewer session management did not expose both active seeded sessions' }];
  }

  const logoutOthersResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/sessions/logout-all', {
    method: 'POST',
    headers: {
      cookie: loginTwo.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (logoutOthersResponse.error) {
    return [
      { ok: false, detail: `viewer logout-all probe failed: ${logoutOthersResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!logoutOthersResponse.response.ok) {
    const body = await logoutOthersResponse.response.text();
    return [
      {
        ok: false,
        detail: `viewer logout-all returned ${logoutOthersResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const logoutOthersPayload = await logoutOthersResponse.response.json();
  if ((logoutOthersPayload?.data?.revokedCount ?? 0) < 1) {
    return [{ ok: false, detail: 'viewer logout-all did not revoke any other active session' }];
  }

  const revokedSessionProbe = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/session', {
    headers: {
      cookie: loginOne.cookieHeader,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (revokedSessionProbe.error) {
    return [
      {
        ok: false,
        detail: `viewer revoked-session probe failed: ${revokedSessionProbe.error.message || 'unknown error'}`,
      },
    ];
  }

  const revokedPayload = await revokedSessionProbe.response.json();
  if (revokedPayload?.data?.isAuthenticated !== false) {
    return [{ ok: false, detail: 'viewer logout-all left the revoked sibling session authenticated' }];
  }

  const currentSessionProbe = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/session', {
    headers: {
      cookie: loginTwo.cookieHeader,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (currentSessionProbe.error) {
    return [
      {
        ok: false,
        detail: `viewer current-session probe failed: ${currentSessionProbe.error.message || 'unknown error'}`,
      },
    ];
  }

  const currentPayload = await currentSessionProbe.response.json();
  if (currentPayload?.data?.isAuthenticated !== true) {
    return [{ ok: false, detail: 'viewer logout-all unexpectedly cleared the current active session' }];
  }

  return [
    { ok: true, detail: 'viewer session list shows multiple active device sessions for the same account' },
    { ok: true, detail: 'viewer logout-all revokes other sessions while keeping the current session active' },
  ];
}

async function checkViewerRecoveryChallenge() {
  const response = await fetchWithResult('http://api.lvh.me:8080/api/v1/auth/password/forgot', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://bidan.lvh.me:3002',
    },
    body: JSON.stringify({
      phone: demoCredentials.customer.phone,
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (response.error) {
    return [
      { ok: false, detail: `viewer recovery challenge request failed: ${response.error.message || 'unknown error'}` },
    ];
  }
  if (!response.response.ok) {
    const body = await response.response.text();
    return [
      {
        ok: false,
        detail: `viewer recovery challenge request returned ${response.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const payload = await response.response.json();
  if (!payload?.data?.challenge?.challengeId) {
    return [{ ok: false, detail: 'viewer recovery challenge request did not return a valid challenge id' }];
  }

  return [{ ok: true, detail: 'viewer password recovery can issue an OTP challenge for the seeded Bidan account' }];
}

async function checkSeededCustomerOrders() {
  const login = await loginSeededViewer();
  if (!login.ok) {
    return [{ ok: false, detail: login.detail }];
  }

  const ordersResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/platforms/bidan/customers/me/orders', {
    headers: {
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });
  if (ordersResponse.error) {
    return [
      { ok: false, detail: `seeded customer orders probe failed: ${ordersResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!ordersResponse.response.ok) {
    const body = await ordersResponse.response.text();
    return [
      { ok: false, detail: `seeded customer orders returned ${ordersResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }
  const payload = await ordersResponse.response.json();
  const orders = payload?.data?.orders;
  if (!Array.isArray(orders) || orders.length < 4) {
    return [{ ok: false, detail: 'seeded customer orders are missing or incomplete' }];
  }

  return [{ ok: true, detail: 'seeded customer can read the demo Bidan order timeline' }];
}

async function checkCustomerOrderPaymentSupportFlow() {
  const login = await loginSeededViewer();
  if (!login.ok) {
    return [{ ok: false, detail: login.detail }];
  }

  const offeringsResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/platforms/bidan/directory/offerings', {
    headers: {
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (offeringsResponse.error) {
    return [
      { ok: false, detail: `directory offerings probe failed: ${offeringsResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!offeringsResponse.response.ok) {
    const body = await offeringsResponse.response.text();
    return [
      { ok: false, detail: `directory offerings returned ${offeringsResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const offeringsPayload = await offeringsResponse.response.json();
  const offering = offeringsPayload?.data?.offerings?.[0];
  if (!offering?.id) {
    return [{ ok: false, detail: 'seeded directory offerings are unavailable for manual_test commerce flow' }];
  }

  const createOrderResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/platforms/bidan/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    body: JSON.stringify({
      fulfillmentDetails: {
        notes: 'Smoke test order flow',
        requestedSchedule: new Date().toISOString(),
      },
      offeringId: offering.id,
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (createOrderResponse.error) {
    return [
      { ok: false, detail: `order create probe failed: ${createOrderResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!createOrderResponse.response.ok) {
    const body = await createOrderResponse.response.text();
    return [
      { ok: false, detail: `order create returned ${createOrderResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const orderPayload = await createOrderResponse.response.json();
  const order = orderPayload?.data;
  if (!order?.id) {
    return [{ ok: false, detail: 'order create did not return a new Bidan order id' }];
  }

  const paymentSessionResponse = await fetchWithResult(
    `http://api.lvh.me:8080/api/v1/orders/${order.id}/payments/session`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: login.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      body: JSON.stringify({
        provider: 'manual_test',
        returnUrl: `http://bidan.lvh.me:3002/id/orders/${order.id}`,
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (paymentSessionResponse.error) {
    return [
      {
        ok: false,
        detail: `payment session create probe failed: ${paymentSessionResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!paymentSessionResponse.response.ok) {
    const body = await paymentSessionResponse.response.text();
    return [
      {
        ok: false,
        detail: `payment session create returned ${paymentSessionResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const paymentPayload = await paymentSessionResponse.response.json();
  const paymentSession = paymentPayload?.data;
  if (!paymentSession?.paymentId) {
    return [{ ok: false, detail: 'manual_test payment session did not return a payment id' }];
  }

  const webhookResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/webhooks/payments/manual_test', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      orderId: order.id,
      paymentId: paymentSession.paymentId,
      providerReference: paymentSession.providerReference,
      status: 'paid',
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (webhookResponse.error) {
    return [
      { ok: false, detail: `manual_test payment webhook failed: ${webhookResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!webhookResponse.response.ok) {
    const body = await webhookResponse.response.text();
    return [
      {
        ok: false,
        detail: `manual_test payment webhook returned ${webhookResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const orderDetailResponse = await fetchWithResult(
    `http://api.lvh.me:8080/api/v1/platforms/bidan/customers/me/orders/${order.id}`,
    {
      headers: {
        cookie: login.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (orderDetailResponse.error) {
    return [
      { ok: false, detail: `order detail probe failed: ${orderDetailResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!orderDetailResponse.response.ok) {
    const body = await orderDetailResponse.response.text();
    return [
      {
        ok: false,
        detail: `order detail probe returned ${orderDetailResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const orderDetailPayload = await orderDetailResponse.response.json();
  const settledOrder = orderDetailPayload?.data;
  if (settledOrder?.paymentStatus !== 'paid') {
    return [{ ok: false, detail: 'manual_test webhook did not move the new order into paid payment status' }];
  }
  if (!['pending_fulfillment', 'completed'].includes(settledOrder?.status)) {
    return [{ ok: false, detail: 'manual_test webhook did not move the new order into a fulfilled-ready state' }];
  }

  const supportCreateResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/support/tickets', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    body: JSON.stringify({
      details: 'Smoke flow support ticket for settlement follow-up.',
      orderId: order.id,
      platformId: primaryServicePlatformId,
      priority: 'normal',
      subject: 'Smoke test support ticket',
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (supportCreateResponse.error) {
    return [
      {
        ok: false,
        detail: `support ticket create probe failed: ${supportCreateResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!supportCreateResponse.response.ok) {
    const body = await supportCreateResponse.response.text();
    return [
      {
        ok: false,
        detail: `support ticket create returned ${supportCreateResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const supportPayload = await supportCreateResponse.response.json();
  const ticket = supportPayload?.data;
  if (!ticket?.id) {
    return [{ ok: false, detail: 'support ticket create did not return a new ticket id' }];
  }

  const adminLogin = await loginSeededAdmin();
  if (!adminLogin.ok) {
    return [{ ok: false, detail: adminLogin.detail }];
  }

  const triageResponse = await fetchWithResult(
    `http://api.lvh.me:8080/api/v1/admin/support/tickets/${ticket.id}/triage`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminLogin.cookieHeader,
        origin: 'http://admin.lvh.me:3005',
      },
      body: JSON.stringify({
        internalNote: 'Smoke triage',
        priority: 'high',
        publicNote: 'Smoke triage complete',
        status: 'triaged',
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (triageResponse.error) {
    return [
      { ok: false, detail: `admin support triage probe failed: ${triageResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!triageResponse.response.ok) {
    const body = await triageResponse.response.text();
    return [
      { ok: false, detail: `admin support triage returned ${triageResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const triagePayload = await triageResponse.response.json();
  if (triagePayload?.data?.status !== 'triaged') {
    return [{ ok: false, detail: 'admin support triage did not move the new ticket into triaged state' }];
  }

  return [
    { ok: true, detail: 'customer can create a new Bidan order from the seeded catalog and open a payment session' },
    { ok: true, detail: 'manual_test payment webhook settles the new order into a paid fulfillment-ready state' },
    { ok: true, detail: 'customer can create a support ticket on the new order and admin can triage it' },
  ];
}

async function checkCustomerChatFlow() {
  const login = await loginSeededViewer();
  if (!login.ok) {
    return [{ ok: false, detail: login.detail }];
  }

  const ordersResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/platforms/bidan/customers/me/orders', {
    headers: {
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (ordersResponse.error) {
    return [{ ok: false, detail: `chat flow order lookup failed: ${ordersResponse.error.message || 'unknown error'}` }];
  }
  if (!ordersResponse.response.ok) {
    const body = await ordersResponse.response.text();
    return [
      { ok: false, detail: `chat flow order lookup returned ${ordersResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const ordersPayload = await ordersResponse.response.json();
  const order = ordersPayload?.data?.orders?.[0];
  if (!order?.id) {
    return [{ ok: false, detail: 'chat flow could not find an existing seeded order to attach an order thread' }];
  }

  const conversationResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/chat/threads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    body: JSON.stringify({
      initialMessage: 'Halo, saya ingin konsultasi lewat smoke flow.',
      platformId: primaryServicePlatformId,
      threadType: 'conversation',
      title: 'Smoke consultation thread',
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (conversationResponse.error) {
    return [
      {
        ok: false,
        detail: `conversation chat create failed: ${conversationResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!conversationResponse.response.ok) {
    const body = await conversationResponse.response.text();
    return [
      {
        ok: false,
        detail: `conversation chat create returned ${conversationResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const conversationPayload = await conversationResponse.response.json();
  const conversationThread = conversationPayload?.data?.thread;
  if (!conversationThread?.id) {
    return [{ ok: false, detail: 'conversation chat create did not return a valid thread id' }];
  }
  if (!Array.isArray(conversationPayload?.data?.messages) || conversationPayload.data.messages.length < 1) {
    return [{ ok: false, detail: 'conversation chat create did not persist the initial message' }];
  }

  const messageResponse = await fetchWithResult(
    `http://api.lvh.me:8080/api/v1/chat/threads/${conversationThread.id}/messages`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: login.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      body: JSON.stringify({
        body: 'Saya lanjut kirim pesan kedua untuk smoke flow.',
        senderName: 'Alya Smoke',
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (messageResponse.error) {
    return [
      { ok: false, detail: `conversation chat message failed: ${messageResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!messageResponse.response.ok) {
    const body = await messageResponse.response.text();
    return [
      {
        ok: false,
        detail: `conversation chat message returned ${messageResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const messagePayload = await messageResponse.response.json();
  const lastMessage =
    messagePayload?.data?.messages?.at?.(-1) ||
    messagePayload?.data?.messages?.[messagePayload?.data?.messages?.length - 1];
  if (!lastMessage || !String(lastMessage.body || '').includes('smoke flow')) {
    return [{ ok: false, detail: 'conversation chat message was not persisted into the thread history' }];
  }

  const orderThreadResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/chat/threads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: login.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    body: JSON.stringify({
      initialMessage: 'Ini thread order smoke flow.',
      orderId: order.id,
      platformId: primaryServicePlatformId,
      threadType: 'order',
      title: 'Smoke order thread',
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (orderThreadResponse.error) {
    return [{ ok: false, detail: `order chat create failed: ${orderThreadResponse.error.message || 'unknown error'}` }];
  }
  if (!orderThreadResponse.response.ok) {
    const body = await orderThreadResponse.response.text();
    return [
      { ok: false, detail: `order chat create returned ${orderThreadResponse.response.status}: ${body.slice(0, 240)}` },
    ];
  }

  const orderThreadPayload = await orderThreadResponse.response.json();
  if (orderThreadPayload?.data?.thread?.orderId !== order.id) {
    return [{ ok: false, detail: 'order chat thread was created without linking to the target order' }];
  }

  const listResponse = await fetchWithResult(
    `http://api.lvh.me:8080/api/v1/chat/threads?platform_id=bidan&order_id=${encodeURIComponent(order.id)}`,
    {
      headers: {
        cookie: login.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (listResponse.error) {
    return [{ ok: false, detail: `chat thread list failed: ${listResponse.error.message || 'unknown error'}` }];
  }
  if (!listResponse.response.ok) {
    const body = await listResponse.response.text();
    return [{ ok: false, detail: `chat thread list returned ${listResponse.response.status}: ${body.slice(0, 240)}` }];
  }

  const listPayload = await listResponse.response.json();
  if (
    !Array.isArray(listPayload?.data?.threads) ||
    !listPayload.data.threads.some((thread) => thread.id === orderThreadPayload?.data?.thread?.id)
  ) {
    return [{ ok: false, detail: 'chat thread list did not surface the new order-linked chat thread' }];
  }

  return [
    { ok: true, detail: 'customer can create and continue a pre-order conversation thread' },
    { ok: true, detail: 'customer can create an order-linked chat thread and list it by order context' },
  ];
}

async function checkProfessionalWorkspaceFlow() {
  const approvedLogin = await loginSeededProfessional('approvedProfessional');
  if (!approvedLogin.ok) {
    return [{ ok: false, detail: approvedLogin.detail }];
  }

  const workspaceResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/platforms/bidan/professionals/me/workspace',
    {
      headers: {
        cookie: approvedLogin.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (workspaceResponse.error) {
    return [
      {
        ok: false,
        detail: `professional workspace snapshot failed: ${workspaceResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!workspaceResponse.response.ok) {
    const body = await workspaceResponse.response.text();
    return [
      {
        ok: false,
        detail: `professional workspace snapshot returned ${workspaceResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const workspacePayload = await workspaceResponse.response.json();
  const workspace = workspacePayload?.data;
  if (workspace?.profile?.reviewStatus !== 'approved' || workspace?.application?.status !== 'approved') {
    return [{ ok: false, detail: 'approved seeded professional workspace is not in the expected approved state' }];
  }

  const uploadTokenResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/platforms/bidan/professionals/me/documents/upload-token',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: approvedLogin.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      body: JSON.stringify({
        contentType: 'text/plain',
        documentKey: 'smoke_test_document',
        fileName: 'smoke-e2e-document.txt',
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (uploadTokenResponse.error) {
    return [
      {
        ok: false,
        detail: `professional upload token failed: ${uploadTokenResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!uploadTokenResponse.response.ok) {
    const body = await uploadTokenResponse.response.text();
    return [
      {
        ok: false,
        detail: `professional upload token returned ${uploadTokenResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const uploadTokenPayload = await uploadTokenResponse.response.json();
  const uploadToken = uploadTokenPayload?.data;
  if (!uploadToken?.uploadUrl || !uploadToken?.documentUrl || !uploadToken?.documentId) {
    return [{ ok: false, detail: 'professional upload token did not return uploadUrl, documentUrl, and documentId' }];
  }

  const documentBody = `smoke-e2e-document:${Date.now()}`;
  const uploadResponse = await fetchWithResult(`http://api.lvh.me:8080${uploadToken.uploadUrl}`, {
    method: uploadToken.method || 'PUT',
    headers: {
      'content-type': 'text/plain',
    },
    body: documentBody,
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (uploadResponse.error) {
    return [
      { ok: false, detail: `professional document upload failed: ${uploadResponse.error.message || 'unknown error'}` },
    ];
  }
  if (!uploadResponse.response.ok) {
    const body = await uploadResponse.response.text();
    return [
      {
        ok: false,
        detail: `professional document upload returned ${uploadResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const ownerDownloadResponse = await fetchWithResult(`http://api.lvh.me:8080${uploadToken.documentUrl}`, {
    headers: {
      cookie: approvedLogin.cookieHeader,
      origin: 'http://bidan.lvh.me:3002',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (ownerDownloadResponse.error) {
    return [
      {
        ok: false,
        detail: `professional owner document download failed: ${ownerDownloadResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!ownerDownloadResponse.response.ok) {
    const body = await ownerDownloadResponse.response.text();
    return [
      {
        ok: false,
        detail: `professional owner document download returned ${ownerDownloadResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const ownerDocumentBody = await ownerDownloadResponse.response.text();
  if (ownerDocumentBody !== documentBody) {
    return [{ ok: false, detail: 'professional owner document download did not return the uploaded file contents' }];
  }

  const adminLogin = await loginSeededAdmin();
  if (!adminLogin.ok) {
    return [{ ok: false, detail: adminLogin.detail }];
  }

  const adminDownloadResponse = await fetchWithResult(`http://api.lvh.me:8080${uploadToken.documentUrl}`, {
    headers: {
      cookie: adminLogin.cookieHeader,
      origin: 'http://admin.lvh.me:3005',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (adminDownloadResponse.error) {
    return [
      {
        ok: false,
        detail: `admin document review download failed: ${adminDownloadResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!adminDownloadResponse.response.ok) {
    const body = await adminDownloadResponse.response.text();
    return [
      {
        ok: false,
        detail: `admin document review download returned ${adminDownloadResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const adminDocumentBody = await adminDownloadResponse.response.text();
  if (adminDocumentBody !== documentBody) {
    return [{ ok: false, detail: 'admin document review download did not return the uploaded file contents' }];
  }

  const approvedOfferingResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/platforms/bidan/professionals/me/offerings',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: approvedLogin.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      body: JSON.stringify({
        deliveryMode: 'home_visit',
        description: 'Smoke test offering for approved professional flow.',
        offeringType: 'home_visit',
        priceAmount: 175000,
        title: `Smoke E2E Offering ${Date.now()}`,
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (approvedOfferingResponse.error) {
    return [
      {
        ok: false,
        detail: `approved professional offering create failed: ${approvedOfferingResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!approvedOfferingResponse.response.ok) {
    const body = await approvedOfferingResponse.response.text();
    return [
      {
        ok: false,
        detail: `approved professional offering create returned ${approvedOfferingResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }

  const approvedOfferingPayload = await approvedOfferingResponse.response.json();
  if (approvedOfferingPayload?.data?.status !== 'published') {
    return [{ ok: false, detail: 'approved professional offering create did not publish the new offering' }];
  }

  const submittedLogin = await loginSeededProfessional('submittedProfessional');
  if (!submittedLogin.ok) {
    return [{ ok: false, detail: submittedLogin.detail }];
  }

  const blockedOfferingResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/platforms/bidan/professionals/me/offerings',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: submittedLogin.cookieHeader,
        origin: 'http://bidan.lvh.me:3002',
      },
      body: JSON.stringify({
        deliveryMode: 'online_session',
        description: 'Smoke test blocked offering flow.',
        offeringType: 'online_session',
        priceAmount: 125000,
        title: `Blocked Smoke Offering ${Date.now()}`,
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (blockedOfferingResponse.error) {
    return [
      {
        ok: false,
        detail: `submitted professional offering gate failed: ${blockedOfferingResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (blockedOfferingResponse.response.ok) {
    return [{ ok: false, detail: 'submitted professional unexpectedly succeeded in publishing an offering' }];
  }

  const blockedBody = await blockedOfferingResponse.response.text();
  if (blockedOfferingResponse.response.status !== 400 || !blockedBody.includes('platform_profile_not_approved')) {
    return [
      {
        ok: false,
        detail: `submitted professional offering gate returned ${blockedOfferingResponse.response.status}: ${blockedBody.slice(0, 240)}`,
      },
    ];
  }

  return [
    {
      ok: true,
      detail: 'approved professional workspace loads in approved state and can issue a real document upload token',
    },
    {
      ok: true,
      detail: 'uploaded professional documents can be downloaded by both the owner and admin review session',
    },
    { ok: true, detail: 'approved professionals can publish offerings while submitted professionals remain gated' },
  ];
}

async function checkSeededDirectory() {
  const professionalsResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/platforms/bidan/directory/professionals',
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (professionalsResponse.error) {
    return [
      {
        ok: false,
        detail: `seeded directory professionals probe failed: ${professionalsResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!professionalsResponse.response.ok) {
    const body = await professionalsResponse.response.text();
    return [
      {
        ok: false,
        detail: `seeded directory professionals returned ${professionalsResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }
  const payload = await professionalsResponse.response.json();
  const professionals = payload?.data?.professionals;
  if (!Array.isArray(professionals) || !professionals.some((item) => item?.displayName === 'Bidan Nabila Lestari')) {
    return [{ ok: false, detail: 'approved seeded professional is missing from the public Bidan directory' }];
  }
  if (professionals.some((item) => item?.displayName === 'Bidan Rahma Pertiwi')) {
    return [{ ok: false, detail: 'submitted seeded professional leaked into the public Bidan directory' }];
  }

  return [{ ok: true, detail: 'public Bidan directory only exposes the approved seeded professional' }];
}

async function loginSeededAdmin() {
  const loginResponse = await fetchWithResult('http://api.lvh.me:8080/api/v1/admin/auth/session', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://admin.lvh.me:3005',
    },
    body: JSON.stringify({
      email: demoCredentials.admin.email,
      password: demoCredentials.admin.password,
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });

  if (loginResponse.error) {
    return {
      ok: false,
      detail: `seeded admin login failed: ${loginResponse.error.message || 'unknown error'}`,
      cookieHeader: '',
    };
  }
  if (!loginResponse.response.ok) {
    const body = await loginResponse.response.text();
    return {
      ok: false,
      detail: `seeded admin login returned ${loginResponse.response.status}: ${body.slice(0, 240)}`,
      cookieHeader: '',
    };
  }
  const cookieHeader = buildCookieHeader(extractSetCookies(loginResponse.response.headers));
  if (!cookieHeader) {
    return {
      ok: false,
      detail: 'seeded admin login did not return an admin session cookie',
      cookieHeader: '',
    };
  }
  return {
    ok: true,
    detail: 'seeded admin login succeeded',
    cookieHeader,
  };
}

async function checkSeededAdminQueue() {
  const login = await loginSeededAdmin();
  if (!login.ok) {
    return [{ ok: false, detail: login.detail }];
  }

  const applicationsResponse = await fetchWithResult(
    'http://api.lvh.me:8080/api/v1/admin/platforms/bidan/professional-applications',
    {
      headers: {
        cookie: login.cookieHeader,
        origin: 'http://admin.lvh.me:3005',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (applicationsResponse.error) {
    return [
      {
        ok: false,
        detail: `seeded admin review queue probe failed: ${applicationsResponse.error.message || 'unknown error'}`,
      },
    ];
  }
  if (!applicationsResponse.response.ok) {
    const body = await applicationsResponse.response.text();
    return [
      {
        ok: false,
        detail: `seeded admin review queue returned ${applicationsResponse.response.status}: ${body.slice(0, 240)}`,
      },
    ];
  }
  const payload = await applicationsResponse.response.json();
  const applications = payload?.data?.applications;
  if (!Array.isArray(applications) || !applications.some((item) => item?.displayName === 'Bidan Rahma Pertiwi')) {
    return [{ ok: false, detail: 'submitted seeded professional is missing from the Bidan admin review queue' }];
  }

  return [{ ok: true, detail: 'seeded admin queue shows the submitted Bidan professional for review' }];
}

function extractSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const combined = headers.get('set-cookie');
  if (!combined) {
    return [];
  }

  return combined
    .split(/,(?=[^;]+?=)/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildCookieHeader(cookies) {
  const pairs = cookies.map((cookie) => cookie.split(';')[0]?.trim()).filter(Boolean);

  if (pairs.length === 0) {
    return '';
  }

  return pairs.join('; ');
}

async function fetchWithResult(url, options) {
  try {
    const response = await fetch(url, options);
    return { response };
  } catch (error) {
    return { error };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function terminateChildren(children) {
  for (const child of children) {
    if (child.exitCode == null && !child.killed) {
      child.kill('SIGTERM');
    }
  }
}

function printReadySummary() {
  section('Local URLs');
  info('backend: http://api.lvh.me:8080/api/v1/health');
  info('bidan:   http://bidan.lvh.me:3002/id');
  info('admin:   http://admin.lvh.me:3005/overview');
}

function detectMigrationDrift(text) {
  return /(already exists|duplicate key|current version|dirty|relation .* already exists)/i.test(text);
}

function parseDatabaseURL(raw) {
  const parsed = new URL(raw);
  return {
    username: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || '5432', 10),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function resetLocalDatabase(backendEnv) {
  const target = parseDatabaseURL(backendEnv.DATABASE_URL);
  if (!isLocalInfraTarget(target.host)) {
    throw new Error(`refusing to reset non-local database host ${target.host}`);
  }
  if (!/^[A-Za-z0-9_]+$/.test(target.database)) {
    throw new Error(`refusing to reset unsafe database name ${target.database}`);
  }
  if (!/^[A-Za-z0-9_]+$/.test(target.username)) {
    throw new Error(`refusing to reset with unsafe database user ${target.username}`);
  }

  const dropResult = runCommandSync(dockerCommand, [
    'exec',
    localPostgresContainerName,
    'psql',
    '-U',
    target.username,
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `DROP DATABASE IF EXISTS "${target.database}" WITH (FORCE);`,
  ]);
  if (dropResult.status !== 0) {
    throw new Error(dropResult.stderr.trim() || dropResult.stdout.trim() || 'failed to drop local database');
  }

  const createResult = runCommandSync(dockerCommand, [
    'exec',
    localPostgresContainerName,
    'psql',
    '-U',
    target.username,
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `CREATE DATABASE "${target.database}";`,
  ]);
  if (createResult.status !== 0) {
    throw new Error(createResult.stderr.trim() || createResult.stdout.trim() || 'failed to create local database');
  }
}

module.exports = {
  allReservedServices,
  backendRequiredKeys,
  checkInfra,
  checkMigrationStatus,
  checkToolchain,
  detectMigrationDrift,
  error,
  findBlockingPorts,
  info,
  inspectPorts,
  localOrigins,
  managedDevServices,
  printPortDiagnostics,
  printReadySummary,
  resetLocalDatabase,
  repoRoot,
  runCommandSync,
  runNpmSync,
  runBidanDemoSeed,
  runServiceReadinessChecks,
  runSmokeChecks,
  section,
  sleep,
  startService,
  syncRuntimeEnvFiles,
  terminateChildren,
  validateRuntimeEnv,
  waitForReadiness,
  warn,
  applyMigrations,
};
