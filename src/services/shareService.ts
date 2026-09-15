import { supabase } from '../lib/supabase';

export interface SharePayload {
  share_code: string;
  payload_type: 'SONG' | 'SETLIST';
  payload: any;
  created_at?: string;
}

export async function fetchSharedSongByCode(code: string) {
  const cleanCode = code.trim().toUpperCase();
  
  const { data, error } = await supabase
    .from('morfeus_shares')
    .select('*')
    .eq('share_code', cleanCode)
    .single();

  if (error || !data) {
    throw new Error('Paylaşım kodu bulunamadı veya süresi dolmuş.');
  }

  return data.payload;
}