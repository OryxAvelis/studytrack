const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderGoals(goals) {
  const container = document.querySelector('[data-goal-list]');
  if (!container) return;
  if (!goals.length) {
    container.innerHTML = '<p class="goal-empty">Add a small goal with a deadline to keep your next step in view.</p>';
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  container.innerHTML = goals.map((goal) => {
    const due = new Date(`${goal.dueDate}T00:00:00`);
    const overdue = !goal.completedAt && due < today;
    const dueLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(due);
    return `<article class="goal-row ${goal.completedAt ? 'is-complete' : ''}">
      <label class="goal-main">
        <input type="checkbox" data-complete-goal="${escapeHtml(goal.id)}" ${goal.completedAt ? 'checked' : ''} aria-label="${goal.completedAt ? 'Mark incomplete' : 'Complete'} ${escapeHtml(goal.title)}">
        <span class="goal-copy"><strong>${escapeHtml(goal.title)}</strong><span class="${overdue ? 'goal-overdue' : ''}">${overdue ? 'Overdue · ' : 'Due '}${escapeHtml(dueLabel)}${goal.targetHours ? ` · ${escapeHtml(goal.targetHours)} target hours` : ''}</span></span>
      </label>
      <button class="goal-delete" type="button" data-delete-goal="${escapeHtml(goal.id)}" aria-label="Delete goal ${escapeHtml(goal.title)}">×</button>
    </article>`;
  }).join('');
}
