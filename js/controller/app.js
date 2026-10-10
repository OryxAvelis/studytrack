import { getCurrentUser, signOut } from '../model/auth.js';
import { getCheckins, getStudyStats, addCheckin } from '../model/checkinData.js';
import { getSessions } from '../model/timetableData.js';
import { renderDashboard } from '../view/dashboardView.js';
import { renderTimetable } from '../view/timetableView.js';
import { initializeAuth } from './authController.js';
import { initializeCheckin } from './checkinController.js';
import { initializeTimetable } from './timetableController.js';
import { initializeStats } from './statsController.js';
import { initializeHistory } from './historyController.js';
import { initializeChart } from './chartController.js';
import { initializeGoals } from './goalsController.js';
import { initializeReminders } from './reminderController.js';
import { initializeLegacyMigration } from './migrationController.js';
import { GUEST_USER, GUEST_USER_ID } from '../model/guestData.js';
import { initializeTheme } from './themeController.js';

let refreshChart = async () => {};
let refreshReminders = async () => {};

initializeTheme();

export async function requireUser() {
  return await getCurrentUser() || GUEST_USER;
}

export async function refreshApp(user) {
  const [sessions, checkins] = await Promise.all([getSessions(user.id), getCheckins(user.id)]);
  const today = new Date();
  if (document.querySelector('[data-today-sessions]')) {
    renderDashboard({ user, sessions, checkins, stats: getStudyStats(checkins, sessions), today });
    try {
      document.querySelector('.chart-panel .chart-error')?.remove();
      await refreshChart();
    } catch (error) {
      const chartPanel = document.querySelector('.chart-panel');
      if (chartPanel) {
        const chartError = document.createElement('p');
        chartError.className = 'form-message error chart-error';
        chartError.setAttribute('role', 'alert');
        chartError.textContent = `The progress chart could not be loaded: ${error.message}`;
        chartPanel.append(chartError);
      }
    }
  }
  if (document.querySelector('[data-week-grid]')) {
    renderTimetable(sessions, today, user);
    await refreshReminders(sessions);
  }
}

function showAppError(error) {
  document.querySelector('.app-error')?.remove();
  const message = document.createElement('p');
  message.className = 'app-error';
  message.setAttribute('role', 'alert');
  message.textContent = `StudyTrack could not load your data: ${error.message}`;
  const retry = document.createElement('button');
  retry.className = 'button button-quiet';
  retry.type = 'button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', () => window.location.reload());
  message.append(' ', retry);
  (document.querySelector('.main-content') || document.querySelector('.auth-card'))?.prepend(message);
}

export async function initializeApp() {
  try {
    const user = await requireUser();
    const isGuest = user.id === GUEST_USER_ID;
    initializeAuth(isGuest ? null : signOut, user);
    if (!isGuest) initializeLegacyMigration({ user });
    refreshChart = initializeChart({ user });
    try {
      refreshReminders = await initializeReminders({ user });
    } catch (error) {
      const status = document.querySelector('[data-reminders-status]');
      if (status) {
        status.textContent = error.message;
        status.classList.add('error');
      }
    }
    await refreshApp(user);
    initializeCheckin({ user, onCheckin: async (sessionId) => { await addCheckin(user.id, sessionId); await refreshApp(user); } });
    initializeTimetable({ user, refresh: () => refreshApp(user) });
    await initializeGoals({ user });
    initializeStats();
    if (document.body.dataset.page === 'history') await initializeHistory({ user });
    return user;
  } catch (error) {
    showAppError(error);
    return null;
  }
}

if (document.querySelector('.app-shell')) initializeApp();