import { addSession, deleteSession } from '../model/timetableData.js';

export function initializeTimetable({ user, refresh }) {
  const form = document.querySelector('[data-session-form]');
  if (!form) return;
  const message = document.querySelector('[data-session-message]');
  const quickDialog = document.querySelector('[data-quick-session-dialog]');
  const quickForm = document.querySelector('[data-quick-session-form]');
  const quickMessage = document.querySelector('[data-quick-session-message]');
  const newSubjectField = document.querySelector('[data-new-subject-field]');
  const newSubjectInput = quickForm.querySelector('[name="newSubject"]');
  const toggle = (open) => {
    form.hidden = !open;
    if (open) document.querySelector('#session-title').focus();
    else { form.reset(); message.textContent = ''; message.classList.remove('error'); }
  };

  document.querySelector('[data-open-session-form]').addEventListener('click', () => toggle(form.hidden));
  document.querySelector('[data-cancel-session]').addEventListener('click', () => toggle(false));
  document.querySelector('[data-close-quick-session]').addEventListener('click', () => quickDialog.close());
  quickDialog.addEventListener('click', (event) => {
    if (event.target === quickDialog) quickDialog.close();
  });
  quickForm.querySelector('[name="subjectChoice"]').addEventListener('change', (event) => {
    const isNewSubject = event.target.value === '__new__';
    newSubjectField.hidden = !isNewSubject;
    newSubjectInput.required = isNewSubject;
    if (isNewSubject) newSubjectInput.focus();
  });
  quickForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(quickForm);
    const subjectChoice = String(values.get('subjectChoice'));
    const subject = subjectChoice === '__new__'
      ? String(values.get('newSubject')).trim()
      : subjectChoice;
    if (!subject || subject === '__new__') {
      quickMessage.textContent = 'Choose or enter a subject.';
      quickMessage.classList.add('error');
      return;
    }
    const submit = quickForm.querySelector('[type="submit"]');
    submit.disabled = true;
    quickMessage.textContent = '';
    quickMessage.classList.remove('error');
    try {
      const { day, startTime } = quickDialog.dataset;
      await addSession(user.id, {
        title: `${subject} study session`,
        subject,
        day: Number(day),
        startTime,
        duration: Number(values.get('durationHours')) * 60,
        reminderMinutes: null,
      });
      quickDialog.close();
      await refresh();
    } catch (error) {
      quickMessage.textContent = error.message;
      quickMessage.classList.add('error');
    } finally {
      submit.disabled = false;
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const subject = String(values.get('subject')).trim();
    if (!subject) {
      message.textContent = 'Enter a subject for this session.';
      message.classList.add('error');
      submit.disabled = false;
      form.querySelector('[name="subject"]').focus();
      return;
    }
    try {
      await addSession(user.id, {
        title: String(values.get('title')).trim(),
        subject,
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
    const addButton = event.target.closest('[data-add-session-day]');
    if (addButton) {
      quickDialog.dataset.day = addButton.dataset.addSessionDay;
      quickDialog.dataset.startTime = addButton.dataset.addSessionTime;
      const day = addButton.closest('tr').querySelector('[scope="row"]').textContent.trim();
      quickForm.reset();
      newSubjectField.hidden = true;
      newSubjectInput.required = false;
      quickMessage.textContent = '';
      quickMessage.classList.remove('error');
      document.querySelector('[data-quick-session-time]').textContent = `${day} at ${addButton.dataset.addSessionTime}`;
      quickDialog.showModal();
      return;
    }

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