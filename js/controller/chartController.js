import { getCheckins, getWeeklyStudyHours } from '../model/checkinData.js';
import { getSessions } from '../model/timetableData.js';
import { renderWeeklyHoursChart } from '../view/chartView.js';

export function initializeChart({ user }) {
  if (!document.querySelector('[data-weekly-hours-chart]')) return () => {};

  return () => {
    const checkins = getCheckins(user.id);
    const sessions = getSessions(user.id);
    renderWeeklyHoursChart(getWeeklyStudyHours(checkins, sessions, 8));
  };
}
