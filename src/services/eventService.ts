// src/services/eventService.ts
import { supabase } from '../lib/supabase';

export interface MorpheusEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  event_date: string;
  ticket_price: string;
  ticket_url?: string;
  image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_by?: string;
  created_at?: string;
}

export async function fetchApprovedEvents(): Promise<MorpheusEvent[]> {
  const { data, error } = await supabase
    .from('morfeus_events')
    .select('*')
    .eq('status', 'APPROVED')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Etkinlikler yüklenirken hata:', error);
    return [];
  }
  return data as MorpheusEvent[];
}

export async function createEvent(eventData: {
  title: string;
  description: string;
  city: string;
  venue: string;
  event_date: string;
  ticket_price: string;
  ticket_url?: string;
  image_url?: string;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('morfeus_events')
    .insert([{ ...eventData, status: 'PENDING' }])
    .select()
    .single();

  if (error) throw error;
  return data as MorpheusEvent;
}

// Admin İşlemleri
export async function fetchPendingEvents(): Promise<MorpheusEvent[]> {
  const { data, error } = await supabase
    .from('morfeus_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin etkinlikleri alınırken hata:', error);
    return [];
  }
  return data as MorpheusEvent[];
}

export async function updateEventStatus(eventId: string, status: 'APPROVED' | 'REJECTED') {
  const { error } = await supabase
    .from('morfeus_events')
    .update({ status })
    .eq('id', eventId);

  if (error) throw error;
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('morfeus_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}