import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

let realtimeClient;
function client() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  realtimeClient ||= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return realtimeClient;
}

export function useInvitationRealtime(invitationId, onChange, enabled = true) {
  useEffect(() => {
    const supabase = client();
    if (!enabled || !invitationId || !supabase) return undefined;
    let timer;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onChange, 250);
    };
    const channel = supabase.channel(`invitation:${invitationId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invitations', filter: `id=eq.${invitationId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_messages', filter: `invitation_id=eq.${invitationId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gift_accounts', filter: `invitation_id=eq.${invitationId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitation_media', filter: `invitation_id=eq.${invitationId}` }, refresh)
      .subscribe();
    return () => { window.clearTimeout(timer); supabase.removeChannel(channel); };
  }, [invitationId, enabled, onChange]);
}
