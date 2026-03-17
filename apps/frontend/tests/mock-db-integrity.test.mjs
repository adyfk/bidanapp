import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');

const readJson = async (relativePath) => JSON.parse(await readFile(resolve(frontendDir, relativePath), 'utf8'));

const [appointments, chatThreads, professionals] = await Promise.all([
  readJson('src/data/mock-db/appointments.json'),
  readJson('src/data/mock-db/chat_threads.json'),
  readJson('src/data/mock-db/professionals.json'),
]);

test('appointment seeds carry unified request and activity metadata', () => {
  for (const appointment of appointments) {
    assert.ok(appointment.areaId, `Missing areaId for ${appointment.id}`);
    assert.ok(appointment.requestedMode, `Missing requestedMode for ${appointment.id}`);
    assert.ok(appointment.requestChannel, `Missing requestChannel for ${appointment.id}`);
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
