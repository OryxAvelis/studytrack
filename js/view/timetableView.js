import { formatTime, WEEKDAYS } from '../model/timetableData.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderTimetable(sessions, today = new Date(), user) {
  const currentDay = (today.getDay() + 6) % 7;
  document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = user.name; });
  document.querySelectorAll('[data-user-email]').forEach((element) => { element.textContent = user.email; });
  document.querySelectorAll('[data-user-initials]').forEach((element) => {
    element.textContent = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  });
  const daySelect = document.querySelector('#session-day');
  daySelect.innerHTML = WEEKDAYS.map((day, index) => `<option value="${index}" ${index === currentDay ? 'selected' : ''}>${day}</option>`).join('');
  document.querySelector('[data-week-grid]').innerHTML = WEEKDAYS.map((day, index) => {
    const daySessions = sessions.filter((session) => session.day === index).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return `<section class="day-column ${index === currentDay ? 'is-today' : ''}" aria-label="${day}">
      <header class="day-heading"><span>${day.slice(0, 3)}</span><strong>${index === currentDay ? 'Today' : '&nbsp;'}</strong></header>
      <div class="day-sessions">${daySessions.length ? daySessions.map((session) => `<article class="week-session">
        <strong>${escapeHtml(session.title)}</strong><span>${formatTime(session.startTime)} · ${session.duration} min</span>
        ${session.subject ? `<span>${escapeHtml(session.subject)}</span>` : ''}
        ${session.ownerId === user.id ? `<button class="remove-session" type="button" data-delete-session="${escapeHtml(session.id)}" aria-label="Remove ${escapeHtml(session.title)}">×</button>` : ''}
      </article>`).join('') : '<div class="empty-day">Open time</div>'}</div>
    </section>`;
  }).join('');
}