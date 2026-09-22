import { supabase } from '../lib/supabase';
import { updateOwnProfile } from './authService';

export async function pickLocalImageFile(): Promise<File | null> {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = data.publicUrl;
  await updateOwnProfile(userId, { avatar_url: url });
  return url;
}

export async function stampCloudBackup(userId: string): Promise<string> {
  const stamp = new Date().toISOString();
  await updateOwnProfile(userId, { cloud_backup_at: stamp });
  return stamp;
}
