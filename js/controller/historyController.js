import { deleteCheckin, getCalculatedHours, getCheckins, updateCheckin } from '../model/checkinData.js';
import { getSessions } from '../model/timetableData.js';
import { renderHistory } from '../view/historyView.js';

export async function initializeHistory({ user }) {
  const table = document.querySelector('[data-history-rows]');
  if (!table) return;
  const message = document.querySelector('[data-history-message]');
  const exportButton = document.querySelector('[data-export-history]');
  let editingId = null;

  const refresh = async () => {
    try {
      const [sessions, checkins] = await Promise.all([getSessions(user.id), getCheckins(user.id)]);
      renderHistory({ user, sessions, checkins, editingId });
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    }
  };

  table.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-checkin]');
    if (editButton) {
      editingId = editButton.dataset.editCheckin;
      message.textContent = '';
      message.classList.remove('error');
      await refresh();
      return;
    }
    if (event.target.closest('[data-cancel-edit]')) {
      editingId = null;
      await refresh();
      return;
    }
    const deleteButton = event.target.closest('[data-delete-checkin]');
    if (deleteButton) {
      deleteButton.disabled = true;
      try {
        await deleteCheckin(user.id, deleteButton.dataset.deleteCheckin);
        editingId = null;
        message.textContent = '';
        message.classList.remove('error');
        await refresh();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('error');
        deleteButton.disabled = false;
      }
    }
  });

  table.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-history-edit]');
    if (!form) return;
    event.preventDefault();
    const values = new FormData(form);
    try {
      await updateCheckin(user.id, form.dataset.historyEdit, {
        status: values.get('status'),
        extraHours: values.get('extraHours'),
      });
      editingId = null;
      message.textContent = 'Check-in updated.';
      message.classList.remove('error');
      await refresh();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
    }
  });

  exportButton.addEventListener('click', async () => {
    try {
      const [sessions, checkins] = await Promise.all([getSessions(user.id), getCheckins(user.id)]);
      const sessionMap = new Map(sessions.map((session) => [session.id, session]));
      checkins.sort((a, b) => (
        b.day.localeCompare(a.day) || b.checkedInAt.localeCompare(a.checkedInAt)
      ));
      const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
      const rows = [
        ['date', 'status', 'calculated_hours', 'extra_hours'],
        ...checkins.map((checkin) => [
          checkin.day,
          checkin.status || 'full',
          getCalculatedHours(checkin, sessionMap.get(checkin.sessionId)),
          Number(checkin.extraHours) || 0,
        ]),
      ];
      const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'studytrack-history.csv';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      message.textContent = 'Your history CSV has been downloaded.';
      message.classList.remove('error');
    } catch (error) {
      message.textContent = `Could not export history: ${error.message}`;
      message.classList.add('error');
    }
  });

  await refresh();
}
