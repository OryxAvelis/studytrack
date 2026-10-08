import { getSupabase, throwIfSupabaseError } from './supabase.js';

const LEGACY_KEYS = Object.freeze({
  users: 'studytrack.v1.users',
  currentUser: 'studytrack.v1.currentUser',
  sessions: 'studytrack.v1.sessions',
  checkins: 'studytrack.v1.checkins',
});

function readLegacyData() {
  try {
    const currentUser = JSON.parse(localStorage.getItem(LEGACY_KEYS.currentUser) || 'null');
    if (!currentUser?.id) return null;
    const allSessions = JSON.parse(localStorage.getItem(LEGACY_KEYS.sessions) || '[]');
    const allCheckins = JSON.parse(localStorage.getItem(LEGACY_KEYS.checkins) || '[]');
    const sessions = allSessions.filter((session) => session.ownerId === null || session.ownerId === currentUser.id);
    const checkins = allCheckins.filter((checkin) => checkin.ownerId === currentUser.id);
    return { currentUser, sessions, checkins };
  } catch (error) {
    throw new Error(`Unable to read old browser data for migration: ${error.message}`);
  }
}

export function getLegacyDataSummary() {
  const legacy = readLegacyData();
  if (!legacy) return null;
  return { sessions: legacy.sessions.length, checkins: legacy.checkins.length };
}

function clearImportedLegacyData(userId) {
  try {
    const sessions = JSON.parse(localStorage.getItem(LEGACY_KEYS.sessions) || '[]');
    const checkins = JSON.parse(localStorage.getItem(LEGACY_KEYS.checkins) || '[]');
    localStorage.setItem(LEGACY_KEYS.sessions, JSON.stringify(sessions.filter((session) => session.ownerId !== userId)));
    localStorage.setItem(LEGACY_KEYS.checkins, JSON.stringify(checkins.filter((checkin) => checkin.ownerId !== userId)));
    localStorage.removeItem(LEGACY_KEYS.currentUser);
    localStorage.removeItem(LEGACY_KEYS.users);
  } catch (error) {
    throw new Error(`Data was copied, but old browser data could not be cleaned up: ${error.message}`);
  }
}

export async function migrateLegacyData(userId) {
  const legacy = readLegacyData();
  if (!legacy) return { sessions: 0, checkins: 0 };
  const supabase = await getSupabase();
  const sessionIds = new Map();
  const sessionsToImport = [...legacy.sessions];
  const importedSourceIds = new Set(sessionsToImport.map((session) => String(session.id)));

  for (const checkin of legacy.checkins) {
    if (importedSourceIds.has(String(checkin.sessionId))) continue;
    const date = new Date(`${checkin.day}T12:00:00`);
    sessionsToImport.push({
      id: checkin.sessionId,
      title: 'Imported study session',
      subject: '',
      day: (date.getDay() + 6) % 7,
      startTime: '12:00',
      duration: Number(checkin.duration) || 60,
      ownerId: legacy.currentUser.id,
    });
    importedSourceIds.add(String(checkin.sessionId));
  }

  for (const session of sessionsToImport) {
    const legacyId = String(session.id);
    const { error: insertError } = await supabase.from('study_sessions').upsert({
      user_id: userId,
      legacy_id: legacyId,
      title: String(session.title).slice(0, 80),
      subject: String(session.subject || '').slice(0, 50),
      weekday: Number(session.day),
      start_time: session.startTime,
      duration_minutes: Number(session.duration) || 60,
      reminder_minutes: session.reminderMinutes ?? null,
    }, { onConflict: 'user_id,legacy_id', ignoreDuplicates: true });
    throwIfSupabaseError(insertError, 'Unable to import a saved timetable session');
    const { data, error } = await supabase.from('study_sessions').select('id')
      .eq('user_id', userId).eq('legacy_id', legacyId).single();
    throwIfSupabaseError(error, 'Unable to verify an imported timetable session');
    sessionIds.set(legacyId, data.id);
  }

  for (const checkin of legacy.checkins) {
    const sessionId = sessionIds.get(String(checkin.sessionId));
    if (!sessionId) throw new Error('A saved check-in references a timetable session that could not be imported.');
    const { error } = await supabase.from('study_checkins').upsert({
      user_id: userId,
      legacy_id: String(checkin.id),
      session_id: sessionId,
      checkin_date: checkin.day,
      session_duration_minutes: Number(checkin.duration) || 60,
      status: ['full', 'half', 'absent'].includes(checkin.status) ? checkin.status : 'full',
      extra_hours: Number(checkin.extraHours) || 0,
      checked_in_at: checkin.checkedInAt,
    }, { onConflict: 'user_id,legacy_id', ignoreDuplicates: true });
    throwIfSupabaseError(error, 'Unable to import a saved check-in');
  }

  clearImportedLegacyData(legacy.currentUser.id);
  return { sessions: sessionsToImport.length, checkins: legacy.checkins.length };
}
