import { DEFAULT_SUBJECTS, WEEKDAYS } from '../model/timetableData.js';
import { renderScheduleTable } from './scheduleTable.js';

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
  const subjectSelect = document.querySelector('#quick-session-subject');
  if (subjectSelect) {
    const subjectMap = new Map(DEFAULT_SUBJECTS.map((subject) => [subject.toLocaleLowerCase(), subject]));
    sessions.forEach((session) => {
      const subject = String(session.subject || '').trim();
      if (subject && !subjectMap.has(subject.toLocaleLowerCase())) {
        subjectMap.set(subject.toLocaleLowerCase(), subject);
      }
    });
    const subjects = [...subjectMap.values()];
    subjectSelect.innerHTML = [
      '<option value="" disabled selected>Choose a subject</option>',
      ...subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`),
      '<option value="__new__">＋ Add a new subject</option>',
    ].join('');
  }
  document.querySelector('[data-week-grid]').innerHTML = renderScheduleTable(sessions, {
    today,
    ownerId: user.id,
    interactive: true,
  });
}