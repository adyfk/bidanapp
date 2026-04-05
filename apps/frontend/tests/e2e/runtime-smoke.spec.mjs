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
const areas = JSON.parse(await readFile(resolve(backendDir, 'seeddata/areas.json'), 'utf8'));
const appointments = JSON.parse(await readFile(resolve(backendDir, 'seeddata/appointments.json'), 'utf8'));

const normalizePhone = (value = '') => {
  const trimmed = value.trim();

  return [...trimmed].filter((character, index) => /\d/.test(character) || (character === '+' && index === 0)).join('');
};

const buildSeedProfessionalPhone = (index) => `+628137000${String(index + 1).padStart(4, '0')}`;
const professionalReviewStatuses = [
  'published',
  'submitted',
  'changes_requested',
  'verified',
  'draft',
  'ready_for_review',
];
const reviewStatusTitles = {
  changes_requested: 'Revisions are required before publishing',
  draft: 'Profile is still inactive',
  published: 'Profile is live',
  ready_for_review: 'Ready to submit for admin review',
  submitted: 'Waiting for admin review',
  verified: 'Verified and ready to publish',
};
const manualQaCaseIds = [
  'PUB-01',
  'PUB-02',
  'PUB-03',
  'PUB-04',
  'CUS-01',
  'CUS-02',
  'CUS-03',
  'PRO-01',
  'PRO-02',
  'PRO-03',
  'PRO-04',
  'PRO-05',
  'PRO-06',
  'ADM-01',
  'ADM-02',
  'ADM-03',
  'ADM-04',
];
const publishedProfessional = professionals.find((professional) => professional.id === '6') ?? professionals[0];
const publishedService = services.find((service) => service.id === 's5') ?? services[0];
const requestedCustomerAppointmentId = 'seed-qa-ibu-nadia-requested';
const historyCompletedAppointmentId = 'seed-qa-mr-hendra-completed';
const historyCancelledAppointmentId = 'seed-qa-mr-hendra-cancelled';
const manualQaPublicCases = [
  {
    id: 'PUB-01',
    routes: ['/id', '/en'],
  },
  {
    id: 'PUB-02',
    routes: ['/id/home', '/id/explore', '/id/services'],
  },
  {
    id: 'PUB-03',
    routes: [`/id/p/${publishedProfessional?.slug ?? ''}`],
  },
  {
    id: 'PUB-04',
    routes: [`/id/s/${publishedService?.slug ?? ''}`],
  },
];
const manualQaCustomerCases = [
  {
    consumerId: 'guest-primary',
    id: 'CUS-01',
    routes: [
      '/id/profile',
      '/id/notifications',
      '/id/appointments',
      '/id/appointments/apt-005',
      '/id/activity/apt-005',
      '/id/appointments/apt-004',
    ],
  },
  {
    consumerId: 'ibu-nadia',
    id: 'CUS-02',
    routes: [
      '/id/profile',
      '/id/notifications',
      '/id/appointments',
      `/id/appointments/${requestedCustomerAppointmentId}`,
    ],
  },
  {
    consumerId: 'mr-hendra',
    id: 'CUS-03',
    routes: [
      '/id/appointments',
      `/id/appointments/${historyCompletedAppointmentId}`,
      `/id/appointments/${historyCancelledAppointmentId}`,
      '/id/services',
      `/id/p/${publishedProfessional?.slug ?? ''}`,
    ],
  },
];
const manualQaProfessionalCases = [
  {
    id: 'PRO-01',
    reviewStatus: 'published',
    routes: [
      '/id/for-professionals/dashboard',
      '/id/for-professionals/dashboard/requests',
      '/id/for-professionals/dashboard/services',
      '/id/for-professionals/dashboard/coverage',
      '/id/for-professionals/dashboard/trust',
    ],
  },
  {
    id: 'PRO-02',
    reviewStatus: 'submitted',
    routes: ['/id/for-professionals/dashboard', '/id/for-professionals/dashboard/overview'],
  },
  {
    id: 'PRO-03',
    reviewStatus: 'changes_requested',
    routes: [
      '/id/for-professionals/dashboard',
      '/id/for-professionals/dashboard/portfolio',
      '/id/for-professionals/dashboard/coverage',
    ],
  },
  {
    id: 'PRO-04',
    reviewStatus: 'verified',
    routes: ['/id/for-professionals/dashboard', '/id/for-professionals/dashboard/trust'],
  },
  {
    id: 'PRO-05',
    reviewStatus: 'draft',
    routes: [
      '/id/for-professionals/dashboard',
      '/id/for-professionals/dashboard/services',
      '/id/for-professionals/dashboard/coverage',
    ],
  },
  {
    id: 'PRO-06',
    reviewStatus: 'ready_for_review',
    routes: [
      '/id/for-professionals/dashboard',
      '/id/for-professionals/dashboard/services',
      '/id/for-professionals/dashboard/overview',
    ],
  },
];
const manualQaAdminCases = [
  {
    id: 'ADM-01',
    routes: ['/admin/support'],
  },
  {
    id: 'ADM-02',
    routes: ['/admin/professionals'],
  },
  {
    id: 'ADM-03',
    routes: ['/admin/customers', '/admin/appointments'],
  },
  {
    id: 'ADM-04',
    routes: ['/admin/services', '/admin/studio'],
  },
];

const professionalSlug = professionals[0]?.slug;
const serviceSlug = services[0]?.slug;
const appointmentId = appointments[0]?.id;
const confirmedHomeVisitAppointment = appointments.find(
  (appointment) => appointment.requestedMode === 'home_visit' && appointment.status === 'confirmed',
);
const confirmedHomeVisitArea = areas.find((area) => area.id === confirmedHomeVisitAppointment?.areaId) ?? null;
const customerPhone = normalizePhone(consumers[0]?.phone ?? '');
const professionalPhone = buildSeedProfessionalPhone(0);
const professionalName = professionals[0]?.name ?? '';
const professionalRegistrationPhone = '+6281391000001';
const professionalRegistrationName = 'Self Signup Midwife';
const professionalPublishPhone = '+6281391000002';
const professionalPublishName = 'Portal Publish Midwife';
const customerBearerToken = `seed-customer-session-${consumers[0]?.id}`;
const professionalBearerToken = `seed-professional-session-${professionals[0]?.id}`;
const seededCustomerSessions = consumers.map((consumer) => ({
  bearerToken: `seed-customer-session-${consumer.id}`,
  consumerId: consumer.id,
}));
const seededProfessionalSessions = professionals.map((professional, index) => {
  const reviewStatus = professionalReviewStatuses[index % professionalReviewStatuses.length];

  return {
    bearerToken: `seed-professional-session-${professional.id}`,
    displayName: professional.name,
    phone: buildSeedProfessionalPhone(index),
    persistedReviewStatus: reviewStatus === 'ready_for_review' ? 'draft' : reviewStatus,
    professionalId: professional.id,
    reviewStatus,
    reviewTitle: reviewStatusTitles[reviewStatus],
  };
});
const confirmedHomeVisitProfessionalSession =
  seededProfessionalSessions.find(
    (session) => session.professionalId === confirmedHomeVisitAppointment?.professionalId,
  ) ?? null;
const submittedProfessionalSession = seededProfessionalSessions.find((session) => session.reviewStatus === 'submitted');
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

const manualQaCoverageIds = [
  ...manualQaPublicCases.map((qaCase) => qaCase.id),
  ...manualQaCustomerCases.map((qaCase) => qaCase.id),
  ...manualQaProfessionalCases.map((qaCase) => qaCase.id),
  ...manualQaAdminCases.map((qaCase) => qaCase.id),
];

const createAuthedPage = async (browser, bearerToken) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);
  return {
    context,
    page,
    runtimeErrors,
  };
};

const readProfessionalPortalReviewStatus = async (browser, professionalSession) => {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      Authorization: `Bearer ${professionalSession.bearerToken}`,
    },
  });

  try {
    const response = await context.request.get(`${backendApiBaseUrl}/professionals/portal/session`, {
      headers: {
        Authorization: `Bearer ${professionalSession.bearerToken}`,
      },
      params: {
        professional_id: professionalSession.professionalId,
      },
    });

    assert.equal(
      response.ok(),
      true,
      `Expected professional portal session to hydrate for ${
        professionalSession.professionalId
      }, got ${response.status()} from ${response.url()}.`,
    );

    const body = await response.json();
    return body?.data?.snapshot?.reviewStatesByProfessionalId?.[professionalSession.professionalId]?.status || 'draft';
  } finally {
    await context.close();
  }
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

const readJson = async (response, message) => {
  assert.equal(response.ok(), true, `${message}. Got ${response.status()} from ${response.url()}.`);
  return await response.json();
};

const fetchJsonFromPage = async (page, url, init = {}) =>
  await page.evaluate(
    async ({ init, url }) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      };
      const response = await fetch(url, {
        ...init,
        body: typeof init.body === 'undefined' ? undefined : JSON.stringify(init.body),
        credentials: 'include',
        headers,
      });
      const text = await response.text();
      let body = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      return {
        body,
        ok: response.ok,
        status: response.status,
        url: response.url,
      };
    },
    { init, url },
  );

const expectPageJsonOk = (response, message) => {
  assert.equal(response.ok, true, `${message}. Got ${response.status} from ${response.url}.`);
  return response.body;
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

test('manual QA case coverage pack stays aligned with the seeded route matrix', async () => {
  assert.deepEqual(
    manualQaCoverageIds,
    manualQaCaseIds,
    `Expected Playwright manual QA coverage IDs to stay aligned with the seeded QA case pack.`,
  );
});

test('manual QA public cases render all seeded routes in Indonesian locale', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);

  for (const manualQaCase of manualQaPublicCases) {
    await test.step(manualQaCase.id, async () => {
      await visitRoutes(page, runtimeErrors, manualQaCase.routes);
    });
  }
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
    `Expected customer auth UI login request to succeed, got ${customerAuthOutcome.response.status()} from ${
      customerAuthOutcome.url
    }.\n${customerAuthOutcome.body}`,
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
    `Expected professional auth UI login request to succeed, got ${professionalAuthOutcome.response.status()} from ${
      professionalAuthOutcome.url
    }.\n${professionalAuthOutcome.body}`,
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

test('home visit departure syncs OTW status to the customer activity screen with a ready service worker channel', async ({
  browser,
}) => {
  assert.ok(confirmedHomeVisitAppointment?.id, 'Expected a seeded confirmed home-visit appointment for OTW testing.');
  assert.ok(
    confirmedHomeVisitArea?.id,
    `Expected a seeded area for appointment ${confirmedHomeVisitAppointment?.id ?? 'unknown'}.`,
  );
  assert.ok(
    confirmedHomeVisitProfessionalSession?.professionalId,
    `Expected a seeded professional session for appointment ${confirmedHomeVisitAppointment?.id ?? 'unknown'}.`,
  );

  const customerContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer seed-customer-session-${confirmedHomeVisitAppointment.consumerId}`,
    },
  });
  await customerContext.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:3301' });
  const customerPage = await customerContext.newPage();
  const customerRuntimeErrors = trackRuntimeErrors(customerPage);

  await customerPage.goto(`/en/activity/${confirmedHomeVisitAppointment.id}`);
  await assertHealthyPage(customerPage, customerRuntimeErrors, `/en/activity/${confirmedHomeVisitAppointment.id}`);

  await customerPage.evaluate(() => {
    window.__bidanappPushPayloads = [];
    window.addEventListener('bidanapp:push-received', (event) => {
      window.__bidanappPushPayloads.push(event.detail ?? null);
    });
  });

  await expect
    .poll(async () => {
      return await customerPage.evaluate(async () => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
          return {
            hasPushManager: false,
            hasServiceWorker: false,
            notificationPermission: 'unsupported',
            registrationScope: null,
          };
        }

        const registration =
          (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready.catch(() => null));

        return {
          hasPushManager: 'PushManager' in window,
          hasServiceWorker: Boolean(registration?.active),
          notificationPermission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
          registrationScope: registration?.scope ?? null,
        };
      });
    })
    .toMatchObject({
      hasPushManager: true,
      hasServiceWorker: true,
    });

  const customerPushChannel = await customerPage.evaluate(async () => {
    const registration =
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready.catch(() => null))
        : null;

    return {
      hasPushManager: true,
      hasServiceWorker: Boolean(registration?.active),
      notificationPermission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
      registrationScope: registration?.scope ?? null,
    };
  });

  assert.equal(
    typeof customerPushChannel.registrationScope,
    'string',
    'Expected the customer browser to keep an active service worker registration scope.',
  );

  await expect(customerPage.locator('body')).toContainText('The professional has not started the trip yet.');

  const professionalContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer seed-professional-session-${confirmedHomeVisitProfessionalSession.professionalId}`,
    },
    geolocation: {
      latitude: confirmedHomeVisitArea.latitude + 0.03,
      longitude: confirmedHomeVisitArea.longitude + 0.03,
    },
  });
  await professionalContext.grantPermissions(['geolocation'], { origin: 'http://127.0.0.1:3301' });
  const professionalPage = await professionalContext.newPage();
  const professionalRuntimeErrors = trackRuntimeErrors(professionalPage);

  await professionalPage.goto('/en/for-professionals/dashboard/requests');
  await assertHealthyPage(
    professionalPage,
    professionalRuntimeErrors,
    '/en/for-professionals/dashboard/requests for home-visit departure',
  );

  const departureResponse = await professionalContext.request.post(
    `${backendApiBaseUrl}/appointments/${confirmedHomeVisitAppointment.id}/depart`,
    {
      data: {
        currentLocation: {
          latitude: confirmedHomeVisitArea.latitude + 0.03,
          longitude: confirmedHomeVisitArea.longitude + 0.03,
        },
      },
      headers: {
        Authorization: `Bearer seed-professional-session-${confirmedHomeVisitProfessionalSession.professionalId}`,
      },
    },
  );
  assert.equal(
    departureResponse.ok(),
    true,
    `Expected home-visit departure request to succeed, got ${departureResponse.status()} from ${departureResponse.url()}.`,
  );

  await expect
    .poll(
      async () => {
        return await customerPage.locator('body').innerText();
      },
      { timeout: 20_000 },
    )
    .toContain('The professional has departed and is heading to your location.');
  await expect(customerPage.locator('body')).not.toContainText('The professional has not started the trip yet.');
  await expect(customerPage.locator('body')).toContainText('About');

  if (customerPushChannel.notificationPermission === 'granted') {
    await expect
      .poll(
        async () => {
          return await customerPage.evaluate(() => window.__bidanappPushPayloads.length);
        },
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
  } else {
    assert.equal(
      customerPushChannel.notificationPermission,
      'denied',
      `Expected headless browser notification permission to stay denied when native web push cannot be subscribed. Received ${customerPushChannel.notificationPermission}.`,
    );
  }

  await professionalContext.close();
  await customerContext.close();
});

test('professional can self-register into a clean onboarding draft', async ({ page }) => {
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto('/en/for-professionals');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals register flow');

  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Full name').fill(professionalRegistrationName);
  await page.getByLabel('WhatsApp number').fill(professionalRegistrationPhone);
  await page.getByLabel('City').fill('Jakarta Selatan');
  await page.getByLabel('STR / license number').fill('STR-SELF-PLAYWRIGHT');
  await page.getByLabel('Password').fill(seededProfessionalPassword);

  runtimeErrors.length = 0;
  const professionalRegisterOutcomePromise = waitForApiOutcome(page, '/api/v1/professionals/auth/register');
  await page.getByRole('button', { name: 'Register and open profile' }).click();
  const professionalRegisterOutcome = await professionalRegisterOutcomePromise;
  assert.equal(
    professionalRegisterOutcome.type,
    'response',
    `Expected professional registration to receive an HTTP response, but saw ${professionalRegisterOutcome.type} for ${professionalRegisterOutcome.url}: ${professionalRegisterOutcome.errorText}`,
  );
  assert.equal(
    professionalRegisterOutcome.response.ok(),
    true,
    `Expected professional registration to succeed, got ${professionalRegisterOutcome.response.status()} from ${
      professionalRegisterOutcome.url
    }.\n${professionalRegisterOutcome.body}`,
  );
  await expect(page).toHaveURL(/\/en\/for-professionals\/dashboard/);
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/dashboard after professional self-registration');
  await expect(page.locator('body')).toContainText('Profile is still inactive');
  await expect(page.locator('body')).toContainText('Active services0');
  await expect(page.locator('body')).toContainText('Average priceRp');
  await expect(page.locator('body')).toContainText('Coverage0 areas');
});

test('professional self-signup can complete onboarding, submit, get published by admin, and appear on public routes', async ({
  browser,
}) => {
  const area = areas[0];
  assert.ok(area?.id, 'Expected seeded areas to be available for professional onboarding coverage.');

  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  await page.goto('/en/for-professionals');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals publish flow register');

  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Full name').fill(professionalPublishName);
  await page.getByLabel('WhatsApp number').fill(professionalPublishPhone);
  await page.getByLabel('City').fill(area.city);
  await page.getByLabel('STR / license number').fill('STR-PORTAL-PUBLISH');
  await page.getByLabel('Password').fill(seededProfessionalPassword);

  runtimeErrors.length = 0;
  const professionalRegisterOutcomePromise = waitForApiOutcome(page, '/api/v1/professionals/auth/register');
  await page.getByRole('button', { name: 'Register and open profile' }).click();
  const professionalRegisterOutcome = await professionalRegisterOutcomePromise;
  assert.equal(
    professionalRegisterOutcome.type,
    'response',
    `Expected professional registration to receive an HTTP response, but saw ${professionalRegisterOutcome.type} for ${professionalRegisterOutcome.url}: ${professionalRegisterOutcome.errorText}`,
  );
  assert.equal(
    professionalRegisterOutcome.response.ok(),
    true,
    `Expected professional registration to succeed, got ${professionalRegisterOutcome.response.status()} from ${
      professionalRegisterOutcome.url
    }.\n${professionalRegisterOutcome.body}`,
  );
  await expect(page).toHaveURL(/\/en\/for-professionals\/dashboard/);
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/dashboard after publish-flow registration');

  const professionalRegisterBody = JSON.parse(professionalRegisterOutcome.body);
  const professionalId = professionalRegisterBody?.data?.professionalId;
  assert.ok(professionalId, 'Expected professional registration response to include a professionalId.');

  const initialPortalSessionBody = expectPageJsonOk(
    await fetchJsonFromPage(
      page,
      `${backendApiBaseUrl}/professionals/portal/session?professional_id=${professionalId}`,
    ),
    'Expected the newly registered professional portal session to hydrate',
  );
  const serviceConfigurations =
    initialPortalSessionBody?.data?.snapshot?.state?.serviceConfigurations &&
    Array.isArray(initialPortalSessionBody.data.snapshot.state.serviceConfigurations)
      ? initialPortalSessionBody.data.snapshot.state.serviceConfigurations
      : [];
  assert.ok(serviceConfigurations.length > 0, 'Expected registration to provision service configuration templates.');

  const targetService = serviceConfigurations.find((service) => service.serviceId === 's5') ?? serviceConfigurations[0];
  assert.ok(targetService?.serviceId, 'Expected at least one service configuration to be available.');

  const profileResponse = await fetchJsonFromPage(page, `${backendApiBaseUrl}/professionals/me/profile`, {
    body: {
      acceptingNewClients: false,
      autoApproveInstantBookings: false,
      city: area.city,
      credentialNumber: 'STR-PORTAL-PUBLISH',
      displayName: professionalPublishName,
      phone: professionalPublishPhone,
      professionalId,
      publicBio: 'Home, clinic, and virtual postpartum support for newborn and lactation care.',
      responseTimeGoal: 'Responds within 15 minutes during clinic hours',
      yearsExperience: '7 years',
    },
    method: 'PUT',
  });
  expectPageJsonOk(profileResponse, 'Expected professional profile upsert to succeed');

  const coverageResponse = await fetchJsonFromPage(page, `${backendApiBaseUrl}/professionals/me/coverage`, {
    body: {
      acceptingNewClients: false,
      autoApproveInstantBookings: false,
      availabilityRulesByMode: {},
      city: area.city,
      coverageAreaIds: [area.id],
      coverageCenter: {
        latitude: area.latitude,
        longitude: area.longitude,
      },
      homeVisitRadiusKm: 0,
      practiceAddress: 'Jl. Kesehatan Ibu No. 10, Jakarta Selatan',
      practiceLabel: 'Klinik Laktasi Cilandak',
      professionalId,
      publicBio: 'Home, clinic, and virtual postpartum support for newborn and lactation care.',
      responseTimeGoal: 'Responds within 15 minutes during clinic hours',
    },
    method: 'PUT',
  });
  expectPageJsonOk(coverageResponse, 'Expected professional coverage upsert to succeed');

  const servicesResponse = await fetchJsonFromPage(page, `${backendApiBaseUrl}/professionals/me/services`, {
    body: {
      professionalId,
      serviceConfigurations: serviceConfigurations.map((service, index) =>
        service.id === targetService.id
          ? {
              ...service,
              bookingFlow: service.bookingFlow || 'request',
              defaultMode: 'online',
              duration: '60 menit',
              featured: true,
              index: index + 1,
              isActive: true,
              price: 'Rp 250.000',
              serviceModes: {
                homeVisit: false,
                online: true,
                onsite: false,
              },
              source: service.source || 'template',
              summary: 'Virtual lactation consultation with feeding review and action plan.',
            }
          : {
              ...service,
              bookingFlow: service.bookingFlow || 'request',
              defaultMode: service.defaultMode || 'online',
              duration: service.duration || '',
              featured: false,
              index: index + 1,
              isActive: false,
              price: service.price || '',
              serviceModes: {
                homeVisit: Boolean(service.serviceModes?.homeVisit),
                online: Boolean(service.serviceModes?.online),
                onsite: Boolean(service.serviceModes?.onsite),
              },
              source: service.source || 'template',
              summary: service.summary || '',
            },
      ),
    },
    method: 'PUT',
  });
  expectPageJsonOk(servicesResponse, 'Expected professional services upsert to succeed');

  const portfolioResponse = await fetchJsonFromPage(page, `${backendApiBaseUrl}/professionals/me/portfolio`, {
    body: {
      portfolioEntries: [
        {
          id: 'portfolio-publish-1',
          image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop',
          index: 1,
          outcomes: ['Exclusive breastfeeding plan completed', '24-hour follow-up delivered'],
          periodLabel: 'March 2026',
          serviceId: targetService.serviceId,
          summary: 'Guided a postpartum mother through latch correction and pumping adjustments.',
          title: 'Postpartum lactation support case',
          visibility: 'public',
        },
      ],
      professionalId,
    },
    method: 'PUT',
  });
  expectPageJsonOk(portfolioResponse, 'Expected professional portfolio upsert to succeed');

  runtimeErrors.length = 0;
  await page.goto('/en/for-professionals/dashboard');
  await assertHealthyPage(page, runtimeErrors, '/en/for-professionals/dashboard before submission');
  await expect(page.locator('body')).toContainText('Ready to submit for admin review');

  await page.getByRole('button', { name: 'Submit to admin' }).click();
  await expect
    .poll(
      async () => {
        const submittedPortalSessionBody = expectPageJsonOk(
          await fetchJsonFromPage(
            page,
            `${backendApiBaseUrl}/professionals/portal/session?professional_id=${professionalId}`,
          ),
          'Expected professional portal session to remain readable after submission',
        );

        return submittedPortalSessionBody?.data?.snapshot?.reviewStatesByProfessionalId?.[professionalId]?.status;
      },
      {
        message: `Expected ${professionalId} to be submitted after the onboarding handoff.`,
        timeout: 15_000,
      },
    )
    .toBe('submitted');

  const adminContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  const adminPage = await adminContext.newPage();
  const adminRuntimeErrors = trackRuntimeErrors(adminPage);
  const searchInput = adminPage.getByPlaceholder('Cari nama, title, id, atau status approval.');
  const approvalQueueSection = adminPage
    .locator('section')
    .filter({ hasText: 'Antrian review FIFO profesional' })
    .first();
  const queueEntryCheckbox = () =>
    approvalQueueSection
      .getByRole('button', {
        name: new RegExp(professionalPublishName, 'i'),
      })
      .first()
      .locator('xpath=..')
      .locator('input[type="checkbox"]');

  await adminPage.goto('/admin/professionals');
  await assertHealthyPage(adminPage, adminRuntimeErrors, '/admin/professionals for new professional publish flow');

  await searchInput.fill(professionalId);
  await queueEntryCheckbox().check();

  const verifySyncResponsePromise = adminPage.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/admin/professionals/review-state') &&
      response.request().method() === 'PUT' &&
      response.ok(),
  );
  await adminPage.getByRole('button', { name: 'Bulk verified' }).click();
  await verifySyncResponsePromise;
  await expect
    .poll(
      async () => {
        const verifiedPortalSessionBody = expectPageJsonOk(
          await fetchJsonFromPage(
            page,
            `${backendApiBaseUrl}/professionals/portal/session?professional_id=${professionalId}`,
          ),
          'Expected professional portal session to remain readable after admin verification',
        );

        return verifiedPortalSessionBody?.data?.snapshot?.reviewStatesByProfessionalId?.[professionalId]?.status;
      },
      {
        message: `Expected ${professionalId} to be verified after the admin review action.`,
        timeout: 15_000,
      },
    )
    .toBe('verified');

  adminRuntimeErrors.length = 0;
  await adminPage.reload();
  await assertHealthyPage(
    adminPage,
    adminRuntimeErrors,
    '/admin/professionals after verify during new professional publish flow',
  );

  await searchInput.fill(professionalId);
  await queueEntryCheckbox().check();

  const publishSyncResponsePromise = adminPage.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/admin/professionals/review-state') &&
      response.request().method() === 'PUT' &&
      response.ok(),
  );
  await adminPage.getByRole('button', { name: 'Bulk publish' }).click();
  await publishSyncResponsePromise;
  await expect
    .poll(
      async () => {
        const publishedPortalSessionBody = expectPageJsonOk(
          await fetchJsonFromPage(
            page,
            `${backendApiBaseUrl}/professionals/portal/session?professional_id=${professionalId}`,
          ),
          'Expected professional portal session to remain readable after publish',
        );

        return publishedPortalSessionBody?.data?.snapshot?.reviewStatesByProfessionalId?.[professionalId]?.status;
      },
      {
        message: `Expected ${professionalId} to be published after the admin publish action.`,
        timeout: 15_000,
      },
    )
    .toBe('published');

  const catalogBody = await readJson(
    await context.request.get(`${backendApiBaseUrl}/catalog`),
    'Expected public catalog request to succeed after publishing a new professional',
  );
  const publishedProfessional = Array.isArray(catalogBody?.data?.professionals)
    ? catalogBody.data.professionals.find((professional) => professional.id === professionalId)
    : undefined;
  assert.ok(
    publishedProfessional?.slug,
    `Expected published professional ${professionalId} to appear in the public catalog with a slug.`,
  );

  runtimeErrors.length = 0;
  await page.goto(`/en/p/${publishedProfessional.slug}`);
  await assertHealthyPage(page, runtimeErrors, `/en/p/${publishedProfessional.slug} after admin publish`);
  await expect(page.locator('body')).toContainText(professionalPublishName);
  await expect(page.locator('body')).toContainText(
    'Virtual lactation consultation with feeding review and action plan.',
  );

  await adminContext.close();
  await context.close();
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

test('all seeded customer personas can reuse bearer sessions on core protected routes', async ({ browser }) => {
  for (const customerSession of seededCustomerSessions) {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:3301',
      extraHTTPHeaders: {
        Authorization: `Bearer ${customerSession.bearerToken}`,
      },
    });
    const page = await context.newPage();
    const runtimeErrors = trackRuntimeErrors(page);

    for (const route of ['/en/profile', '/en/appointments', '/en/notifications']) {
      runtimeErrors.length = 0;
      await page.goto(route);
      await assertHealthyPage(page, runtimeErrors, `${route} for ${customerSession.consumerId}`);
      await expect(page).not.toHaveURL(/\/auth\/customer/);
    }

    await context.close();
  }
});

test('manual QA customer cases keep seeded appointment journeys reachable', async ({ browser }) => {
  for (const manualQaCase of manualQaCustomerCases) {
    const session = seededCustomerSessions.find((candidate) => candidate.consumerId === manualQaCase.consumerId);
    assert.ok(session?.bearerToken, `Expected a seeded customer bearer token for ${manualQaCase.id}.`);

    const { context, page, runtimeErrors } = await createAuthedPage(browser, session.bearerToken);

    try {
      await test.step(manualQaCase.id, async () => {
        for (const route of manualQaCase.routes) {
          runtimeErrors.length = 0;
          await page.goto(route);
          await assertHealthyPage(page, runtimeErrors, `${manualQaCase.id} ${route}`);
          await expect(page).not.toHaveURL(/\/auth\/customer/);
        }
      });
    } finally {
      await context.close();
    }
  }
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

test('all seeded professional review states render the expected onboarding status', async ({ browser }) => {
  for (const professionalSession of seededProfessionalSessions) {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:3301',
      extraHTTPHeaders: {
        Authorization: `Bearer ${professionalSession.bearerToken}`,
      },
    });
    const page = await context.newPage();
    const runtimeErrors = trackRuntimeErrors(page);

    await page.goto('/en/for-professionals/dashboard');

    await assertHealthyPage(
      page,
      runtimeErrors,
      `/en/for-professionals/dashboard for ${professionalSession.professionalId}`,
    );
    await expect(page).not.toHaveURL(/\/en\/for-professionals(\?|$)/);

    const portalSessionResponse = await context.request.get(`${backendApiBaseUrl}/professionals/portal/session`, {
      headers: {
        Authorization: `Bearer ${professionalSession.bearerToken}`,
      },
      params: {
        professional_id: professionalSession.professionalId,
      },
    });
    assert.equal(
      portalSessionResponse.ok(),
      true,
      `Expected professional portal session to hydrate for ${
        professionalSession.professionalId
      }, got ${portalSessionResponse.status()} from ${portalSessionResponse.url()}.`,
    );
    const portalSessionBody = await portalSessionResponse.json();
    const hydratedReviewStatus =
      portalSessionBody?.data?.snapshot?.reviewStatesByProfessionalId?.[professionalSession.professionalId]?.status ||
      'draft';
    assert.equal(
      hydratedReviewStatus,
      professionalSession.persistedReviewStatus,
      `Expected hydrated professional review status for ${professionalSession.professionalId} to be ${professionalSession.persistedReviewStatus}.`,
    );

    await context.close();
  }
});

test('manual QA professional cases keep seeded review-state route packs reachable', async ({ browser }) => {
  for (const manualQaCase of manualQaProfessionalCases) {
    const session = seededProfessionalSessions.find(
      (candidate) => candidate.reviewStatus === manualQaCase.reviewStatus,
    );
    assert.ok(session?.bearerToken, `Expected a seeded professional bearer token for ${manualQaCase.id}.`);

    const { context, page, runtimeErrors } = await createAuthedPage(browser, session.bearerToken);

    try {
      await test.step(manualQaCase.id, async () => {
        for (const route of manualQaCase.routes) {
          runtimeErrors.length = 0;
          await page.goto(route);
          await assertHealthyPage(page, runtimeErrors, `${manualQaCase.id} ${route}`);
          await expect(page).not.toHaveURL(/\/for-professionals(\?|$)/);
        }

        const persistedReviewStatus = await readProfessionalPortalReviewStatus(browser, session);
        assert.equal(
          persistedReviewStatus,
          session.persistedReviewStatus,
          `Expected ${manualQaCase.id} to keep persisted review status ${session.persistedReviewStatus}.`,
        );
      });
    } finally {
      await context.close();
    }
  }
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
    '/admin/studio',
    '/admin/appointments',
    '/admin/support',
  ];

  for (const route of routes) {
    runtimeErrors.length = 0;
    await page.goto(route);
    await assertHealthyPage(page, runtimeErrors, route);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  }

  await context.close();
});

test('manual QA admin cases keep seeded support, ops, and studio routes reachable', async ({ browser }) => {
  const { context, page, runtimeErrors } = await createAuthedPage(browser, adminBearerToken);

  try {
    for (const manualQaCase of manualQaAdminCases) {
      await test.step(manualQaCase.id, async () => {
        for (const route of manualQaCase.routes) {
          runtimeErrors.length = 0;
          await page.goto(route);
          await assertHealthyPage(page, runtimeErrors, `${manualQaCase.id} ${route}`);
          await expect(page).not.toHaveURL(/\/admin\/login/);
        }
      });
    }
  } finally {
    await context.close();
  }
});

test('admin bulk review and publish actions persist professional lifecycle state after reload', async ({ browser }) => {
  assert.ok(submittedProfessionalSession, 'Expected seeded dataset to include a submitted professional.');

  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);
  const searchInput = page.getByPlaceholder('Cari nama, title, id, atau status approval.');
  const approvalQueueSection = page.locator('section').filter({ hasText: 'Antrian review FIFO profesional' }).first();

  const queueEntryCheckbox = () =>
    approvalQueueSection
      .getByRole('button', {
        name: new RegExp(submittedProfessionalSession.displayName, 'i'),
      })
      .first()
      .locator('xpath=..')
      .locator('input[type="checkbox"]');

  await page.goto('/admin/professionals');
  await assertHealthyPage(page, runtimeErrors, '/admin/professionals for bulk review flow');

  await searchInput.fill(submittedProfessionalSession.professionalId);
  await queueEntryCheckbox().check();

  const verifySyncResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/admin/professionals/review-state') &&
      response.request().method() === 'PUT' &&
      response.ok(),
  );
  await page.getByRole('button', { name: 'Bulk verified' }).click();
  await verifySyncResponsePromise;

  runtimeErrors.length = 0;
  await page.reload();
  await assertHealthyPage(page, runtimeErrors, '/admin/professionals after bulk verified reload');
  assert.equal(
    await readProfessionalPortalReviewStatus(browser, submittedProfessionalSession),
    'verified',
    `Expected ${submittedProfessionalSession.professionalId} to persist as verified after bulk review.`,
  );

  await searchInput.fill(submittedProfessionalSession.professionalId);
  await queueEntryCheckbox().check();

  const publishSyncResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/admin/professionals/review-state') &&
      response.request().method() === 'PUT' &&
      response.ok(),
  );
  await page.getByRole('button', { name: 'Bulk publish' }).click();
  await publishSyncResponsePromise;

  runtimeErrors.length = 0;
  await page.reload();
  await assertHealthyPage(page, runtimeErrors, '/admin/professionals after bulk publish reload');
  assert.equal(
    await readProfessionalPortalReviewStatus(browser, submittedProfessionalSession),
    'published',
    `Expected ${submittedProfessionalSession.professionalId} to persist as published after bulk publish.`,
  );

  await context.close();
});

test('admin service mutations are reflected by public service routes', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3301',
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  const page = await context.newPage();
  const runtimeErrors = trackRuntimeErrors(page);

  const servicesTableResponse = await context.request.get(`${backendApiBaseUrl}/admin/console/tables/services`, {
    headers: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  assert.equal(servicesTableResponse.ok(), true, 'Expected admin services table request to succeed.');

  const servicesTableBody = await servicesTableResponse.json();
  const serviceRows = Array.isArray(servicesTableBody?.data?.rows) ? servicesTableBody.data.rows : [];
  const seedService = serviceRows.find((candidate) => candidate.slug === serviceSlug) ?? serviceRows[0];

  assert.ok(seedService?.id, 'Expected a seed service row to be present in the admin console services table.');

  const updatedServiceName = `${seedService.name} Synced`;
  const updateResponse = await context.request.put(`${backendApiBaseUrl}/admin/console/tables/services`, {
    data: {
      rows: serviceRows.map((row, index) =>
        row.id === seedService.id
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
      savedAt: servicesTableBody?.data?.savedAt,
      schemaVersion: servicesTableBody?.data?.schemaVersion ?? 1,
    },
    headers: {
      Authorization: `Bearer ${adminBearerToken}`,
    },
  });
  assert.equal(updateResponse.ok(), true, 'Expected admin services table mutation to succeed.');

  await page.goto(`/en/s/${seedService.slug}`);
  await assertHealthyPage(page, runtimeErrors, `/en/s/${seedService.slug} after admin service mutation`);
  await expect(page.locator('body')).toContainText(updatedServiceName);

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
