-- Fix SQL-inserted auth.users rows that may have NULL in non-nullable columns
-- added by GoTrue's own internal migrations after our rows were inserted.
-- Specifically: is_anonymous, deleted_at behaviour, and token fields.

-- 1. Fix is_anonymous (GoTrue added this column; existing rows may be NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous'
  ) THEN
    UPDATE auth.users SET is_anonymous = false WHERE is_anonymous IS NULL;
    RAISE NOTICE 'Fixed is_anonymous NULLs in auth.users';
  END IF;
END $$;

-- 2. Fix is_sso_user (similar column added later)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_sso_user'
  ) THEN
    UPDATE auth.users SET is_sso_user = false WHERE is_sso_user IS NULL;
    RAISE NOTICE 'Fixed is_sso_user NULLs in auth.users';
  END IF;
END $$;

-- 3. Fix confirmation_token / recovery_token (should be NULL, not empty string)
UPDATE auth.users
SET
  confirmation_token = NULL,
  recovery_token     = NULL
WHERE confirmation_token = '' OR recovery_token = '';

-- 4. Check auth.identities for missing id column values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id'
  ) THEN
    -- If id column exists but some rows have NULL id, generate UUIDs for them
    UPDATE auth.identities SET id = gen_random_uuid() WHERE id IS NULL;
    RAISE NOTICE 'Fixed NULL ids in auth.identities';
  END IF;
END $$;
