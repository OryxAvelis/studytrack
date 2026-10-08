import { getSupabase, throwIfSupabaseError } from './supabase.js';

function mapGoal(row) {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    targetHours: Number(row.target_hours) || 0,
    completedAt: row.completed_at,
  };
}

export async function getGoals(userId) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_goals')
    .select('id,title,due_date,target_hours,completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_date');
  throwIfSupabaseError(error, 'Unable to load your study goals');
  return data.map(mapGoal);
}

export async function addGoal(userId, goal) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_goals').insert({
    user_id: userId,
    title: goal.title.trim(),
    due_date: goal.dueDate,
    target_hours: Number(goal.targetHours) || 0,
  }).select('id,title,due_date,target_hours,completed_at').single();
  throwIfSupabaseError(error, 'Unable to save your study goal');
  return mapGoal(data);
}

export async function setGoalCompleted(userId, goalId, completed) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_goals')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  throwIfSupabaseError(error, 'Unable to update your study goal');
  if (!data) throw new Error('This study goal could not be found.');
}

export async function deleteGoal(userId, goalId) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_goals').delete()
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('id');
  throwIfSupabaseError(error, 'Unable to delete your study goal');
  if (!data.length) throw new Error('This study goal could not be found.');
}
