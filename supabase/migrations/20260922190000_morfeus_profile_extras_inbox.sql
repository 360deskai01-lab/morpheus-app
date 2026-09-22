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
CREATE POLICY morfeus_messages_own
  ON public.morfeus_messages
  FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
