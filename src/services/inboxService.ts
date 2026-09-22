import { supabase } from '../lib/supabase';

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  created_at?: string;
  kind: 'message' | 'correction';
};

export async function fetchInboxItems(userId: string): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('morfeus_messages')
    .select('*')
    .or(`recipient_id.eq.${userId},sender_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(40);

  if (!error && data) {
    return data.map((row: any) => ({
      id: String(row.id),
      title: row.subject || 'Mesaj',
      body: row.body || '',
      created_at: row.created_at,
      kind: 'message' as const,
    }));
  }

  const { data: corr } = await supabase
    .from('song_corrections')
    .select('id, notes, suggested_content, created_at, user_id, morfeus_songs(title, artist)')
    .order('id', { ascending: false })
    .limit(40);

  return (corr || [])
    .filter((row: any) => !row.user_id || row.user_id === userId)
    .map((row: any) => ({
      id: `corr-${row.id}`,
      title: `Düzeltme: ${row.morfeus_songs?.title || 'Parça'}`,
      body: row.notes || 'Akor düzeltme önerisi gönderildi.',
      created_at: row.created_at,
      kind: 'correction' as const,
    }));
}

export async function sendSupportMessage(userId: string, body: string): Promise<void> {
  const clean = body.trim();
  if (!clean) throw new Error('Mesaj boş olamaz.');
  const { error } = await supabase.from('morfeus_messages').insert({
    sender_id: userId,
    recipient_id: userId,
    subject: 'Sahne notu / Destek',
    body: clean,
  });
  if (error) throw error;
}

export async function fetchMyCorrections(userId: string): Promise<any[]> {
  const { data } = await supabase
    .from('song_corrections')
    .select('*, morfeus_songs(title, artist)')
    .order('id', { ascending: false })
    .limit(50);
  return (data || []).filter((row: any) => !row.user_id || row.user_id === userId);
}
