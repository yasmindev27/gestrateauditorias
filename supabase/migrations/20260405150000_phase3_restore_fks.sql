-- PHASE 3: Re-add FK constraints and trigger after users recreated via admin API

-- Re-add FK from profiles to auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-add FK from user_roles to auth.users
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-add other FKs that reference auth.users that exist in public schema
-- (only if the profiles table references are the only ones — others handled above in phase 1)

-- Re-add trigger for future user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cleanup temp mapping table
DROP TABLE IF EXISTS public._auth_fix_email_map;

DO $$ BEGIN RAISE NOTICE 'Phase 3 complete: FKs and trigger restored.'; END $$;
