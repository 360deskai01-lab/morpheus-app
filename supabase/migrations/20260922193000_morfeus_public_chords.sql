CREATE TABLE IF NOT EXISTS public.morfeus_public_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid REFERENCES public.morfeus_songs(id) ON DELETE CASCADE,
  chord_name text NOT NULL,
  instrument text NOT NULL CHECK (instrument IN ('guitar', 'piano', 'bass')),
  frets integer[],
  pitches integer[],
  source text DEFAULT 'akorlar',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS morfeus_public_chords_unique
  ON public.morfeus_public_chords (song_id, chord_name, instrument);

CREATE INDEX IF NOT EXISTS morfeus_public_chords_name_idx
  ON public.morfeus_public_chords (chord_name);

ALTER TABLE public.morfeus_public_chords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS morfeus_public_chords_read ON public.morfeus_public_chords;
CREATE POLICY morfeus_public_chords_read
  ON public.morfeus_public_chords
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS morfeus_public_chords_write ON public.morfeus_public_chords;
CREATE POLICY morfeus_public_chords_write
  ON public.morfeus_public_chords
  FOR ALL
  USING (true)
  WITH CHECK (true);
