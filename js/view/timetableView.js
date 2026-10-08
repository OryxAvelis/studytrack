import { WEEKDAYS } from '../model/timetableData.js';
import { renderScheduleTable } from './scheduleTable.js';

export function renderTimetable(sessions, today = new Date(), user) {
  const currentDay = (today.getDay() + 6) % 7;
  document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = user.name; });
  document.querySelectorAll('[data-user-email]').forEach((element) => { element.textContent = user.email; });
  document.querySelectorAll('[data-user-initials]').forEach((element) => {
    element.textContent = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  });
  const daySelect = document.querySelector('#session-day');
  daySelect.innerHTML = WEEKDAYS.map((day, index) => `<option value="${index}" ${index === currentDay ? 'selected' : ''}>${day}</option>`).join('');
  document.querySelector('[data-week-grid]').innerHTML = renderScheduleTable(sessions, {
    today,
    ownerId: user.id,
  });
}