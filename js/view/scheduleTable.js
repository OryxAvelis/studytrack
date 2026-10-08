import { WEEKDAYS } from '../model/timetableData.js';

const DEFAULT_SCHOOL_HOURS = Object.freeze(
  Array.from({ length: 10 }, (_, index) => index + 8),
);

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderScheduleTable(sessions, {
  today = new Date(),
  ownerId = null,
  compact = false,
} = {}) {
  const todayIndex = (today.getDay() + 6) % 7;
  const days = sessions.some((session) => session.day === 6)
    ? WEEKDAYS.map((_, index) => index)
    : [0, 1, 2, 3, 4, 5];
  const visibleHours = DEFAULT_SCHOOL_HOURS;

  const header = `<thead><tr>
    <th class="schedule-day-heading" scope="col">Day</th>
    ${visibleHours.map((hour) => `<th class="schedule-time-heading" scope="col" dir="ltr">${String(hour).padStart(2, '0')}:00–${String(hour + 1).padStart(2, '0')}:00</th>`).join('')}
  </tr></thead>`;
  const rows = days.map((day) => `<tr class="${day === todayIndex ? 'is-today' : ''}">
    <th class="schedule-day-name" scope="row">
      ${WEEKDAYS[day]}
    </th>
    ${visibleHours.map((hour) => {
      const atTime = sessions.filter((session) => (
        session.day === day && Number(session.startTime.split(':')[0]) === hour
      ));
      return `<td class="${atTime.length ? 'has-schedule' : ''}">${atTime.length ? atTime.map((session) => {
        const removable = ownerId && session.ownerId === ownerId;
        return `<div class="schedule-entry">
          <strong title="${escapeHtml(session.title)}">${escapeHtml(session.subject || session.title)}</strong>
          <span>${escapeHtml(session.startTime)} · ${session.duration} min${session.reminderMinutes ? ` · ${session.reminderMinutes}m reminder` : ''}</span>
          ${removable ? `<button class="remove-session" type="button" data-delete-session="${escapeHtml(session.id)}" aria-label="Remove ${escapeHtml(session.title)}">×</button>` : ''}
        </div>`;
      }).join('') : '<span class="schedule-empty" aria-hidden="true"></span>'}</td>`;
    }).join('')}
  </tr>`).join('');

  return `<div class="schedule-table-scroll ${compact ? 'is-compact' : ''}">
    <table class="morocco-schedule-table" dir="ltr" aria-label="Weekly study timetable">
      ${header}
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
