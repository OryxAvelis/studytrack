import { getCalculatedHours } from '../model/checkinData.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function formatHours(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, '');
}

function formatDate(day) {
  const date = new Date(`${day}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export function renderHistory({ user, sessions, checkins, editingId = null }) {
  document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = user.name; });
  document.querySelectorAll('[data-user-email]').forEach((element) => { element.textContent = user.email; });
  document.querySelectorAll('[data-user-initials]').forEach((element) => {
    element.textContent = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  });

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const sortedCheckins = [...checkins].sort((a, b) => (
    b.day.localeCompare(a.day) || b.checkedInAt.localeCompare(a.checkedInAt)
  ));
  document.querySelector('[data-history-count]').textContent = `${sortedCheckins.length} ${sortedCheckins.length === 1 ? 'check-in' : 'check-ins'}`;
  document.querySelector('[data-history-rows]').innerHTML = sortedCheckins.length
    ? sortedCheckins.map((checkin) => {
      const status = checkin.status || 'full';
      const extraHours = Number(checkin.extraHours) || 0;
      const session = sessionMap.get(checkin.sessionId);
      const calculatedHours = getCalculatedHours(checkin, session);
      const editing = checkin.id === editingId;
      const formId = `edit-checkin-${escapeHtml(checkin.id)}`;
      return `<tr data-history-row="${escapeHtml(checkin.id)}">
        <td>${escapeHtml(formatDate(checkin.day))}</td>
        <td>${editing
          ? `<select class="history-input" name="status" aria-label="Status" form="${formId}">
              <option value="full" ${status === 'full' ? 'selected' : ''}>Full</option>
              <option value="half" ${status === 'half' ? 'selected' : ''}>Half</option>
              <option value="absent" ${status === 'absent' ? 'selected' : ''}>Absent</option>
            </select>`
          : `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status)}</span>`}</td>
        <td>${formatHours(calculatedHours)} h</td>
        <td>${editing
          ? `<input class="history-input extra-hours-input" type="number" name="extraHours" min="0" max="24" step="0.25" value="${escapeHtml(extraHours)}" aria-label="Extra hours" form="${formId}" required>`
          : `${formatHours(extraHours)} h`}</td>
        <td class="history-actions">${editing
          ? `<form id="${formId}" data-history-edit="${escapeHtml(checkin.id)}">
              <button class="button button-primary history-action-button" type="submit">Save</button>
              <button class="button button-quiet history-action-button" type="button" data-cancel-edit>Cancel</button>
            </form>`
          : `<button class="button button-quiet history-action-button" type="button" data-edit-checkin="${escapeHtml(checkin.id)}">Edit</button>
             <button class="button button-quiet history-action-button delete-action" type="button" data-delete-checkin="${escapeHtml(checkin.id)}">Delete</button>`}</td>
      </tr>`;
    }).join('')
    : '<tr><td class="history-empty" colspan="5">No check-ins yet. Completed sessions will appear here.</td></tr>';
}
