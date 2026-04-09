-- PHASE 1: Prepare for clean auth user recreation
-- 1. Save email <-> user_id mapping (emails are only stored in auth.users)
-- 2. Drop FK constraints so profiles/user_roles survive the deletion
-- 3. Drop auto-profile trigger (to avoid conflict on recreation)
-- 4. Delete all auth.users (cascades to auth.identities, sessions, etc.)

-- Step 1: Save mapping
CREATE TABLE IF NOT EXISTS public._auth_fix_email_map (
  user_id UUID PRIMARY KEY,
  email   TEXT NOT NULL
);

INSERT INTO public._auth_fix_email_map (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- Step 2: Drop FKs from profiles and user_roles to auth.users
ALTER TABLE public.profiles    DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.user_roles  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Also drop FKs from other tables that reference auth.users.id
-- (discovered by looking at profiles-related tables)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'auth'
      AND ccu.table_name   = 'users'
      AND tc.table_schema  = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
                   r.table_name, r.constraint_name);
    RAISE NOTICE 'Dropped FK % on table %', r.constraint_name, r.table_name;
  END LOOP;
END $$;

-- Step 3: Drop the trigger that auto-creates profiles on user INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Delete ALL rows from auth.users
-- This cascades to auth.identities, auth.sessions, auth.refresh_tokens, auth.mfa_factors
-- but NOT to public.profiles / public.user_roles (FKs were just dropped)
DELETE FROM auth.users;

DO $$ BEGIN RAISE NOTICE 'Phase 1 complete: auth.users cleared, FKs dropped, mapping saved.'; END $$;
