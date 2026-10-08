import { addGoal, deleteGoal, getGoals, setGoalCompleted } from '../model/goalsData.js';
import { renderGoals } from '../view/goalsView.js';
import { getLocalDateKey } from '../model/checkinData.js';

export async function initializeGoals({ user }) {
  const form = document.querySelector('[data-goal-form]');
  if (!form) return;
  const list = document.querySelector('[data-goal-list]');
  const message = document.querySelector('[data-goal-message]');
  const refresh = async () => renderGoals(await getGoals(user.id));
  document.querySelector('#goal-due-date').min = getLocalDateKey();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    message.textContent = '';
    try {
      await addGoal(user.id, {
        title: String(values.get('title')),
        dueDate: String(values.get('dueDate')),
        targetHours: values.get('targetHours'),
      });
      form.reset();
      await refresh();
      message.textContent = 'Goal added.';
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    } finally {
      submit.disabled = false;
    }
  });

  list.addEventListener('change', async (event) => {
    const checkbox = event.target.closest('[data-complete-goal]');
    if (!checkbox) return;
    checkbox.disabled = true;
    try {
      await setGoalCompleted(user.id, checkbox.dataset.completeGoal, checkbox.checked);
      await refresh();
    } catch (error) {
      checkbox.disabled = false;
      checkbox.checked = !checkbox.checked;
      message.textContent = error.message;
      message.classList.add('error');
    }
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-goal]');
    if (!button) return;
    button.disabled = true;
    try {
      await deleteGoal(user.id, button.dataset.deleteGoal);
      await refresh();
    } catch (error) {
      button.disabled = false;
      message.textContent = error.message;
      message.classList.add('error');
    }
  });

  try {
    await refresh();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  }
}
