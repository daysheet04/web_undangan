import { createClient } from '@supabase/supabase-js';

export function database(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'daymoment-worker/2' } },
  });
}

export async function one(query, notFoundMessage = 'Data tidak ditemukan.') {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) {
    const failure = new Error(notFoundMessage);
    failure.status = 404;
    throw failure;
  }
  return data;
}

export async function many(query) {
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? data?.length ?? 0 };
}
