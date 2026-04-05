import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const backendDir = path.join(repoRoot, 'apps', 'backend');
const browserOrigin = 'http://localhost:3000';

function parseArgs(argv) {
  const options = {
    baseUrl: '',
    port: 18080,
    reuseBackend: false,
  };

  for (const argument of argv) {
    if (argument === '--reuse-backend') {
      options.reuseBackend = true;
      continue;
    }

    if (argument.startsWith('--base-url=')) {
      options.baseUrl = argument.slice('--base-url='.length);
      continue;
    }

    if (argument.startsWith('--port=')) {
      options.port = Number(argument.slice('--port='.length));
    }
  }

  if (!Number.isFinite(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error(`invalid --port value ${String(options.port)}`);
  }

  if (options.baseUrl === '') {
    options.baseUrl = `http://127.0.0.1:${options.port}/api/v1`;
  }

  return options;
}

async function runCommand(command, args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} exited with code ${String(code)}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

function startBackend(port) {
  const child = spawn('go', ['run', './cmd/api'], {
    cwd: backendDir,
    detached: true,
    env: {
      ...process.env,
      APP_ENV: process.env.APP_ENV ?? 'development',
      HTTP_HOST: '127.0.0.1',
      HTTP_PORT: String(port),
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  return {
    child,
    getLogs() {
      return `stdout:\n${stdout}\nstderr:\n${stderr}`;
    },
  };
}

function killBackendGroup(child, signal) {
  if (!child?.pid) {
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    if (child.exitCode === null) {
      child.kill(signal);
    }
  }
}

async function waitForHealth(baseUrl, backendProcess) {
  const deadline = Date.now() + 30_000;
  let lastError = null;

  while (Date.now() < deadline) {
    if (backendProcess && backendProcess.child.exitCode !== null) {
      throw new Error(`backend exited before becoming healthy\n${backendProcess.getLogs()}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.status === 200) {
        return;
      }
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(500);
  }

  throw new Error(`backend did not become healthy in time: ${String(lastError)}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJSON(label, baseUrl, pathName, options = {}) {
  const url = `${baseUrl}${pathName}`;
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  if (text.trim() !== '') {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(`${label} returned non-JSON response (${response.status})\n${text}\n${String(error)}`);
    }
  }

  const expectedStatus = options.expectedStatus ?? 200;
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label} expected status ${expectedStatus} but got ${response.status}\n${JSON.stringify(payload, null, 2)}`,
    );
  }

  return {
    payload,
    response,
  };
}

function getRoleToken(summary, role) {
  return summary.bearerTokens.find((token) => token.role === role)?.token ?? '';
}

function getCustomerAccount(summary, consumerId) {
  return summary.customerAccounts.find((account) => account.id === consumerId) ?? null;
}

function getProfessionalAccount(summary, professionalId) {
  return summary.professionalAccounts.find((account) => account.professionalId === professionalId) ?? null;
}

function cookieHeader(setCookieValue) {
  const head = String(setCookieValue ?? '')
    .split(';')[0]
    .trim();
  return head === '' ? '' : head;
}

function totalAppointmentCount(summary) {
  return Object.values(summary.appointmentStatusCounts ?? {}).reduce((total, count) => total + Number(count ?? 0), 0);
}

async function runSmokeChecks(summary, baseUrl) {
  const completedChecks = [];

  const recordSuccess = (label) => {
    completedChecks.push(label);
    process.stdout.write(`✓ ${label}\n`);
  };

  const { payload: healthPayload } = await requestJSON('health', baseUrl, '/health');
  assert(healthPayload?.data?.service, 'health payload missing service name');
  recordSuccess('health endpoint');

  const { payload: bootstrapPayload } = await requestJSON('bootstrap', baseUrl, '/bootstrap');
  assert(
    Array.isArray(bootstrapPayload?.data?.catalog?.professionals) &&
      bootstrapPayload.data.catalog.professionals.length >= summary.professionalScenarios.length,
    'bootstrap payload missing professionals',
  );
  recordSuccess('bootstrap read model');

  const { payload: professionalsPayload } = await requestJSON('professionals', baseUrl, '/professionals');
  assert(
    Array.isArray(professionalsPayload?.data) && professionalsPayload.data.length > 0,
    'professionals list is empty',
  );
  recordSuccess('professionals directory list');

  const sampleSlug = professionalsPayload.data[0]?.slug;
  assert(sampleSlug, 'sample professional slug is missing');
  await requestJSON('professional detail', baseUrl, `/professionals/${sampleSlug}`);
  recordSuccess('professional detail read');

  const { payload: chatPayload } = await requestJSON('chat', baseUrl, '/chat');
  const chatThreadCount =
    (chatPayload?.data?.directThreads?.length ?? 0) + (chatPayload?.data?.appointmentThreads?.length ?? 0);
  assert(chatThreadCount > 0, 'chat payload missing seeded threads');
  recordSuccess('chat read model');

  const { payload: unauthorizedAdminPayload } = await requestJSON('admin unauthorized', baseUrl, '/admin/console', {
    expectedStatus: 401,
  });
  assert(
    unauthorizedAdminPayload?.error?.code === 'missing_admin_session',
    'admin unauthorized response did not enforce auth',
  );
  recordSuccess('admin auth guard');

  const adminToken = getRoleToken(summary, 'admin');
  assert(adminToken !== '', 'missing seeded admin bearer token');
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const { payload: adminAuthPayload } = await requestJSON('admin auth session', baseUrl, '/admin/auth/session', {
    headers: adminHeaders,
  });
  assert(adminAuthPayload?.data?.isAuthenticated === true, 'admin session not authenticated');
  recordSuccess('admin bearer auth session');

  const { payload: appointmentsPayload } = await requestJSON('admin appointments', baseUrl, '/appointments', {
    headers: adminHeaders,
  });
  assert(
    Array.isArray(appointmentsPayload?.data?.appointments) &&
      appointmentsPayload.data.appointments.length >= totalAppointmentCount(summary),
    'appointments payload missing seeded rows',
  );
  recordSuccess('admin appointments read model');

  const { payload: adminSupportPayload } = await requestJSON('admin support desk', baseUrl, '/admin/support-desk', {
    headers: adminHeaders,
  });
  assert(
    Array.isArray(adminSupportPayload?.data?.tickets) &&
      adminSupportPayload.data.tickets.length === summary.supportTicketCount,
    'support desk ticket count mismatch',
  );
  recordSuccess('admin support desk read');

  const { payload: adminConsolePayload } = await requestJSON('admin console', baseUrl, '/admin/console', {
    headers: adminHeaders,
  });
  assert(
    Object.keys(adminConsolePayload?.data?.tables ?? {}).length === summary.adminConsoleTableCount,
    'admin console table count mismatch',
  );
  recordSuccess('admin console read');

  await requestJSON('admin console professionals table', baseUrl, '/admin/console/tables/professionals', {
    headers: adminHeaders,
  });
  recordSuccess('admin console granular table read');

  const { payload: adminServicesTablePayload } = await requestJSON(
    'admin console services table',
    baseUrl,
    '/admin/console/tables/services',
    {
      headers: adminHeaders,
    },
  );
  const adminServiceRows = Array.isArray(adminServicesTablePayload?.data?.rows)
    ? adminServicesTablePayload.data.rows
    : [];
  const serviceRow = adminServiceRows[0];
  assert(serviceRow?.id, 'admin services table is missing a seed service row');
  const updatedServiceName = `${serviceRow.name} Synced`;
  await requestJSON('admin console services mutation', baseUrl, '/admin/console/tables/services', {
    method: 'PUT',
    headers: adminHeaders,
    body: {
      rows: adminServiceRows.map((row, index) =>
        row.id === serviceRow.id
          ? {
              ...row,
              index: index + 1,
              name: updatedServiceName,
            }
          : {
              ...row,
              index: index + 1,
            },
      ),
      savedAt: adminServicesTablePayload?.data?.savedAt,
      schemaVersion: adminServicesTablePayload?.data?.schemaVersion ?? 1,
    },
  });
  const { payload: catalogAfterAdminMutationPayload } = await requestJSON(
    'catalog after admin console service mutation',
    baseUrl,
    '/catalog',
  );
  const updatedCatalogService = catalogAfterAdminMutationPayload?.data?.services?.find(
    (service) => service.id === serviceRow.id,
  );
  assert(
    updatedCatalogService?.name === updatedServiceName,
    'admin console service mutation did not update the public catalog read model',
  );
  recordSuccess('admin console mutation updates public catalog');

  const { payload: adminUpdatePayload } = await requestJSON('admin session update', baseUrl, '/admin/auth/session', {
    method: 'PUT',
    headers: adminHeaders,
    body: { lastVisitedRoute: '/admin/support' },
  });
  assert(adminUpdatePayload?.data?.lastVisitedRoute === '/admin/support', 'admin session update did not persist');
  recordSuccess('admin session mutation');

  const { payload: viewerSessionPayload } = await requestJSON('viewer session', baseUrl, '/viewer/session');
  assert(viewerSessionPayload?.data?.mode, 'viewer session missing mode');
  await requestJSON('viewer session mutation', baseUrl, '/viewer/session', {
    method: 'PUT',
    body: { mode: 'customer' },
  });
  recordSuccess('viewer session read and mutation');

  const seededCustomerToken = getRoleToken(summary, 'customer');
  assert(seededCustomerToken !== '', 'missing seeded customer bearer token');
  const { payload: customerBearerPayload } = await requestJSON(
    'customer bearer session',
    baseUrl,
    '/customers/auth/session',
    {
      headers: { Authorization: `Bearer ${seededCustomerToken}` },
    },
  );
  assert(customerBearerPayload?.data?.consumerId, 'customer bearer session missing consumer id');
  recordSuccess('customer bearer auth session');

  const customerScenario =
    summary.customerScenarios.find((scenario) => scenario.consumerId === 'ibu-nadia') ?? summary.customerScenarios[0];
  assert(customerScenario, 'missing customer scenario for login');
  const customerAccount = getCustomerAccount(summary, customerScenario.consumerId);
  assert(customerAccount, `missing customer account for ${customerScenario.consumerId}`);

  const customerLoginResponse = await requestJSON('customer login', baseUrl, '/customers/auth/session', {
    method: 'POST',
    body: {
      phone: customerAccount.phone,
      password: customerAccount.password,
    },
  });
  const customerCookie = cookieHeader(customerLoginResponse.response.headers.get('set-cookie'));
  assert(customerCookie !== '', 'customer login did not return session cookie');
  recordSuccess('customer login');

  const customerCookieHeaders = { Cookie: customerCookie };
  const { payload: customerSessionPayload } = await requestJSON(
    'customer cookie session',
    baseUrl,
    '/customers/auth/session',
    {
      headers: customerCookieHeaders,
    },
  );
  assert(customerSessionPayload?.data?.consumerId === customerScenario.consumerId, 'customer cookie session mismatch');
  recordSuccess('customer cookie auth session');

  const { payload: customerNotificationsPayload } = await requestJSON(
    'customer notifications',
    baseUrl,
    '/notifications/customer',
    { headers: customerCookieHeaders },
  );
  assert(Array.isArray(customerNotificationsPayload?.data?.readIds), 'customer notifications missing readIds');
  recordSuccess('customer notifications read');

  await requestJSON('customer notifications mutation', baseUrl, '/notifications/customer', {
    method: 'PUT',
    headers: {
      ...customerCookieHeaders,
      Origin: browserOrigin,
    },
    body: customerNotificationsPayload.data,
  });
  recordSuccess('customer notifications mutation');

  const { payload: customerPreferencesPayload } = await requestJSON(
    'customer preferences',
    baseUrl,
    '/consumers/preferences',
    { headers: customerCookieHeaders },
  );
  assert(
    customerPreferencesPayload?.data?.consumerId === customerScenario.consumerId,
    'customer preferences consumer mismatch',
  );
  await requestJSON('customer preferences mutation', baseUrl, '/consumers/preferences', {
    method: 'PUT',
    headers: {
      ...customerCookieHeaders,
      Origin: browserOrigin,
    },
    body: customerPreferencesPayload.data,
  });
  recordSuccess('customer preferences read and mutation');

  const seededProfessionalToken = getRoleToken(summary, 'professional');
  assert(seededProfessionalToken !== '', 'missing seeded professional bearer token');
  const { payload: professionalBearerPayload } = await requestJSON(
    'professional bearer session',
    baseUrl,
    '/professionals/auth/session',
    {
      headers: { Authorization: `Bearer ${seededProfessionalToken}` },
    },
  );
  assert(professionalBearerPayload?.data?.professionalId, 'professional bearer session missing professional id');
  recordSuccess('professional bearer auth session');

  const professionalScenario =
    summary.professionalScenarios.find((scenario) => scenario.reviewStatus === 'changes_requested') ??
    summary.professionalScenarios[0];
  assert(professionalScenario, 'missing professional scenario for login');
  const professionalAccount = getProfessionalAccount(summary, professionalScenario.professionalId);
  assert(professionalAccount, `missing professional account for ${professionalScenario.professionalId}`);

  const professionalLoginResponse = await requestJSON('professional login', baseUrl, '/professionals/auth/session', {
    method: 'POST',
    body: {
      professionalId: professionalAccount.professionalId,
      phone: professionalAccount.phone,
      password: professionalAccount.password,
    },
  });
  const professionalCookie = cookieHeader(professionalLoginResponse.response.headers.get('set-cookie'));
  assert(professionalCookie !== '', 'professional login did not return session cookie');
  recordSuccess('professional login');

  const professionalCookieHeaders = { Cookie: professionalCookie };
  const { payload: professionalSessionPayload } = await requestJSON(
    'professional cookie session',
    baseUrl,
    '/professionals/auth/session',
    { headers: professionalCookieHeaders },
  );
  assert(
    professionalSessionPayload?.data?.professionalId === professionalScenario.professionalId,
    'professional cookie session mismatch',
  );
  recordSuccess('professional cookie auth session');

  const { payload: professionalProfilePayload } = await requestJSON(
    'professional profile',
    baseUrl,
    '/professionals/me/profile',
    { headers: professionalCookieHeaders },
  );
  assert(
    professionalProfilePayload?.data?.professionalId === professionalScenario.professionalId,
    'professional profile mismatch',
  );
  const professionalProfileMutationBody = {
    acceptingNewClients: professionalProfilePayload.data.acceptingNewClients,
    autoApproveInstantBookings: professionalProfilePayload.data.autoApproveInstantBookings,
    city: professionalProfilePayload.data.city,
    credentialNumber: professionalProfilePayload.data.credentialNumber,
    displayName: professionalProfilePayload.data.displayName,
    phone: professionalProfilePayload.data.phone,
    professionalId: professionalProfilePayload.data.professionalId,
    publicBio: professionalProfilePayload.data.publicBio,
    responseTimeGoal: professionalProfilePayload.data.responseTimeGoal,
    yearsExperience: professionalProfilePayload.data.yearsExperience,
  };
  await requestJSON('professional profile mutation', baseUrl, '/professionals/me/profile', {
    method: 'PUT',
    headers: {
      ...professionalCookieHeaders,
      Origin: browserOrigin,
    },
    body: professionalProfileMutationBody,
  });
  recordSuccess('professional profile read and mutation');

  if (professionalProfilePayload?.data?.reviewState?.status === 'changes_requested') {
    const { payload: professionalSubmitReviewPayload } = await requestJSON(
      'professional profile submit review',
      baseUrl,
      '/professionals/me/profile/submit-review',
      {
        method: 'POST',
        headers: {
          ...professionalCookieHeaders,
          Origin: browserOrigin,
        },
      },
    );
    assert(
      professionalSubmitReviewPayload?.data?.reviewState?.status === 'submitted',
      'professional submit review did not transition to submitted',
    );
    recordSuccess('professional review submission');
  }

  await requestJSON('professional coverage', baseUrl, '/professionals/me/coverage', {
    headers: professionalCookieHeaders,
  });
  recordSuccess('professional coverage read');

  await requestJSON('professional services', baseUrl, '/professionals/me/services', {
    headers: professionalCookieHeaders,
  });
  recordSuccess('professional services read');

  await requestJSON('professional requests', baseUrl, '/professionals/me/requests', {
    headers: professionalCookieHeaders,
  });
  recordSuccess('professional requests read');

  const { payload: professionalNotificationsPayload } = await requestJSON(
    'professional notifications',
    baseUrl,
    '/notifications/professional',
    { headers: professionalCookieHeaders },
  );
  assert(
    typeof professionalNotificationsPayload?.data?.readIdsByProfessional === 'object',
    'professional notifications missing map',
  );
  await requestJSON('professional notifications mutation', baseUrl, '/notifications/professional', {
    method: 'PUT',
    headers: {
      ...professionalCookieHeaders,
      Origin: browserOrigin,
    },
    body: professionalNotificationsPayload.data,
  });
  recordSuccess('professional notifications read and mutation');

  process.stdout.write(`\nSeeded smoke completed with ${String(completedChecks.length)} checks against ${baseUrl}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const backendProcess = options.reuseBackend ? null : startBackend(options.port);
  const cleanup = async () => {
    if (!backendProcess) {
      return;
    }
    if (backendProcess.child.exitCode === null) {
      killBackendGroup(backendProcess.child, 'SIGTERM');
      await sleep(250);
      if (backendProcess.child.exitCode === null) {
        killBackendGroup(backendProcess.child, 'SIGKILL');
      }
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    process.stdout.write('Seeding backend runtime...\n');
    const seedResult = await runCommand('go', ['run', './cmd/seed', '--reset', '--format=json'], {
      cwd: backendDir,
    });
    const summary = JSON.parse(seedResult.stdout);

    if (backendProcess) {
      process.stdout.write(`Starting backend on ${options.baseUrl}...\n`);
      await waitForHealth(options.baseUrl, backendProcess);
    } else {
      process.stdout.write(`Reusing backend at ${options.baseUrl}...\n`);
      await waitForHealth(options.baseUrl, null);
    }

    await runSmokeChecks(summary, options.baseUrl);
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
