import { addSession, deleteSession } from '../model/timetableData.js';

export function initializeTimetable({ user, refresh }) {
  const form = document.querySelector('[data-session-form]');
  if (!form) return;
  const message = document.querySelector('[data-session-message]');
  const toggle = (open) => {
    form.hidden = !open;
    if (open) document.querySelector('#session-title').focus();
    else { form.reset(); message.textContent = ''; message.classList.remove('error'); }
  };

  document.querySelector('[data-open-session-form]').addEventListener('click', () => toggle(form.hidden));
  document.querySelector('[data-cancel-session]').addEventListener('click', () => toggle(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    try {
      addSession(user.id, {
        title: String(values.get('title')).trim(),
        subject: String(values.get('subject')).trim(),
        day: Number(values.get('day')),
        startTime: String(values.get('startTime')),
        duration: Number(values.get('duration')),
      });
      toggle(false);
      refresh();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    }
  });

  document.querySelector('[data-week-grid]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-session]');
    if (!button) return;
    try {
      deleteSession(user.id, button.dataset.deleteSession);
      refresh();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    }
  });
}