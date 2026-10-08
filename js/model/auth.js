import { getSupabase, hasSupabaseConfig, throwIfSupabaseError } from './supabase.js';

function clearLegacyPasswords() {
  try {
    localStorage.removeItem('studytrack.v1.users');
  } catch (error) {
    throw new Error(`Signed in successfully, but could not clear old browser-stored passwords: ${error.message}`);
  }
}

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
  };
}

export async function getCurrentUser() {
  if (!await hasSupabaseConfig()) return null;
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.getSession();
  throwIfSupabaseError(error, 'Unable to check your sign-in status');
  return mapUser(data.session?.user);
}

export async function signIn(email, password) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  throwIfSupabaseError(error, 'Unable to sign in');
  clearLegacyPasswords();
  return mapUser(data.user);
}

export async function signUp(name, email, password) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: new URL('index.html', window.location.href).href,
    },
  });
  throwIfSupabaseError(error, 'Unable to create your account');
  clearLegacyPasswords();
  return { user: mapUser(data.session?.user), needsEmailConfirmation: !data.session };
}

export async function sendPasswordReset(email) {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: new URL('login.html?recovery=1', window.location.href).href,
  });
  throwIfSupabaseError(error, 'Unable to send the password reset email');
}

export async function updatePassword(password) {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  throwIfSupabaseError(error, 'Unable to update your password');
}

export async function signOut() {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signOut();
  throwIfSupabaseError(error, 'Unable to sign out');
}
