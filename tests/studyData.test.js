import test from 'node:test';
import assert from 'node:assert/strict';
import { getCalculatedHours, getCheckinTotalHours, getStudyStats, getWeeklyStudyHours } from '../js/model/checkinData.js';
import { initializeReminders } from '../js/controller/reminderController.js';

const session = { id: 'session-1', duration: 90 };

test('calculated hours respect full, half, absent, and saved duration', () => {
  assert.equal(getCalculatedHours({ status: 'full' }, session), 1.5);
  assert.equal(getCalculatedHours({ status: 'half' }, session), 0.75);
  assert.equal(getCalculatedHours({ status: 'absent' }, session), 0);
  assert.equal(getCalculatedHours({ duration: 30 }, session), 0.5);
  assert.equal(getCheckinTotalHours({ status: 'half', extraHours: 0.25 }, session), 1);
});

test('eight-week totals include study and extra hours and exclude older records', () => {
  const sessions = [session];
  const checkins = [
    { sessionId: session.id, day: '2026-10-07', status: 'half', extraHours: 0.5 },
    { sessionId: session.id, day: '2026-10-04', status: 'full', extraHours: 0 },
    { sessionId: session.id, day: '2026-07-01', status: 'full', extraHours: 0 },
  ];
  const weeks = getWeeklyStudyHours(checkins, sessions, 8, new Date(2026, 9, 8, 12));
  assert.equal(weeks.length, 8);
  assert.equal(weeks.at(-1).key, '2026-10-05');
  assert.equal(weeks.at(-1).hours, 1.25);
  assert.equal(weeks.at(-2).key, '2026-09-28');
  assert.equal(weeks.at(-2).hours, 1.5);
  assert.equal(weeks.reduce((sum, week) => sum + week.hours, 0), 2.75);
});

test('study statistics reuse the same calculated and extra-hours total', () => {
  const checkins = [
    { sessionId: session.id, day: '2026-10-08', status: 'half', extraHours: 0.5 },
    { sessionId: session.id, day: '2026-10-07', status: 'absent', extraHours: 1 },
  ];
  const stats = getStudyStats(checkins, [session]);
  assert.equal(stats.sessions, 2);
  assert.equal(stats.hours, 2.25);
});

test('weekly study hours rejects invalid ranges', () => {
  assert.throws(() => getWeeklyStudyHours([], [], 0), /positive whole number/);
  assert.throws(() => getWeeklyStudyHours([], [], 1.5), /positive whole number/);
});

test('pages without reminder controls get a safe no-op timetable refresh', async () => {
  const originalDocument = globalThis.document;
  globalThis.document = { querySelector: () => null };
  try {
    const refreshReminders = await initializeReminders({ user: { id: 'test-user' } });
    assert.equal(typeof refreshReminders, 'function');
    await refreshReminders([]);
  } finally {
    globalThis.document = originalDocument;
  }
});
