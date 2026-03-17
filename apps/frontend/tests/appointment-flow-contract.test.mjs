import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');

const readJson = async (relativePath) => JSON.parse(await readFile(resolve(frontendDir, relativePath), 'utf8'));

const [appointments, areas, bookingFlows, offerings, scheduleDays, services, timeSlots] = await Promise.all([
  readJson('src/data/mock-db/appointments.json'),
  readJson('src/data/mock-db/areas.json'),
  readJson('src/data/mock-db/reference_booking_flows.json'),
  readJson('src/data/mock-db/professional_service_offerings.json'),
  readJson('src/data/mock-db/professional_availability_schedule_days.json'),
  readJson('src/data/mock-db/services.json'),
  readJson('src/data/mock-db/professional_availability_time_slots.json'),
]);

const areasById = new Map(areas.map((area) => [area.id, area]));
const bookingFlowsByCode = new Map(bookingFlows.map((flow) => [flow.code, flow]));
const offeringsById = new Map(offerings.map((offering) => [offering.id, offering]));
const scheduleDaysById = new Map(scheduleDays.map((scheduleDay) => [scheduleDay.id, scheduleDay]));
const servicesById = new Map(services.map((service) => [service.id, service]));
const timeSlotsById = new Map(timeSlots.map((timeSlot) => [timeSlot.id, timeSlot]));

const parsePriceLabel = (priceLabel) => Number.parseInt(String(priceLabel).replace(/\D/g, ''), 10) || 0;

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

    if (appointment.scheduleSnapshot.scheduleDayId) {
      const scheduleDay = scheduleDaysById.get(appointment.scheduleSnapshot.scheduleDayId);

      assert.ok(
        scheduleDay,
        `Missing schedule day ${appointment.scheduleSnapshot.scheduleDayId} for ${appointment.id}`,
      );
      assert.equal(
        scheduleDay.professionalId,
        appointment.professionalId,
        `Schedule day professional mismatch for ${appointment.id}`,
      );
      assert.equal(scheduleDay.mode, appointment.requestedMode, `Schedule day mode mismatch for ${appointment.id}`);

      if (appointment.scheduleSnapshot.dateIso) {
        assert.equal(
          scheduleDay.dateIso,
          appointment.scheduleSnapshot.dateIso,
          `Schedule date mismatch for ${appointment.id}`,
        );
      }

      if (appointment.scheduleSnapshot.scheduleDayLabel) {
        assert.equal(
          scheduleDay.label,
          appointment.scheduleSnapshot.scheduleDayLabel,
          `Schedule day label mismatch for ${appointment.id}`,
        );
      }
    } else {
      assert.ok(
        appointment.scheduleSnapshot.dateIso || appointment.scheduleSnapshot.scheduleDayLabel,
        `Offline appointment needs date context when scheduleDayId is absent for ${appointment.id}`,
      );
    }

    if (appointment.scheduleSnapshot.timeSlotId) {
      const timeSlot = timeSlotsById.get(appointment.scheduleSnapshot.timeSlotId);

      assert.ok(timeSlot, `Missing time slot ${appointment.scheduleSnapshot.timeSlotId} for ${appointment.id}`);
      assert.equal(
        timeSlot.professionalId,
        appointment.professionalId,
        `Time slot professional mismatch for ${appointment.id}`,
      );
      assert.equal(timeSlot.mode, appointment.requestedMode, `Time slot mode mismatch for ${appointment.id}`);
      assert.equal(
        timeSlot.scheduleDayId,
        appointment.scheduleSnapshot.scheduleDayId,
        `Time slot schedule day mismatch for ${appointment.id}`,
      );

      if (appointment.scheduleSnapshot.timeSlotLabel) {
        assert.equal(
          timeSlot.label,
          appointment.scheduleSnapshot.timeSlotLabel,
          `Time slot label mismatch for ${appointment.id}`,
        );
      }
    } else {
      assert.ok(
        appointment.scheduleSnapshot.timeSlotLabel,
        `Offline appointment needs time context when timeSlotId is absent for ${appointment.id}`,
      );
    }
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
