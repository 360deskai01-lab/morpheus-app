// src/services/authService.ts
import { supabase } from '../lib/supabase';

export type AdminModule = 'PORTAL' | 'APP' | 'FORUM' | 'COURSES' | 'EVENTS' | 'STORE';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  membership_tier: 'FREE' | 'BASIC' | 'PREMIUM';
  is_master_admin: boolean;
  created_at?: string;
}

export interface AdminRole {
  module: AdminModule;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

export async function loginWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass.trim(),
  });
  if (error) throw error;
  return data.user;
}

// YENİ: Ziyaretçilerin doğrudan BASIC üye olarak kaydolmasını sağlayan fonksiyon
export async function registerUser(email: string, pass: string, fullName: string) {
  const cleanEmail = email.trim();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass.trim(),
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Kullanıcı oluşturulamadı.');

  // morfeus_profiles tablosuna BASIC üye olarak kaydet
  const { error: profileError } = await supabase.from('morfeus_profiles').upsert([
    {
      id: data.user.id,
      email: cleanEmail,
      full_name: fullName.trim(),
      membership_tier: 'BASIC',
      is_master_admin: false,
    },
  ]);

  if (profileError) {
    console.warn('Profil oluşturulurken uyarı:', profileError.message);
  }

  return data.user;
}

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('morfeus_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function getUserAdminRoles(profileId: string): Promise<AdminRole[]> {
  const { data, error } = await supabase
    .from('morfeus_admin_roles')
    .select('module, can_read, can_write, can_delete')
    .eq('profile_id', profileId);

  if (error) return [];
  return data as AdminRole[];
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('morfeus_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function updateUserMembershipTier(profileId: string, tier: 'FREE' | 'BASIC' | 'PREMIUM') {
  const { error } = await supabase
    .from('morfeus_profiles')
    .update({ membership_tier: tier })
    .eq('id', profileId);

  if (error) throw error;
}

export async function deleteUserProfile(profileId: string) {
  const { error } = await supabase
    .from('morfeus_profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
}

export async function assignSubAdminRole(
  profileId: string,
  module: AdminModule,
  canRead: boolean,
  canWrite: boolean,
  canDelete: boolean
) {
  const { error } = await supabase.from('morfeus_admin_roles').upsert(
    {
      profile_id: profileId,
      module,
      can_read: canRead,
      can_write: canWrite,
      can_delete: canDelete,
    },
    { onConflict: 'profile_id,module' }
  );

  if (error) throw error;
}

export async function removeSubAdminRole(profileId: string, module: AdminModule) {
  const { error } = await supabase
    .from('morfeus_admin_roles')
    .delete()
    .eq('profile_id', profileId)
    .eq('module', module);

  if (error) throw error;
}

export async function fetchAllAdminSongs() {
  const { data, error } = await supabase
    .from('morfeus_songs')
    .select('id, title, artist, original_key, genre, view_count, rating_avg')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function deleteSongByAdmin(songId: string) {
  const { error } = await supabase
    .from('morfeus_songs')
    .delete()
    .eq('id', songId);

  if (error) throw error;
}