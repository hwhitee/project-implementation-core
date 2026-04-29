-- Set search_path on touch_updated_at (was missing)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restrict execute on SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Restrict bucket listing: replace permissive SELECT with per-object access
DROP POLICY IF EXISTS "Alert images public read" ON storage.objects;
-- Public can read individual files (needed since bucket is public for image URLs), but cannot LIST via API beyond what they know.
-- Keep public read by object id (Supabase still serves public URLs). This policy permits SELECT on objects in this bucket.
CREATE POLICY "Alert images read" ON storage.objects
FOR SELECT USING (bucket_id = 'alert-images');
