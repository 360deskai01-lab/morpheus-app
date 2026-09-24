create extension if not exists pgcrypto;

CREATE TABLE IF NOT EXISTS public.morfeus_public_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chord_name text NOT NULL,
  instrument text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.morfeus_public_chords
  ADD COLUMN IF NOT EXISTS song_id uuid REFERENCES public.morfeus_songs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS chord_name text,
  ADD COLUMN IF NOT EXISTS instrument text,
  ADD COLUMN IF NOT EXISTS frets integer[],
  ADD COLUMN IF NOT EXISTS pitches integer[],
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'akorlar',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS morfeus_public_chords_unique
  ON public.morfeus_public_chords (song_id, chord_name, instrument);

CREATE INDEX IF NOT EXISTS morfeus_public_chords_name_idx
  ON public.morfeus_public_chords (chord_name);

ALTER TABLE public.morfeus_public_chords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS morfeus_public_chords_read ON public.morfeus_public_chords;
CREATE POLICY morfeus_public_chords_read
  ON public.morfeus_public_chords
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS morfeus_public_chords_write ON public.morfeus_public_chords;
CREATE POLICY morfeus_public_chords_write
  ON public.morfeus_public_chords
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS morfeus_public_chords_update ON public.morfeus_public_chords;
CREATE POLICY morfeus_public_chords_update
  ON public.morfeus_public_chords
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.morfeus_public_chords TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.morfeus_public_chords TO authenticated;
