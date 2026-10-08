import { getSupabase, throwIfSupabaseError } from './supabase.js';
import { createGuestId, GUEST_USER_ID, getGuestCollection, isGuestUser, saveGuestCollection } from './guestData.js';

export const WEEKDAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

function mapSession(row) {
  return {
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    subject: row.subject || '',
    day: row.weekday,
    startTime: String(row.start_time).slice(0, 5),
    duration: row.duration_minutes,
    reminderMinutes: row.reminder_minutes ?? null,
  };
}

export async function getSessions(userId) {
  if (isGuestUser(userId)) {
    return getGuestCollection('sessions')
      .filter((session) => session.ownerId === GUEST_USER_ID)
      .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id,user_id,title,subject,weekday,start_time,duration_minutes,reminder_minutes')
    .eq('user_id', userId)
    .order('weekday')
    .order('start_time');
  throwIfSupabaseError(error, 'Unable to load your timetable');
  return data.map(mapSession);
}

export async function addSession(userId, session) {
  if (isGuestUser(userId)) {
    const sessions = getGuestCollection('sessions');
    const savedSession = {
      ...session,
      id: createGuestId(),
      ownerId: GUEST_USER_ID,
      subject: session.subject || '',
      reminderMinutes: session.reminderMinutes ?? null,
    };
    sessions.push(savedSession);
    saveGuestCollection('sessions', sessions);
    return savedSession;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_sessions').insert({
    user_id: userId,
    title: session.title,
    subject: session.subject || '',
    weekday: session.day,
    start_time: session.startTime,
    duration_minutes: session.duration,
    reminder_minutes: session.reminderMinutes ?? null,
  }).select('id,user_id,title,subject,weekday,start_time,duration_minutes,reminder_minutes').single();
  throwIfSupabaseError(error, 'Unable to save the study session');
  return mapSession(data);
}

export async function deleteSession(userId, sessionId) {
  if (isGuestUser(userId)) {
    const sessions = getGuestCollection('sessions');
    const remaining = sessions.filter((session) => session.id !== sessionId || session.ownerId !== GUEST_USER_ID);
    if (remaining.length === sessions.length) throw new Error('This session could not be found.');
    saveGuestCollection('sessions', remaining);
    return;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('id');
  throwIfSupabaseError(error, 'Unable to delete the study session');
  if (!data.length) throw new Error('This session could not be found.');
}

export function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
