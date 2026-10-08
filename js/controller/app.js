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

let refreshChart = () => {};

export function requireUser() {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  return user;
}

export function refreshApp(user) {
  const sessions = getSessions(user.id);
  const checkins = getCheckins(user.id);
  const today = new Date();
  if (document.querySelector('[data-today-sessions]')) {
    renderDashboard({ user, sessions, checkins, stats: getStudyStats(user.id, sessions), today });
    refreshChart();
  }
  if (document.querySelector('[data-week-grid]')) renderTimetable(sessions, today, user);
}

function showAppError(error) {
  const message = document.createElement('p');
  message.className = 'app-error';
  message.setAttribute('role', 'alert');
  message.textContent = `StudyTrack could not load your data: ${error.message}`;
  document.querySelector('.main-content')?.prepend(message);
}

try {
  const user = requireUser();
  if (user) {
    refreshChart = initializeChart({ user });
    refreshApp(user);
    initializeAuth(signOut);
    initializeCheckin({ onCheckin: (sessionId) => { addCheckin(user.id, sessionId); refreshApp(user); } });
    initializeTimetable({ user, refresh: () => refreshApp(user) });
    initializeStats();
    if (document.body.dataset.page === 'history') initializeHistory({ user });
  }
} catch (error) {
  showAppError(error);
}