-- FirstCareerSteps only. Preserve account content; revoke accidental public access.
-- Re-runnable. No storage objects or student accounts are deleted by this migration.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.fcs_account_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = (SELECT auth.uid())
      AND COALESCE(u.raw_app_meta_data->>'deletion_in_progress', 'false') <> 'true'
  );
$$;
REVOKE ALL ON FUNCTION private.fcs_account_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.fcs_account_active() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.fcs_asset_user(object_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT lower(COALESCE(
    substring(object_name FROM '^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'),
    substring(object_name FROM '^resume_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_'),
    substring(object_name FROM '^roadmaps/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/'),
    substring(object_name FROM '^profile-photos/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})[_/-]')
  ));
$$;
REVOKE ALL ON FUNCTION private.fcs_asset_user(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.fcs_asset_user(text) TO authenticated, service_role;

-- Revoke accidental public resume publication, including existing automatic links.
DROP POLICY IF EXISTS "Public can view shared resumes" ON public.resumes;
CREATE OR REPLACE FUNCTION private.fcs_disable_public_link()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.shareable_link := NULL; RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS fcs_private_resume_links ON public.resumes;
CREATE TRIGGER fcs_private_resume_links BEFORE INSERT OR UPDATE OF shareable_link
ON public.resumes FOR EACH ROW EXECUTE FUNCTION private.fcs_disable_public_link();
UPDATE public.resumes SET shareable_link = NULL WHERE shareable_link IS NOT NULL;

-- Existing owner RLS remains in force. These restrictive checks additionally stop
-- old tokens from reading/writing after deletion, or during retryable cleanup.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['users','profile','experiences','certifications','resumes','generated_content','roadmaps','career_roadmaps','user_payments','subscriptions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS fcs_active_account ON public.%I', t);
    EXECUTE format('CREATE POLICY fcs_active_account ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.fcs_account_active())) WITH CHECK ((SELECT private.fcs_account_active()))', t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "Users can view logs" ON public.debug_logs;
-- Prevent a student from promoting their own role to admin to bypass privacy.
REVOKE INSERT, UPDATE ON public.users FROM PUBLIC, anon, authenticated;
GRANT INSERT(id, email, full_name, linkedin_link) ON public.users TO authenticated;
GRANT UPDATE(email, full_name, linkedin_link) ON public.users TO authenticated;

-- Restrict all four student file buckets. Public URLs cease to grant access.
UPDATE storage.buckets SET public = false
WHERE id IN ('photos','resume-assets','resumes','roadmaps');
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ~ '(photos|resume-assets|resumes|roadmaps)'
  LOOP EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname); END LOOP;
END $$;
DROP POLICY IF EXISTS fcs_asset_read ON storage.objects;
DROP POLICY IF EXISTS fcs_asset_insert ON storage.objects;
DROP POLICY IF EXISTS fcs_asset_update ON storage.objects;
DROP POLICY IF EXISTS fcs_asset_delete ON storage.objects;
CREATE POLICY fcs_asset_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('photos','resume-assets','resumes','roadmaps')
  AND (SELECT private.fcs_account_active())
  AND COALESCE(private.fcs_asset_user(name), owner_id) = (SELECT auth.uid())::text);
CREATE POLICY fcs_asset_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('photos','resume-assets','resumes','roadmaps')
  AND (SELECT private.fcs_account_active())
  AND private.fcs_asset_user(name) = (SELECT auth.uid())::text);
CREATE POLICY fcs_asset_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('photos','resume-assets','resumes','roadmaps')
  AND (SELECT private.fcs_account_active())
  AND COALESCE(private.fcs_asset_user(name), owner_id) = (SELECT auth.uid())::text)
WITH CHECK (bucket_id IN ('photos','resume-assets','resumes','roadmaps')
  AND (SELECT private.fcs_account_active())
  AND COALESCE(private.fcs_asset_user(name), owner_id) = (SELECT auth.uid())::text);
CREATE POLICY fcs_asset_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('photos','resume-assets','resumes','roadmaps')
  AND (SELECT private.fcs_account_active())
  AND COALESCE(private.fcs_asset_user(name), owner_id) = (SELECT auth.uid())::text);

-- Storage metadata is read here; bytes MUST be deleted through the Storage API.
-- Neither helper is callable with a student or anonymous token.
CREATE OR REPLACE FUNCTION public.fcs_account_storage(target_user uuid)
RETURNS TABLE(bucket_id text, name text) LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT o.bucket_id, o.name FROM storage.objects o
  WHERE o.bucket_id IN ('photos','resume-assets','resumes','roadmaps')
    AND (o.owner_id = target_user::text OR private.fcs_asset_user(o.name) = target_user::text)
  ORDER BY o.bucket_id, o.name LIMIT 500;
$$;
REVOKE ALL ON FUNCTION public.fcs_account_storage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fcs_account_storage(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.fcs_purge_account_logs(target_user uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  DELETE FROM public.debug_logs
  WHERE context->>'userId' = target_user::text OR context->>'user_id' = target_user::text;
$$;
REVOKE ALL ON FUNCTION public.fcs_purge_account_logs(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fcs_purge_account_logs(uuid) TO service_role;
COMMIT;
