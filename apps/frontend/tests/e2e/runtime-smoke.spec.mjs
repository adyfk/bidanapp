import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..', '..');
const backendDir = resolve(frontendDir, '..', 'backend');

const consumers = JSON.parse(await readFile(resolve(backendDir, 'seeddata/consumers.json'), 'utf8'));
const professionals = JSON.parse(await readFile(resolve(backendDir, 'seeddata/professionals.json'), 'utf8'));
const services = JSON.parse(await readFile(resolve(backendDir, 'seeddata/services.json'), 'utf8'));
const appointments = JSON.parse(await readFile(resolve(backendDir, 'seeddata/appointments.json'), 'utf8'));

const normalizePhone = (value = '') => {
  const trimmed = value.trim();

  return [...trimmed].filter((character, index) => /\d/.test(character) || (character === '+' && index === 0)).join('');
};

const buildSeedProfessionalPhone = (index) => `+628137000${String(index + 1).padStart(4, '0')}`;

const professionalSlug = professionals[0]?.slug;
const serviceSlug = services[0]?.slug;
const appointmentId = appointments[0]?.id;
const customerPhone = normalizePhone(consumers[0]?.phone ?? '');
const professionalPhone = buildSeedProfessionalPhone(0);
const professionalName = professionals[0]?.name ?? '';
const customerBearerToken = `seed-customer-session-${consumers[0]?.id}`;
const professionalBearerToken = `seed-professional-session-${professionals[0]?.id}`;
const adminBearerToken = 'seed-admin-session-adm-01';
const backendApiBaseUrl = process.env.PLAYWRIGHT_BACKEND_API_BASE_URL ?? 'http://127.0.0.1:3302/api/v1';
const seededCustomerPassword = 'Customer2026A';
const seededProfessionalPassword = 'Professional2026A';
const blockedUiPatterns = [
  /choose your professional profile/i,
  /developmental notes/i,
  /\bdummy\b/i,
  /\bmock\b/i,
  /\bdemo\b/i,
  /\bsimulate\b/i,
  /\bsimulation\b/i,
  /\bsimulasi\b/i,
  /\bsandbox\b/i,
];

const trackRuntimeErrors = (page) => {
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(error instanceof Error ? error.stack || error.message : String(error));
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }

    const text = message.text();

    if (
      text.includes('TypeError') ||
      text.includes('Unhandled Runtime Error') ||
      text.includes('Cannot read properties')
    ) {
      errors.push(text);
    }
  });

  return errors;
};

const assertNoRuntimeErrors = (errors, route) => {
  assert.deepEqual(errors, [], `Unexpected runtime errors while rendering ${route}:\n${errors.join('\n\n')}`);
};

const collectRenderedUiText = async (page) =>
  page.evaluate(() => {
    const values = [];

    if (document.body?.innerText) {
      values.push(document.body.innerText);
    }

    for (const element of document.querySelectorAll('[placeholder],[title],[aria-label],img[alt]')) {
      for (const attributeName of ['placeholder', 'title', 'aria-label', 'alt']) {
        const attributeValue = element.getAttribute(attributeName);

        if (attributeValue) {
          values.push(attributeValue);
        }
      }
    }

    return values.join('\n');
  });

const assertNoDevelopmentWording = async (page, route) => {
  const renderedUiText = await collectRenderedUiText(page);
  const matches = blockedUiPatterns
    .map((pattern) => {
      const matchedText = renderedUiText.match(pattern);
      return matchedText ? matchedText[0] : null;
    })
    .filter(Boolean);

  assert.deepEqual(
    matches,
    [],
    `Unexpected development-oriented wording while rendering ${route}:\n${matches.join('\n')}`,
  );
};

const assertHealthyPage = async (page, errors, route) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
  await expect(page.locator('body')).not.toContainText("Cannot read properties of null (reading '0')");
  await expect(page.locator('body')).not.toContainText('TypeError');

  assertNoRuntimeErrors(errors, route);
  await assertNoDevelopmentWording(page, route);
};

const waitForApiOutcome = async (page, pathFragment) => {
  const requestFailurePromise = new Promise((resolve) => {
    const handleRequestFailed = (request) => {
      if (!request.url().includes(pathFragment)) {
        return;
      }

      page.off('requestfailed', handleRequestFailed);
      resolve({
        errorText: request.failure()?.errorText ?? 'unknown request failure',
        type: 'requestfailed',
        url: request.url(),
      });
    };

    page.on('requestfailed', handleRequestFailed);
  });

  const responsePromise = page
    .waitForResponse((response) => response.url().includes(pathFragment) && response.request().method() === 'POST')
    .then(async (response) => ({
      body: await response.text(),
      response,
      type: 'response',
      url: response.url(),
    }));

  return await Promise.race([requestFailurePromise, responsePromise]);
};

const visitRoutes = async (page, errors, routes) => {
  for (const route of routes) {
    errors.length = 0;
    await page.goto(route);
    await assertHealthyPage(page, errors, route);
  }
};

test('public and access routes render cleanly without browser runtime crashes', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);
  const routes = [
    '/en',
    '/id',
    '/en/home',
    '/id/home',
    '/en/explore',
    '/en/services',
    `/en/p/${professionalSlug}`,
    `/en/s/${serviceSlug}`,
    '/en/auth/customer',
    '/id/auth/customer',
    '/en/for-professionals',
    '/id/for-professionals',
    '/en/for-professionals/setup',
    '/admin/login',
  ];

  await visitRoutes(page, runtimeErrors, routes);
});

test('customer can sign in through the UI and reuse the restored session on protected routes', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto('/en/auth/customer');
  await assertHealthyPage(page, runtimeErrors, '/en/auth/customer');

  await page.getByLabel('WhatsApp number').fill(customerPhone);
  await page.getByLabel('Password').fill(seededCustomerPassword);

  runtimeErrors.length = 0;
  const customerAuthOutcomePromise = waitForApiOutcome(page, '/api/v1/customers/auth/session');
  await page.getByRole('button', { name: 'Sign in and continue' }).click();
  const customerAuthOutcome = await customerAuthOutcomePromise;
  assert.equal(
    customerAuthOutcome.type,
    'response',
    `Expected customer auth UI login request to receive an HTTP response, but saw ${customerAuthOutcome.type} for ${customerAuthOutcome.url}: ${customerAuthOutcome.errorText}`,
  );
  assert.equal(
    customerAuthOutcome.response.ok(),
    true,
    `Expected customer auth UI login request to succeed, got ${customerAuthOutcome.response.status()} from ${customerAuthOutcome.url}.\n${customerAuthOutcome.body}`,
  );
  await expect(page).toHaveURL(/\/en\/home$/);
  await assertHealthyPage(page, runtimeErrors, '/en/home after customer UI login');

  runtimeErrors.length = 0;
  await page.goto('/en/profile');
  await assertHealthyPage(page, runtimeErrors, '/en/profile after customer UI login');
  await expect(page).not.toHaveURL(/\/auth\/customer/);

  runtimeErrors.length = 0;
  await page.goto('/en/notifications');
  await assertHealthyPage(page, runtimeErrors, '/en/notifications after customer UI login');
  await expect(page).not.toHaveURL(/\/auth\/customer/);
});

test('professional can sign in through the UI and reuse the restored session on dashboard routes', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto('/en/for-professionals');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals');

  if (professionalName) {
    await page
      .getByRole('button', { name: new RegExp(professionalName, 'i') })
      .first()
      .click();
  }

  await page.getByLabel('WhatsApp number').fill(professionalPhone);
  await page.getByLabel('Password').fill(seededProfessionalPassword);

  runtimeErrors.length = 0;
  const professionalAuthOutcomePromise = waitForApiOutcome(page, '/api/v1/professionals/auth/session');
  await page.getByRole('button', { name: 'Sign in to portal' }).click();
  const professionalAuthOutcome = await professionalAuthOutcomePromise;
  assert.equal(
    professionalAuthOutcome.type,
    'response',
    `Expected professional auth UI login request to receive an HTTP response, but saw ${professionalAuthOutcome.type} for ${professionalAuthOutcome.url}: ${professionalAuthOutcome.errorText}`,
  );
  assert.equal(
    professionalAuthOutcome.response.ok(),
    true,
    `Expected professional auth UI login request to succeed, got ${professionalAuthOutcome.response.status()} from ${professionalAuthOutcome.url}.\n${professionalAuthOutcome.body}`,
  );
  await expect(page).toHaveURL(/\/en\/for-professionals\/dashboard/);
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/dashboard after professional UI login');

  runtimeErrors.length = 0;
  await page.goto('/en/for-professionals/dashboard/requests');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/dashboard/requests after professional UI login');
  await expect(page).not.toHaveURL(/\/en\/for-professionals(\?|$)/);

  runtimeErrors.length = 0;
  await page.goto('/en/for-professionals/profile');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/profile after professional UI login');
  await expect(page).not.toHaveURL(/\/en\/for-professionals(\?|$)/);
});

test('customer protected routes render with the seeded customer session bearer token', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${customerBearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  const routes = [
    '/en/profile',
    '/en/appointments',
    `/en/appointments/${appointmentId}`,
    `/en/activity/${appointmentId}`,
    '/en/notifications',
  ];

  for (const route of routes) {
    runtimeErrors.length = 0;
    await page.goto(route);
    await assertHealthyPage(page, runtimeErrors, route);
    await expect(page).not.toHaveURL(/\/auth\/customer/);
  }

  await context.close();
});

test('professional dashboard routes render with the seeded professional session bearer token', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${professionalBearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  const routes = [
    '/en/for-professionals/profile',
    '/en/for-professionals/dashboard',
    '/en/for-professionals/dashboard/overview',
    '/en/for-professionals/dashboard/requests',
    '/en/for-professionals/dashboard/services',
    '/en/for-professionals/dashboard/availability',
    '/en/for-professionals/dashboard/coverage',
    '/en/for-professionals/dashboard/portfolio',
    '/en/for-professionals/dashboard/trust',
    '/en/for-professionals/dashboard/notifications',
  ];

  for (const route of routes) {
    runtimeErrors.length = 0;
    await page.goto(route);
    await assertHealthyPage(page, runtimeErrors, route);
    await expect(page).not.toHaveURL(/\/for-professionals(\?|$)/);
  }

  await context.close();
});

test('admin console routes render with the seeded admin session bearer token', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  const routes = [
    '/admin',
    '/admin/overview',
    '/admin/customers',
    '/admin/professionals',
    '/admin/services',
    '/admin/appointments',
    '/admin/support',
    '/admin/studio',
  ];

  for (const route of routes) {
    runtimeErrors.length = 0;
    await page.goto(route);
    await assertHealthyPage(page, runtimeErrors, route);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  }

  await context.close();
});

test('home route survives malformed /catalog professionals during hydration', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);

  await page.route('**/api/v1/catalog', async (route) => {
    const response = await fetch(`${backendApiBaseUrl}/catalog`);

    assert.equal(
      response.ok,
      true,
      `Expected seeded backend catalog request to succeed while stubbing /catalog, got ${response.status}.`,
    );

    const payload = await response.json();
    const professionalsData = Array.isArray(payload?.data?.professionals) ? payload.data.professionals : [];

    if (professionalsData[0]) {
      professionalsData[0] = {
        ...professionalsData[0],
        coverage: {
          ...professionalsData[0].coverage,
          areaIds: null,
        },
        practiceLocation: {
          ...professionalsData[0].practiceLocation,
          areaId: null,
        },
        services: null,
      };
    }

    await route.fulfill({
      contentType: 'application/json',
      json: payload,
      status: 200,
    });
  });

  await page.goto('/en/home');
  await page.waitForResponse((response) => response.url().includes('/api/v1/catalog') && response.ok());
  await assertHealthyPage(page, runtimeErrors, '/en/home with malformed /catalog payload');
});
