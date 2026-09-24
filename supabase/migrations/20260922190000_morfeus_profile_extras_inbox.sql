create extension if not exists pgcrypto;

ALTER TABLE public.morfeus_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS stage_badge text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS chord_palette text DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS cloud_backup_at timestamptz;

CREATE TABLE IF NOT EXISTS public.morfeus_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.morfeus_profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.morfeus_profiles(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.morfeus_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS morfeus_messages_own ON public.morfeus_messages;
DROP POLICY IF EXISTS morfeus_messages_select ON public.morfeus_messages;
DROP POLICY IF EXISTS morfeus_messages_insert ON public.morfeus_messages;
DROP POLICY IF EXISTS morfeus_messages_update ON public.morfeus_messages;
DROP POLICY IF EXISTS morfeus_messages_delete ON public.morfeus_messages;

CREATE POLICY morfeus_messages_select
  ON public.morfeus_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY morfeus_messages_insert
  ON public.morfeus_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY morfeus_messages_update
  ON public.morfeus_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY morfeus_messages_delete
  ON public.morfeus_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.morfeus_messages TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_owner_insert ON storage.objects;
CREATE POLICY avatars_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
