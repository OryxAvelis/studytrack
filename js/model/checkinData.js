import { getSupabase, throwIfSupabaseError } from './supabase.js';
import { getSessions } from './timetableData.js';
import { createGuestId, GUEST_USER_ID, getGuestCollection, isGuestUser, saveGuestCollection } from './guestData.js';

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapCheckin(row) {
  return {
    id: row.id,
    ownerId: row.user_id,
    sessionId: row.session_id,
    day: row.checkin_date,
    duration: row.session_duration_minutes,
    status: row.status || 'full',
    extraHours: Number(row.extra_hours) || 0,
    checkedInAt: row.checked_in_at,
  };
}

export async function getCheckins(userId) {
  if (isGuestUser(userId)) {
    return getGuestCollection('checkins')
      .filter((checkin) => checkin.ownerId === GUEST_USER_ID)
      .sort((a, b) => b.day.localeCompare(a.day) || b.checkedInAt.localeCompare(a.checkedInAt));
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_checkins')
    .select('id,user_id,session_id,checkin_date,session_duration_minutes,status,extra_hours,checked_in_at')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .order('checked_in_at', { ascending: false });
  throwIfSupabaseError(error, 'Unable to load your study history');
  return data.map(mapCheckin);
}

export async function addCheckin(userId, sessionId, date = new Date()) {
  const session = (await getSessions(userId)).find((item) => item.id === sessionId);
  if (!session) throw new Error('Choose a valid study session before checking in.');
  if (isGuestUser(userId)) {
    const checkins = getGuestCollection('checkins');
    const checkin = {
      id: createGuestId(),
      ownerId: GUEST_USER_ID,
      sessionId,
      day: getLocalDateKey(date),
      duration: session.duration,
      status: 'full',
      extraHours: 0,
      checkedInAt: new Date().toISOString(),
    };
    checkins.push(checkin);
    saveGuestCollection('checkins', checkins);
    return checkin;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_checkins').insert({
    user_id: userId,
    session_id: sessionId,
    checkin_date: getLocalDateKey(date),
    session_duration_minutes: session.duration,
    status: 'full',
    extra_hours: 0,
  }).select('id,user_id,session_id,checkin_date,session_duration_minutes,status,extra_hours,checked_in_at').single();
  throwIfSupabaseError(error, 'Unable to save your check-in');
  return mapCheckin(data);
}

export async function updateCheckin(userId, checkinId, changes) {
  if (!['full', 'half', 'absent'].includes(changes.status)) throw new Error('Choose a valid check-in status.');
  const extraHours = Number(changes.extraHours);
  if (!Number.isFinite(extraHours) || extraHours < 0 || extraHours > 24) {
    throw new Error('Extra hours must be between 0 and 24.');
  }
  if (isGuestUser(userId)) {
    const checkins = getGuestCollection('checkins');
    const checkin = checkins.find((item) => item.id === checkinId && item.ownerId === GUEST_USER_ID);
    if (!checkin) throw new Error('This check-in could not be found.');
    checkin.status = changes.status;
    checkin.extraHours = extraHours;
    saveGuestCollection('checkins', checkins);
    return checkin;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_checkins')
    .update({ status: changes.status, extra_hours: extraHours })
    .eq('id', checkinId)
    .eq('user_id', userId)
    .select('id,user_id,session_id,checkin_date,session_duration_minutes,status,extra_hours,checked_in_at')
    .maybeSingle();
  throwIfSupabaseError(error, 'Unable to update the check-in');
  if (!data) throw new Error('This check-in could not be found.');
  return mapCheckin(data);
}

export async function deleteCheckin(userId, checkinId) {
  if (isGuestUser(userId)) {
    const checkins = getGuestCollection('checkins');
    const remaining = checkins.filter((checkin) => checkin.id !== checkinId || checkin.ownerId !== GUEST_USER_ID);
    if (remaining.length === checkins.length) throw new Error('This check-in could not be found.');
    saveGuestCollection('checkins', remaining);
    return;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_checkins')
    .delete()
    .eq('id', checkinId)
    .eq('user_id', userId)
    .select('id');
  throwIfSupabaseError(error, 'Unable to delete the check-in');
  if (!data.length) throw new Error('This check-in could not be found.');
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
  if (!Number.isInteger(weekCount) || weekCount < 1) throw new Error('Week count must be a positive whole number.');
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

export function getStudyStats(checkins, sessions) {
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const hours = checkins.reduce((total, checkin) => total + getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId)), 0);
  const checkedDays = [...new Set(checkins
    .filter((checkin) => getCheckinTotalHours(checkin, sessionMap.get(checkin.sessionId)) > 0)
    .map((checkin) => checkin.day))].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (checkedDays[0] !== getLocalDateKey(cursor)) cursor.setDate(cursor.getDate() - 1);
  for (const day of checkedDays) {
    if (day !== getLocalDateKey(cursor)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { sessions: checkins.length, days: checkedDays.length, hours, streak };
}
