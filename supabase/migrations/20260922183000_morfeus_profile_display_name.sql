-- Optional phone + case-insensitive unique display-name check for morfeus_profiles

ALTER TABLE public.morfeus_profiles
  ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.morfeus_is_display_name_taken(p_name text, p_exclude uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.morfeus_profiles
    WHERE id <> p_exclude
      AND full_name IS NOT NULL
      AND lower(btrim(full_name)) = lower(btrim(p_name))
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM (
      SELECT lower(btrim(full_name)) AS n
      FROM public.morfeus_profiles
      WHERE full_name IS NOT NULL AND btrim(full_name) <> ''
      GROUP BY 1
      HAVING count(*) > 1
    ) dups
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS morfeus_profiles_full_name_ci
      ON public.morfeus_profiles (lower(btrim(full_name)))
      WHERE full_name IS NOT NULL AND btrim(full_name) <> '';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) TO anon;
