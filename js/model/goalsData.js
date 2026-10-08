import { getSupabase, throwIfSupabaseError } from './supabase.js';
import { createGuestId, GUEST_USER_ID, getGuestCollection, isGuestUser, saveGuestCollection } from './guestData.js';

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
  if (isGuestUser(userId)) {
    return getGuestCollection('goals')
      .filter((goal) => goal.ownerId === GUEST_USER_ID)
      .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)) || a.dueDate.localeCompare(b.dueDate));
  }
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
  if (isGuestUser(userId)) {
    const goals = getGuestCollection('goals');
    const savedGoal = {
      id: createGuestId(),
      ownerId: GUEST_USER_ID,
      title: goal.title.trim(),
      dueDate: goal.dueDate,
      targetHours: Number(goal.targetHours) || 0,
      completedAt: null,
    };
    goals.push(savedGoal);
    saveGuestCollection('goals', goals);
    return savedGoal;
  }
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
  if (isGuestUser(userId)) {
    const goals = getGuestCollection('goals');
    const goal = goals.find((item) => item.id === goalId && item.ownerId === GUEST_USER_ID);
    if (!goal) throw new Error('This study goal could not be found.');
    goal.completedAt = completed ? new Date().toISOString() : null;
    saveGuestCollection('goals', goals);
    return;
  }
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
  if (isGuestUser(userId)) {
    const goals = getGuestCollection('goals');
    const remaining = goals.filter((goal) => goal.id !== goalId || goal.ownerId !== GUEST_USER_ID);
    if (remaining.length === goals.length) throw new Error('This study goal could not be found.');
    saveGuestCollection('goals', remaining);
    return;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('study_goals').delete()
    .eq('id', goalId)
    .eq('user_id', userId)
    .select('id');
  throwIfSupabaseError(error, 'Unable to delete your study goal');
  if (!data.length) throw new Error('This study goal could not be found.');
}
