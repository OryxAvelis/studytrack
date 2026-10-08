import { STORAGE_KEYS, createId, readStored, writeStored } from './supabase.js';

const normalizeEmail = (email) => email.trim().toLowerCase();

export function getCurrentUser() {
  return readStored(STORAGE_KEYS.currentUser, null);
}

export function signIn(email, password) {
  const normalized = normalizeEmail(email);
  const users = readStored(STORAGE_KEYS.users, []);
  const user = users.find((candidate) => candidate.email === normalized && candidate.password === password);
  if (!user) throw new Error('That email and password combination was not found.');
  const currentUser = { id: user.id, name: user.name, email: user.email };
  writeStored(STORAGE_KEYS.currentUser, currentUser);
  return currentUser;
}

export function signUp(name, email, password) {
  const normalized = normalizeEmail(email);
  const users = readStored(STORAGE_KEYS.users, []);
  if (users.some((candidate) => candidate.email === normalized)) {
    throw new Error('An account with that email already exists. Try signing in instead.');
  }
  const user = { id: createId(), name: name.trim(), email: normalized, password };
  users.push(user);
  writeStored(STORAGE_KEYS.users, users);
  const currentUser = { id: user.id, name: user.name, email: user.email };
  writeStored(STORAGE_KEYS.currentUser, currentUser);
  return currentUser;
}

export function signOut() {
  try {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  } catch (error) {
    throw new Error(`Unable to sign out: ${error.message}`);
  }
}