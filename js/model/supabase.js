const STORAGE_PREFIX = 'studytrack.v1';

export const STORAGE_KEYS = Object.freeze({
  users: `${STORAGE_PREFIX}.users`,
  currentUser: `${STORAGE_PREFIX}.currentUser`,
  sessions: `${STORAGE_PREFIX}.sessions`,
  checkins: `${STORAGE_PREFIX}.checkins`,
});

export function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    throw new Error(`Unable to read StudyTrack browser data: ${error.message}`);
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(`Unable to save StudyTrack browser data: ${error.message}`);
  }
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getWeekday(date = new Date()) {
  return (date.getDay() + 6) % 7;
}