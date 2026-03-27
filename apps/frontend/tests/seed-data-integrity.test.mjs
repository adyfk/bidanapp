import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');
const backendDir = resolve(frontendDir, '..', 'backend');

const readJson = async (relativePath) => JSON.parse(await readFile(resolve(backendDir, relativePath), 'utf8'));

const [
  appointments,
  areas,
  chatThreads,
  consumers,
  homeFeedSnapshots,
  practiceLocations,
  professionalCoverageAreas,
  professionals,
  runtimeSelections,
  serviceOfferings,
  userContexts,
] = await Promise.all([
  readJson('seeddata/appointments.json'),
  readJson('seeddata/areas.json'),
  readJson('seeddata/chat_threads.json'),
  readJson('seeddata/consumers.json'),
  readJson('seeddata/home_feed_snapshots.json'),
  readJson('seeddata/professional_practice_locations.json'),
  readJson('seeddata/professional_coverage_areas.json'),
  readJson('seeddata/professionals.json'),
  readJson('seeddata/app_runtime_selections.json'),
  readJson('seeddata/professional_service_offerings.json'),
  readJson('seeddata/user_contexts.json'),
]);
const areasById = new Map(areas.map((area) => [area.id, area]));
const consumersById = new Map(consumers.map((consumer) => [consumer.id, consumer]));
const professionalsById = new Map(professionals.map((professional) => [professional.id, professional]));
const userContextIds = new Set(userContexts.map((context) => context.id));
const requiredCoveredCities = [
  'Bandung',
  'Bekasi',
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Medan',
  'Surabaya',
  'Tangerang Selatan',
];
const requiredOperationalCities = ['Bekasi', 'Bandung', 'Jakarta Selatan', 'Medan', 'Surabaya', 'Tangerang Selatan'];
const requiredAppointmentStatuses = [
  'approved_waiting_payment',
  'cancelled',
  'completed',
  'confirmed',
  'expired',
  'in_service',
  'paid',
  'rejected',
  'requested',
];
const requiredBookingFlows = ['instant', 'request'];
const requiredModes = ['home_visit', 'online', 'onsite'];

test('appointment seeds carry unified request and activity metadata', () => {
  for (const appointment of appointments) {
    assert.ok(appointment.areaId, `Missing areaId for ${appointment.id}`);
    assert.ok(areasById.has(appointment.areaId), `Unknown area ${appointment.areaId} for ${appointment.id}`);
    assert.ok(appointment.requestedMode, `Missing requestedMode for ${appointment.id}`);
    assert.equal('requestChannel' in appointment, false, `Legacy requestChannel still present for ${appointment.id}`);
    assert.equal(
      'rescheduleRequest' in appointment,
      false,
      `Legacy rescheduleRequest still present for ${appointment.id}`,
    );
    assert.equal('changeRequest' in appointment, false, `Legacy changeRequest still present for ${appointment.id}`);
    assert.ok(appointment.requestNote, `Missing requestNote for ${appointment.id}`);
    assert.match(
      appointment.requestedAt,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      `Invalid requestedAt for ${appointment.id}`,
    );
    assert.ok(appointment.recentActivity, `Missing recentActivity for ${appointment.id}`);
    assert.ok(appointment.recentActivity.title, `Missing recentActivity.title for ${appointment.id}`);
    assert.ok(appointment.recentActivity.summary, `Missing recentActivity.summary for ${appointment.id}`);
  }
});

test('seeded Indonesia metro references stay aligned across runtime fixtures', () => {
  const coveredCities = new Set(areas.map((area) => area.city));

  for (const city of requiredCoveredCities) {
    assert.ok(coveredCities.has(city), `Expected seeded market coverage for ${city}`);
  }

  for (const context of userContexts) {
    assert.ok(
      areasById.has(context.selectedAreaId),
      `Unknown selectedAreaId ${context.selectedAreaId} for ${context.id}`,
    );
  }

  for (const snapshot of homeFeedSnapshots) {
    assert.ok(consumersById.has(snapshot.consumerId), `Unknown consumer ${snapshot.consumerId} for ${snapshot.id}`);
    assert.ok(
      userContextIds.has(snapshot.userContextId),
      `Unknown userContext ${snapshot.userContextId} for ${snapshot.id}`,
    );
  }

  for (const selection of runtimeSelections) {
    assert.ok(
      consumersById.has(selection.currentConsumerId),
      `Unknown runtime consumer ${selection.currentConsumerId} for ${selection.id}`,
    );
    assert.ok(
      userContextIds.has(selection.currentUserContextId),
      `Unknown runtime userContext ${selection.currentUserContextId} for ${selection.id}`,
    );
  }

  for (const location of practiceLocations) {
    assert.ok(
      professionalsById.has(location.professionalId),
      `Unknown professional ${location.professionalId} for practice ${location.id}`,
    );
    assert.ok(areasById.has(location.areaId), `Unknown practice area ${location.areaId} for ${location.id}`);
  }

  for (const coverage of professionalCoverageAreas) {
    assert.ok(
      professionalsById.has(coverage.professionalId),
      `Unknown professional ${coverage.professionalId} for coverage ${coverage.id}`,
    );
    assert.ok(areasById.has(coverage.areaId), `Unknown coverage area ${coverage.areaId} for ${coverage.id}`);
  }
});

test('appointment chat threads align with appointment ownership', () => {
  const appointmentsById = new Map(appointments.map((appointment) => [appointment.id, appointment]));
  const appointmentThreads = chatThreads.filter((thread) => thread.threadType === 'appointment');

  assert.equal(
    appointmentThreads.length,
    appointments.length,
    'Expected one appointment chat thread for every appointment row',
  );

  for (const thread of appointmentThreads) {
    const appointment = appointmentsById.get(thread.appointmentId);

    assert.ok(appointment, `Missing appointment for thread ${thread.id}`);
    assert.equal(
      thread.professionalId,
      appointment.professionalId,
      `Professional mismatch between thread ${thread.id} and ${thread.appointmentId}`,
    );
  }
});

test('seeded business coverage spans metro operations, booking flows, and appointment modes', () => {
  const appointmentStatuses = new Set(appointments.map((appointment) => appointment.status));
  const appointmentModes = new Set(appointments.map((appointment) => appointment.requestedMode));
  const bookingFlows = new Set(serviceOfferings.map((offering) => offering.bookingFlow));
  const supportedServiceModes = new Set();
  const practiceCities = new Set(
    practiceLocations
      .map((location) => areasById.get(location.areaId)?.city)
      .filter((city) => typeof city === 'string' && city.length > 0),
  );

  for (const offering of serviceOfferings) {
    if (offering.supportsHomeVisit) {
      supportedServiceModes.add('home_visit');
    }
    if (offering.supportsOnline) {
      supportedServiceModes.add('online');
    }
    if (offering.supportsOnsite) {
      supportedServiceModes.add('onsite');
    }
  }

  for (const city of requiredOperationalCities) {
    assert.ok(practiceCities.has(city), `Expected a seeded professional practice in ${city}`);
  }

  for (const status of requiredAppointmentStatuses) {
    assert.ok(appointmentStatuses.has(status), `Expected seeded appointment status ${status}`);
  }

  for (const mode of requiredModes) {
    assert.ok(appointmentModes.has(mode), `Expected seeded appointment mode ${mode}`);
    assert.ok(supportedServiceModes.has(mode), `Expected service offerings to support ${mode}`);
  }

  for (const flow of requiredBookingFlows) {
    assert.ok(bookingFlows.has(flow), `Expected seeded booking flow ${flow}`);
  }
});

test('every professional recent activity can be derived from appointments', () => {
  const professionalIdsWithActivities = new Set(
    appointments.filter((appointment) => appointment.recentActivity).map((appointment) => appointment.professionalId),
  );

  for (const professional of professionals) {
    assert.ok(
      professionalIdsWithActivities.has(professional.id),
      `Professional ${professional.id} is missing an appointment-linked recent activity`,
    );
  }
});
