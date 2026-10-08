import { getCheckins, getWeeklyStudyHours } from '../model/checkinData.js';
import { getSessions } from '../model/timetableData.js';
import { renderWeeklyHoursChart } from '../view/chartView.js';

export function initializeChart({ user }) {
  if (!document.querySelector('[data-weekly-hours-chart]')) return async () => {};

  return async () => {
    const [checkins, sessions] = await Promise.all([getCheckins(user.id), getSessions(user.id)]);
    renderWeeklyHoursChart(getWeeklyStudyHours(checkins, sessions, 8));
  };
}
