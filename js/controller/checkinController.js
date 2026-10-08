export function initializeCheckin({ onCheckin }) {
  const form = document.querySelector('[data-checkin-form]');
  if (!form) return;
  const message = document.querySelector('[data-checkin-message]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.classList.remove('error');
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await onCheckin(new FormData(form).get('sessionId'));
      message.textContent = 'Checked in. Nice work showing up!';
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    } finally {
      submit.disabled = !form.querySelector('select').value;
    }
  });
}