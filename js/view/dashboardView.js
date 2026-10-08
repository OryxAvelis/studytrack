import { formatTime, WEEKDAYS } from '../model/timetableData.js';
import { getCheckinTotalHours, getLocalDateKey } from '../model/checkinData.js';
import { renderScheduleTable } from './scheduleTable.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderDashboard({ user, sessions, checkins, stats, today }) {
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  const firstName = user.name.trim().split(/\s+/)[0] || 'Student';
  const hoursText = (hours) => Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  setText('[data-user-name]', user.name);
  setText('[data-user-email]', user.email);
  setText('[data-greeting-name]', firstName);
  setText('[data-user-initials]', user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase());
  setText('[data-stat="hours"]', hoursText(stats.hours));
  setText('[data-stat="streak"]', stats.streak);
  setText('[data-stat="days"]', stats.days);
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartKey = getLocalDateKey(weekStart);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const thisWeekHours = checkins
    .filter((checkin) => checkin.day >= weekStartKey)
    .reduce((total, checkin) => total + getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId)), 0);
  setText('[data-stat="week-hours"]', hoursText(thisWeekHours));
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
  const preview = document.querySelector('[data-week-preview]');
  preview.innerHTML = renderScheduleTable(sessions, { today, compact: true });

  const heatmap = document.querySelector('[data-study-heatmap]');
  const dailyHours = new Map();
  checkins.forEach((checkin) => {
    dailyHours.set(checkin.day, (dailyHours.get(checkin.day) || 0) + getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId)));
  });
  const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));
  const firstMonday = new Date(thisMonday);
  firstMonday.setDate(firstMonday.getDate() - 25 * 7);
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthLabels = [];
  const heatmapWeeks = Array.from({ length: 26 }, (_, weekIndex) => {
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + weekIndex * 7);
    const month = monday.toLocaleDateString(undefined, { month: 'short' });
    const previousMonday = weekIndex ? new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + (weekIndex - 1) * 7) : null;
    const previousMonth = previousMonday?.toLocaleDateString(undefined, { month: 'short' });
    monthLabels.push(month !== previousMonth ? `<span>${month}</span>` : '<span></span>');
    return `<div class="heatmap-week" role="group" aria-label="Week of ${escapeHtml(monday.toLocaleDateString())}">${weekdayLabels.map((weekday, dayIndex) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);
      const key = getLocalDateKey(date);
      const hours = dailyHours.get(key) || 0;
      const level = hours <= 0 ? 0 : hours < 1 ? 1 : hours < 2 ? 2 : hours < 4 ? 3 : 4;
      const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `<span class="heatmap-cell level-${level}" title="${escapeHtml(`${dateLabel}: ${hoursText(hours)} study hours`)}" aria-label="${escapeHtml(`${weekday}, ${dateLabel}: ${hoursText(hours)} study hours`)}"></span>`;
    }).join('')}</div>`;
  }).join('');
  heatmap.innerHTML = `<div class="heatmap-days" aria-hidden="true"><span></span>${weekdayLabels.map((day, index) => `<span>${index % 2 === 0 ? day : ''}</span>`).join('')}</div><div class="heatmap-content"><div class="heatmap-months" aria-hidden="true">${monthLabels.join('')}</div><div class="heatmap-weeks">${heatmapWeeks}</div><div class="heatmap-legend"><span>Less</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>More</span></div></div>`;

  const todayKey = getLocalDateKey(today);
  const completed = todaySessions.length > 0 && todaySessions.every((session) => checkins.some((checkin) => checkin.sessionId === session.id && checkin.day === todayKey));
  const status = document.querySelector('[data-checkin-status]');
  status.textContent = completed ? 'All done' : 'Ready';
  status.classList.toggle('done', completed);
  document.querySelector('[data-checkin-form]').dataset.completed = String(completed);
  document.querySelector('[data-checkin-form] button[type="submit"]').disabled = completed || todaySessions.length === 0;

  const recent = [...checkins].sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt)).slice(0, 4);
  const recentContainer = document.querySelector('[data-recent-checkins]');
  recentContainer.innerHTML = recent.length ? `<div class="recent-list">${recent.map((checkin) => {
    const session = sessions.find((item) => item.id === checkin.sessionId);
    const date = new Date(`${checkin.day}T12:00:00`);
    return `<div class="recent-row"><span class="recent-dot"></span><span class="recent-copy"><strong>${escapeHtml(session?.title || 'Study session')}</strong><span>${escapeHtml(session?.subject || 'Study time')} · ${session?.duration ?? 0} min</span></span><span class="recent-date">${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}</span></div>`;
  }).join('')}</div>` : '<div class="empty-state">Your completed sessions will show up here.</div>';
}