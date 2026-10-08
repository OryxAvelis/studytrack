import test from 'node:test';
import assert from 'node:assert/strict';
import { getCalculatedHours, getCheckinTotalHours, getStudyStats, getWeeklyStudyHours } from '../js/model/checkinData.js';
import { initializeReminders } from '../js/controller/reminderController.js';
import { renderScheduleTable } from '../js/view/scheduleTable.js';

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
    { sessionId: session.id, day: '2026-10-06', status: 'absent', extraHours: 0 },
  ];
  const stats = getStudyStats(checkins, [session]);
  assert.equal(stats.sessions, 3);
  assert.equal(stats.hours, 2.25);
  assert.equal(stats.days, 2);
});

test('weekly study hours rejects invalid ranges', () => {
  assert.throws(() => getWeeklyStudyHours([], [], 0), /positive whole number/);
  assert.throws(() => getWeeklyStudyHours([], [], 1.5), /positive whole number/);
});

test('Timetable uses left-to-right English Monday-to-Saturday rows and school-hour columns', () => {
  const table = renderScheduleTable([], { today: new Date(2026, 9, 8) });
  assert.match(table, /dir="ltr"/);
  assert.match(table, />Day</);
  assert.match(table, /Monday/);
  assert.match(table, /Saturday/);
  assert.doesNotMatch(table, /Sunday/);
  assert.doesNotMatch(table, /الإثنين/);
  assert.equal((table.match(/class="schedule-time-heading"/g) || []).length, 10);
  assert.match(table, /08:00–09:00/);
  assert.match(table, /17:00–18:00/);
  assert.doesNotMatch(table, /18:00–19:00/);
  assert.ok(table.indexOf('08:00–09:00') < table.indexOf('09:00–10:00'));
  assert.ok(table.indexOf('Day</th>') < table.indexOf('08:00–09:00'));
});

test('Timetable includes Sunday only when scheduled and escapes session text', () => {
  const table = renderScheduleTable([{
    id: 'session-1',
    ownerId: 'user-1',
    title: '<Revision>',
    subject: 'Math',
    day: 6,
    startTime: '08:30',
    duration: 60,
  }], { ownerId: 'user-1' });
  assert.match(table, /Sunday/);
  assert.match(table, /Math/);
  assert.doesNotMatch(table, /<Revision>/);
  assert.match(table, /&lt;Revision&gt;/);
  assert.match(table, /data-delete-session="session-1"/);
});

test('Timetable groups half-hour sessions under the correct hour and keeps exact start time', () => {
  const table = renderScheduleTable([{
    id: 'session-half-hour',
    title: 'French',
    subject: 'French',
    day: 0,
    startTime: '08:30',
    duration: 60,
  }]);
  assert.ok(table.indexOf('09:00') > table.indexOf('08:00'));
  const mondayRow = table.slice(table.indexOf('<tbody>')).split('</tr>')[0];
  assert.match(mondayRow, /<td class="has-schedule"><div class="schedule-entry">[\s\S]*?08:30 · 60 min/);
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
