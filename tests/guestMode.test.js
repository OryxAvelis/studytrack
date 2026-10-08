import test from 'node:test';
import assert from 'node:assert/strict';
import { addCheckin, deleteCheckin, getCheckins, updateCheckin } from '../js/model/checkinData.js';
import { addGoal, deleteGoal, getGoals, setGoalCompleted } from '../js/model/goalsData.js';
import { getRemindersEnabled, setRemindersEnabled } from '../js/model/reminderData.js';
import { addSession, deleteSession, getSessions } from '../js/model/timetableData.js';
import { GUEST_USER_ID } from '../js/model/guestData.js';

test('guest mode saves and edits study data locally without Supabase', async () => {
  const storage = new Map();
  const originalLocalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  };

  try {
    const session = await addSession(GUEST_USER_ID, {
      title: 'Biology revision',
      subject: 'Biology',
      day: 3,
      startTime: '09:30',
      duration: 90,
      reminderMinutes: 10,
    });
    assert.equal((await getSessions(GUEST_USER_ID))[0].title, 'Biology revision');
    assert.equal(session.ownerId, GUEST_USER_ID);

    const checkin = await addCheckin(GUEST_USER_ID, session.id, new Date(2026, 9, 8, 12));
    assert.equal((await getCheckins(GUEST_USER_ID)).length, 1);
    await updateCheckin(GUEST_USER_ID, checkin.id, { status: 'half', extraHours: 0.5 });
    const updatedCheckin = (await getCheckins(GUEST_USER_ID))[0];
    assert.equal(updatedCheckin.status, 'half');
    assert.equal(updatedCheckin.extraHours, 0.5);

    const goal = await addGoal(GUEST_USER_ID, {
      title: 'Review biology',
      dueDate: '2026-10-12',
      targetHours: 2,
    });
    await setGoalCompleted(GUEST_USER_ID, goal.id, true);
    assert.ok((await getGoals(GUEST_USER_ID))[0].completedAt);

    await setRemindersEnabled(GUEST_USER_ID, true);
    assert.equal(await getRemindersEnabled(GUEST_USER_ID), true);

    await deleteCheckin(GUEST_USER_ID, checkin.id);
    await deleteGoal(GUEST_USER_ID, goal.id);
    await deleteSession(GUEST_USER_ID, session.id);
    assert.deepEqual(await getCheckins(GUEST_USER_ID), []);
    assert.deepEqual(await getGoals(GUEST_USER_ID), []);
    assert.deepEqual(await getSessions(GUEST_USER_ID), []);
  } finally {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  }
});
