import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');

const readJson = async (relativePath) => JSON.parse(await readFile(resolve(frontendDir, relativePath), 'utf8'));

const [
  appointments,
  areas,
  bookingFlows,
  dateOverrides,
  offerings,
  runtimeSelections,
  services,
  weeklyHours,
  availabilityPolicies,
] = await Promise.all([
  readJson('src/data/mock-db/appointments.json'),
  readJson('src/data/mock-db/areas.json'),
  readJson('src/data/mock-db/reference_booking_flows.json'),
  readJson('src/data/mock-db/professional_availability_date_overrides.json'),
  readJson('src/data/mock-db/professional_service_offerings.json'),
  readJson('src/data/mock-db/app_runtime_selections.json'),
  readJson('src/data/mock-db/services.json'),
  readJson('src/data/mock-db/professional_availability_weekly_hours.json'),
  readJson('src/data/mock-db/professional_availability_policies.json'),
]);

const areasById = new Map(areas.map((area) => [area.id, area]));
const bookingFlowsByCode = new Map(bookingFlows.map((flow) => [flow.code, flow]));
const dateOverrideByProfessionalModeAndDate = new Map(
  dateOverrides.map((override) => [`${override.professionalId}:${override.mode}:${override.dateIso}`, override]),
);
const offeringsById = new Map(offerings.map((offering) => [offering.id, offering]));
const availabilityPoliciesByProfessionalMode = new Map(
  availabilityPolicies.map((policy) => [`${policy.professionalId}:${policy.mode}`, policy]),
);
const servicesById = new Map(services.map((service) => [service.id, service]));
const weeklyHoursByProfessionalModeAndWeekday = new Map(
  weeklyHours.map((row) => [`${row.professionalId}:${row.mode}:${row.weekday}`, row]),
);
const allowedMinimumNoticeHours = new Set([4, 12, 24, 48]);

const parsePriceLabel = (priceLabel) => Number.parseInt(String(priceLabel).replace(/\D/g, ''), 10) || 0;
const parseTimeLabelToMinutes = (timeLabel) => {
  const match = String(timeLabel).match(/(\d{2}):(\d{2})/);

  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
};
const extractTimeLabel = (value) => String(value).match(/(\d{2}:\d{2})/)?.[1] || null;
const getWeekdayKey = (dateIso) => {
  const weekdayIndex = new Date(`${dateIso}T00:00:00Z`).getUTCDay();

  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][weekdayIndex];
};

const isModeSupportedByOffering = (offering, mode) =>
  (mode === 'online' && offering.supportsOnline) ||
  (mode === 'home_visit' && offering.supportsHomeVisit) ||
  (mode === 'onsite' && offering.supportsOnsite);

const isModeSupportedBySnapshot = (serviceSnapshot, mode) =>
  (mode === 'online' && serviceSnapshot.serviceModes.online) ||
  (mode === 'home_visit' && serviceSnapshot.serviceModes.homeVisit) ||
  (mode === 'onsite' && serviceSnapshot.serviceModes.onsite);

test('appointment snapshots stay aligned with service catalog and ordered service offering', () => {
  for (const appointment of appointments) {
    const area = areasById.get(appointment.areaId);
    const offering = offeringsById.get(appointment.serviceOfferingId);
    const service = servicesById.get(appointment.serviceId);
    const bookingFlow = bookingFlowsByCode.get(appointment.bookingFlow);

    assert.ok(area, `Missing area ${appointment.areaId} for ${appointment.id}`);
    assert.ok(offering, `Missing service offering ${appointment.serviceOfferingId} for ${appointment.id}`);
    assert.ok(service, `Missing service ${appointment.serviceId} for ${appointment.id}`);
    assert.ok(bookingFlow, `Missing booking flow ${appointment.bookingFlow} for ${appointment.id}`);

    assert.equal(offering.professionalId, appointment.professionalId, `Professional mismatch for ${appointment.id}`);
    assert.equal(offering.serviceId, appointment.serviceId, `Service mismatch for ${appointment.id}`);
    assert.equal(offering.bookingFlow, appointment.bookingFlow, `Booking flow mismatch for ${appointment.id}`);

    assert.equal(
      appointment.serviceSnapshot.bookingFlow,
      appointment.bookingFlow,
      `Snapshot flow mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.serviceId,
      service.id,
      `Snapshot serviceId mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.serviceOfferingId,
      offering.id,
      `Snapshot offeringId mismatch for ${appointment.id}`,
    );
    assert.equal(appointment.serviceSnapshot.categoryId, service.categoryId, `Category mismatch for ${appointment.id}`);
    assert.equal(appointment.serviceSnapshot.slug, service.slug, `Slug mismatch for ${appointment.id}`);
    assert.equal(appointment.serviceSnapshot.name, service.name, `Service name mismatch for ${appointment.id}`);
    assert.equal(
      appointment.serviceSnapshot.description,
      service.description,
      `Service description mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.shortDescription,
      service.shortDescription,
      `Short description mismatch for ${appointment.id}`,
    );
    assert.equal(appointment.serviceSnapshot.image, service.image, `Image mismatch for ${appointment.id}`);
    assert.equal(
      appointment.serviceSnapshot.coverImage,
      service.coverImage,
      `Cover image mismatch for ${appointment.id}`,
    );
    assert.deepEqual(appointment.serviceSnapshot.tags, service.tags, `Tags mismatch for ${appointment.id}`);
    assert.deepEqual(
      appointment.serviceSnapshot.highlights,
      service.highlights,
      `Highlights mismatch for ${appointment.id}`,
    );

    assert.equal(
      appointment.serviceSnapshot.defaultMode,
      offering.defaultMode,
      `Snapshot default mode mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.durationLabel,
      offering.duration,
      `Snapshot duration mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.priceLabel,
      offering.price,
      `Snapshot price label mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.priceAmount,
      parsePriceLabel(offering.price),
      `Snapshot price amount mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.serviceSnapshot.summary,
      offering.summary,
      `Snapshot summary mismatch for ${appointment.id}`,
    );
    assert.equal(
      appointment.totalPriceLabel,
      appointment.serviceSnapshot.priceLabel,
      `Appointment price should match immutable snapshot for ${appointment.id}`,
    );

    const expectedSnapshotModes = {
      homeVisit: offering.supportsHomeVisit,
      online: offering.supportsOnline,
      onsite: offering.supportsOnsite,
    };

    assert.deepEqual(
      appointment.serviceSnapshot.serviceModes,
      expectedSnapshotModes,
      `Snapshot mode flags mismatch for ${appointment.id}`,
    );
    assert.ok(
      isModeSupportedByOffering(offering, appointment.requestedMode),
      `Requested mode is not supported by offering for ${appointment.id}`,
    );
    assert.ok(
      isModeSupportedBySnapshot(appointment.serviceSnapshot, appointment.requestedMode),
      `Requested mode is not supported by snapshot for ${appointment.id}`,
    );
    assert.ok(
      isModeSupportedBySnapshot(
        {
          serviceModes: {
            homeVisit: service.serviceModes.homeVisit,
            online: service.serviceModes.online,
            onsite: service.serviceModes.onsite,
          },
        },
        appointment.requestedMode,
      ),
      `Requested mode is not supported by service catalog for ${appointment.id}`,
    );
  }
});

test('appointment schedule snapshots respect mode and seeded slot rules', () => {
  for (const appointment of appointments) {
    const requiresSchedule = appointment.requestedMode !== 'online';

    assert.equal(
      appointment.scheduleSnapshot.requiresSchedule,
      requiresSchedule,
      `Schedule requirement mismatch for ${appointment.id}`,
    );
    assert.ok(appointment.scheduleSnapshot.scheduledTimeLabel, `Missing scheduledTimeLabel for ${appointment.id}`);

    if (!requiresSchedule) {
      assert.equal(
        appointment.scheduleSnapshot.scheduleDayId ?? null,
        null,
        `Online appointment should not carry scheduleDayId for ${appointment.id}`,
      );
      continue;
    }

    assert.ok(appointment.scheduleSnapshot.dateIso, `Offline appointment needs dateIso for ${appointment.id}`);
    const dateIso = appointment.scheduleSnapshot.dateIso;
    const override = dateOverrideByProfessionalModeAndDate.get(
      `${appointment.professionalId}:${appointment.requestedMode}:${dateIso}`,
    );
    const weeklyWindow = weeklyHoursByProfessionalModeAndWeekday.get(
      `${appointment.professionalId}:${appointment.requestedMode}:${getWeekdayKey(dateIso)}`,
    );

    assert.ok(
      override || weeklyWindow,
      `Missing weekly hours or date override for ${appointment.professionalId}:${appointment.requestedMode}:${dateIso}`,
    );
    assert.equal(override?.isClosed === true, false, `Closed special date cannot have appointment ${appointment.id}`);

    const startTime = override?.startTime || weeklyWindow?.startTime;
    const endTime = override?.endTime || weeklyWindow?.endTime;
    const bookedTimeLabel =
      appointment.scheduleSnapshot.timeSlotLabel || extractTimeLabel(appointment.scheduledTimeLabel);

    assert.ok(startTime && endTime, `Missing applicable working hours for ${appointment.id}`);
    assert.ok(bookedTimeLabel, `Missing appointment time label for ${appointment.id}`);

    const bookedMinutes = parseTimeLabelToMinutes(bookedTimeLabel);
    const startMinutes = parseTimeLabelToMinutes(startTime);
    const endMinutes = parseTimeLabelToMinutes(endTime);

    assert.notEqual(bookedMinutes, null, `Invalid booked time label for ${appointment.id}`);
    assert.notEqual(startMinutes, null, `Invalid start time for ${appointment.id}`);
    assert.notEqual(endMinutes, null, `Invalid end time for ${appointment.id}`);
    assert.ok(
      bookedMinutes >= startMinutes && bookedMinutes < endMinutes,
      `Booked time ${bookedTimeLabel} falls outside working hours for ${appointment.id}`,
    );
  }
});

test('appointment timelines preserve flow entry semantics and final status', () => {
  for (const appointment of appointments) {
    assert.ok(appointment.timeline.length > 0, `Timeline should not be empty for ${appointment.id}`);

    const firstEvent = appointment.timeline[0];
    const lastEvent = appointment.timeline[appointment.timeline.length - 1];

    if (appointment.bookingFlow === 'request') {
      assert.equal(firstEvent.toStatus, 'requested', `Request flow should start at requested for ${appointment.id}`);
      assert.equal(firstEvent.actor, 'customer', `Initial request should come from customer for ${appointment.id}`);
    } else {
      assert.equal(
        firstEvent.toStatus,
        'approved_waiting_payment',
        `Instant flow should start at approved_waiting_payment for ${appointment.id}`,
      );
      assert.equal(
        bookingFlowsByCode.get(appointment.bookingFlow)?.requiresApproval,
        false,
        `Instant booking metadata should not require approval for ${appointment.id}`,
      );
    }

    assert.equal(lastEvent.toStatus, appointment.status, `Final timeline status mismatch for ${appointment.id}`);

    for (let index = 1; index < appointment.timeline.length; index += 1) {
      const previousEvent = appointment.timeline[index - 1];
      const currentEvent = appointment.timeline[index];

      assert.equal(
        currentEvent.fromStatus,
        previousEvent.toStatus,
        `Timeline transition chain mismatch for ${appointment.id} at index ${index}`,
      );
    }
  }
});

test('appointment seeds cover the full delivery-mode and booking-flow matrix', () => {
  const expectedMatrix = new Set([
    'online|instant',
    'online|request',
    'home_visit|instant',
    'home_visit|request',
    'onsite|instant',
    'onsite|request',
  ]);
  const presentMatrix = new Set(
    appointments.map((appointment) => `${appointment.requestedMode}|${appointment.bookingFlow}`),
  );

  assert.deepEqual(
    [...presentMatrix].sort(),
    [...expectedMatrix].sort(),
    'Appointment seeds should include every supported mode x booking-flow case',
  );
});

test('availability policies exist for every seeded offline availability mode', () => {
  const availabilityCombos = new Set(
    [...weeklyHours, ...dateOverrides].map((row) => `${row.professionalId}:${row.mode}`),
  );

  for (const combo of availabilityCombos) {
    const policy = availabilityPoliciesByProfessionalMode.get(combo);

    assert.ok(policy, `Missing availability policy for ${combo}`);
    assert.ok(
      allowedMinimumNoticeHours.has(policy.minimumNoticeHours),
      `Unexpected minimumNoticeHours ${policy.minimumNoticeHours} for ${combo}`,
    );
  }

  assert.equal(runtimeSelections.length > 0, true, 'Missing app runtime selection seed');
  assert.match(
    runtimeSelections[0].currentDateTimeIso,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    'Runtime clock seed must expose a stable currentDateTimeIso',
  );
});
