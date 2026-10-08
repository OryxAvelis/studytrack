import { getLegacyDataSummary, migrateLegacyData } from '../model/legacyMigrationData.js';

export function initializeLegacyMigration({ user }) {
  const summary = getLegacyDataSummary();
  if (!summary) return;
  const main = document.querySelector('.main-content');
  if (!main) return;

  const notice = document.createElement('section');
  notice.className = 'migration-notice';
  notice.setAttribute('aria-labelledby', 'migration-title');
  notice.innerHTML = `<div><h2 id="migration-title">Import this browser’s saved study data?</h2><p>${summary.sessions} timetable sessions and ${summary.checkins} check-ins are saved locally. Import them to your account to keep them synced. Old browser demo passwords are never imported.</p><p class="form-message" data-migration-message aria-live="polite"></p></div><button class="button button-primary" type="button" data-migrate-legacy>Import data</button>`;
  main.prepend(notice);
  const button = notice.querySelector('[data-migrate-legacy]');
  const message = notice.querySelector('[data-migration-message]');
  button.addEventListener('click', async () => {
    button.disabled = true;
    message.textContent = 'Importing your saved sessions and check-ins…';
    try {
      const result = await migrateLegacyData(user.id);
      message.textContent = `Imported ${result.sessions} sessions and ${result.checkins} check-ins. Old local demo accounts were cleared.`;
      button.remove();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
      button.disabled = false;
    }
  });
}
