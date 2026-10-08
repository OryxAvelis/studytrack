let clientPromise;

export async function getSupabase() {
  if (!clientPromise) {
    clientPromise = (async () => {
      let config;
      try {
        config = await import('./supabaseConfig.js');
      } catch (error) {
        if (error.code === 'ERR_MODULE_NOT_FOUND' || error.message.includes('supabaseConfig.js')) {
          throw new Error('Supabase is not configured. Copy js/model/supabaseConfig.example.js to js/model/supabaseConfig.js and enter your project URL and publishable key.');
        }
        throw error;
      }

      if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Supabase is not configured. Enter your project URL and publishable key in js/model/supabaseConfig.js.');
      }

      let createClient;
      try {
        ({ createClient } = await import('https://esm.sh/@supabase/supabase-js@2'));
      } catch (error) {
        throw new Error(`Could not load the Supabase client. Check your internet connection and reload: ${error.message}`);
      }

      return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      });
    })();
  }
  return clientPromise;
}

export function throwIfSupabaseError(error, operation) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}
