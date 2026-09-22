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

REVOKE ALL ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.morfeus_is_display_name_taken(text, uuid) TO anon;
