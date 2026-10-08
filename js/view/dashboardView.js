import { formatTime, WEEKDAYS } from '../model/timetableData.js';
import { getLocalDateKey } from '../model/checkinData.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderDashboard({ user, sessions, checkins, stats, today }) {
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  const firstName = user.name.trim().split(/\s+/)[0] || 'Student';
  setText('[data-user-name]', user.name);
  setText('[data-user-email]', user.email);
  setText('[data-greeting-name]', firstName);
  setText('[data-user-initials]', user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase());
  setText('[data-stat="sessions"]', stats.sessions);
  setText('[data-stat="hours"]', Number.isInteger(stats.hours) ? stats.hours : stats.hours.toFixed(1));
  setText('[data-stat="streak"]', stats.streak);
  setText('[data-today-label]', new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(today).toUpperCase());

  const todaySessions = sessions.filter((session) => session.day === (today.getDay() + 6) % 7).sort((a, b) => a.startTime.localeCompare(b.startTime));
  document.querySelector('[data-today-sessions]').innerHTML = todaySessions.length ? todaySessions.map((session) => `
    <div class="today-session">
      <span class="session-time">${formatTime(session.startTime)}</span><span class="session-color"></span>
      <span class="session-details"><strong>${escapeHtml(session.title)}</strong><span>${escapeHtml(session.subject || WEEKDAYS[session.day])}</span></span>
      <span class="session-duration">${session.duration} min</span>
    </div>`).join('') : '<div class="empty-state">Nothing planned for today.<br><a href="timetable.html">Add a study session →</a></div>';

  const select = document.querySelector('[data-checkin-sessions]');
  select.innerHTML = todaySessions.length
    ? todaySessions.map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.title)} · ${formatTime(session.startTime)}</option>`).join('')
    : '<option value="">No sessions scheduled today</option>';
  select.disabled = todaySessions.length === 0;
  const todayKey = getLocalDateKey(today);
  const completed = todaySessions.length > 0 && todaySessions.every((session) => checkins.some((checkin) => checkin.sessionId === session.id && checkin.day === todayKey));
  const status = document.querySelector('[data-checkin-status]');
  status.textContent = completed ? 'All done' : 'Ready';
  status.classList.toggle('done', completed);
  document.querySelector('[data-checkin-form] button[type="submit"]').disabled = completed || todaySessions.length === 0;

  const recent = [...checkins].sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt)).slice(0, 4);
  const recentContainer = document.querySelector('[data-recent-checkins]');
  recentContainer.innerHTML = recent.length ? `<div class="recent-list">${recent.map((checkin) => {
    const session = sessions.find((item) => item.id === checkin.sessionId);
    const date = new Date(`${checkin.day}T12:00:00`);
    return `<div class="recent-row"><span class="recent-dot"></span><span class="recent-copy"><strong>${escapeHtml(session?.title || 'Study session')}</strong><span>${escapeHtml(session?.subject || 'Study time')} · ${session?.duration ?? 0} min</span></span><span class="recent-date">${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}</span></div>`;
  }).join('')}</div>` : '<div class="empty-state">Your completed sessions will show up here.</div>';
}