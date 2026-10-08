import { STORAGE_KEYS, createId, readStored, writeStored } from './supabase.js';
import { getSessions } from './timetableData.js';

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCheckins(userId) {
  return readStored(STORAGE_KEYS.checkins, []).filter((checkin) => checkin.ownerId === userId);
}

export function addCheckin(userId, sessionId, date = new Date()) {
  const session = getSessions(userId).find((item) => item.id === sessionId);
  if (!session) throw new Error('Choose a valid study session before checking in.');
  const checkins = readStored(STORAGE_KEYS.checkins, []);
  const day = getLocalDateKey(date);
  if (checkins.some((checkin) => checkin.ownerId === userId && checkin.sessionId === sessionId && checkin.day === day)) {
    throw new Error('You have already checked in for this session today.');
  }
  const checkin = { id: createId(), ownerId: userId, sessionId, day, duration: session.duration, status: 'full', extraHours: 0, checkedInAt: date.toISOString() };
  checkins.push(checkin);
  writeStored(STORAGE_KEYS.checkins, checkins);
  return checkin;
}

export function updateCheckin(userId, checkinId, changes) {
  const checkins = readStored(STORAGE_KEYS.checkins, []);
  const index = checkins.findIndex((checkin) => checkin.id === checkinId && checkin.ownerId === userId);
  if (index === -1) throw new Error('This check-in could not be found.');
  if (!['full', 'half', 'absent'].includes(changes.status)) throw new Error('Choose a valid check-in status.');
  const extraHours = Number(changes.extraHours);
  if (!Number.isFinite(extraHours) || extraHours < 0 || extraHours > 24) {
    throw new Error('Extra hours must be between 0 and 24.');
  }
  checkins[index] = { ...checkins[index], status: changes.status, extraHours };
  writeStored(STORAGE_KEYS.checkins, checkins);
  return checkins[index];
}

export function deleteCheckin(userId, checkinId) {
  const checkins = readStored(STORAGE_KEYS.checkins, []);
  if (!checkins.some((checkin) => checkin.id === checkinId && checkin.ownerId === userId)) {
    throw new Error('This check-in could not be found.');
  }
  writeStored(STORAGE_KEYS.checkins, checkins.filter((checkin) => !(checkin.id === checkinId && checkin.ownerId === userId)));
}

export function getCalculatedHours(checkin, session) {
  const duration = checkin.duration ?? session?.duration ?? 0;
  const statusFactor = { full: 1, half: 0.5, absent: 0 }[checkin.status || 'full'];
  return duration * (statusFactor ?? 1) / 60;
}

export function getCheckinTotalHours(checkin, session) {
  return getCalculatedHours(checkin, session) + (Number(checkin.extraHours) || 0);
}

export function getWeeklyStudyHours(checkins, sessions, weekCount = 8, today = new Date()) {
  if (!Number.isInteger(weekCount) || weekCount < 1) {
    throw new Error('Week count must be a positive whole number.');
  }
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const firstWeek = new Date(weekStart);
  firstWeek.setDate(firstWeek.getDate() - (weekCount - 1) * 7);

  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const start = new Date(firstWeek);
    start.setDate(start.getDate() + index * 7);
    return {
      key: getLocalDateKey(start),
      label: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(start),
      hours: 0,
    };
  });
  const weekMap = new Map(weeks.map((week) => [week.key, week]));
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));

  checkins.forEach((checkin) => {
    const day = new Date(`${checkin.day}T12:00:00`);
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
    const week = weekMap.get(getLocalDateKey(day));
    if (week) week.hours += getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId));
  });

  return weeks;
}

export function getStudyStats(userId, sessions) {
  const checkins = getCheckins(userId);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const hours = checkins.reduce((total, checkin) => total + getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId)), 0);
  const checkedDays = [...new Set(checkins.map((checkin) => checkin.day))].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (checkedDays[0] !== getLocalDateKey(cursor)) cursor.setDate(cursor.getDate() - 1);
  for (const day of checkedDays) {
    if (day !== getLocalDateKey(cursor)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { sessions: checkins.length, hours, streak };
}