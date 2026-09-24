// src/services/authService.ts
import { supabase } from '../lib/supabase';

export type AdminModule = 'PORTAL' | 'APP' | 'FORUM' | 'COURSES' | 'EVENTS' | 'STORE';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  stage_badge?: string | null;
  chord_palette?: string | null;
  cloud_backup_at?: string | null;
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
      membership_tier: 'basic',
    },
  ]);

  if (profileError) {
    console.warn('Profil oluşturulurken uyarı:', profileError.message);
  }

  return data.user;
}

function normalizeDisplayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export async function isDisplayNameTaken(name: string, excludeProfileId: string): Promise<boolean> {
  const clean = normalizeDisplayName(name);
  if (!clean) return false;

  const { data: rpcTaken, error: rpcError } = await supabase.rpc('morfeus_is_display_name_taken', {
    p_name: clean,
    p_exclude: excludeProfileId,
  });

  if (!rpcError && typeof rpcTaken === 'boolean') {
    return rpcTaken;
  }

  const { data, error } = await supabase
    .from('morfeus_profiles')
    .select('id, full_name')
    .neq('id', excludeProfileId);

  if (error) throw error;
  if (!data) return false;
  const needle = clean.toLocaleLowerCase('tr-TR');
  return data.some((row) => (row.full_name || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR') === needle);
}

export type ProfilePatch = {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  stage_badge?: string | null;
  chord_palette?: string | null;
  cloud_backup_at?: string | null;
};

export async function updateOwnProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from('morfeus_profiles').update(patch).eq('id', userId);
  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu görünen ad başka bir profilde kayıtlı. Lütfen farklı bir isim seçin.');
    }
    throw error;
  }
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
  const { error } = await supabase.rpc('morfeus_admin_set_tier', {
    p_profile_id: profileId,
    p_tier: tier.toLowerCase(),
  });
  if (error) throw error;
}

export async function deleteUserProfile(profileId: string) {
  const { error } = await supabase.rpc('morfeus_admin_delete_profile', {
    p_profile_id: profileId,
  });
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