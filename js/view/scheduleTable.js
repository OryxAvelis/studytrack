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
  interactive = false,
} = {}) {
  const todayIndex = (today.getDay() + 6) % 7;
  const days = WEEKDAYS.map((_, index) => index);
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
      const hourStart = hour * 60;
      const atTime = sessions.filter((session) => (
        session.day === day && Number(session.startTime.split(':')[0]) === hour
      ));
      const continuing = sessions.filter((session) => {
        if (session.day !== day) return false;
        const [startHour, startMinute] = session.startTime.split(':').map(Number);
        const start = startHour * 60 + startMinute;
        return start < hourStart && start + session.duration > hourStart;
      });
      const content = [
        ...atTime.map((session) => {
        const removable = ownerId && session.ownerId === ownerId;
        return `<div class="schedule-entry">
          <strong title="${escapeHtml(session.title)}">${escapeHtml(session.subject || session.title)}</strong>
          <span>${escapeHtml(session.startTime)} · ${session.duration} min${session.reminderMinutes ? ` · ${session.reminderMinutes}m reminder` : ''}</span>
          ${removable ? `<button class="remove-session" type="button" data-delete-session="${escapeHtml(session.id)}" aria-label="Remove ${escapeHtml(session.title)}">×</button>` : ''}
        </div>`;
        }),
        ...continuing.map((session) => `<div class="schedule-continuation">
          <strong>${escapeHtml(session.subject || session.title)}</strong>
          <span>Continues from ${escapeHtml(session.startTime)}</span>
        </div>`),
      ].join('');
      const occupied = atTime.length > 0 || continuing.length > 0;
      return `<td class="${occupied ? 'has-schedule' : ''}">${occupied ? content : interactive
        ? `<button class="schedule-empty-button" type="button" data-add-session-day="${day}" data-add-session-time="${String(hour).padStart(2, '0')}:00" aria-label="Add session on ${WEEKDAYS[day]} at ${String(hour).padStart(2, '0')}:00"><span class="schedule-empty" aria-hidden="true"></span></button>`
        : '<span class="schedule-empty" aria-hidden="true"></span>'}</td>`;
    }).join('')}
  </tr>`).join('');

  return `<div class="schedule-table-scroll ${compact ? 'is-compact' : ''}">
    <table class="morocco-schedule-table" dir="ltr" aria-label="Weekly study timetable">
      ${header}
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
