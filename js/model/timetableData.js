import { STORAGE_KEYS, createId, getWeekday, readStored, writeStored } from './supabase.js';

export const WEEKDAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const SEED_SESSIONS = [
  { id: 'seed-mon', title: 'Biology revision', subject: 'Biology', day: 0, startTime: '09:00', duration: 60 },
  { id: 'seed-tue', title: 'Calculus practice', subject: 'Mathematics', day: 1, startTime: '10:30', duration: 90 },
  { id: 'seed-wed', title: 'Reading & notes', subject: 'History', day: 2, startTime: '14:00', duration: 60 },
  { id: 'seed-thu', title: 'Problem set', subject: 'Physics', day: 3, startTime: '11:00', duration: 60 },
  { id: 'seed-fri', title: 'Weekly review', subject: 'Study skills', day: 4, startTime: '09:30', duration: 45 },
];

function getAllSessions() {
  let sessions = readStored(STORAGE_KEYS.sessions, null);
  if (!sessions) {
    sessions = SEED_SESSIONS.map((session) => ({ ...session, ownerId: null }));
    writeStored(STORAGE_KEYS.sessions, sessions);
  }
  return sessions;
}

export function getSessions(userId) {
  return getAllSessions().filter((session) => session.ownerId === userId || session.ownerId === null);
}

export function addSession(userId, session) {
  const sessions = getAllSessions();
  const created = { ...session, id: createId(), ownerId: userId };
  sessions.push(created);
  writeStored(STORAGE_KEYS.sessions, sessions);
  return created;
}

export function deleteSession(userId, sessionId) {
  const sessions = getAllSessions();
  const session = sessions.find((item) => item.id === sessionId && item.ownerId === userId);
  if (!session) throw new Error('This session could not be found.');
  writeStored(STORAGE_KEYS.sessions, sessions.filter((item) => item.id !== sessionId));
}

export function getTodaySessions(userId, date = new Date()) {
  return getSessions(userId)
    .filter((session) => session.day === getWeekday(date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}