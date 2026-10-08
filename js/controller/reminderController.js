import { getRemindersEnabled, setRemindersEnabled } from '../model/reminderData.js';
import { getSessions } from '../model/timetableData.js';

const SENT_KEY = 'studytrack.reminders.sent';
const POLL_INTERVAL = 15000;

function getSentReminders() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
  } catch (error) {
    throw new Error(`Unable to read reminder state: ${error.message}`);
  }
}

function recordReminder(key) {
  const sent = getSentReminders();
  sent[key] = Date.now();
  for (const [sentKey, timestamp] of Object.entries(sent)) {
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) delete sent[sentKey];
  }
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch (error) {
    throw new Error(`Unable to save reminder state: ${error.message}`);
  }
}

function nextSessionDate(session, now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntil = (session.day - ((now.getDay() + 6) % 7) + 7) % 7;
  start.setDate(start.getDate() + daysUntil);
  const [hours, minutes] = session.startTime.split(':').map(Number);
  start.setHours(hours, minutes, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 7);
  return start;
}

export async function initializeReminders({ user }) {
  const button = document.querySelector('[data-reminders-toggle]');
  if (!button) return async () => {};
  const status = document.querySelector('[data-reminders-status]');
  let enabled = false;
  let sessions = [];
  let timer;
  let loadError = null;

  const updateUI = () => {
    button.textContent = enabled ? 'Turn off reminders' : 'Enable reminders';
    button.setAttribute('aria-pressed', String(enabled));
    status.textContent = enabled
      ? 'Reminders are on while StudyTrack is open in this browser.'
      : 'Optional browser notifications for upcoming sessions.';
  };

  const checkSchedule = () => {
    if (!enabled || document.visibilityState === 'hidden') return;
    const now = new Date();
    try {
      const sent = getSentReminders();
      for (const session of sessions) {
        if (!session.reminderMinutes) continue;
        const start = nextSessionDate(session, now);
        const notifyAt = start.getTime() - session.reminderMinutes * 60 * 1000;
        const key = `${session.id}:${start.toISOString()}`;
        if (now.getTime() >= notifyAt && now.getTime() < start.getTime() && !sent[key]) {
          new Notification('Study session coming up', {
            body: `${session.title} starts in ${session.reminderMinutes} minutes.`,
            tag: key,
          });
          recordReminder(key);
        }
      }
    } catch (error) {
      status.textContent = `A reminder could not be delivered: ${error.message}`;
      status.classList.add('error');
    }
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    status.classList.remove('error');
    try {
      if (!enabled) {
        if (!('Notification' in window)) throw new Error('This browser does not support notifications.');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') throw new Error('Notification permission was not granted. You can enable it in your browser settings.');
      }
      const nextEnabled = !enabled;
      await setRemindersEnabled(user.id, nextEnabled);
      enabled = nextEnabled;
      sessions = await getSessions(user.id);
      updateUI();
      status.textContent = enabled
        ? 'Reminders are on while StudyTrack is open. Add a session with a reminder time to get notified.'
        : 'Reminders are off.';
      if (enabled) {
        checkSchedule();
        timer = window.setInterval(checkSchedule, POLL_INTERVAL);
      } else {
        window.clearInterval(timer);
      }
    } catch (error) {
      status.textContent = error.message;
      status.classList.add('error');
    } finally {
      button.disabled = false;
    }
  });

  button.disabled = true;
  try {
    enabled = await getRemindersEnabled(user.id);
    sessions = await getSessions(user.id);
  } catch (error) {
    loadError = error;
  } finally {
    button.disabled = false;
  }
  updateUI();
  if (loadError) {
    status.textContent = loadError.message;
    status.classList.add('error');
  }
  if (enabled) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      enabled = false;
      await setRemindersEnabled(user.id, false);
      updateUI();
      status.textContent = 'Notifications are blocked in this browser. Enable them in browser settings to turn reminders on.';
      return;
    }
    checkSchedule();
    timer = window.setInterval(checkSchedule, POLL_INTERVAL);
  }
  return async (nextSessions) => {
    sessions = nextSessions || await getSessions(user.id);
    if (enabled) checkSchedule();
  };
}
