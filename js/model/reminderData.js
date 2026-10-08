import { getSupabase, throwIfSupabaseError } from './supabase.js';

export async function getRemindersEnabled(userId) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_preferences')
    .select('reminders_enabled')
    .eq('user_id', userId)
    .maybeSingle();
  throwIfSupabaseError(error, 'Unable to load reminder preferences');
  return data?.reminders_enabled ?? false;
}

export async function setRemindersEnabled(userId, enabled) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('study_preferences').upsert({
    user_id: userId,
    reminders_enabled: enabled,
    updated_at: new Date().toISOString(),
  });
  throwIfSupabaseError(error, 'Unable to save reminder preferences');
}
