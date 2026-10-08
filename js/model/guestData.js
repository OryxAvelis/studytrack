export const GUEST_USER_ID = 'studytrack-local-guest';

const STORAGE_PREFIX = 'studytrack.guest.v1.';

export const GUEST_USER = Object.freeze({
  id: GUEST_USER_ID,
  name: 'Guest',
  email: 'Saved on this device',
});

export function isGuestUser(userId) {
  return userId === GUEST_USER_ID;
}

export function getGuestCollection(name) {
  let value;
  try {
    value = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
  } catch (error) {
    throw new Error(`Unable to read your local ${name}: ${error.message}`);
  }
  if (!value) return [];
  try {
    const collection = JSON.parse(value);
    if (!Array.isArray(collection)) throw new Error('Saved data is not a list.');
    return collection;
  } catch (error) {
    throw new Error(`Your local ${name} data could not be read: ${error.message}`);
  }
}

export function saveGuestCollection(name, collection) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(collection));
  } catch (error) {
    throw new Error(`Unable to save your local ${name}: ${error.message}`);
  }
}

export function createGuestId() {
  return globalThis.crypto?.randomUUID?.()
    || `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
