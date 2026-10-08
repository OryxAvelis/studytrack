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
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await addSession(user.id, {
        title: String(values.get('title')).trim(),
        subject: String(values.get('subject')).trim(),
        day: Number(values.get('day')),
        startTime: String(values.get('startTime')),
        duration: Number(values.get('duration')),
        reminderMinutes: values.get('reminderMinutes') ? Number(values.get('reminderMinutes')) : null,
      });
      toggle(false);
      await refresh();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector('[data-week-grid]').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-session]');
    if (!button) return;
    button.disabled = true;
    try {
      await deleteSession(user.id, button.dataset.deleteSession);
      await refresh();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
      button.disabled = false;
    }
  });
}